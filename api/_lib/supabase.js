// Supabase client for API routes.
// Uses the anon key for public reads and the service role for writes that
// need to bypass RLS (e.g. moderator workflows). The /suggest insert path
// uses anon — RLS allows anonymous inserts to resource_suggestions only.

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  // Defer the throw until first call so the module can still import in tests.
}

let _anon = null;
let _service = null;

export function supabaseAnon() {
  if (!_anon) {
    if (!url || !anonKey) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY required');
    _anon = createClient(url, anonKey, { auth: { persistSession: false } });
  }
  return _anon;
}

export function supabaseService() {
  if (!_service) {
    if (!url || !serviceKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    _service = createClient(url, serviceKey, { auth: { persistSession: false } });
  }
  return _service;
}
