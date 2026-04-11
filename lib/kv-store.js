function getKvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_URL || '';
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN || '';
  if (!url || !token) return null;
  return { url: String(url).replace(/\/+$/, ''), token };
}

async function runKvCommand(parts) {
  const cfg = getKvConfig();
  if (!cfg) return { ok: false, missing: true };
  const response = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parts)
  });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch (error) {
    throw new Error(`KV invalid JSON response: ${text.slice(0, 200)}`);
  }
  if (!response.ok) {
    const message = payload && (payload.error || payload.result) ? String(payload.error || payload.result) : `${response.status}`;
    throw new Error(`KV request failed: ${message}`);
  }
  if (payload && payload.error) throw new Error(String(payload.error));
  return { ok: true, result: payload ? payload.result : null };
}

async function kvGetJson(key, fallbackValue) {
  const result = await runKvCommand(['GET', key]);
  if (!result.ok) return fallbackValue;
  if (result.result == null || result.result === '') return fallbackValue;
  if (typeof result.result === 'string') return JSON.parse(result.result);
  return result.result;
}

async function kvSetJson(key, value) {
  const result = await runKvCommand(['SET', key, JSON.stringify(value)]);
  return !!(result && result.ok);
}

module.exports = {
  getKvConfig,
  kvGetJson,
  kvSetJson,
  runKvCommand
};
