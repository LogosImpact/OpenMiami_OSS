// GET /resources/:id
// Returns one resource by UUID. 404 if not found or not verified.

import { applyCors } from '../_lib/cors.js';
import { supabaseAnon } from '../_lib/supabase.js';
import { sendJson, sendError } from '../_lib/json.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') return sendError(res, 405, 'method_not_allowed', 'Use GET');

  const id = req.query?.id ?? new URL(req.url, 'http://localhost').pathname.split('/').pop();
  if (!id || !UUID_RE.test(id)) {
    return sendError(res, 400, 'invalid_id', 'id must be a UUID');
  }

  try {
    const sb = supabaseAnon();
    const { data, error } = await sb
      .from('resources')
      .select('id,name,provider_type,category,description,eligibility,languages,contact,source_url,verified_at,created_at')
      .eq('id', id)
      .not('verified_at', 'is', null)
      .maybeSingle();

    if (error) return sendError(res, 500, 'db_error', error.message);
    if (!data) return sendError(res, 404, 'not_found', 'Resource not found');
    return sendJson(res, 200, { data });
  } catch (e) {
    return sendError(res, 500, 'unexpected', e.message);
  }
}
