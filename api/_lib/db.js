// Dual-driver database access for OpenMiami_OSS.
//
// Supabase mode (primary): if SUPABASE_URL + SUPABASE_ANON_KEY are set, route
// calls through @supabase/supabase-js. RLS policies in db/schema.sql provide
// defense-in-depth.
//
// Neon / vanilla Postgres mode (alternative): if only DATABASE_URL is set,
// drop to a `pg.Pool`. RLS is enforced in the API layer — the queries below
// always filter on `verified_at is not null` for public reads, and the
// suggestions table is only inserted into.
//
// The shim exposes a small high-level surface so callers don't branch.

import { createClient } from '@supabase/supabase-js';

let _mode = null;
let _supabaseAnon = null;
let _supabaseService = null;
let _pgPool = null;

function resolveMode() {
  if (_mode) return _mode;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    _mode = 'supabase';
  } else if (process.env.DATABASE_URL) {
    _mode = 'pg';
  } else {
    throw new Error('No database configured: set SUPABASE_URL+SUPABASE_ANON_KEY or DATABASE_URL');
  }
  return _mode;
}

function getSupabaseAnon() {
  if (!_supabaseAnon) {
    _supabaseAnon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
  }
  return _supabaseAnon;
}

function getSupabaseService() {
  if (!_supabaseService) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY required for service-role operations');
    _supabaseService = createClient(process.env.SUPABASE_URL, key, {
      auth: { persistSession: false },
    });
  }
  return _supabaseService;
}

async function getPgPool() {
  if (!_pgPool) {
    const { default: pg } = await import('pg');
    _pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pgPool;
}

const RESOURCE_COLS = [
  'id', 'verse_id', 'name', 'provider_type', 'category', 'description',
  'eligibility', 'languages', 'contact', 'source_url', 'verified_at',
  'health_score', 'url_status', 'created_at',
];
const RESOURCE_COLUMNS = RESOURCE_COLS.join(', ');
const RESOURCE_COLS_R = RESOURCE_COLS.map((c) => `r.${c}`).join(', ');

/**
 * List verified resources with filters.
 * Returns { data, total, error? }.
 */
export async function listResources({ q, category, provider, language, verseSlug, limit, offset }) {
  const mode = resolveMode();

  if (mode === 'supabase') {
    const sb = getSupabaseAnon();
    let query = sb
      .from('resources')
      .select(RESOURCE_COLUMNS, { count: 'exact' })
      .not('verified_at', 'is', null)
      .order('health_score', { ascending: false })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);
    if (category) query = query.eq('category', category);
    if (provider) query = query.eq('provider_type', provider);
    if (language) query = query.contains('languages', [language]);
    if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    if (verseSlug) {
      // Resolve verse slug → list of descendant ids, then filter resources.
      const { data: verses, error: verseErr } = await sb.rpc('verse_descendants', { root_slug: verseSlug });
      if (verseErr) return { data: [], total: 0, error: verseErr.message };
      const ids = (verses ?? []).map((v) => v.id);
      if (ids.length === 0) return { data: [], total: 0 };
      query = query.in('verse_id', ids);
    }
    const { data, error, count } = await query;
    if (error) return { data: [], total: 0, error: error.message };
    return { data: data ?? [], total: count ?? 0 };
  }

  // pg mode
  const pool = await getPgPool();
  const wheres = ['r.verified_at is not null'];
  const params = [];
  const push = (val) => {
    params.push(val);
    return `$${params.length}`;
  };
  if (category) wheres.push(`r.category = ${push(category)}::resource_category`);
  if (provider) wheres.push(`r.provider_type = ${push(provider)}::provider_type`);
  if (language) wheres.push(`${push(language)} = any(r.languages)`);
  if (q) {
    const like = `%${q}%`;
    wheres.push(`(r.name ilike ${push(like)} or coalesce(r.description,'') ilike $${params.length})`);
  }
  if (verseSlug) {
    wheres.push(`r.verse_id in (select id from public.verse_descendants(${push(verseSlug)}))`);
  }
  const whereSql = wheres.join(' and ');
  const limitParam = push(limit);
  const offsetParam = push(offset);
  const sql = `
    select ${RESOURCE_COLS_R},
           count(*) over() as _total
      from public.resources r
     where ${whereSql}
     order by r.health_score desc, r.name asc
     limit ${limitParam} offset ${offsetParam}
  `;
  try {
    const result = await pool.query(sql, params);
    const total = result.rows[0]?._total ? Number(result.rows[0]._total) : 0;
    const data = result.rows.map(({ _total, ...row }) => row);
    return { data, total };
  } catch (e) {
    return { data: [], total: 0, error: e.message };
  }
}

/** Fetch one verified resource by UUID. */
export async function getResource(id) {
  const mode = resolveMode();
  if (mode === 'supabase') {
    const sb = getSupabaseAnon();
    const { data, error } = await sb
      .from('resources')
      .select(RESOURCE_COLUMNS)
      .eq('id', id)
      .not('verified_at', 'is', null)
      .maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data };
  }
  const pool = await getPgPool();
  try {
    const { rows } = await pool.query(
      `select ${RESOURCE_COLUMNS} from public.resources where id = $1 and verified_at is not null`,
      [id],
    );
    return { data: rows[0] ?? null };
  } catch (e) {
    return { data: null, error: e.message };
  }
}

/** Return the categories present in verified resources, with counts. */
export async function categoryCounts() {
  const mode = resolveMode();
  if (mode === 'supabase') {
    const sb = getSupabaseAnon();
    const { data, error } = await sb
      .from('resources')
      .select('category')
      .not('verified_at', 'is', null);
    if (error) return { data: [], error: error.message };
    const counts = {};
    for (const r of data ?? []) counts[r.category] = (counts[r.category] ?? 0) + 1;
    return { data: counts };
  }
  const pool = await getPgPool();
  try {
    const { rows } = await pool.query(
      `select category::text as category, count(*)::int as count
         from public.resources
        where verified_at is not null
        group by category`,
    );
    const counts = {};
    for (const r of rows) counts[r.category] = r.count;
    return { data: counts };
  } catch (e) {
    return { data: {}, error: e.message };
  }
}

/** Insert a community suggestion. Returns the inserted minimal row. */
export async function insertSuggestion(payload) {
  const mode = resolveMode();
  if (mode === 'supabase') {
    const sb = getSupabaseAnon();
    const { data, error } = await sb
      .from('resource_suggestions')
      .insert(payload)
      .select('id, status, created_at')
      .single();
    if (error) return { data: null, error: error.message };
    return { data };
  }
  const pool = await getPgPool();
  try {
    const { rows } = await pool.query(
      `insert into public.resource_suggestions
         (name, provider_type, category, description, languages, contact, source_url, submitter_note)
       values ($1, $2::provider_type, $3::resource_category, $4, $5, $6, $7, $8)
       returning id, status::text as status, created_at`,
      [
        payload.name,
        payload.provider_type,
        payload.category,
        payload.description,
        payload.languages,
        payload.contact,
        payload.source_url,
        payload.submitter_note,
      ],
    );
    return { data: rows[0] };
  } catch (e) {
    return { data: null, error: e.message };
  }
}

/** Service-role accessor for moderator workflows (Supabase only). */
export function supabaseService() {
  if (resolveMode() !== 'supabase') {
    throw new Error('supabaseService() requires Supabase mode');
  }
  return getSupabaseService();
}

/** Test seam: reset cached clients (used by api/__tests__). */
export function _resetForTests() {
  _mode = null;
  _supabaseAnon = null;
  _supabaseService = null;
  _pgPool = null;
}
