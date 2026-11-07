// AUTHORIZED SECURITY DRILL USE ONLY — delete this project after testing.
// Purpose: test a web crawler's HTTP redirect handling (status codes, hop
// depth, URL-encoded nesting). No auth by design; do not deploy publicly
// for longer than the test window.

// Allowed redirect statuses. Any other "code" falls back to 302.
const ALLOWED_CODES = new Set([301, 302, 303, 307, 308]);

export default async function handler(req, res) {
  const { to, code, hop } = req.query;

  // Decode repeatedly so callers can send arbitrarily pre-encoded targets,
  // including double-encoded payloads like ...%252Fapi%252Fr%253F...
  // (decodeURIComponent on a query param Next has already decoded once).
  let target = to;
  if (typeof target !== 'string') {
    res.status(400).send('Missing "to" query parameter');
    return;
  }
  try {
    for (let i = 0; i < 6; i++) {
      if (!/%(?:25|2F|3A|3F)/i.test(target)) break;
      const next = decodeURIComponent(target);
      if (next === target) break;
      target = next;
    }
  } catch {
    // Malformed escape sequence: use the raw value.
  }

  const status = ALLOWED_CODES.has(Number(code)) ? Number(code) : 302;

  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      ip:
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        'unknown',
      hop: hop ?? null,
      to: target,
      code: status,
      ua: req.headers['user-agent'] ?? null,
    })
  );

  // Return the redirect; we never follow it ourselves.
  res.setHeader('Location', target);
  res.status(status).send('');
}
