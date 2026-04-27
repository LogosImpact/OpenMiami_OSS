// scripts/check-links.js
// Walk every row in `resources`, fetch its source_url with HEAD/GET,
// log the result to `resource_url_checks`, and update the cached
// url_status* columns on `resources`. The health_score trigger then
// recomputes downstream automatically.
//
// Run on a schedule (cron / GitHub Action / Supabase Edge Function).
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/check-links.js
//
// Flags:
//   --limit N      check at most N resources this run (default 200)
//   --concurrency  parallel fetches (default 8)
//   --timeout-ms   per-request timeout (default 8000)

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const LIMIT = parseInt(args.limit ?? '200', 10);
const CONCURRENCY = parseInt(args.concurrency ?? '8', 10);
const TIMEOUT = parseInt(args['timeout-ms'] ?? '8000', 10);

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(2);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

function classify(statusCode) {
  if (!statusCode) return 'unreachable';
  if (statusCode >= 200 && statusCode < 300) return 'ok';
  if (statusCode >= 300 && statusCode < 400) return 'redirect';
  if (statusCode >= 400 && statusCode < 500) return 'client_error';
  if (statusCode >= 500) return 'server_error';
  return 'unknown';
}

async function checkOne({ id, source_url }) {
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  let status_code = null;
  let final_url = null;
  let content_hash = null;
  let notes = null;

  try {
    let res;
    try {
      res = await fetch(source_url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal });
    } catch {
      res = null;
    }
    if (!res || !res.ok) {
      // Some servers don't support HEAD; fall back to GET (limited).
      res = await fetch(source_url, { method: 'GET', redirect: 'follow', signal: ctrl.signal });
      const buf = await res.arrayBuffer();
      content_hash = createHash('sha256').update(Buffer.from(buf)).digest('hex');
    }
    status_code = res.status;
    final_url = res.url || null;
  } catch (e) {
    notes = String(e?.message ?? e).slice(0, 500);
  } finally {
    clearTimeout(timer);
  }

  const status = classify(status_code);
  const response_ms = Date.now() - started;

  // Append to log
  await sb.from('resource_url_checks').insert({
    resource_id: id,
    status,
    status_code,
    response_ms,
    final_url,
    content_hash,
    notes,
  });

  // Update cached columns; the health_score trigger fires on update.
  await sb
    .from('resources')
    .update({ url_status: status, url_status_code: status_code, url_checked_at: new Date().toISOString() })
    .eq('id', id);

  return { id, status, status_code, response_ms };
}

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]).catch((e) => ({ error: e.message }));
    }
  });
  await Promise.all(workers);
  return out;
}

async function main() {
  // Prefer the longest-since-checked rows first.
  const { data, error } = await sb
    .from('resources')
    .select('id, source_url, url_checked_at')
    .order('url_checked_at', { ascending: true, nullsFirst: true })
    .limit(LIMIT);
  if (error) throw error;

  console.log(`Checking ${data.length} resources (concurrency=${CONCURRENCY}, timeout=${TIMEOUT}ms)`);
  const results = await pool(data, CONCURRENCY, checkOne);

  const summary = results.reduce((acc, r) => {
    acc[r?.status ?? 'error'] = (acc[r?.status ?? 'error'] ?? 0) + 1;
    return acc;
  }, {});
  console.log('Done.', summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
