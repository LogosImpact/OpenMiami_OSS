// Shared CORS helper for api.openmiami.org
// Allowed origins (exact + wildcard):
//   https://miamiverse.world
//   https://*.miamiverse.world
//   https://*.netlify.app
//   https://*.vercel.app
//   http://localhost:*

const ORIGIN_PATTERNS = [
  /^https:\/\/miamiverse\.world$/i,
  /^https:\/\/[a-z0-9-]+\.miamiverse\.world$/i,
  /^https:\/\/[a-z0-9-]+\.netlify\.app$/i,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i,
  /^http:\/\/localhost(:\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/i,
];

export function isOriginAllowed(origin) {
  if (!origin) return false;
  return ORIGIN_PATTERNS.some((re) => re.test(origin));
}

export function applyCors(req, res) {
  const origin = req.headers.origin;
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true; // handled
  }
  return false;
}
