// POST /suggest
// Public submission endpoint. RLS allows insert-only on resource_suggestions.
// Body: { name, source_url, description, category?, provider_type?, languages?, contact?, submitter_note? }

import { applyCors } from '../_lib/cors.js';
import { supabaseAnon } from '../_lib/supabase.js';
import { sendJson, sendError, readJsonBody } from '../_lib/json.js';

const CATEGORIES = new Set([
  'housing', 'food', 'health', 'mental_health', 'small_business',
  'workforce', 'education', 'youth', 'seniors', 'immigration',
  'legal', 'arts_culture', 'climate_resilience', 'transit',
  'utilities', 'civic_311', 'emergency',
]);
const PROVIDERS = new Set([
  'lhrt', 'city_of_miami', 'miami_dade_311', 'miami_dade_county',
  'state', 'federal', 'nonprofit', 'mutual_aid', 'faith_based', 'business',
]);
const LANGS = new Set(['en', 'ht', 'es', 'fr']);

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return sendError(res, 405, 'method_not_allowed', 'Use POST');

  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    return sendError(res, 400, e.message === 'payload_too_large' ? 'payload_too_large' : 'invalid_json', 'Could not parse JSON body');
  }

  const errs = [];
  const name = (body.name ?? '').toString().trim();
  if (!name) errs.push('name required');
  if (name.length > 200) errs.push('name too long');

  const source_url = (body.source_url ?? '').toString().trim();
  if (source_url && !/^https?:\/\//i.test(source_url)) errs.push('source_url must be http(s)');

  const description = (body.description ?? '').toString();
  if (description.length > 2000) errs.push('description too long');

  const category = body.category ? String(body.category) : null;
  if (category && !CATEGORIES.has(category)) errs.push('invalid category');

  const provider_type = body.provider_type ? String(body.provider_type) : null;
  if (provider_type && !PROVIDERS.has(provider_type)) errs.push('invalid provider_type');

  let languages = Array.isArray(body.languages) ? body.languages : null;
  if (languages) {
    languages = languages.map(String).filter((l) => LANGS.has(l));
    if (languages.length === 0) languages = null;
  }

  const contact = body.contact && typeof body.contact === 'object' ? body.contact : {};
  const submitter_note = (body.submitter_note ?? '').toString().slice(0, 1000) || null;

  if (errs.length) return sendError(res, 400, 'invalid_input', errs.join('; '));

  try {
    const sb = supabaseAnon();
    const { data, error } = await sb
      .from('resource_suggestions')
      .insert({
        name,
        provider_type,
        category,
        description: description || null,
        languages,
        contact,
        source_url: source_url || null,
        submitter_note,
      })
      .select('id, status, created_at')
      .single();
    if (error) return sendError(res, 500, 'db_error', error.message);
    return sendJson(res, 201, { data });
  } catch (e) {
    return sendError(res, 500, 'unexpected', e.message);
  }
}
