const path = require('path');
const crypto = require('crypto');
const { createJsonStore } = require('./json-store');
const configBackend = require('./app-config-backend');
const questionBank = require('./question-bank-backend');

const STORAGE_KEY = process.env.STUDENT_CLOUD_STORAGE_KEY || 'kgEnglishStudentCloudV2';
const FILE_PATH = path.join(process.cwd(), 'data', 'student-cloud.json');

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
    const error = new Error('Class is required unless the outside-student option is checked');
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

function normalizeQuestion(question) {
  if (!question || typeof question !== 'object') return null;
  const text = String(question.text || '').trim();
  const options = Array.isArray(question.options) ? question.options.map((item) => String(item || '').trim()).filter(Boolean) : [];
  const answer = String(question.answer || '').trim();
  if (!text || !options.length || !answer) return null;
  const fixedAnswer = options.includes(answer)
    ? answer
    : (options.find((item) => item.toLowerCase() === answer.toLowerCase()) || '');
  if (!fixedAnswer) return null;
  return {
    id: String(question.id || '').trim() || crypto.createHash('sha1').update(`${text}|${fixedAnswer}`).digest('hex').slice(0, 16),
    grade: String(question.grade || '').trim().toUpperCase(),
    skill: String(question.skill || 'General').trim() || 'General',
    type: String(question.type || 'Choice').trim() || 'Choice',
    text,
    options,
    answer: fixedAnswer,
    image: question.image || null,
    difficulty: Math.max(1, Math.min(3, Number(question.difficulty || 1) || 1))
  };
}

function sanitizePublicQuestion(question) {
  const safe = normalizeQuestion(question);
  if (!safe) return null;
  return {
    id: safe.id,
    grade: safe.grade,
    skill: safe.skill,
    type: safe.type,
    text: safe.text,
    options: safe.options.slice(),
    image: safe.image || null,
    difficulty: safe.difficulty
  };
}

function buildCompositeKey(identity, quizKey) {
  return `${identity.identityKey}::${quizKey}`;
}

function sanitizeSkillStats(raw) {
  const out = {};
  const source = raw && typeof raw === 'object' ? raw : {};
  Object.keys(source).forEach((key) => {
    const item = source[key] || {};
    out[String(key)] = {
      right: Number(item.right || 0) || 0,
      wrong: Number(item.wrong || 0) || 0,
      samples: Array.isArray(item.samples) ? item.samples.map((value) => String(value || '').trim()).filter(Boolean).slice(0, 10) : []
    };
  });
  return out;
}

function ensureSkillStat(skillStats, skill, sampleText) {
  const key = String(skill || 'General').trim() || 'General';
  if (!skillStats[key]) skillStats[key] = { right: 0, wrong: 0, samples: [] };
  if (sampleText && !skillStats[key].samples.includes(sampleText)) skillStats[key].samples.push(sampleText);
  return skillStats[key];
}

function sanitizeAnswerEntry(raw, questionMap) {
  if (!raw || typeof raw !== 'object') return null;
  const index = Math.max(0, Number(raw.index || 0) || 0);
  const questionId = String(raw.questionId || '').trim();
  const fallbackQuestion = questionId && questionMap && questionMap[questionId] ? questionMap[questionId] : null;
  return {
    index,
    questionId,
    questionText: String(raw.questionText || (fallbackQuestion && fallbackQuestion.text) || '').trim(),
    chosen: raw.chosen != null ? String(raw.chosen) : '',
    correct: !!raw.correct,
    expected: String(raw.expected || (fallbackQuestion && fallbackQuestion.answer) || '').trim(),
    timedOut: !!raw.timedOut,
    answeredAt: String(raw.answeredAt || '').trim(),
    remainingSeconds: Math.max(0, Number(raw.remainingSeconds || 0) || 0),
    earnedScore: Math.max(0, Number(raw.earnedScore || 0) || 0)
  };
}

function sanitizeSession(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const identity = sanitizeIdentity(raw.identity || raw);
  const quizKey = sanitizeQuizKey(raw.quizKey || raw.sessionId || raw.quizId || raw.quiz);
  const questions = Array.isArray(raw.questions) ? raw.questions.map(normalizeQuestion).filter(Boolean) : [];
  const questionMap = {};
  questions.forEach((question) => { questionMap[question.id] = question; });
  const skillStats = sanitizeSkillStats(raw.skillStats || {});
  questions.forEach((question) => ensureSkillStat(skillStats, question.skill, question.text));
  return {
    key: buildCompositeKey(identity, quizKey),
    identity,
    quizKey,
    mode: String(raw.mode || 'quiz').trim().toLowerCase() === 'play' ? 'play' : 'quiz',
    gradeKey: String(raw.gradeKey || identity.grade || '').trim().toLowerCase(),
    selectedCount: Math.max(1, Number(raw.selectedCount || raw.questionCount || questions.length || 1) || 1),
    selectedLevelLabel: String(raw.selectedLevelLabel || raw.quizLevel || '').trim(),
    questionCount: Math.max(1, Number(raw.questionCount || raw.selectedCount || questions.length || 1) || 1),
    currentIndex: Math.max(0, Number(raw.currentIndex || 0) || 0),
    score: Math.max(0, Number(raw.score || 0) || 0),
    answers: Array.isArray(raw.answers) ? raw.answers.map((item) => sanitizeAnswerEntry(item, questionMap)).filter(Boolean) : [],
    missedQuestions: Array.isArray(raw.missedQuestions) ? raw.missedQuestions.map((item) => String(item || '').trim()).filter(Boolean) : [],
    skillStats,
    questions,
    startedAt: String(raw.startedAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
    questionStartedAt: String(raw.questionStartedAt || raw.startedAt || new Date().toISOString()),
    completed: !!raw.completed,
    completedAt: String(raw.completedAt || '').trim(),
    timerEnabled: raw.timerEnabled !== false,
    timeLimitSeconds: Math.max(0, Number(raw.timeLimitSeconds || 0) || 0),
    playStage: String(raw.playStage || '').trim().toLowerCase(),
    playEndedReason: String(raw.playEndedReason || '').trim().toLowerCase(),
    lang: String(raw.lang || 'en').trim()
  };
}

function sanitizeResult(raw, identity, quizKey) {
  const result = raw || {};
  return {
    key: buildCompositeKey(identity, quizKey),
    identity,
    quizKey,
    studentName: identity.name,
    studentId: identity.studentId,
    className: identity.className,
    isGuest: identity.isGuest,
    grade: identity.grade,
    quizLevel: String(result.quizLevel || '').trim(),
    questionCount: Math.max(0, Number(result.questionCount || 0) || 0),
    score: Math.max(0, Number(result.score || 0) || 0),
    percent: Math.max(0, Number(result.percent || 0) || 0),
    strengths: Array.isArray(result.strengths) ? result.strengths.map((item) => String(item || '').trim()).filter(Boolean) : [],
    weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses.map((item) => String(item || '').trim()).filter(Boolean) : [],
    advice: String(result.advice || '').trim(),
    remark: String(result.remark || '').trim(),
    date: String(result.date || '').trim(),
    lang: String(result.lang || 'en').trim(),
    missedQuestions: Array.isArray(result.missedQuestions) ? result.missedQuestions.map((item) => String(item || '').trim()).filter(Boolean) : [],
    answers: Array.isArray(result.answers) ? result.answers.map((item) => sanitizeAnswerEntry(item, {})).filter(Boolean) : [],
    questions: Array.isArray(result.questions) ? result.questions.map(normalizeQuestion).filter(Boolean) : [],
    completedAt: String(result.completedAt || new Date().toISOString()),
    updatedAt: new Date().toISOString(),
    mode: String(result.mode || 'quiz').trim().toLowerCase() === 'play' ? 'play' : 'quiz',
    timerEnabled: result.timerEnabled !== false,
    timeLimitSeconds: Math.max(0, Number(result.timeLimitSeconds || 0) || 0),
    playStage: String(result.playStage || '').trim().toLowerCase(),
    playEndedReason: String(result.playEndedReason || '').trim().toLowerCase()
  };
}

function coerceStoreShape(raw) {
  if (raw && typeof raw === 'object') {
    return {
      version: 2,
      sessions: raw.sessions && typeof raw.sessions === 'object' ? raw.sessions : {},
      results: raw.results && typeof raw.results === 'object' ? raw.results : {},
      notes: raw.notes && typeof raw.notes === 'object' ? raw.notes : {}
    };
  }
  return { version: 2, sessions: {}, results: {}, notes: {} };
}

const store = createJsonStore({
  storageKey: STORAGE_KEY,
  filePath: FILE_PATH,
  memoryKey: '__KG_STUDENT_CLOUD_MEMORY__',
  factory: () => ({ version: 2, sessions: {}, results: {}, notes: {} }),
  normalize: coerceStoreShape
});

async function readStore() {
  return store.read();
}

async function writeStore(value) {
  return store.write(coerceStoreShape(value));
}

function buildSessionPayload(session) {
  const safe = sanitizeSession(session);
  const currentQuestion = safe.questions[safe.currentIndex] || null;
  const now = Date.now();
  const startedAt = safe.questionStartedAt ? new Date(safe.questionStartedAt).getTime() : now;
  const deadline = safe.timerEnabled && safe.timeLimitSeconds > 0 ? (startedAt + safe.timeLimitSeconds * 1000) : 0;
  const timeLeft = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
  return {
    key: safe.key,
    identity: safe.identity,
    quizKey: safe.quizKey,
    sessionId: safe.quizKey,
    mode: safe.mode,
    gradeKey: safe.gradeKey,
    selectedCount: safe.selectedCount,
    selectedLevelLabel: safe.selectedLevelLabel,
    questionCount: safe.questionCount,
    currentIndex: safe.currentIndex,
    score: safe.score,
    answers: safe.answers.map((item) => ({ ...item })),
    missedQuestions: safe.missedQuestions.slice(),
    skillStats: clone(safe.skillStats),
    questions: safe.questions.map(sanitizePublicQuestion).filter(Boolean),
    startedAt: safe.startedAt,
    updatedAt: safe.updatedAt,
    questionStartedAt: safe.questionStartedAt,
    completed: safe.completed,
    completedAt: safe.completedAt,
    timerEnabled: safe.timerEnabled,
    timeLimitSeconds: safe.timeLimitSeconds,
    playStage: safe.playStage,
    playEndedReason: safe.playEndedReason,
    timeLeft,
    question: sanitizePublicQuestion(currentQuestion)
  };
}

function todayGbDate() {
  return new Intl.DateTimeFormat('en-GB').format(new Date());
}

function resultRemark(percent) {
  if (percent >= 85) return 'Excellent';
  if (percent >= 70) return 'Very Good';
  if (percent >= 50) return 'Good';
  return 'Keep Practicing';
}

function smartAdvice(weaknesses) {
  if (!Array.isArray(weaknesses) || !weaknesses.length) return 'Excellent work. Keep reading and speaking every day.';
  return weaknesses.map((skill) => `Practice ${skill} with short daily activities.`).join(' ');
}

function finalizeResultFromSession(session) {
  const weaknessEntries = Object.entries(session.skillStats || {}).map(([skill, stat]) => ({ skill, wrong: Number(stat.wrong || 0) || 0, right: Number(stat.right || 0) || 0 }));
  const weaknesses = weaknessEntries.filter((item) => item.wrong > 0).sort((a, b) => b.wrong - a.wrong || a.skill.localeCompare(b.skill)).slice(0, 2).map((item) => item.skill);
  const strengths = weaknessEntries.filter((item) => item.right > 0).sort((a, b) => b.right - a.right || a.skill.localeCompare(b.skill)).slice(0, 2).map((item) => item.skill);
  const questionCount = session.mode === 'play' ? Math.max(0, session.answers.length) : session.questionCount;
  const maxScore = session.mode === 'play'
    ? Math.max(1, questionCount)
    : Math.max(1, questionCount * (session.timerEnabled ? (10 + session.timeLimitSeconds) : 10));
  const percent = session.mode === 'play'
    ? Math.max(0, session.score)
    : Math.round((session.score / maxScore) * 100);
  const completedAt = new Date().toISOString();
  const quizLevel = session.mode === 'play'
    ? 'Play & Test'
    : (session.selectedLevelLabel || session.quizKey);
  return sanitizeResult({
    mode: session.mode,
    timerEnabled: session.timerEnabled,
    timeLimitSeconds: session.timeLimitSeconds,
    playStage: session.playStage,
    playEndedReason: session.playEndedReason,
    quizLevel,
    questionCount,
    score: session.score,
    percent,
    strengths: strengths.length ? strengths : ['Reading'],
    weaknesses,
    advice: smartAdvice(weaknesses),
    remark: resultRemark(percent),
    date: todayGbDate(),
    lang: session.lang || 'en',
    missedQuestions: session.missedQuestions,
    answers: session.answers,
    questions: session.questions,
    completedAt
  }, session.identity, session.quizKey);
}

function validateQuizPassword(config, gradeKey, suppliedPassword) {
  const quizAccess = config && config.settings && config.settings.quizAccess ? config.settings.quizAccess : {};
  const rules = quizAccess[String(gradeKey || '').trim().toLowerCase()] || null;
  if (!rules || !rules.enabled || !rules.password) return;
  const safePassword = String(suppliedPassword || '').trim();
  if (!safePassword) {
    const error = new Error('This quiz is protected. Enter the quiz password to continue.');
    error.status = 403;
    error.code = 'PASSWORD_REQUIRED';
    throw error;
  }
  if (safePassword !== String(rules.password)) {
    const error = new Error('Wrong quiz password.');
    error.status = 403;
    error.code = 'INVALID_PASSWORD';
    throw error;
  }
}

function buildQuizSessionKey(identity, gradeKey, count, label, explicitQuizKey) {
  if (explicitQuizKey) return sanitizeQuizKey(explicitQuizKey);
  const safeLabel = slugify(label || 'quiz');
  return sanitizeQuizKey([String(gradeKey || identity.grade || '').trim().toUpperCase(), count || 'custom', safeLabel].join('|'));
}

function nowIso() {
  return new Date().toISOString();
}

async function startQuizSession(payload) {
  const identity = sanitizeIdentity(payload.identity || payload);
  const gradeKey = String(payload.gradeKey || identity.grade || '').trim().toLowerCase();
  const count = Math.max(1, Math.min(50, Number(payload.count || payload.selectedCount || 10) || 10));
  const label = String(payload.label || payload.selectedLevelLabel || payload.quizLabel || '').trim() || `${gradeKey.toUpperCase()} Quiz`;
  const config = await configBackend.readConfig();
  validateQuizPassword(config, gradeKey, payload.accessPassword || payload.password || '');
  const quizKey = buildQuizSessionKey(identity, gradeKey, count, label, payload.quizKey || payload.sessionId || payload.quizId || payload.quiz);
  const compositeKey = buildCompositeKey(identity, quizKey);
  const currentStore = await readStore();
  const existingResult = currentStore.results[compositeKey] ? sanitizeResult(currentStore.results[compositeKey], identity, quizKey) : null;
  if (existingResult) {
    return { ok: true, identity, quizKey, key: compositeKey, progress: null, result: existingResult, resumed: false };
  }
  const existingSession = currentStore.sessions[compositeKey] ? sanitizeSession(currentStore.sessions[compositeKey]) : null;
  if (existingSession && !existingSession.completed && Array.isArray(existingSession.questions) && existingSession.questions.length) {
    return { ok: true, identity, quizKey, key: compositeKey, progress: buildSessionPayload(existingSession), result: null, resumed: true };
  }
  const questions = await questionBank.selectQuizQuestionsFull({ gradeKey, count, label, identity, seed: quizKey, useTeacherTest: !!payload.useTeacherTest });
  if (!questions.length) {
    const error = new Error('No valid questions available for this grade yet.');
    error.status = 400;
    throw error;
  }
  const timerSettings = config && config.settings && config.settings.timerSettings ? config.settings.timerSettings : {};
  const teacherTests = config && config.teacherTests ? config.teacherTests : {};
  const teacherTest = teacherTests[gradeKey] || null;
  const timerEnabled = timerSettings[gradeKey] !== false;
  const timeLimitSeconds = gradeKey === 'kg1' ? 15 : 18;
  const selectedLevelLabel = payload.useTeacherTest && teacherTest && teacherTest.enabled ? (teacherTest.name || label) : label;
  const created = sanitizeSession({
    identity,
    quizKey,
    mode: 'quiz',
    gradeKey,
    selectedCount: questions.length,
    selectedLevelLabel,
    questionCount: questions.length,
    currentIndex: 0,
    score: 0,
    answers: [],
    missedQuestions: [],
    skillStats: {},
    questions,
    startedAt: nowIso(),
    updatedAt: nowIso(),
    questionStartedAt: nowIso(),
    completed: false,
    timerEnabled,
    timeLimitSeconds,
    lang: String(payload.lang || 'en').trim()
  });
  currentStore.sessions[created.key] = created;
  await writeStore(currentStore);
  return { ok: true, identity, quizKey, key: created.key, progress: buildSessionPayload(created), result: null, resumed: false };
}

function computeRemainingSeconds(session, answeredAt) {
  if (!session.timerEnabled || session.timeLimitSeconds <= 0) return session.timeLimitSeconds;
  const started = session.questionStartedAt ? new Date(session.questionStartedAt).getTime() : Date.now();
  const end = started + session.timeLimitSeconds * 1000;
  return Math.max(0, Math.ceil((end - answeredAt.getTime()) / 1000));
}

function recordAnswerIntoSession(session, currentQuestion, payload, answeredAt) {
  const question = normalizeQuestion(currentQuestion);
  const chosen = payload.timedOut ? '' : String(payload.chosen || '').trim();
  const remainingSeconds = computeRemainingSeconds(session, answeredAt);
  const timedOut = !!payload.timedOut || (session.timerEnabled && remainingSeconds <= 0 && !chosen);
  const correct = !timedOut && chosen === question.answer;
  let earnedScore = 0;
  if (session.mode === 'play') {
    earnedScore = correct ? 1 : 0;
  } else {
    earnedScore = correct ? (session.timerEnabled ? 10 + remainingSeconds : 10) : 0;
  }
  ensureSkillStat(session.skillStats, question.skill, question.text);
  if (correct) session.skillStats[question.skill].right += 1;
  else session.skillStats[question.skill].wrong += 1;
  if (!correct) session.missedQuestions.push(question.text);
  session.score += earnedScore;
  const answerEntry = {
    index: session.currentIndex,
    questionId: question.id,
    questionText: question.text,
    chosen,
    correct,
    expected: question.answer,
    timedOut,
    answeredAt: answeredAt.toISOString(),
    remainingSeconds,
    earnedScore
  };
  session.answers[session.currentIndex] = answerEntry;
  return answerEntry;
}

async function answerSessionQuestion(payload) {
  const identity = sanitizeIdentity(payload.identity || payload);
  const quizKey = sanitizeQuizKey(payload.quizKey || payload.sessionId || payload.quizId || payload.quiz);
  const compositeKey = buildCompositeKey(identity, quizKey);
  const currentStore = await readStore();
  const session = currentStore.sessions[compositeKey] ? sanitizeSession(currentStore.sessions[compositeKey]) : null;
  if (!session) {
    const error = new Error('Session not found');
    error.status = 404;
    throw error;
  }
  if (session.completed) {
    const result = currentStore.results[compositeKey] || finalizeResultFromSession(session);
    currentStore.results[compositeKey] = result;
    await writeStore(currentStore);
    return { ok: true, finished: true, progress: buildSessionPayload(session), result };
  }
  const currentQuestion = session.questions[session.currentIndex];
  if (payload.questionId && currentQuestion && String(payload.questionId).trim() && String(payload.questionId).trim() !== String(currentQuestion.id)) {
    return { ok: true, stale: true, finished: false, progress: buildSessionPayload(session), result: null };
  }
  if (!currentQuestion) {
    session.completed = true;
    session.completedAt = nowIso();
    const result = finalizeResultFromSession(session);
    currentStore.sessions[session.key] = session;
    currentStore.results[session.key] = result;
    await writeStore(currentStore);
    return { ok: true, finished: true, progress: buildSessionPayload(session), result };
  }
  const answeredAt = new Date();
  const answerEntry = recordAnswerIntoSession(session, currentQuestion, payload, answeredAt);
  let finished = false;
  let result = null;
  if (session.mode === 'play') {
    const shouldEnd = answerEntry.timedOut || !answerEntry.correct || session.currentIndex >= session.questionCount - 1;
    if (shouldEnd) {
      finished = true;
      session.completed = true;
      session.completedAt = answeredAt.toISOString();
      session.playEndedReason = answerEntry.timedOut ? 'timeout' : (answerEntry.correct ? 'complete' : 'wrong');
    }
  } else if (session.currentIndex >= session.questionCount - 1) {
    finished = true;
    session.completed = true;
    session.completedAt = answeredAt.toISOString();
  }
  if (!finished) {
    session.currentIndex += 1;
    session.questionStartedAt = answeredAt.toISOString();
  }
  session.updatedAt = answeredAt.toISOString();
  currentStore.sessions[session.key] = session;
  if (finished) {
    result = finalizeResultFromSession(session);
    currentStore.results[session.key] = result;
  }
  await writeStore(currentStore);
  return {
    ok: true,
    finished,
    answer: answerEntry,
    progress: buildSessionPayload(session),
    result
  };
}

async function startPlaySession(payload) {
  const identity = sanitizeIdentity(Object.assign({}, payload.identity || payload, {
    isGuest: true,
    className: safeClassName((payload.identity && payload.identity.className) || payload.className || 'Play & Test', true)
  }));
  const stage = String(payload.stage || questionBank.stageForGrade(identity.grade)).trim().toLowerCase() || 'starter';
  const requestedQuizKey = String(payload.sessionId || payload.quizKey || payload.quizId || '').trim();
  const quizKey = requestedQuizKey || `PLAYTEST|${Date.now()}|${crypto.randomBytes(4).toString('hex')}`;
  const compositeKey = buildCompositeKey(identity, sanitizeQuizKey(quizKey));
  const currentStore = await readStore();
  const existingResult = currentStore.results[compositeKey] ? sanitizeResult(currentStore.results[compositeKey], identity, sanitizeQuizKey(quizKey)) : null;
  if (existingResult) {
    return { ok: true, identity, sessionId: sanitizeQuizKey(quizKey), progress: null, result: existingResult, created: false };
  }
  const existingSession = currentStore.sessions[compositeKey] ? sanitizeSession(currentStore.sessions[compositeKey]) : null;
  if (existingSession && !existingSession.completed && existingSession.questions.length) {
    return { ok: true, identity, sessionId: existingSession.quizKey, progress: buildSessionPayload(existingSession), result: null, created: false };
  }
  const questions = await questionBank.selectPlayQuestionsFull({ stage, identity, count: 30, grade: identity.grade });
  const created = sanitizeSession({
    identity,
    quizKey: sanitizeQuizKey(quizKey),
    mode: 'play',
    gradeKey: 'play',
    selectedCount: questions.length,
    selectedLevelLabel: 'Play & Test',
    questionCount: questions.length,
    currentIndex: 0,
    score: 0,
    answers: [],
    missedQuestions: [],
    skillStats: {},
    questions,
    startedAt: nowIso(),
    updatedAt: nowIso(),
    questionStartedAt: nowIso(),
    completed: false,
    timerEnabled: true,
    timeLimitSeconds: 15,
    playStage: stage,
    lang: String(payload.lang || 'en').trim()
  });
  currentStore.sessions[created.key] = created;
  await writeStore(currentStore);
  return { ok: true, identity, sessionId: created.quizKey, progress: buildSessionPayload(created), result: null, created: true };
}

async function getStudentQuiz(identityInput, quizKeyInput) {
  const identity = sanitizeIdentity(identityInput);
  const quizKey = sanitizeQuizKey(quizKeyInput);
  const compositeKey = buildCompositeKey(identity, quizKey);
  const currentStore = await readStore();
  const session = currentStore.sessions[compositeKey] ? sanitizeSession(currentStore.sessions[compositeKey]) : null;
  const result = currentStore.results[compositeKey] ? sanitizeResult(currentStore.results[compositeKey], identity, quizKey) : null;
  return {
    identity,
    quizKey,
    key: compositeKey,
    progress: session ? buildSessionPayload(session) : null,
    result
  };
}

async function saveProgress(payload) {
  const identity = sanitizeIdentity(payload.identity || payload);
  const quizKey = sanitizeQuizKey(payload.quizKey || payload.quizId || payload.quiz || payload.sessionId);
  const compositeKey = buildCompositeKey(identity, quizKey);
  const currentStore = await readStore();
  const existing = currentStore.sessions[compositeKey] ? sanitizeSession(currentStore.sessions[compositeKey]) : null;
  if (existing) {
    const state = payload.state || payload.progress || payload;
    if (typeof state.questionStartedAt === 'string' && state.questionStartedAt.trim()) existing.questionStartedAt = state.questionStartedAt.trim();
    existing.updatedAt = nowIso();
    currentStore.sessions[compositeKey] = existing;
    await writeStore(currentStore);
    return { ok: true, progress: buildSessionPayload(existing) };
  }
  const error = new Error('Session not found');
  error.status = 404;
  throw error;
}

async function submitResult(payload) {
  const identity = sanitizeIdentity(payload.identity || payload);
  const quizKey = sanitizeQuizKey(payload.quizKey || payload.quizId || payload.quiz || payload.sessionId);
  const compositeKey = buildCompositeKey(identity, quizKey);
  const currentStore = await readStore();
  const session = currentStore.sessions[compositeKey] ? sanitizeSession(currentStore.sessions[compositeKey]) : null;
  if (!session) {
    const error = new Error('Session not found');
    error.status = 404;
    throw error;
  }
  session.completed = true;
  session.completedAt = session.completedAt || nowIso();
  session.updatedAt = nowIso();
  const result = finalizeResultFromSession(session);
  currentStore.sessions[compositeKey] = session;
  currentStore.results[compositeKey] = result;
  await writeStore(currentStore);
  return { ok: true, progress: buildSessionPayload(session), result };
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
  const currentStore = await readStore();
  const rows = [];
  Object.values(currentStore.results || {}).forEach((item) => {
    const note = item && item.identity && currentStore.notes[item.identity.identityKey] ? currentStore.notes[item.identity.identityKey].note : '';
    rows.push(buildSummary(item, 'completed', note));
  });
  Object.values(currentStore.sessions || {}).forEach((item) => {
    if (!item || item.completed || (currentStore.results && currentStore.results[item.key])) return;
    const note = item && item.identity && currentStore.notes[item.identity.identityKey] ? currentStore.notes[item.identity.identityKey].note : '';
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
  const currentStore = await readStore();
  const result = currentStore.results[safeKey] || null;
  const progress = currentStore.sessions[safeKey] ? buildSessionPayload(currentStore.sessions[safeKey]) : null;
  const identityKey = (result && result.identity && result.identity.identityKey) || (progress && progress.identity && progress.identity.identityKey) || '';
  return {
    ok: true,
    result,
    progress,
    note: identityKey && currentStore.notes[identityKey] ? currentStore.notes[identityKey] : null
  };
}

async function saveTeacherNote(payload) {
  const identity = sanitizeIdentity(payload.identity || payload);
  const note = String(payload.note || '').trim().slice(0, 2000);
  const author = String(payload.author || payload.adminName || payload.teacher || '').trim().slice(0, 120);
  const currentStore = await readStore();
  currentStore.notes[identity.identityKey] = {
    identity,
    note,
    author,
    updatedAt: new Date().toISOString()
  };
  await writeStore(currentStore);
  return { ok: true, note: currentStore.notes[identity.identityKey] };
}

function normalizePlayerKey(row) {
  const studentId = String(row.studentId || (row.identity && row.identity.studentId) || '').trim().toLowerCase();
  if (studentId) return `id:${studentId}`;
  const name = String(row.studentName || (row.identity && row.identity.name) || '').trim().toLowerCase().replace(/\s+/g, ' ');
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

function buildAnalyticsFromStore(currentStore, filters) {
  const resultRows = applyFilters(Object.values(currentStore.results || {}).map((item) => buildSummary(item, 'completed', item && item.identity && currentStore.notes[item.identity.identityKey] ? currentStore.notes[item.identity.identityKey].note : '')), filters);
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
        topScore: 0,
        students: new Set()
      };
    }
    classMap[classKey].attempts += 1;
    classMap[classKey].totalPercent += Number(row.percent || 0) || 0;
    classMap[classKey].topScore = Math.max(classMap[classKey].topScore, Number(row.percent || 0) || 0);
    classMap[classKey].students.add(row.identityKey || row.studentName);

    const studentKey = row.identityKey || normalizePlayerKey(row);
    if (!studentMap[studentKey]) {
      studentMap[studentKey] = {
        identityKey: row.identityKey || '',
        studentName: row.studentName,
        studentId: row.studentId,
        className: row.className,
        grade: row.grade,
        attempts: 0,
        totalPercent: 0,
        bestPercent: 0,
        averagePercent: 0,
        quizLevel: row.quizLevel,
        teacherNote: row.teacherNote || '',
        updatedAt: row.updatedAt
      };
    }
    studentMap[studentKey].attempts += 1;
    studentMap[studentKey].totalPercent += Number(row.percent || 0) || 0;
    studentMap[studentKey].bestPercent = Math.max(studentMap[studentKey].bestPercent, Number(row.percent || 0) || 0);
    if (String(row.updatedAt || '') > String(studentMap[studentKey].updatedAt || '')) studentMap[studentKey].updatedAt = row.updatedAt;

    const source = currentStore.results[row.key];
    (source && source.weaknesses || []).forEach((weak) => {
      const safe = String(weak || '').trim();
      if (!safe) return;
      allWeaknesses[safe] = (allWeaknesses[safe] || 0) + 1;
    });
  });

  const classAnalytics = Object.values(classMap).map((item) => ({
    className: item.className,
    grade: item.grade,
    studentCount: item.students.size,
    attempts: item.attempts,
    averagePercent: item.attempts ? Math.round(item.totalPercent / item.attempts) : 0,
    topScore: item.topScore
  })).sort((a, b) => b.averagePercent - a.averagePercent || a.className.localeCompare(b.className));

  const leaderboard = Object.values(studentMap).map((item) => ({
    identityKey: item.identityKey,
    studentName: item.studentName,
    studentId: item.studentId,
    className: item.className,
    grade: item.grade,
    attempts: item.attempts,
    bestPercent: item.bestPercent,
    averagePercent: item.attempts ? Math.round(item.totalPercent / item.attempts) : 0,
    teacherNote: item.teacherNote,
    updatedAt: item.updatedAt
  })).sort((a, b) => b.bestPercent - a.bestPercent || b.averagePercent - a.averagePercent || a.studentName.localeCompare(b.studentName));

  const weaknessEntry = Object.entries(allWeaknesses).sort((a, b) => b[1] - a[1])[0];
  const totalStudents = Object.keys(studentMap).length;
  const totalCompletedAttempts = resultRows.length;
  const averagePercent = totalCompletedAttempts ? Math.round(resultRows.reduce((sum, row) => sum + (Number(row.percent || 0) || 0), 0) / totalCompletedAttempts) : 0;
  const totalClasses = classAnalytics.length;

  return {
    totals: {
      totalStudents,
      totalCompletedAttempts,
      totalClasses,
      averagePercent,
      mostCommonWeakness: weaknessEntry ? weaknessEntry[0] : '-'
    },
    classAnalytics,
    leaderboard
  };
}

async function analytics(filters) {
  const currentStore = await readStore();
  const data = buildAnalyticsFromStore(currentStore, filters || {});
  return { ok: true, ...data };
}

async function exportRows(filters) {
  const list = await listRecords(filters || {});
  return { ok: true, rows: list.rows || [] };
}

async function getPlayLeaderboard() {
  const currentStore = await readStore();
  const playResults = Object.values(currentStore.results || {}).filter((item) => isPlayLikeRow(item));
  const players = {};
  playResults.forEach((item) => {
    const key = normalizePlayerKey(item);
    if (!players[key]) {
      players[key] = {
        identityKey: item.identity && item.identity.identityKey || '',
        studentName: item.studentName || (item.identity && item.identity.name) || '',
        studentId: item.studentId || (item.identity && item.identity.studentId) || '',
        className: item.className || 'Play & Test',
        grade: item.grade || (item.identity && item.identity.grade) || 'PLAY',
        bestScore: 0,
        attempts: 0,
        lastPlayedAt: '',
        stage: item.playStage || ''
      };
    }
    players[key].attempts += 1;
    players[key].bestScore = Math.max(players[key].bestScore, Number(item.score || item.percent || 0) || 0);
    if (String(item.completedAt || item.updatedAt || '') > String(players[key].lastPlayedAt || '')) {
      players[key].lastPlayedAt = item.completedAt || item.updatedAt || '';
      players[key].stage = item.playStage || players[key].stage;
    }
  });
  const leaderboard = Object.values(players).sort((a, b) => b.bestScore - a.bestScore || b.attempts - a.attempts || String(b.lastPlayedAt || '').localeCompare(String(a.lastPlayedAt || ''))).map((row, index) => ({
    rank: index + 1,
    ...row
  }));
  return { ok: true, leaderboard, top3: leaderboard.slice(0, 3) };
}

async function resetPlayLeaderboard() {
  const currentStore = await readStore();
  Object.keys(currentStore.results || {}).forEach((key) => {
    if (isPlayLikeRow(currentStore.results[key])) delete currentStore.results[key];
  });
  Object.keys(currentStore.sessions || {}).forEach((key) => {
    if (isPlayLikeRow(currentStore.sessions[key])) delete currentStore.sessions[key];
  });
  await writeStore(currentStore);
  return { ok: true };
}

async function resetAllStudentData() {
  const safe = { version: 2, sessions: {}, results: {}, notes: {} };
  await writeStore(safe);
  return { ok: true };
}

module.exports = {
  analytics,
  answerSessionQuestion,
  detailFor,
  exportRows,
  getPlayLeaderboard,
  getStudentQuiz,
  listRecords,
  resetAllStudentData,
  resetPlayLeaderboard,
  saveProgress,
  saveTeacherNote,
  sanitizeIdentity,
  sanitizeQuizKey,
  startPlaySession,
  startQuizSession,
  submitResult
};
