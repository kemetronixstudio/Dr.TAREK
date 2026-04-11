const fs = require('fs');
const path = require('path');
const net = require('net');
const tls = require('tls');
const { kvGetJson, kvSetJson, getKvConfig } = require('./kv-store');

const STORAGE_KEY = 'kgEnglishStudentCloudV1';
const RUNTIME_DATA_DIR = process.env.RUNTIME_DATA_DIR || (process.env.VERCEL ? path.join('/tmp', 'kg-quiz-runtime') : path.join(process.cwd(), 'data'));
const FILE_PATH = process.env.STUDENT_CLOUD_DATA_PATH || path.join(RUNTIME_DATA_DIR, 'student-cloud.json');

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function safeClassName(className, isGuest) {
  const value = String(className || '').trim();
  return value || (isGuest ? 'Guest' : '');
}

function sanitizeIdentity(input) {
  const raw = input || {};
  const name = String(raw.name || raw.studentName || '').trim();
  const studentId = String(raw.studentId || '').trim();
  const grade = String(raw.grade || '').trim().toUpperCase();
  const isGuest = !!(raw.isGuest || raw.externalParticipant || raw.notInClass || raw.notInSchool);
  const className = safeClassName(raw.className || raw.class || raw.course || '', isGuest);
  if (!name) {
    const error = new Error('Student name is required');
    error.status = 400;
    throw error;
  }
  if (!grade) {
    const error = new Error('Grade is required');
    error.status = 400;
    throw error;
  }
  if (!className && !isGuest) {
    const error = new Error('Class is required unless the external participant option is checked');
    error.status = 400;
    throw error;
  }
  const identityKey = [grade, slugify(className || 'guest'), slugify(studentId || 'no-id'), slugify(name)].join('::');
  return {
    name,
    studentId,
    grade,
    className: className || 'Guest',
    isGuest,
    identityKey
  };
}

function sanitizeQuizKey(value) {
  const key = String(value || '').trim();
  if (!key) {
    const error = new Error('Quiz key is required');
    error.status = 400;
    throw error;
  }
  return key.slice(0, 180);
}

function sanitizeQuestion(question) {
  if (!question || typeof question !== 'object') return null;
  const text = String(question.text || '').trim();
  if (!text) return null;
  const options = Array.isArray(question.options) ? question.options.map((item) => String(item || '').trim()).filter(Boolean) : [];
  return {
    text,
    options,
    answer: String(question.answer || '').trim(),
    skill: String(question.skill || '').trim(),
    type: String(question.type || '').trim(),
    image: question.image || null,
    difficulty: Number(question.difficulty || 1) || 1
  };
}

function sanitizeState(raw, identity, quizKey) {
  const state = raw || {};
  return {
    key: buildCompositeKey(identity, quizKey),
    identity,
    quizKey,
    selectedCount: Number(state.selectedCount || 0) || 0,
    selectedLevelLabel: String(state.selectedLevelLabel || '').trim(),
    currentIndex: Math.max(0, Number(state.currentIndex || 0) || 0),
    score: Number(state.score || 0) || 0,
    answers: Array.isArray(state.answers) ? state.answers.map((item) => ({
      index: Number(item && item.index) || 0,
      questionText: String(item && item.questionText || '').trim(),
      chosen: item && item.chosen != null ? String(item.chosen) : '',
      correct: item ? !!item.correct : false,
      expected: String(item && item.expected || '').trim(),
      timedOut: item ? !!item.timedOut : false,
      answeredAt: String(item && item.answeredAt || '').trim()
    })) : [],
    missedQuestions: Array.isArray(state.missedQuestions) ? state.missedQuestions.map((item) => String(item || '').trim()).filter(Boolean) : [],
    skillStats: state.skillStats && typeof state.skillStats === 'object' ? state.skillStats : {},
    questions: Array.isArray(state.questions) ? state.questions.map(sanitizeQuestion).filter(Boolean) : [],
    startedAt: String(state.startedAt || new Date().toISOString()),
    updatedAt: new Date().toISOString(),
    completed: !!state.completed
  };
}

function sanitizeResult(raw, identity, quizKey) {
  const result = raw || {};
  const summary = {
    key: buildCompositeKey(identity, quizKey),
    identity,
    quizKey,
    studentName: identity.name,
    studentId: identity.studentId,
    className: identity.className,
    isGuest: identity.isGuest,
    grade: identity.grade,
    quizLevel: String(result.quizLevel || '').trim(),
    questionCount: Number(result.questionCount || 0) || 0,
    score: Number(result.score || 0) || 0,
    percent: Number(result.percent || 0) || 0,
    strengths: Array.isArray(result.strengths) ? result.strengths.map((item) => String(item || '').trim()).filter(Boolean) : [],
    weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses.map((item) => String(item || '').trim()).filter(Boolean) : [],
    advice: String(result.advice || '').trim(),
    remark: String(result.remark || '').trim(),
    homeworkTitle: String(result.homeworkTitle || '').trim(),
    date: String(result.date || '').trim(),
    lang: String(result.lang || 'en').trim(),
    missedQuestions: Array.isArray(result.missedQuestions) ? result.missedQuestions.map((item) => String(item || '').trim()).filter(Boolean) : [],
    answers: Array.isArray(result.answers) ? result.answers.map((item) => ({
      index: Number(item && item.index) || 0,
      questionText: String(item && item.questionText || '').trim(),
      chosen: item && item.chosen != null ? String(item.chosen) : '',
      correct: item ? !!item.correct : false,
      expected: String(item && item.expected || '').trim(),
      timedOut: item ? !!item.timedOut : false,
      answeredAt: String(item && item.answeredAt || '').trim()
    })) : [],
    questions: Array.isArray(result.questions) ? result.questions.map(sanitizeQuestion).filter(Boolean) : [],
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  return summary;
}

function buildCompositeKey(identity, quizKey) {
  return `${identity.identityKey}::${quizKey}`;
}

function coerceStoreShape(raw) {
  if (raw && typeof raw === 'object') {
    return {
      sessions: raw.sessions && typeof raw.sessions === 'object' ? raw.sessions : {},
      results: raw.results && typeof raw.results === 'object' ? raw.results : {},
      notes: raw.notes && typeof raw.notes === 'object' ? raw.notes : {}
    };
  }
  return { sessions: {}, results: {}, notes: {} };
}

function createRedisSocket(redisUrl) {
  const parsed = new URL(redisUrl);
  const options = {
    host: parsed.hostname,
    port: Number(parsed.port || (parsed.protocol === 'rediss:' ? 6380 : 6379))
  };
  return parsed.protocol === 'rediss:' ? tls.connect(options) : net.createConnection(options);
}

function encodeRedisCommand(parts) {
  const items = Array.isArray(parts) ? parts : [];
  let out = `*${items.length}\r\n`;
  items.forEach((part) => {
    const value = Buffer.isBuffer(part) ? part : Buffer.from(String(part), 'utf8');
    out += `$${value.length}\r\n${value.toString('utf8')}\r\n`;
  });
  return out;
}

function parseRedisReply(buffer) {
  function readAt(offset) {
    const type = String.fromCharCode(buffer[offset]);
    let cursor = offset + 1;
    const lineEnd = buffer.indexOf('\r\n', cursor, 'utf8');
    if (lineEnd < 0) return null;
    const line = buffer.toString('utf8', cursor, lineEnd);
    cursor = lineEnd + 2;
    if (type === '+') return { value: line, next: cursor };
    if (type === '-') throw new Error(line || 'Redis error');
    if (type === ':') return { value: Number(line || 0), next: cursor };
    if (type === '$') {
      const len = Number(line || -1);
      if (len === -1) return { value: null, next: cursor };
      if (buffer.length < cursor + len + 2) return null;
      const value = buffer.toString('utf8', cursor, cursor + len);
      return { value, next: cursor + len + 2 };
    }
    if (type === '*') {
      const count = Number(line || 0);
      if (count === -1) return { value: null, next: cursor };
      const arr = [];
      let next = cursor;
      for (let i = 0; i < count; i += 1) {
        const item = readAt(next);
        if (!item) return null;
        arr.push(item.value);
        next = item.next;
      }
      return { value: arr, next };
    }
    return null;
  }
  return readAt(0);
}

async function redisCommand(commandParts) {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;
  const parsed = new URL(redisUrl);
  const password = decodeURIComponent(parsed.password || '');
  const username = decodeURIComponent(parsed.username || '');
  const dbIndex = String(parsed.pathname || '').replace(/^\//, '').trim();

  const queue = [];
  if (password || username) queue.push(username ? ['AUTH', username, password] : ['AUTH', password]);
  if (dbIndex) queue.push(['SELECT', dbIndex]);
  queue.push(commandParts);

  return new Promise((resolve, reject) => {
    const socket = createRedisSocket(redisUrl);
    let raw = Buffer.alloc(0);
    let replies = queue.length;
    let lastValue = null;
    let settled = false;

    const finishError = (error) => {
      if (settled) return;
      settled = true;
      try { socket.destroy(); } catch (e) {}
      reject(error);
    };

    socket.on('error', finishError);
    socket.on('connect', () => {
      try {
        queue.forEach((cmd) => socket.write(encodeRedisCommand(cmd)));
      } catch (error) {
        finishError(error);
      }
    });
    socket.on('data', (chunk) => {
      if (settled) return;
      raw = Buffer.concat([raw, chunk]);
      try {
        while (replies > 0) {
          const parsedReply = parseRedisReply(raw);
          if (!parsedReply) break;
          lastValue = parsedReply.value;
          raw = raw.slice(parsedReply.next);
          replies -= 1;
        }
        if (replies === 0 && !settled) {
          settled = true;
          try { socket.end(); } catch (e) {}
          resolve(lastValue);
        }
      } catch (error) {
        finishError(error);
      }
    });
  });
}

async function redisGetJson() {
  const raw = await redisCommand(['GET', STORAGE_KEY]);
  if (raw == null) return null;
  if (typeof raw === 'string') return JSON.parse(raw);
  return raw;
}

async function redisSetJson(value) {
  const raw = JSON.stringify(value);
  await redisCommand(['SET', STORAGE_KEY, raw]);
  return true;
}

function readFileJson() {
  try {
    if (!fs.existsSync(FILE_PATH)) return null;
    const raw = fs.readFileSync(FILE_PATH, 'utf8');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function writeFileJson(value) {
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(value, null, 2), 'utf8');
  return true;
}

function getMemoryStore() {
  globalThis.__KG_STUDENT_CLOUD_MEMORY__ = globalThis.__KG_STUDENT_CLOUD_MEMORY__ || { sessions: {}, results: {}, notes: {} };
  return globalThis.__KG_STUDENT_CLOUD_MEMORY__;
}

function setMemoryStore(value) {
  globalThis.__KG_STUDENT_CLOUD_MEMORY__ = coerceStoreShape(value);
  return true;
}

async function readStore() {
  let raw;
  try { raw = await kvGetJson(STORAGE_KEY, undefined); } catch (error) { raw = undefined; }
  if (raw == null) {
    try { raw = await redisGetJson(); } catch (error) { raw = undefined; }
  }
  if (raw == null && !process.env.VERCEL && !getKvConfig()) raw = readFileJson();
  if (raw == null) raw = getMemoryStore();
  return coerceStoreShape(raw);
}

async function writeStore(store) {
  const safe = coerceStoreShape(store);
  try {
    const done = await kvSetJson(STORAGE_KEY, safe);
    if (done) return safe;
  } catch (error) {}
  try {
    const done = await redisSetJson(safe);
    if (done) return safe;
  } catch (error) {}
  if (!process.env.VERCEL && !getKvConfig()) {
    try {
      writeFileJson(safe);
      return safe;
    } catch (error) {}
  }
  setMemoryStore(safe);
  if (process.env.VERCEL && getKvConfig()) {
    const writeError = new Error('Persistent KV storage write failed. Check Vercel KV environment variables.');
    writeError.code = 'KV_WRITE_FAILED';
    throw writeError;
  }
  return safe;
}

async function getStudentQuiz(identityInput, quizKeyInput) {
  const identity = sanitizeIdentity(identityInput);
  const quizKey = sanitizeQuizKey(quizKeyInput);
  const compositeKey = buildCompositeKey(identity, quizKey);
  const store = await readStore();
  return {
    identity,
    quizKey,
    key: compositeKey,
    progress: store.sessions[compositeKey] || null,
    result: store.results[compositeKey] || null
  };
}

async function saveProgress(payload) {
  const identity = sanitizeIdentity(payload.identity || payload);
  const quizKey = sanitizeQuizKey(payload.quizKey || payload.quizId || payload.quiz);
  const store = await readStore();
  const state = sanitizeState(payload.state || payload.progress || payload, identity, quizKey);
  store.sessions[state.key] = state;
  await writeStore(store);
  return { ok: true, progress: state };
}

async function submitResult(payload) {
  const identity = sanitizeIdentity(payload.identity || payload);
  const quizKey = sanitizeQuizKey(payload.quizKey || payload.quizId || payload.quiz);
  const store = await readStore();
  const result = sanitizeResult(payload.result || payload, identity, quizKey);
  const progress = sanitizeState(Object.assign({}, payload.state || payload.progress || {}, { completed: true }), identity, quizKey);
  progress.completed = true;
  progress.completedAt = result.completedAt;
  progress.resultKey = result.key;
  store.sessions[result.key] = progress;
  store.results[result.key] = result;
  await writeStore(store);
  return { ok: true, result, progress };
}

function buildSummary(row, status, teacherNote) {
  const identity = row.identity || {};
  return {
    key: row.key,
    identityKey: identity.identityKey || '',
    status,
    studentName: row.studentName || identity.name || '',
    studentId: row.studentId || identity.studentId || '',
    className: row.className || identity.className || '',
    isGuest: !!(row.isGuest || identity.isGuest),
    grade: row.grade || identity.grade || '',
    quizKey: row.quizKey,
    quizLevel: row.quizLevel || row.selectedLevelLabel || '',
    homeworkTitle: row.homeworkTitle || '',
    questionCount: row.questionCount || row.selectedCount || (Array.isArray(row.questions) ? row.questions.length : 0),
    score: Number(row.score || 0) || 0,
    percent: Number(row.percent || 0) || 0,
    updatedAt: row.updatedAt || row.completedAt || row.startedAt || '',
    completedAt: row.completedAt || '',
    currentIndex: Number(row.currentIndex || 0) || 0,
    teacherNote: teacherNote || ''
  };
}

function applyFilters(rows, filters) {
  const q = slugify((filters && filters.q) || '');
  const classFilter = slugify((filters && filters.className) || (filters && filters.class) || '');
  const statusFilter = String((filters && filters.status) || '').trim().toLowerCase();
  return rows.filter((row) => {
    if (statusFilter && row.status !== statusFilter) return false;
    if (classFilter && slugify(row.className) !== classFilter) return false;
    if (!q) return true;
    return [row.studentName, row.studentId, row.className, row.grade, row.quizLevel, row.quizKey].some((value) => slugify(value).includes(q));
  });
}

async function listRecords(filters) {
  const store = await readStore();
  const rows = [];
  Object.values(store.results || {}).forEach((item) => {
    const note = item && item.identity && store.notes[item.identity.identityKey] ? store.notes[item.identity.identityKey].note : '';
    rows.push(buildSummary(item, 'completed', note));
  });
  Object.values(store.sessions || {}).forEach((item) => {
    if (!item || item.completed || (store.results && store.results[item.key])) return;
    const note = item && item.identity && store.notes[item.identity.identityKey] ? store.notes[item.identity.identityKey].note : '';
    rows.push(buildSummary(item, 'in-progress', note));
  });
  const filtered = applyFilters(rows, filters).sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  return { ok: true, rows: filtered, total: filtered.length };
}

async function detailFor(key) {
  const safeKey = String(key || '').trim();
  if (!safeKey) {
    const error = new Error('Record key is required');
    error.status = 400;
    throw error;
  }
  const store = await readStore();
  const result = store.results[safeKey] || null;
  const progress = store.sessions[safeKey] || null;
  const identityKey = (result && result.identity && result.identity.identityKey) || (progress && progress.identity && progress.identity.identityKey) || '';
  return {
    ok: true,
    result,
    progress,
    note: identityKey && store.notes[identityKey] ? store.notes[identityKey] : null
  };
}

async function saveTeacherNote(payload) {
  const identity = sanitizeIdentity(payload.identity || payload);
  const note = String(payload.note || '').trim().slice(0, 2000);
  const author = String(payload.author || payload.adminName || payload.teacher || '').trim().slice(0, 120);
  const store = await readStore();
  store.notes[identity.identityKey] = {
    identity,
    note,
    author,
    updatedAt: new Date().toISOString()
  };
  await writeStore(store);
  return { ok: true, note: store.notes[identity.identityKey] };
}

function buildAnalyticsFromStore(store, filters) {
  const resultRows = applyFilters(Object.values(store.results || {}).map((item) => buildSummary(item, 'completed', item && item.identity && store.notes[item.identity.identityKey] ? store.notes[item.identity.identityKey].note : '')), filters);
  const classMap = {};
  const studentMap = {};
  const allWeaknesses = {};

  resultRows.forEach((row) => {
    const classKey = isPlayLikeRow(row) ? 'PLAY::Play & Test' : `${row.grade}::${row.className}`;
    if (!classMap[classKey]) {
      classMap[classKey] = {
        className: isPlayLikeRow(row) ? 'Play & Test' : row.className,
        grade: isPlayLikeRow(row) ? 'PLAY' : row.grade,
        attempts: 0,
        totalPercent: 0,
        totalScore: 0,
        students: new Set(),
        topScore: 0
      };
    }
    classMap[classKey].attempts += 1;
    classMap[classKey].totalPercent += row.percent;
    classMap[classKey].totalScore += row.score;
    classMap[classKey].students.add(row.identityKey || row.studentId || row.studentName);
    classMap[classKey].topScore = Math.max(classMap[classKey].topScore, row.percent);

    const studentKey = (String(row.className || '') === 'Play & Test' || String(row.quizKey || '').startsWith('PLAYTEST|')) ? normalizePlayerKey(row) : (row.identityKey || [row.grade, row.className, row.studentId || row.studentName].join('::'));
    if (!studentMap[studentKey]) {
      studentMap[studentKey] = {
        studentName: row.studentName,
        studentId: row.studentId,
        className: isPlayLikeRow(row) ? 'Play & Test' : row.className,
        grade: isPlayLikeRow(row) ? 'PLAY' : row.grade,
        attempts: 0,
        totalPercent: 0,
        bestPercent: 0,
        bestScore: 0,
        updatedAt: row.updatedAt,
        teacherNote: row.teacherNote || ''
      };
    }
    studentMap[studentKey].attempts += 1;
    studentMap[studentKey].totalPercent += row.percent;
    studentMap[studentKey].bestPercent = Math.max(studentMap[studentKey].bestPercent, row.percent);
    studentMap[studentKey].bestScore = Math.max(studentMap[studentKey].bestScore, row.score);
    if (String(row.updatedAt || '') > String(studentMap[studentKey].updatedAt || '')) studentMap[studentKey].updatedAt = row.updatedAt;
    if (row.teacherNote) studentMap[studentKey].teacherNote = row.teacherNote;

    const original = store.results[row.key];
    const weaknesses = original && Array.isArray(original.weaknesses) ? original.weaknesses : [];
    weaknesses.forEach((skill) => {
      const safeSkill = String(skill || '').trim();
      if (!safeSkill) return;
      allWeaknesses[safeSkill] = (allWeaknesses[safeSkill] || 0) + 1;
    });
  });

  const classAnalytics = Object.values(classMap)
    .map((item) => ({
      className: item.className,
      grade: item.grade,
      studentCount: item.students.size,
      attempts: item.attempts,
      averagePercent: item.attempts ? Math.round(item.totalPercent / item.attempts) : 0,
      averageScore: item.attempts ? Math.round((item.totalScore / item.attempts) * 10) / 10 : 0,
      topScore: item.topScore
    }))
    .sort((a, b) => b.averagePercent - a.averagePercent || a.className.localeCompare(b.className));

  const leaderboard = Object.values(studentMap)
    .map((item) => ({
      studentName: item.studentName,
      studentId: item.studentId,
      className: item.className,
      grade: item.grade,
      attempts: item.attempts,
      averagePercent: item.attempts ? Math.round(item.totalPercent / item.attempts) : 0,
      bestPercent: item.bestPercent,
      bestScore: item.bestScore,
      updatedAt: item.updatedAt,
      teacherNote: item.teacherNote || ''
    }))
    .sort((a, b) => b.bestPercent - a.bestPercent || b.averagePercent - a.averagePercent || String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
    .slice(0, 100);

  const totals = {
    totalCompletedAttempts: resultRows.length,
    totalClasses: classAnalytics.length,
    totalStudents: Object.keys(studentMap).length,
    averagePercent: resultRows.length ? Math.round(resultRows.reduce((sum, row) => sum + row.percent, 0) / resultRows.length) : 0,
    mostCommonWeakness: Object.entries(allWeaknesses).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
  };

  return { ok: true, totals, classAnalytics, leaderboard };
}


async function getPlaySession(identityInput, sessionIdInput) {
  const identity = sanitizeIdentity(Object.assign({}, identityInput || {}, { isGuest: true, className: (identityInput && identityInput.className) || 'Play & Test' }));
  const requested = String(sessionIdInput || '').trim();
  const store = await readStore();
  const allSessions = Object.values(store.sessions || {}).filter((item) => item && item.identity && item.identity.identityKey === identity.identityKey && String(item.quizKey || '').startsWith('PLAYTEST|'));
  let progress = null;
  if (requested) progress = allSessions.find((item) => item.quizKey === requested) || null;
  if (!progress) {
    progress = allSessions
      .filter((item) => !item.completed)
      .sort((a, b) => String(b.updatedAt || b.startedAt || '').localeCompare(String(a.updatedAt || a.startedAt || '')))[0] || null;
  }
  if (progress) {
    return {
      ok: true,
      identity,
      sessionId: progress.quizKey,
      progress,
      result: store.results[progress.key] || null,
      created: false
    };
  }
  const sessionId = requested || `PLAYTEST|${Date.now()}|${Math.random().toString(36).slice(2, 8)}`;
  return { ok: true, identity, sessionId, progress: null, result: null, created: true };
}


function normalizePlayerKey(row) {
  const studentId = String(row.studentId || (row.identity && row.identity.studentId) || '').trim().toLowerCase();
  if (studentId) return `id:${studentId}`;
  const name = String(row.studentName || (row.identity && row.identity.name) || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  if (name) return `name:${name}`;
  try {
    return buildCompositeKey(sanitizeIdentity(row.identity || row), row.quizKey || '');
  } catch (error) {
    return `anon:${String(row.quizKey || '')}`;
  }
}


function isPlayLikeRow(row) {
  const quizKey = String((row && row.quizKey) || '').trim();
  const className = String((row && row.className) || (row && row.identity && row.identity.className) || '').trim().toLowerCase();
  const grade = String((row && row.grade) || (row && row.identity && row.identity.grade) || '').trim().toLowerCase();
  return quizKey.startsWith('PLAYTEST|') || className === 'play & test' || grade === 'play';
}

async function getPlayLeaderboard() {
  const store = await readStore();
  const relevant = Object.values(store.results || {}).filter((item) => item && String(item.quizKey || '').startsWith('PLAYTEST|'));
  const playerMap = {};
  relevant.forEach((row) => {
    const key = normalizePlayerKey(row);
    if (!playerMap[key]) {
      playerMap[key] = {
        studentName: row.studentName || (row.identity && row.identity.name) || '',
        studentId: row.studentId || (row.identity && row.identity.studentId) || '',
        grade: row.grade || (row.identity && row.identity.grade) || '',
        className: row.className || (row.identity && row.identity.className) || 'Play & Test',
        attempts: 0,
        bestPercent: 0,
        latestPercent: 0,
        updatedAt: '',
        bestScore: 0,
        questionCount: 0
      };
    }
    const item = playerMap[key];
    item.attempts += 1;
    item.latestPercent = Number(row.percent || 0) || 0;
    item.updatedAt = String(row.completedAt || row.updatedAt || '');
    const rowPercent = Number(row.percent || 0) || 0;
    const rowScore = Number(row.score || 0) || 0;
    if (
      rowScore > item.bestScore ||
      (rowScore === item.bestScore && rowPercent > item.bestPercent)
    ) {
      item.bestPercent = rowPercent;
      item.bestScore = rowScore;
      item.questionCount = Number(row.questionCount || 0) || 0;
      item.grade = row.grade || (row.identity && row.identity.grade) || item.grade || '';
      item.className = row.className || (row.identity && row.identity.className) || item.className || 'Play & Test';
      item.studentName = row.studentName || (row.identity && row.identity.name) || item.studentName;
      item.studentId = row.studentId || (row.identity && row.identity.studentId) || item.studentId;
    }
  });
  const allPlayers = Object.values(playerMap).sort((a, b) =>
    b.bestScore - a.bestScore ||
    b.bestPercent - a.bestPercent ||
    String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
  );
  const leaderboard = allPlayers.slice(0, 20);
  return { ok: true, top3: allPlayers.slice(0, 3), leaderboard, totalPlayers: allPlayers.length };
}


async function resetPlayLeaderboard() {
  const store = await readStore();
  const removedIdentityKeys = new Set();
  Object.keys(store.results || {}).forEach((key) => {
    const row = store.results[key];
    if (row && isPlayLikeRow(row)) {
      if (row.identity && row.identity.identityKey) removedIdentityKeys.add(row.identity.identityKey);
      delete store.results[key];
    }
  });
  Object.keys(store.sessions || {}).forEach((key) => {
    const row = store.sessions[key];
    if (row && isPlayLikeRow(row)) {
      if (row.identity && row.identity.identityKey) removedIdentityKeys.add(row.identity.identityKey);
      delete store.sessions[key];
    }
  });
  Object.keys(store.notes || {}).forEach((key) => {
    if (String(key || '').startsWith('PLAYTEST|') || removedIdentityKeys.has(key)) {
      delete store.notes[key];
    }
  });
  await writeStore(store);
  return { ok: true };
}

async function resetAllStudentData() {
  const store = await readStore();
  store.results = {};
  store.sessions = {};
  store.notes = {};
  await writeStore(store);
  return { ok: true };
}

async function analytics(filters) {
  const store = await readStore();
  return buildAnalyticsFromStore(store, filters);
}

async function exportRows(filters) {
  const store = await readStore();
  const baseRows = await listRecords(filters);
  const analyticsData = buildAnalyticsFromStore(store, filters);
  const rows = baseRows.rows.map((row) => ({
    Student: row.studentName,
    StudentID: row.studentId || '',
    Class: row.className || '',
    Grade: row.grade || '',
    Quiz: row.quizLevel || row.quizKey || '',
    Status: row.status,
    ScorePercent: row.status === 'completed' ? row.percent : '',
    RawScore: row.score,
    QuestionCount: row.questionCount,
    CurrentQuestion: row.status === 'in-progress' ? row.currentIndex + 1 : '',
    UpdatedAt: row.updatedAt,
    TeacherNote: row.teacherNote || ''
  }));
  return { ok: true, rows, analytics: analyticsData };
}

module.exports = {
  sanitizeIdentity,
  sanitizeQuizKey,
  getStudentQuiz,
  saveProgress,
  submitResult,
  listRecords,
  detailFor,
  saveTeacherNote,
  analytics,
  exportRows,
  getPlaySession,
  getPlayLeaderboard,
  resetPlayLeaderboard,
  resetAllStudentData
};
