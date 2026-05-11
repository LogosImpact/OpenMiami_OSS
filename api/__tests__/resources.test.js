// Smoke tests for api/resources/index.js.
//
// CORS + validation tests run unconditionally (they short-circuit before
// touching the DB). The happy-path test requires a working DB:
//   - DATABASE_URL set (local: `npm run db:up`), or
//   - SUPABASE_URL + SUPABASE_ANON_KEY set (production).
// It is skipped otherwise.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import handler from '../resources/index.js';

function makeReqRes(url, method = 'GET', origin = 'http://localhost:5173') {
  const req = { method, url, headers: { origin } };
  let statusCode = 200;
  const headers = {};
  let body = '';
  let ended = false;
  const res = {
    setHeader(k, v) { headers[k] = v; },
    get statusCode() { return statusCode; },
    set statusCode(v) { statusCode = v; },
    end(chunk) { if (chunk) body += chunk; ended = true; },
    write(chunk) { body += chunk; },
  };
  return { req, res, get: () => ({ statusCode, headers, body, ended }) };
}

test('CORS preflight returns 204 for allowed origin', async () => {
  const { req, res, get } = makeReqRes('/resources', 'OPTIONS');
  await handler(req, res);
  const r = get();
  assert.equal(r.statusCode, 204);
  assert.equal(r.headers['Access-Control-Allow-Origin'], 'http://localhost:5173');
});

test('CORS denies disallowed origin (no allow-origin header)', async () => {
  const { req, res, get } = makeReqRes('/resources', 'OPTIONS', 'https://evil.example.com');
  await handler(req, res);
  const r = get();
  assert.equal(r.statusCode, 204);
  assert.equal(r.headers['Access-Control-Allow-Origin'], undefined);
});

test('Non-GET method returns 405', async () => {
  const { req, res, get } = makeReqRes('/resources', 'POST');
  await handler(req, res);
  const r = get();
  assert.equal(r.statusCode, 405);
  assert.match(r.body, /method_not_allowed/);
});

test('Invalid zipcode returns 400', async () => {
  const { req, res, get } = makeReqRes('/resources?zipcode=abc');
  await handler(req, res);
  const r = get();
  assert.equal(r.statusCode, 400);
  assert.match(r.body, /invalid_zipcode/);
});

test('Invalid language returns 400', async () => {
  const { req, res, get } = makeReqRes('/resources?language=zz');
  await handler(req, res);
  const r = get();
  assert.equal(r.statusCode, 400);
  assert.match(r.body, /invalid_language/);
});

const hasDb = !!(process.env.DATABASE_URL || (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY));

test('Happy path returns seeded data', { skip: !hasDb && 'Set DATABASE_URL or SUPABASE_URL+SUPABASE_ANON_KEY to run' }, async () => {
  const { req, res, get } = makeReqRes('/resources?category=food&limit=10');
  await handler(req, res);
  const r = get();
  assert.equal(r.statusCode, 200);
  const parsed = JSON.parse(r.body);
  assert.ok(Array.isArray(parsed.data));
  assert.ok(parsed.data.length >= 2, `expected ≥2 food resources, got ${parsed.data.length}`);
  for (const row of parsed.data) {
    assert.equal(row.category, 'food');
    assert.ok(typeof row.health_score === 'number');
  }
});

test('Verse rollup returns LHRT-scoped rows', { skip: !hasDb && 'Set DATABASE_URL or SUPABASE_URL+SUPABASE_ANON_KEY to run' }, async () => {
  const { req, res, get } = makeReqRes('/resources?verse=lhrt&limit=20');
  await handler(req, res);
  const r = get();
  assert.equal(r.statusCode, 200);
  const parsed = JSON.parse(r.body);
  // Seed has 5 LHRT programs assigned to verse 'lhrt'.
  assert.ok(parsed.data.length >= 5, `expected ≥5 LHRT-scoped rows, got ${parsed.data.length}`);
});
