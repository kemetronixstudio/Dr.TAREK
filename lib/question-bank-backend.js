const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const configBackend = require('./app-config-backend');

const FILE_PATH = path.join(process.cwd(), 'data', 'question-bank.json');
const QUESTION_CACHE_KEY = '__KG_DEFAULT_QUESTION_BANK__';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

function questionId(question, gradeKey, index) {
  const seed = `${gradeKey}::${index}::${question.text || ''}::${question.answer || ''}`;
  return `${gradeKey}:${crypto.createHash('sha1').update(seed).digest('hex').slice(0, 16)}`;
}

function normalizeQuestion(question, gradeKey, index) {
  if (!question || typeof question !== 'object') return null;
  const text = String(question.text || '').trim();
  const options = Array.isArray(question.options)
    ? question.options.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  const answer = String(question.answer || '').trim();
  if (!text || !options.length || !answer) return null;
  const fixedAnswer = options.includes(answer)
    ? answer
    : (options.find((item) => item.toLowerCase() === answer.toLowerCase()) || '');
  if (!fixedAnswer) return null;
  return {
    id: String(question.id || questionId(question, gradeKey, index)),
    grade: String(question.grade || gradeKey || '').trim().toUpperCase(),
    skill: String(question.skill || 'General').trim() || 'General',
    type: String(question.type || 'Choice').trim() || 'Choice',
    text,
    options,
    answer: fixedAnswer,
    image: question.image || null,
    difficulty: Math.max(1, Math.min(3, Number(question.difficulty || 1) || 1)),
    note: String(question.note || '').trim()
  };
}

function readDefaultBank() {
  if (globalThis[QUESTION_CACHE_KEY]) return globalThis[QUESTION_CACHE_KEY];
  const raw = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
  const out = {};
  Object.keys(raw || {}).forEach((gradeKey) => {
    const list = Array.isArray(raw[gradeKey]) ? raw[gradeKey] : [];
    out[gradeKey] = list.map((item, index) => normalizeQuestion(item, gradeKey, index)).filter(Boolean);
  });
  globalThis[QUESTION_CACHE_KEY] = out;
  return out;
}

function sanitizePublicQuestion(question) {
  if (!question) return null;
  return {
    id: question.id,
    grade: question.grade,
    skill: question.skill,
    type: question.type,
    text: question.text,
    options: clone(question.options),
    image: question.image || null,
    difficulty: question.difficulty
  };
}

function signature(question) {
  return [slugify(question.text), slugify(question.answer), (question.options || []).map((item) => slugify(item)).join('|')].join('::');
}

function dedupeQuestions(list) {
  const seen = new Set();
  return (Array.isArray(list) ? list : []).filter((question) => {
    const key = signature(question);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function applyOverrides(questions, overrides) {
  const safeOverrides = overrides && typeof overrides === 'object' ? overrides : {};
  return (Array.isArray(questions) ? questions : []).map((question) => {
    const override = safeOverrides[question.id] || safeOverrides[signature(question)] || null;
    if (!override) return question;
    const merged = normalizeQuestion({ ...question, ...override }, question.grade || '', 0);
    return merged || question;
  });
}

async function buildPools() {
  const defaults = readDefaultBank();
  const config = await configBackend.readConfig();
  const customQuestions = config.customQuestions || {};
  const overrides = config.questionOverrides || {};
  const out = {};
  const gradeKeys = new Set(Object.keys(defaults).concat(Object.keys(customQuestions || {})));
  gradeKeys.forEach((gradeKey) => {
    const base = Array.isArray(defaults[gradeKey]) ? defaults[gradeKey].map((item) => normalizeQuestion(item, gradeKey, 0)).filter(Boolean) : [];
    const custom = Array.isArray(customQuestions[gradeKey])
      ? customQuestions[gradeKey].map((item, index) => normalizeQuestion({ ...item, id: item.id || `${gradeKey}:custom:${index + 1}` }, gradeKey, index)).filter(Boolean)
      : [];
    const merged = dedupeQuestions(applyOverrides(base.concat(custom), overrides));
    out[gradeKey] = merged.map((item, index) => normalizeQuestion({ ...item, id: item.id || questionId(item, gradeKey, index) }, gradeKey, index)).filter(Boolean);
  });
  return out;
}

function shuffle(list, seed) {
  const out = Array.isArray(list) ? list.slice() : [];
  let hash = crypto.createHash('sha256').update(String(seed || 'kg-seed')).digest();
  function nextRand() {
    hash = crypto.createHash('sha256').update(hash).digest();
    return hash.readUInt32BE(0) / 0xffffffff;
  }
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextRand() * (i + 1));
    const temp = out[i];
    out[i] = out[j];
    out[j] = temp;
  }
  return out;
}

function pickSequentialQuestionSet(pool, count, seed) {
  const list = Array.isArray(pool) ? pool.slice() : [];
  if (!list.length) return [];
  const safeCount = Math.max(1, Math.min(Number(count || 10) || 10, list.length));
  const ordered = shuffle(list, seed || 'kg-seq');
  return ordered.slice(0, safeCount);
}

function adaptiveQuestionSet(pool, count, seed) {
  const source = pickSequentialQuestionSet(pool, count, seed);
  const result = [];
  const used = new Set();
  let targetDifficulty = 1;
  while (result.length < Math.min(count, source.length)) {
    const next = source.find((question) => !used.has(question.id) && question.difficulty === targetDifficulty)
      || source.find((question) => !used.has(question.id));
    if (!next) break;
    result.push(next);
    used.add(next.id);
    if (result.length % 5 === 0 && targetDifficulty < 3) targetDifficulty += 1;
  }
  return result;
}

function stageForGrade(grade) {
  const safe = String(grade || '').trim().toLowerCase();
  if (safe === 'kg1' || safe === 'kg2' || safe === 'grade1' || safe === 'grade2') return 'starter';
  if (safe === 'grade3' || safe === 'grade4') return 'explorer';
  return 'champion';
}

function gradeKeysForStage(stage) {
  const safe = String(stage || '').trim().toLowerCase();
  if (safe === 'starter') return ['kg1', 'kg2', 'grade1', 'grade2'];
  if (safe === 'explorer') return ['grade3', 'grade4'];
  return ['grade5', 'grade6'];
}

async function questionsForGrade(gradeKey) {
  const pools = await buildPools();
  return clone(pools[String(gradeKey || '').trim().toLowerCase()] || []);
}

async function selectQuizQuestionsFull(options) {
  const gradeKey = String(options.gradeKey || '').trim().toLowerCase();
  const label = String(options.label || '').trim();
  const count = Math.max(1, Math.min(50, Number(options.count || 10) || 10));
  const identity = options.identity || {};
  const seed = options.seed || `${identity.name || ''}|${identity.studentId || ''}|${identity.grade || gradeKey}|${label}|${count}`;
  const pools = await buildPools();
  let pool = clone(pools[gradeKey] || []);
  const config = await configBackend.readConfig();
  const teacherTest = config.teacherTests && config.teacherTests[gradeKey] ? config.teacherTests[gradeKey] : null;
  if (teacherTest && teacherTest.enabled && options.useTeacherTest) {
    if ((teacherTest.mode === 'manual' || teacherTest.mode === 'select') && Array.isArray(teacherTest.questions) && teacherTest.questions.length) {
      const wanted = new Set(teacherTest.questions.map((item) => slugify(item)));
      pool = pool.filter((question) => wanted.has(slugify(question.text)));
    }
  }
  if (!pool.length) return [];
  const effectiveCount = teacherTest && teacherTest.enabled && options.useTeacherTest ? Math.min(pool.length, teacherTest.count || count) : Math.min(pool.length, count);
  return adaptiveQuestionSet(pool, effectiveCount, seed);
}

async function selectQuizQuestions(options) {
  const selected = await selectQuizQuestionsFull(options);
  return selected.map(sanitizePublicQuestion);
}

async function selectPlayQuestionsFull(options) {
  const stage = String(options.stage || stageForGrade(options.grade) || 'starter').trim().toLowerCase();
  const count = Math.max(1, Math.min(60, Number(options.count || 30) || 30));
  const identity = options.identity || {};
  const pools = await buildPools();
  const gradeKeys = gradeKeysForStage(stage);
  const all = [];
  gradeKeys.forEach((gradeKey) => {
    (pools[gradeKey] || []).forEach((question) => all.push(question));
  });
  return pickSequentialQuestionSet(dedupeQuestions(all), count, `${identity.name || ''}|${identity.studentId || ''}|${stage}|play`);
}

async function selectPlayQuestions(options) {
  const selected = await selectPlayQuestionsFull(options);
  return selected.map(sanitizePublicQuestion);
}

async function adminQuestionBankSummary() {
  const pools = await buildPools();
  const summary = {};
  Object.keys(pools).forEach((key) => {
    summary[key] = (pools[key] || []).map((question) => clone(question));
  });
  return { ok: true, pools: summary };
}

async function getCanonicalQuestionMap() {
  const pools = await buildPools();
  const map = new Map();
  Object.keys(pools).forEach((gradeKey) => {
    (pools[gradeKey] || []).forEach((question) => {
      map.set(question.id, question);
    });
  });
  return map;
}

module.exports = {
  adminQuestionBankSummary,
  buildPools,
  getCanonicalQuestionMap,
  gradeKeysForStage,
  pickSequentialQuestionSet,
  questionsForGrade,
  sanitizePublicQuestion,
  selectPlayQuestions,
  selectPlayQuestionsFull,
  selectQuizQuestions,
  selectQuizQuestionsFull,
  stageForGrade
};
