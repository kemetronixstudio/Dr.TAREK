const access = require('../../lib/access-accounts-backend');
const configBackend = require('../../lib/app-config-backend');
const { parseJsonBody, sendJson, setAuthCookie } = require('../../lib/http-utils');

function allPerms(account) {
  if (!account) return [];
  if (account.role === 'admin') return ['levelVisibility','timerSettings','quizAccess','teacherTest','questionBank','bulkQuestions','classManager'];
  return Array.isArray(account.permissions) ? account.permissions.slice() : [];
}

function can(account, permission) {
  return account && (account.role === 'admin' || allPerms(account).includes(permission));
}

function sanitizeForAccount(config, account) {
  const safe = {
    ok: true,
    updatedAt: config.updatedAt,
    settings: {
      levelVisibility: can(account, 'levelVisibility') ? config.settings.levelVisibility : {},
      timerSettings: can(account, 'timerSettings') ? config.settings.timerSettings : {},
      quizAccess: can(account, 'quizAccess')
        ? config.settings.quizAccess
        : Object.fromEntries(Object.keys(config.settings.quizAccess || {}).map((key) => [key, { enabled: !!(config.settings.quizAccess[key] && config.settings.quizAccess[key].enabled), password: '' }]))
    },
    classes: can(account, 'classManager') || account.role === 'admin' ? config.classes : [],
    customQuestions: can(account, 'questionBank') || can(account, 'bulkQuestions') ? config.customQuestions : {},
    questionOverrides: can(account, 'questionBank') ? config.questionOverrides : {},
    teacherTests: can(account, 'teacherTest') ? config.teacherTests : {}
  };
  return safe;
}

module.exports = async function handler(req, res) {
  try {
    const auth = await access.requireAuthorized(req, null);
    if (!auth.ok) return sendJson(res, auth.status, { ok: false, error: auth.error });
    setAuthCookie(res, auth.token);

    if (req.method === 'GET') {
      const config = await configBackend.readConfig();
      return sendJson(res, 200, { ...sanitizeForAccount(config, auth.account), token: auth.token, account: auth.account });
    }

    if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'Method not allowed' });

    const body = parseJsonBody(req);
    const current = await configBackend.readConfig();
    const next = JSON.parse(JSON.stringify(current));

    if (body.settings && typeof body.settings === 'object') {
      if (body.settings.levelVisibility && can(auth.account, 'levelVisibility')) next.settings.levelVisibility = body.settings.levelVisibility;
      if (body.settings.timerSettings && can(auth.account, 'timerSettings')) next.settings.timerSettings = body.settings.timerSettings;
      if (body.settings.quizAccess && can(auth.account, 'quizAccess')) next.settings.quizAccess = body.settings.quizAccess;
    }
    if (typeof body.classes !== 'undefined' && can(auth.account, 'classManager')) next.classes = body.classes;
    if (typeof body.teacherTests !== 'undefined' && can(auth.account, 'teacherTest')) next.teacherTests = body.teacherTests;
    if (typeof body.customQuestions !== 'undefined' && (can(auth.account, 'questionBank') || can(auth.account, 'bulkQuestions'))) next.customQuestions = body.customQuestions;
    if (typeof body.questionOverrides !== 'undefined' && can(auth.account, 'questionBank')) next.questionOverrides = body.questionOverrides;

    const saved = await configBackend.writeConfig(next);
    const fresh = await configBackend.readConfig();
    return sendJson(res, 200, { ok: true, updatedAt: saved.updatedAt, config: sanitizeForAccount(fresh, auth.account), token: auth.token, account: auth.account });
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message || 'Request failed' });
  }
};
