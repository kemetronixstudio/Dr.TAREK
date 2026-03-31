const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const net = require('net');
const tls = require('tls');

const STORAGE_KEY = process.env.ACCESS_ACCOUNTS_STORAGE_KEY || 'kg:access_accounts:v1';
const TOKEN_SECRET = process.env.ACCESS_ACCOUNTS_SESSION_SECRET || process.env.SESSION_SECRET || 'change-this-secret-in-vercel-env';
const TOKEN_TTL_SECONDS = Number(process.env.ACCESS_ACCOUNTS_SESSION_TTL_SECONDS || 60 * 60 * 12);
const FILE_PATH = process.env.ACCESS_ACCOUNTS_DATA_PATH || path.join(process.cwd(), 'data', 'access-accounts.json');
const LOG_LIMIT = Number(process.env.ACCESS_ACCOUNTS_LOG_LIMIT || 200);
const PERMISSIONS = ['dashboard','levelVisibility','timerSettings','quizAccess','teacherTest','bulkQuestions','questionBank','classManager','accountManager'];
const DEFAULT_BUILTIN_ADMINS = [
  { user: 'KEMETRONIX', pass: '01002439054' },
  { user: 'Dr. Tarek', pass: 'T01032188008' }
];

function normalizeUser(value) {
  return String(value || '').trim().toLowerCase();
}

function allPermissions() {
  return [...PERMISSIONS];
}

function nonAdminPermissions() {
  return PERMISSIONS.filter((key) => key !== 'accountManager');
}

function parseBuiltinAdmins() {
  const raw = process.env.BUILTIN_ADMINS_JSON;
  if (!raw) return DEFAULT_BUILTIN_ADMINS;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_BUILTIN_ADMINS;
    return parsed
      .map((item) => ({ user: String(item.user || '').trim(), pass: String(item.pass || '').trim() }))
      .filter((item) => item.user && item.pass);
  } catch (error) {
    return DEFAULT_BUILTIN_ADMINS;
  }
}

function pbkdf2Hash(password, salt) {
  const safeSalt = salt || crypto.randomBytes(16).toString('hex');
  const iterations = 120000;
  const digest = crypto.pbkdf2Sync(String(password || ''), safeSalt, iterations, 32, 'sha256').toString('hex');
  return `pbkdf2$${iterations}$${safeSalt}$${digest}`;
}

function verifyPassword(password, storedValue) {
  const value = String(storedValue || '');
  if (!value) return false;
  if (!value.startsWith('pbkdf2$')) return String(password || '') === value;
  const parts = value.split('$');
  if (parts.length !== 4) return false;
  const iterations = Number(parts[1] || 0);
  const salt = parts[2] || '';
  const digest = parts[3] || '';
  const next = crypto.pbkdf2Sync(String(password || ''), salt, iterations, 32, 'sha256').toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(next, 'hex'));
  } catch (error) {
    return false;
  }
}

function sanitizePermissions(role, permissions) {
  if (role === 'admin') return allPermissions();
  const allowed = new Set(nonAdminPermissions());
  return Array.from(new Set((Array.isArray(permissions) ? permissions : []).filter((key) => allowed.has(key))));
}

function sanitizeStoredEditableAccount(raw) {
  if (!raw) return null;
  const user = String(raw.user || '').trim();
  const passwordHash = String(raw.passwordHash || raw.pass || '').trim();
  let role = String(raw.role || 'user').trim().toLowerCase();
  if (role !== 'admin') role = 'user';
  if (!user || !passwordHash) return null;
  const originalUser = String(raw.originalUser || user).trim() || user;
  return {
    user,
    role,
    permissions: sanitizePermissions(role, raw.permissions),
    originalUser,
    builtInOverride: !!raw.builtInOverride,
    passwordHash
  };
}

function parseCookieHeader(cookieHeader) {
  return String(cookieHeader || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const eq = part.indexOf('=');
      if (eq > 0) acc[part.slice(0, eq)] = decodeURIComponent(part.slice(eq + 1));
      return acc;
    }, {});
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
  if (!payload || payload.result == null) return [];
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

function readFileJson() {
  try {
    if (!fs.existsSync(FILE_PATH)) return [];
    const raw = fs.readFileSync(FILE_PATH, 'utf8');
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function writeFileJson(value) {
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(value, null, 2), 'utf8');
  return true;
}

function getMemoryStore() {
  globalThis.__KG_ACCESS_ACCOUNTS_MEMORY__ = globalThis.__KG_ACCESS_ACCOUNTS_MEMORY__ || [];
  return globalThis.__KG_ACCESS_ACCOUNTS_MEMORY__;
}

function setMemoryStore(value) {
  globalThis.__KG_ACCESS_ACCOUNTS_MEMORY__ = Array.isArray(value) ? value : [];
  return true;
}

function coerceStoreShape(raw) {
  if (Array.isArray(raw)) return { accounts: raw, logs: [] };
  if (raw && typeof raw === 'object') {
    return {
      accounts: Array.isArray(raw.accounts) ? raw.accounts : [],
      logs: Array.isArray(raw.logs) ? raw.logs : []
    };
  }
  return { accounts: [], logs: [] };
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

function sanitizeLogEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const action = String(raw.action || '').trim();
  const actor = String(raw.actor || '').trim();
  const target = String(raw.target || '').trim();
  const role = String(raw.role || '').trim();
  const createdAt = String(raw.createdAt || new Date().toISOString()).trim();
  const detail = String(raw.detail || '').trim();
  if (!action || !actor) return null;
  return { action, actor, target, role, detail, createdAt };
}

async function readLogs() {
  const store = await readStore();
  return (store.logs || []).map(sanitizeLogEntry).filter(Boolean).slice(0, LOG_LIMIT);
}

async function appendLog(entry) {
  const store = await readStore();
  const next = sanitizeLogEntry(entry);
  if (!next) return [];
  store.logs = [next].concat((store.logs || []).map(sanitizeLogEntry).filter(Boolean)).slice(0, LOG_LIMIT);
  await writeStore(store);
  return store.logs;
}

function describeAction(action, role) {
  const roleText = role === 'admin' ? 'admin' : (role || 'staff');
  const map = {
    login: `Logged in as ${roleText}`,
    create: `Created ${roleText} account`,
    update: `Updated ${roleText} account`,
    delete: 'Deleted account',
    password: 'Changed account password'
  };
  return map[action] || action;
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
    if (type === '-') {
      const err = new Error(line || 'Redis error');
      err.redis = true;
      throw err;
    }
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

  const commandQueue = [];
  if (password || username) {
    commandQueue.push(username ? ['AUTH', username, password] : ['AUTH', password]);
  }
  if (dbIndex) commandQueue.push(['SELECT', dbIndex]);
  commandQueue.push(commandParts);

  return new Promise((resolve, reject) => {
    const socket = createRedisSocket(redisUrl);
    let raw = Buffer.alloc(0);
    let expectedReplies = commandQueue.length;
    let lastValue = null;
    let settled = false;

    const finishError = (error) => {
      if (settled) return;
      settled = true;
      try { socket.destroy(); } catch (e) {}
      reject(error);
    };
    const finishOk = (value) => {
      if (settled) return;
      settled = true;
      try { socket.end(); } catch (e) {}
      resolve(value);
    };

    socket.setTimeout(8000, () => finishError(new Error('Redis timeout')));
    socket.once('error', finishError);
    socket.on('data', (chunk) => {
      raw = Buffer.concat([raw, chunk]);
      try {
        while (expectedReplies > 0) {
          const parsedReply = parseRedisReply(raw);
          if (!parsedReply) break;
          raw = raw.subarray(parsedReply.next);
          expectedReplies -= 1;
          lastValue = parsedReply.value;
        }
        if (expectedReplies === 0) finishOk(lastValue);
      } catch (error) {
        finishError(error);
      }
    });
    socket.once('connect', () => {
      try {
        const payload = commandQueue.map(encodeRedisCommand).join('');
        socket.write(payload);
      } catch (error) {
        finishError(error);
      }
    });
  });
}

async function redisGetJson() {
  if (!process.env.REDIS_URL) return null;
  const raw = await redisCommand(['GET', STORAGE_KEY]);
  if (raw == null || raw === '') return [];
  return JSON.parse(String(raw));
}

async function redisSetJson(value) {
  if (!process.env.REDIS_URL) return false;
  await redisCommand(['SET', STORAGE_KEY, JSON.stringify(value)]);
  return true;
}

async function readEditableAccounts() {
  const store = await readStore();
  return (Array.isArray(store.accounts) ? store.accounts : []).map(sanitizeStoredEditableAccount).filter(Boolean);
}

async function writeEditableAccounts(accounts) {
  const store = await readStore();
  store.accounts = (Array.isArray(accounts) ? accounts : []).map(sanitizeStoredEditableAccount).filter(Boolean);
  const saved = await writeStore(store);
  return saved.accounts;
}


function builtInAdmins() {
  return parseBuiltinAdmins().map((item) => ({
    user: item.user,
    role: 'admin',
    permissions: allPermissions(),
    builtIn: true,
    builtInOverride: false,
    originalUser: item.user,
    passwordHash: item.pass,
    authMode: 'plain'
  }));
}

async function mergedAccounts() {
  const map = new Map();
  builtInAdmins().forEach((admin) => {
    map.set(normalizeUser(admin.originalUser || admin.user), { ...admin });
  });
  const editable = await readEditableAccounts();
  editable.forEach((account) => {
    const key = normalizeUser(account.originalUser || account.user);
    const built = map.get(key);
    if (built) {
      map.set(key, {
        ...built,
        ...account,
        role: 'admin',
        permissions: allPermissions(),
        builtIn: true,
        builtInOverride: true,
        originalUser: built.originalUser || built.user
      });
    } else {
      map.set(normalizeUser(account.user), {
        ...account,
        builtIn: false,
        builtInOverride: false,
        originalUser: account.originalUser || account.user
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => String(a.user || '').localeCompare(String(b.user || '')));
}

function publicAccount(account) {
  return {
    user: account.user,
    role: account.role,
    permissions: account.role === 'admin' ? allPermissions() : sanitizePermissions('user', account.permissions),
    builtIn: !!account.builtIn,
    builtInOverride: !!account.builtInOverride,
    originalUser: account.originalUser || account.user,
    hasPassword: !!account.passwordHash
  };
}

async function authenticate(user, password) {
  const accounts = await mergedAccounts();
  const lookup = normalizeUser(user);
  const match = accounts.find((item) => normalizeUser(item.user) === lookup);
  if (!match) return null;
  const ok = match.authMode === 'plain'
    ? String(password || '') === String(match.passwordHash || '')
    : verifyPassword(password, match.passwordHash);
  if (!ok) return null;
  return publicAccount(match);
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  const raw = String(token || '').trim();
  if (!raw || !raw.includes('.')) return null;
  const [body, sig] = raw.split('.');
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (error) {
    return null;
  }
}

function createTokenForAccount(account) {
  const now = Math.floor(Date.now() / 1000);
  return signToken({
    user: account.user,
    role: account.role,
    originalUser: account.originalUser || account.user,
    exp: now + TOKEN_TTL_SECONDS
  });
}

function readBearerToken(req) {
  const auth = String((req && req.headers && req.headers.authorization) || '').trim();
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  const cookies = parseCookieHeader(req && req.headers && req.headers.cookie);
  return String(cookies.kgAccessToken || '').trim();
}

async function authenticateFromHeaders(req) {
  const headers = (req && req.headers) || {};
  const user = String(headers['x-access-user'] || headers['x-admin-user'] || '').trim();
  const pass = String(headers['x-access-pass'] || headers['x-admin-pass'] || '').trim();
  if (!user || !pass) return null;
  return authenticate(user, pass);
}

async function requireAuthorized(req, requiredPermission) {
  const token = readBearerToken(req);
  let account = null;
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const accounts = await mergedAccounts();
      const match = accounts.find((item) => normalizeUser(item.originalUser || item.user) === normalizeUser(payload.originalUser || payload.user) || normalizeUser(item.user) === normalizeUser(payload.user));
      if (match) account = publicAccount(match);
    }
  }
  if (!account) {
    const fallback = await authenticateFromHeaders(req);
    if (fallback) account = fallback;
  }
  if (!account) return { ok: false, status: 401, error: 'Unauthorized' };
  if (requiredPermission && account.role !== 'admin') {
    const perms = Array.isArray(account.permissions) ? account.permissions : [];
    if (!perms.includes(requiredPermission)) return { ok: false, status: 403, error: 'Forbidden' };
  }
  return { ok: true, account, token: token || createTokenForAccount(account) };
}

async function requireAdmin(req) {
  const auth = await requireAuthorized(req, null);
  if (!auth.ok) return auth;
  if (!auth.account || auth.account.role !== 'admin') return { ok: false, status: 401, error: 'Unauthorized' };
  return auth;
}

async function saveAccount(payload, actor) {
  if (!actor || actor.role !== 'admin') {
    const error = new Error('Admin access required');
    error.status = 403;
    throw error;
  }
  const user = String(payload.user || '').trim();
  const pass = String(payload.pass || '').trim();
  const keepExistingPassword = !!payload.keepExistingPassword;
  const originalUser = String(payload.originalUser || user).trim() || user;
  const originalBuiltIn = !!payload.originalBuiltIn || builtInAdmins().some((item) => normalizeUser(item.originalUser || item.user) === normalizeUser(originalUser));
  let role = String(payload.role || 'user').trim().toLowerCase();
  if (role !== 'admin') role = 'user';
  let permissions = role === 'admin' ? allPermissions() : sanitizePermissions('user', payload.permissions);
  if (!user) {
    const error = new Error('Username is required');
    error.status = 400;
    throw error;
  }
  if (role !== 'admin' && permissions.length === 0) {
    const error = new Error('Please choose at least one permission');
    error.status = 400;
    throw error;
  }

  const editable = await readEditableAccounts();
  const builtIns = builtInAdmins();
  const builtInConflict = builtIns.find((item) => normalizeUser(item.user) === normalizeUser(user));
  let existing = editable.find((item) => normalizeUser(item.originalUser || item.user) === normalizeUser(originalUser) || normalizeUser(item.user) === normalizeUser(originalUser) || normalizeUser(item.user) === normalizeUser(user));
  let nextPasswordHash = '';
  if (pass) nextPasswordHash = pbkdf2Hash(pass);
  else if (existing && keepExistingPassword) nextPasswordHash = existing.passwordHash;
  else if (existing && !pass) nextPasswordHash = existing.passwordHash;
  if (!nextPasswordHash) {
    const error = new Error('Password is required');
    error.status = 400;
    throw error;
  }

  let sanitized;
  if (originalBuiltIn || builtInConflict) {
    const built = builtInConflict || builtIns.find((item) => normalizeUser(item.originalUser || item.user) === normalizeUser(originalUser));
    sanitized = sanitizeStoredEditableAccount({
      user,
      role: 'admin',
      permissions: allPermissions(),
      originalUser: (built && (built.originalUser || built.user)) || originalUser || user,
      builtInOverride: true,
      passwordHash: nextPasswordHash
    });
  } else {
    sanitized = sanitizeStoredEditableAccount({
      user,
      role,
      permissions,
      originalUser: originalUser || user,
      builtInOverride: false,
      passwordHash: nextPasswordHash
    });
  }

  const next = [];
  let replaced = false;
  editable.forEach((item) => {
    const itemOriginal = normalizeUser(item.originalUser || item.user);
    const itemUser = normalizeUser(item.user);
    const match = itemOriginal === normalizeUser(originalUser) || itemUser === normalizeUser(originalUser) || itemUser === normalizeUser(user);
    if (match && !replaced) {
      next.push(sanitized);
      replaced = true;
    } else if (!match) {
      next.push(item);
    }
  });
  if (!replaced) next.push(sanitized);

  const seen = new Set();
  const deduped = next.filter((item) => {
    const key = normalizeUser(item.originalUser || item.user);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  await writeEditableAccounts(deduped);
  const merged = await mergedAccounts();
  const saved = merged.find((item) => normalizeUser(item.originalUser || item.user) === normalizeUser(sanitized.originalUser || sanitized.user) || normalizeUser(item.user) === normalizeUser(sanitized.user));

  const actorWasUpdated = normalizeUser(actor.originalUser || actor.user) === normalizeUser(originalUser) || normalizeUser(actor.user) === normalizeUser(originalUser);
  await appendLog({
    action: existing ? 'update' : 'create',
    actor: actor.user,
    target: user,
    role: role,
    detail: describeAction(existing ? 'update' : 'create', role),
    createdAt: new Date().toISOString()
  });
  const response = { ok: true, account: saved ? publicAccount(saved) : publicAccount(sanitized) };
  if (actorWasUpdated && saved) {
    response.currentAccount = publicAccount(saved);
    response.token = createTokenForAccount(saved);
  }
  return response;
}

async function deleteAccount(payload, actor) {
  if (!actor || actor.role !== 'admin') {
    const error = new Error('Admin access required');
    error.status = 403;
    throw error;
  }
  const user = String(payload.user || '').trim();
  const account = (await mergedAccounts()).find((item) => normalizeUser(item.user) === normalizeUser(user));
  if (!account) {
    const error = new Error('Account not found');
    error.status = 404;
    throw error;
  }
  const merged = await mergedAccounts();
  const admins = merged.filter((item) => item.role === 'admin');
  if (account.role === 'admin' && admins.length <= 1) {
    const error = new Error('You cannot delete the last admin');
    error.status = 400;
    throw error;
  }
  let editable = await readEditableAccounts();
  if (account.builtIn) {
    editable = editable.filter((item) => normalizeUser(item.originalUser || item.user) !== normalizeUser(account.originalUser || account.user));
  } else {
    editable = editable.filter((item) => normalizeUser(item.user) !== normalizeUser(account.user));
  }
  await writeEditableAccounts(editable);
  await appendLog({ action: 'delete', actor: actor.user, target: account.user, role: account.role, detail: describeAction('delete', account.role), createdAt: new Date().toISOString() });
  return { ok: true };
}

async function changePassword(payload, actor) {
  if (!actor || actor.role !== 'admin') {
    const error = new Error('Admin access required');
    error.status = 403;
    throw error;
  }
  const user = String(payload.user || '').trim();
  const nextPass = String(payload.pass || '').trim();
  if (!user || !nextPass) {
    const error = new Error('Username and password are required');
    error.status = 400;
    throw error;
  }
  const account = (await mergedAccounts()).find((item) => normalizeUser(item.user) === normalizeUser(user));
  if (!account) {
    const error = new Error('Account not found');
    error.status = 404;
    throw error;
  }
  const result = await saveAccount({
    user: account.user,
    pass: nextPass,
    role: account.role,
    permissions: account.permissions,
    originalUser: account.originalUser || account.user,
    originalBuiltIn: !!account.builtIn,
    keepExistingPassword: false
  }, actor);
  await appendLog({ action: 'password', actor: actor.user, target: account.user, role: account.role, detail: describeAction('password', account.role), createdAt: new Date().toISOString() });
  return { ok: true, account: result.account, currentAccount: result.currentAccount, token: result.token };
}

module.exports = {
  allPermissions,
  authenticate,
  builtInAdmins,
  changePassword,
  createTokenForAccount,
  deleteAccount,
  mergedAccounts,
  pbkdf2Hash,
  publicAccount,
  readEditableAccounts,
  requireAdmin,
  requireAuthorized,
  saveAccount,
  verifyPassword,
  writeEditableAccounts,
  parseBuiltinAdmins,
  readLogs,
  appendLog
};
