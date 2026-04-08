const fs = require('fs');
const path = require('path');
const net = require('net');
const tls = require('tls');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
      const error = new Error(line);
      error.redis = true;
      throw error;
    }
    if (type === ':') return { value: Number(line || 0), next: cursor };
    if (type === '$') {
      const size = Number(line || -1);
      if (size < 0) return { value: null, next: cursor };
      const end = cursor + size;
      const value = buffer.toString('utf8', cursor, end);
      return { value, next: end + 2 };
    }
    if (type === '*') {
      const count = Number(line || 0);
      const list = [];
      for (let i = 0; i < count; i += 1) {
        const parsed = readAt(cursor);
        list.push(parsed.value);
        cursor = parsed.next;
      }
      return { value: list, next: cursor };
    }
    return null;
  }
  return readAt(0);
}

function redisCommand(parts) {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const socket = createRedisSocket(redisUrl);
    const chunks = [];
    let settled = false;
    function finish(error, value) {
      if (settled) return;
      settled = true;
      socket.removeAllListeners();
      try { socket.end(); } catch (err) {}
      if (error) reject(error);
      else resolve(value);
    }
    socket.on('error', (error) => finish(error));
    socket.on('connect', () => socket.write(encodeRedisCommand(parts)));
    socket.on('data', (chunk) => {
      chunks.push(chunk);
      try {
        const parsed = parseRedisReply(Buffer.concat(chunks));
        if (parsed) finish(null, parsed.value);
      } catch (error) {
        finish(error);
      }
    });
  });
}

async function kvGetJson(storageKey) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token || !storageKey) return null;
  const response = await fetch(`${url}/get/${encodeURIComponent(storageKey)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`KV get failed: ${response.status}`);
  const payload = await response.json();
  if (!payload || payload.result == null) return null;
  if (typeof payload.result === 'string') return JSON.parse(payload.result);
  return payload.result;
}

async function kvSetJson(storageKey, value) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token || !storageKey) return false;
  const encoded = encodeURIComponent(JSON.stringify(value));
  const response = await fetch(`${url}/set/${encodeURIComponent(storageKey)}/${encoded}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`KV set failed: ${response.status}`);
  return true;
}

async function redisGetJson(storageKey) {
  if (!storageKey) return null;
  const raw = await redisCommand(['GET', storageKey]);
  if (!raw) return null;
  return JSON.parse(raw);
}

async function redisSetJson(storageKey, value) {
  if (!storageKey) return false;
  await redisCommand(['SET', storageKey, JSON.stringify(value)]);
  return true;
}

function readFileJson(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function canWriteFile() {
  return !(process.env.VERCEL === '1');
}

function writeFileJson(filePath, value) {
  if (!filePath || !canWriteFile()) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
  return true;
}

function readMemory(memoryKey) {
  const value = globalThis[memoryKey];
  return typeof value === 'undefined' ? null : clone(value);
}

function writeMemory(memoryKey, value) {
  globalThis[memoryKey] = clone(value);
  return true;
}

function createJsonStore(options) {
  const storageKey = options.storageKey;
  const filePath = options.filePath;
  const memoryKey = options.memoryKey || `__JSON_STORE_${storageKey || 'default'}__`;
  const factory = typeof options.factory === 'function' ? options.factory : (() => ({}));
  const normalize = typeof options.normalize === 'function' ? options.normalize : ((value) => value);

  async function read() {
    let raw = null;
    try { raw = await kvGetJson(storageKey); } catch (error) { raw = null; }
    if (raw == null) {
      try { raw = await redisGetJson(storageKey); } catch (error) { raw = null; }
    }
    if (raw == null) raw = readFileJson(filePath);
    if (raw == null) raw = readMemory(memoryKey);
    if (raw == null) raw = factory();
    return normalize(raw);
  }

  async function write(value) {
    const safe = normalize(value);
    try {
      const done = await kvSetJson(storageKey, safe);
      if (done) {
        writeMemory(memoryKey, safe);
        return safe;
      }
    } catch (error) {}
    try {
      const done = await redisSetJson(storageKey, safe);
      if (done) {
        writeMemory(memoryKey, safe);
        return safe;
      }
    } catch (error) {}
    try {
      const done = writeFileJson(filePath, safe);
      if (done) {
        writeMemory(memoryKey, safe);
        return safe;
      }
    } catch (error) {}
    writeMemory(memoryKey, safe);
    return safe;
  }

  return { read, write };
}

module.exports = {
  createJsonStore
};
