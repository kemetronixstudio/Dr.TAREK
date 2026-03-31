const fs = require('fs');
const path = require('path');
const net = require('net');
const tls = require('tls');

const STORAGE_KEY = 'kgEnglishStudentCloudV1';
const FILE_PATH = path.join(process.cwd(), 'data', 'student-cloud.json');

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
      results: raw.results && typeof raw.results === 'object' ? raw.results : {}
    };
  }
  return { sessions: {}, results: {} };
}

async function kvGetJson() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const response = await fetch(`${url}/get/${encodeURIComponent(STORAGE_KEY)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`KV get failed: ${response.status}`);
  const payload = await response.json();
  if (!payload || payload.result == null) return null;
  if (typeof payload.result === 'string') return JSON.parse(payload.result);
  return payload.result;
}

async function kvSetJson(value) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return false;
  const encoded = encodeURIComponent(JSON.stringify(value));
  const response = await fetch(`${url}/set/${encodeURIComponent(STORAGE_KEY)}/${encoded}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`KV set failed: ${response.status}`);
  return true;
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
  globalThis.__KG_STUDENT_CLOUD_MEMORY__ = globalThis.__KG_STUDENT_CLOUD_MEMORY__ || { sessions: {}, results: {} };
  return globalThis.__KG_STUDENT_CLOUD_MEMORY__;
}

function setMemoryStore(value) {
  globalThis.__KG_STUDENT_CLOUD_MEMORY__ = coerceStoreShape(value);
  return true;
}

async function readStore() {
  let raw;
  try { raw = await kvGetJson(); } catch (error) { raw = undefined; }
  if (raw == null) {
    try { raw = await redisGetJson(); } catch (error) { raw = undefined; }
  }
  if (raw == null) raw = readFileJson();
  if (raw == null) raw = getMemoryStore();
  return coerceStoreShape(raw);
}

async function writeStore(store) {
  const safe = coerceStoreShape(store);
  try {
    const done = await kvSetJson(safe);
    if (done) return safe;
  } catch (error) {}
  try {
    const done = await redisSetJson(safe);
    if (done) return safe;
  } catch (error) {}
  try {
    writeFileJson(safe);
    return safe;
  } catch (error) {}
  setMemoryStore(safe);
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

function buildSummary(row, status) {
  const identity = row.identity || {};
  return {
    key: row.key,
    status,
    studentName: row.studentName || identity.name || '',
    studentId: row.studentId || identity.studentId || '',
    className: row.className || identity.className || '',
    isGuest: !!(row.isGuest || identity.isGuest),
    grade: row.grade || identity.grade || '',
    quizKey: row.quizKey,
    quizLevel: row.quizLevel || row.selectedLevelLabel || '',
    questionCount: row.questionCount || row.selectedCount || (Array.isArray(row.questions) ? row.questions.length : 0),
    score: Number(row.score || 0) || 0,
    percent: Number(row.percent || 0) || 0,
    updatedAt: row.updatedAt || row.completedAt || row.startedAt || '',
    completedAt: row.completedAt || '',
    currentIndex: Number(row.currentIndex || 0) || 0
  };
}

async function listRecords(filters) {
  const store = await readStore();
  const rows = [];
  Object.values(store.results || {}).forEach((item) => { rows.push(buildSummary(item, 'completed')); });
  Object.values(store.sessions || {}).forEach((item) => {
    if (!item || item.completed || (store.results && store.results[item.key])) return;
    rows.push(buildSummary(item, 'in-progress'));
  });
  const q = slugify((filters && filters.q) || '');
  const classFilter = slugify((filters && filters.className) || (filters && filters.class) || '');
  const statusFilter = String((filters && filters.status) || '').trim().toLowerCase();
  const filtered = rows.filter((row) => {
    if (statusFilter && row.status !== statusFilter) return false;
    if (classFilter && slugify(row.className) !== classFilter) return false;
    if (!q) return true;
    return [row.studentName, row.studentId, row.className, row.grade, row.quizLevel, row.quizKey].some((value) => slugify(value).includes(q));
  }).sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
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
  return {
    ok: true,
    result: store.results[safeKey] || null,
    progress: store.sessions[safeKey] || null
  };
}

module.exports = {
  sanitizeIdentity,
  sanitizeQuizKey,
  getStudentQuiz,
  saveProgress,
  submitResult,
  listRecords,
  detailFor
};
