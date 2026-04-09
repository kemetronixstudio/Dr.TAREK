const fs = require('fs');
const path = require('path');

const FILE_PATH = process.env.HOMEWORK_DATA_PATH || path.join(process.cwd(), 'data', 'homework.json');

function ensureDir(){
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive:true });
}

function baseStore(){
  return { assignments: [], submissions: [], attempts: {} };
}

function readRaw(){
  try {
    return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8') || 'null');
  } catch (error) {
    return null;
  }
}

function coerceStore(raw){
  if (Array.isArray(raw)) {
    return { assignments: raw, submissions: [], attempts: {} };
  }
  if (!raw || typeof raw !== 'object') return baseStore();
  return {
    assignments: Array.isArray(raw.assignments) ? raw.assignments : [],
    submissions: Array.isArray(raw.submissions) ? raw.submissions : [],
    attempts: raw.attempts && typeof raw.attempts === 'object' ? raw.attempts : {}
  };
}

function readStore(){
  return coerceStore(readRaw());
}

function writeStore(store){
  ensureDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(coerceStore(store), null, 2), 'utf8');
}

function slugify(value){
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function normalizeText(value){
  return String(value || '').trim().toLowerCase();
}

function normalizeAnswer(value){
  return String(value || '').trim().toLowerCase();
}

function sanitizeQuestion(q){
  if (!q || typeof q !== 'object') return null;
  const text = String(q.text || '').trim();
  const answer = String(q.answer || '').trim();
  const options = Array.isArray(q.options) ? q.options.map((v) => String(v || '').trim()).filter(Boolean) : [];
  if (!text || !answer || options.length < 2) return null;
  return {
    text,
    options,
    answer,
    skill: String(q.skill || 'Homework').trim(),
    type: String(q.type || 'Question').trim(),
    image: q.image || null
  };
}

function sanitizeAssignment(row){
  const classes = Array.isArray(row.classes) ? row.classes.map((v) => String(v || '').trim()).filter(Boolean) : [];
  const questions = Array.isArray(row.questions) ? row.questions.map(sanitizeQuestion).filter(Boolean) : [];
  return {
    id: String(row.id || ('HW-' + Date.now())).trim(),
    title: String(row.title || '').trim().slice(0, 160),
    grade: String(row.grade || '').trim().toUpperCase(),
    classes,
    date: String(row.date || '').trim(),
    mode: String(row.mode || 'select').trim(),
    questions,
    useTimer: !!row.useTimer,
    timerMinutes: row.useTimer ? Math.max(1, Number(row.timerMinutes || 0) || 0) : 0,
    usePassword: !!row.usePassword,
    password: row.usePassword ? String(row.password || '').trim().slice(0, 60) : '',
    tryLimit: Math.max(0, Math.min(5, Number(row.tryLimit || 0) || 0)),
    createdAt: String(row.createdAt || new Date().toISOString())
  };
}

function sanitizeIdentity(input){
  const raw = input || {};
  const name = String(raw.name || raw.studentName || '').trim();
  const studentId = String(raw.studentId || '').trim();
  const grade = String(raw.grade || '').trim().toUpperCase();
  const className = String(raw.className || raw.class || '').trim();
  if (!name) throw new Error('Student name is required');
  if (!grade) throw new Error('Student grade is required');
  if (!className) throw new Error('Student class is required');
  return {
    name,
    studentId,
    grade,
    className,
    identityKey: [grade, slugify(className), slugify(studentId || 'no-id'), slugify(name)].join('::')
  };
}

function attemptKey(identity, homeworkId){
  return `${identity.identityKey}::${String(homeworkId || '').trim()}`;
}

function publicAssignment(item, extra){
  const row = sanitizeAssignment(item || {});
  const out = Object.assign({}, row, extra || {});
  delete out.password;
  return out;
}

function findAssignment(store, homeworkId){
  const id = String(homeworkId || '').trim();
  const row = (store.assignments || []).find((item) => String(item.id || '') === id);
  if (!row) throw new Error('Homework was not found');
  return sanitizeAssignment(row);
}

function studentCanAccess(assignment, identity){
  if (normalizeText(assignment.grade) !== normalizeText(identity.grade)) return false;
  if (!Array.isArray(assignment.classes) || !assignment.classes.length) return true;
  return assignment.classes.some((className) => normalizeText(className) === normalizeText(identity.className));
}

function ensureStudentAccess(assignment, identity){
  if (!studentCanAccess(assignment, identity)) throw new Error('This homework is not available for this student');
}

function getAttemptRecord(store, identity, homeworkId){
  const key = attemptKey(identity, homeworkId);
  return store.attempts[key] && typeof store.attempts[key] === 'object'
    ? store.attempts[key]
    : { count: 0, sessions: [] };
}

function setAttemptRecord(store, identity, homeworkId, record){
  store.attempts[attemptKey(identity, homeworkId)] = {
    count: Math.max(0, Number(record && record.count || 0) || 0),
    sessions: Array.isArray(record && record.sessions) ? record.sessions : []
  };
}

function checkTryLimit(assignment, attemptRecord){
  const tryLimit = Math.max(0, Number(assignment.tryLimit || 0) || 0);
  if (tryLimit > 0 && Number(attemptRecord.count || 0) >= tryLimit) {
    throw new Error('No tries left for this homework');
  }
}

function buildSubmissionSummary(submission){
  return {
    id: submission.id,
    homeworkId: submission.homeworkId,
    homeworkTitle: submission.homeworkTitle,
    studentName: submission.studentName,
    studentId: submission.studentId,
    className: submission.className,
    grade: submission.grade,
    score: submission.score,
    percent: submission.percent,
    questionCount: submission.questionCount,
    wrongAnswersCount: submission.wrongAnswersCount,
    triesUsed: submission.triesUsed,
    submittedAt: submission.submittedAt,
    timeUp: !!submission.timeUp
  };
}

async function list(){
  const store = readStore();
  return { ok:true, rows: (store.assignments || []).map((item) => publicAssignment(item)) };
}

async function save(row){
  const store = readStore();
  const data = sanitizeAssignment(row || {});
  if (!data.title) throw new Error('Homework title is required');
  if (!data.grade) throw new Error('Homework grade is required');
  if (!data.date) throw new Error('Homework date is required');
  if (!data.questions.length) throw new Error('At least one homework question is required');
  store.assignments = (store.assignments || []).filter((item) => item.id !== data.id);
  store.assignments.unshift(data);
  writeStore(store);
  return { ok:true, row: publicAssignment(data) };
}

async function remove(id){
  const key = String(id || '').trim();
  if (!key) throw new Error('Homework id is required');
  const store = readStore();
  store.assignments = (store.assignments || []).filter((item) => item.id !== key);
  store.submissions = (store.submissions || []).filter((item) => item.homeworkId !== key);
  Object.keys(store.attempts || {}).forEach((attemptId) => {
    if (attemptId.endsWith(`::${key}`)) delete store.attempts[attemptId];
  });
  writeStore(store);
  return { ok:true };
}

async function listForStudent(identityInput){
  const identity = sanitizeIdentity(identityInput);
  const store = readStore();
  const rows = (store.assignments || [])
    .map((item) => sanitizeAssignment(item))
    .filter((assignment) => studentCanAccess(assignment, identity))
    .sort((a, b) => String(b.date || b.createdAt || '').localeCompare(String(a.date || a.createdAt || '')))
    .map((assignment) => {
      const attempts = getAttemptRecord(store, identity, assignment.id);
      const triesUsed = Number(attempts.count || 0) || 0;
      const tryLimit = Number(assignment.tryLimit || 0) || 0;
      return publicAssignment(assignment, {
        triesUsed,
        remainingTries: tryLimit > 0 ? Math.max(0, tryLimit - triesUsed) : null,
        blocked: tryLimit > 0 ? triesUsed >= tryLimit : false
      });
    });
  return { ok:true, rows };
}

async function start(payload){
  const identity = sanitizeIdentity(payload.identity || payload);
  const store = readStore();
  const assignment = findAssignment(store, payload.homeworkId || payload.id);
  ensureStudentAccess(assignment, identity);
  if (assignment.usePassword) {
    const provided = String(payload.password || '').trim();
    if (provided !== String(assignment.password || '')) throw new Error('Wrong password');
  }
  const attempts = getAttemptRecord(store, identity, assignment.id);
  checkTryLimit(assignment, attempts);
  const token = `HWS-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  attempts.count = (Number(attempts.count || 0) || 0) + 1;
  attempts.sessions = Array.isArray(attempts.sessions) ? attempts.sessions : [];
  attempts.sessions.unshift({ token, startedAt: new Date().toISOString(), submittedAt: '', submissionId: '' });
  attempts.sessions = attempts.sessions.slice(0, 20);
  setAttemptRecord(store, identity, assignment.id, attempts);
  writeStore(store);
  return {
    ok:true,
    token,
    tryLimit: Number(assignment.tryLimit || 0) || 0,
    triesUsed: Number(attempts.count || 0) || 0,
    assignment: publicAssignment(assignment)
  };
}

async function submit(payload){
  const identity = sanitizeIdentity(payload.identity || payload);
  const token = String(payload.token || '').trim();
  if (!token) throw new Error('Homework session token is required');
  const store = readStore();
  const assignment = findAssignment(store, payload.homeworkId || payload.id);
  ensureStudentAccess(assignment, identity);

  const attempts = getAttemptRecord(store, identity, assignment.id);
  const session = (attempts.sessions || []).find((item) => String(item.token || '') === token);
  if (!session) throw new Error('This homework session is not valid');
  if (session.submissionId) throw new Error('This homework session was already submitted');

  const rawAnswers = Array.isArray(payload.answers) ? payload.answers : [];
  const answerMap = {};
  rawAnswers.forEach((item) => {
    const index = Number(item && item.index);
    if (!Number.isFinite(index)) return;
    answerMap[index] = item || {};
  });

  const answers = assignment.questions.map((question, index) => {
    const input = answerMap[index] || {};
    const chosen = String(input.chosen != null ? input.chosen : '').trim();
    const expected = String(question.answer || '').trim();
    return {
      index,
      questionText: question.text,
      chosen,
      correct: normalizeAnswer(chosen) === normalizeAnswer(expected) && !!chosen,
      expected,
      timedOut: !!input.timedOut,
      answeredAt: String(input.answeredAt || new Date().toISOString())
    };
  });

  const score = answers.filter((item) => item.correct).length;
  const questionCount = assignment.questions.length;
  const percent = questionCount ? Math.round((score / questionCount) * 100) : 0;
  const wrongAnswers = answers.filter((item) => !item.correct).map((item) => ({
    index: item.index,
    questionText: item.questionText,
    chosen: item.chosen,
    expected: item.expected,
    answeredAt: item.answeredAt,
    timedOut: !!item.timedOut
  }));
  const submissionId = `HWR-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const submittedAt = new Date().toISOString();
  const submission = {
    id: submissionId,
    homeworkId: assignment.id,
    homeworkTitle: assignment.title,
    date: assignment.date,
    studentName: identity.name,
    studentId: identity.studentId,
    className: identity.className,
    grade: identity.grade,
    identity,
    token,
    score,
    percent,
    questionCount,
    triesUsed: Number(attempts.count || 0) || 0,
    wrongAnswersCount: wrongAnswers.length,
    wrongAnswers,
    answers,
    questions: assignment.questions,
    submittedAt,
    timeUp: !!payload.timeUp,
    timerMinutes: Number(assignment.timerMinutes || 0) || 0,
    usedTimer: !!assignment.useTimer
  };

  session.submissionId = submissionId;
  session.submittedAt = submittedAt;
  store.submissions = Array.isArray(store.submissions) ? store.submissions : [];
  store.submissions.unshift(submission);
  setAttemptRecord(store, identity, assignment.id, attempts);
  writeStore(store);

  const result = {
    studentName: identity.name,
    studentId: identity.studentId,
    className: identity.className,
    grade: identity.grade,
    quizLevel: 'Homework',
    questionCount,
    score,
    percent,
    strengths: [],
    weaknesses: [],
    advice: 'Homework submitted.',
    remark: payload.timeUp ? 'Time Up' : 'Submitted',
    date: new Date(submittedAt).toLocaleDateString('en-GB'),
    lang: 'en',
    missedQuestions: wrongAnswers.map((item) => item.questionText),
    answers,
    questions: assignment.questions,
    homeworkId: assignment.id,
    homeworkTitle: assignment.title,
    completedAt: submittedAt
  };

  return { ok:true, submission: buildSubmissionSummary(submission), detail: submission, result };
}

function filterReports(rows, filters){
  const q = slugify((filters && filters.q) || '');
  const className = slugify((filters && filters.className) || '');
  return rows.filter((row) => {
    if (className && slugify(row.className) !== className) return false;
    if (!q) return true;
    return [row.studentName, row.studentId, row.className, row.grade, row.homeworkTitle, row.homeworkId].some((value) => slugify(value).includes(q));
  });
}

async function listReports(filters){
  const store = readStore();
  const rows = filterReports(Array.isArray(store.submissions) ? store.submissions : [], filters)
    .sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')))
    .map(buildSubmissionSummary);
  return { ok:true, rows, total: rows.length };
}

async function reportDetail(id){
  const reportId = String(id || '').trim();
  if (!reportId) throw new Error('Report id is required');
  const store = readStore();
  const submission = (store.submissions || []).find((item) => String(item.id || '') === reportId);
  if (!submission) throw new Error('Homework report was not found');
  return { ok:true, row: submission };
}

module.exports = {
  list,
  save,
  remove,
  listForStudent,
  start,
  submit,
  listReports,
  reportDetail
};
