const path = require('path');
const { createJsonStore } = require('./json-store');

const FILE_PATH = path.join(process.cwd(), 'data', 'app-config.json');
const STORAGE_KEY = process.env.APP_CONFIG_STORAGE_KEY || 'kg:app_config:v1';

const DEFAULT_LEVELS = [10, 20, 30, 40, 50];
const DEFAULT_STORE = {
  version: 1,
  settings: {
    levelVisibility: { kg1: [...DEFAULT_LEVELS], kg2: [...DEFAULT_LEVELS] },
    timerSettings: { kg1: true, kg2: true },
    quizAccess: { kg1: { enabled: false, password: '' }, kg2: { enabled: false, password: '' } }
  },
  classes: [],
  customQuestions: { kg1: [], kg2: [] },
  questionOverrides: {},
  teacherTests: { kg1: null, kg2: null },
  updatedAt: ''
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function sanitizeQuestion(question, fallbackGrade) {
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
    grade: String(question.grade || fallbackGrade || '').trim().toUpperCase(),
    skill: String(question.skill || 'General').trim() || 'General',
    type: String(question.type || 'Choice').trim() || 'Choice',
    text,
    options,
    answer: fixedAnswer,
    image: question.image || null,
    difficulty: Math.max(1, Math.min(3, Number(question.difficulty || 1) || 1))
  };
}

function sanitizeLevelVisibility(raw, classKeys) {
  const out = {};
  const source = raw && typeof raw === 'object' ? raw : {};
  ['kg1', 'kg2'].concat(classKeys || []).forEach((key) => {
    const values = Array.isArray(source[key]) ? source[key].map((item) => Number(item || 0)).filter((item) => DEFAULT_LEVELS.includes(item)) : [...DEFAULT_LEVELS];
    out[key] = Array.from(new Set(values.length ? values : DEFAULT_LEVELS)).sort((a, b) => a - b);
  });
  return out;
}

function sanitizeTimerSettings(raw, classKeys) {
  const out = {};
  const source = raw && typeof raw === 'object' ? raw : {};
  ['kg1', 'kg2'].concat(classKeys || []).forEach((key) => {
    out[key] = source[key] !== false;
  });
  return out;
}

function sanitizeQuizAccess(raw, classKeys) {
  const out = {};
  const source = raw && typeof raw === 'object' ? raw : {};
  ['kg1', 'kg2'].concat(classKeys || []).forEach((key) => {
    const item = source[key] && typeof source[key] === 'object' ? source[key] : {};
    const password = String(item.password || '').trim().slice(0, 120);
    out[key] = { enabled: !!item.enabled && !!password, password };
  });
  return out;
}

function sanitizeClassItem(item) {
  if (!item || typeof item !== 'object') return null;
  const name = String(item.name || '').trim();
  if (!name) return null;
  const key = slugify(item.key || item.name);
  if (!key) return null;
  return {
    key,
    name,
    description: String(item.description || '').trim().slice(0, 500),
    image: item.image || null,
    hidden: !!item.hidden,
    questionCount: Math.max(0, Number(item.questionCount || 0) || 0),
    createdAt: String(item.createdAt || '').trim(),
    updatedAt: String(item.updatedAt || '').trim()
  };
}

function sanitizeClasses(raw) {
  const list = Array.isArray(raw) ? raw.map(sanitizeClassItem).filter(Boolean) : [];
  const seen = new Set();
  return list.filter((item) => {
    if (seen.has(item.key)) return false;
    seen.add(item.key);
    return true;
  });
}

function sanitizeCustomQuestions(raw, classKeys) {
  const out = { kg1: [], kg2: [] };
  const keys = ['kg1', 'kg2'].concat(classKeys || []);
  const source = raw && typeof raw === 'object' ? raw : {};
  keys.forEach((key) => {
    out[key] = Array.isArray(source[key])
      ? source[key].map((item) => sanitizeQuestion(item, key)).filter(Boolean)
      : (out[key] || []);
  });
  return out;
}

function sanitizeQuestionOverrides(raw) {
  const out = {};
  const source = raw && typeof raw === 'object' ? raw : {};
  Object.keys(source).forEach((key) => {
    const next = sanitizeQuestion(source[key], '');
    if (next) out[String(key)] = next;
  });
  return out;
}

function sanitizeTeacherTests(raw, classKeys) {
  const out = { kg1: null, kg2: null };
  const keys = ['kg1', 'kg2'].concat(classKeys || []);
  const source = raw && typeof raw === 'object' ? raw : {};
  keys.forEach((key) => {
    const item = source[key];
    if (!item || typeof item !== 'object' || item.enabled === false) {
      out[key] = null;
      return;
    }
    const mode = String(item.mode || 'random').trim().toLowerCase();
    const name = String(item.name || `${key.toUpperCase()} Test`).trim().slice(0, 120);
    const questions = Array.isArray(item.questions)
      ? item.questions.map((q) => String(q || '').trim()).filter(Boolean).slice(0, 200)
      : [];
    let count = Math.max(1, Math.min(50, Number(item.count || questions.length || 10) || 10));
    if ((mode === 'manual' || mode === 'select') && questions.length) count = Math.min(count, questions.length);
    out[key] = { enabled: true, name, mode, count, questions };
  });
  return out;
}

function normalizeStore(raw) {
  const base = raw && typeof raw === 'object' ? raw : {};
  const classes = sanitizeClasses(base.classes || DEFAULT_STORE.classes);
  const classKeys = classes.map((item) => item.key);
  const safe = {
    version: 1,
    settings: {
      levelVisibility: sanitizeLevelVisibility(base.settings && base.settings.levelVisibility, classKeys),
      timerSettings: sanitizeTimerSettings(base.settings && base.settings.timerSettings, classKeys),
      quizAccess: sanitizeQuizAccess(base.settings && base.settings.quizAccess, classKeys)
    },
    classes,
    customQuestions: sanitizeCustomQuestions(base.customQuestions || DEFAULT_STORE.customQuestions, classKeys),
    questionOverrides: sanitizeQuestionOverrides(base.questionOverrides || DEFAULT_STORE.questionOverrides),
    teacherTests: sanitizeTeacherTests(base.teacherTests || DEFAULT_STORE.teacherTests, classKeys),
    updatedAt: String(base.updatedAt || '').trim() || new Date().toISOString()
  };
  return safe;
}

const store = createJsonStore({
  storageKey: STORAGE_KEY,
  filePath: FILE_PATH,
  memoryKey: '__KG_APP_CONFIG_MEMORY__',
  factory: () => clone(DEFAULT_STORE),
  normalize: normalizeStore
});

async function readConfig() {
  return store.read();
}

async function writeConfig(value) {
  const safe = normalizeStore(value);
  safe.updatedAt = new Date().toISOString();
  return store.write(safe);
}

function publicConfigFrom(config) {
  const safe = normalizeStore(config);
  const teacherTests = {};
  Object.keys(safe.teacherTests || {}).forEach((key) => {
    const item = safe.teacherTests[key];
    if (item && item.enabled) {
      teacherTests[key] = {
        enabled: true,
        name: item.name,
        mode: item.mode,
        count: item.count
      };
    }
  });
  const quizAccess = {};
  Object.keys(safe.settings.quizAccess || {}).forEach((key) => {
    const item = safe.settings.quizAccess[key] || {};
    quizAccess[key] = { enabled: !!item.enabled };
  });
  return {
    ok: true,
    updatedAt: safe.updatedAt,
    classes: safe.classes.map((item) => ({
      key: item.key,
      name: item.name,
      description: item.description,
      image: item.image,
      hidden: !!item.hidden,
      questionCount: item.questionCount
    })),
    levelVisibility: clone(safe.settings.levelVisibility),
    teacherTests,
    quizAccess,
    timerSettings: clone(safe.settings.timerSettings)
  };
}

async function getPublicConfig() {
  return publicConfigFrom(await readConfig());
}

async function getAdminConfig() {
  const safe = await readConfig();
  return {
    ok: true,
    updatedAt: safe.updatedAt,
    settings: clone(safe.settings),
    classes: clone(safe.classes),
    customQuestions: clone(safe.customQuestions),
    questionOverrides: clone(safe.questionOverrides),
    teacherTests: clone(safe.teacherTests)
  };
}

async function replaceAdminConfig(payload) {
  const current = await readConfig();
  const next = {
    version: 1,
    settings: payload && payload.settings ? payload.settings : current.settings,
    classes: payload && payload.classes ? payload.classes : current.classes,
    customQuestions: payload && payload.customQuestions ? payload.customQuestions : current.customQuestions,
    questionOverrides: payload && payload.questionOverrides ? payload.questionOverrides : current.questionOverrides,
    teacherTests: payload && payload.teacherTests ? payload.teacherTests : current.teacherTests,
    updatedAt: new Date().toISOString()
  };
  const saved = await writeConfig(next);
  return { ok: true, updatedAt: saved.updatedAt };
}

async function patchAdminConfig(patch) {
  const current = await readConfig();
  const next = {
    ...current,
    settings: patch && patch.settings ? patch.settings : current.settings,
    classes: patch && patch.classes ? patch.classes : current.classes,
    customQuestions: patch && patch.customQuestions ? patch.customQuestions : current.customQuestions,
    questionOverrides: patch && patch.questionOverrides ? patch.questionOverrides : current.questionOverrides,
    teacherTests: patch && patch.teacherTests ? patch.teacherTests : current.teacherTests,
    updatedAt: new Date().toISOString()
  };
  const saved = await writeConfig(next);
  return { ok: true, updatedAt: saved.updatedAt };
}

function getGradeKeys(config) {
  const safe = normalizeStore(config);
  return ['kg1', 'kg2'].concat(safe.classes.map((item) => item.key));
}

function defaultLevelVisibility() {
  return { kg1: [...DEFAULT_LEVELS], kg2: [...DEFAULT_LEVELS] };
}

module.exports = {
  DEFAULT_LEVELS,
  defaultLevelVisibility,
  getGradeKeys,
  getPublicConfig,
  getAdminConfig,
  patchAdminConfig,
  publicConfigFrom,
  readConfig,
  replaceAdminConfig,
  sanitizeQuestion,
  writeConfig
};
