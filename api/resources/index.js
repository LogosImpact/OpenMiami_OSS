// GET /resources
// Query params:
//   q          - free-text search across name + description
//   category   - resource_category enum
//   provider   - provider_type enum
//   language   - filter to resources offering a given language (en|ht|es|fr)
//   verse      - verse slug (e.g. 'lhrt', 'openmiami', 'miamiverse'). Rolls up
//                to include the slug's verse + all descendants.
//   zipcode    - 5-digit ZIP for proximity ranking (currently a soft hint)
//   limit      - 1..50 (default 20)
//   offset     - default 0
//
// Response: { data: Resource[], page: { limit, offset, total } }

import { applyCors } from '../_lib/cors.js';
import { listResources } from '../_lib/db.js';
import { sendJson, sendError } from '../_lib/json.js';

const MAX_LIMIT = 50;

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') return sendError(res, 405, 'method_not_allowed', 'Use GET');

  const url = new URL(req.url, 'http://localhost');
  const q = url.searchParams.get('q') || undefined;
  const category = url.searchParams.get('category') || undefined;
  const provider = url.searchParams.get('provider') || undefined;
  const language = url.searchParams.get('language') || undefined;
  const verseSlug = url.searchParams.get('verse') || undefined;
  const zipcode = url.searchParams.get('zipcode');
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10) || 20, MAX_LIMIT);
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10) || 0, 0);

  if (zipcode && !/^\d{5}$/.test(zipcode)) {
    return sendError(res, 400, 'invalid_zipcode', 'zipcode must be a 5-digit string');
  }
  if (language && !['en', 'ht', 'es', 'fr'].includes(language)) {
    return sendError(res, 400, 'invalid_language', 'language must be one of en|ht|es|fr');
  }

  try {
    const { data, total, error } = await listResources({
      q, category, provider, language, verseSlug, limit, offset,
    });
    if (error) return sendError(res, 500, 'db_error', error);
    return sendJson(res, 200, {
      data,
      page: { limit, offset, total },
      hint: zipcode ? { zipcode_proximity: 'not_yet_implemented_server_side' } : undefined,
    });
  } catch (e) {
    return sendError(res, 500, 'unexpected', e.message);
  }
}
