// GET /categories
// Returns the list of supported resource categories with counts and
// localized labels (client picks the right locale via packages/languages).

import { applyCors } from '../_lib/cors.js';
import { supabaseAnon } from '../_lib/supabase.js';
import { sendJson, sendError } from '../_lib/json.js';

// Mirror of resource_category enum in db/schema.sql.
const CATEGORIES = [
  'housing', 'food', 'health', 'mental_health', 'small_business',
  'workforce', 'education', 'youth', 'seniors', 'immigration',
  'legal', 'arts_culture', 'climate_resilience', 'transit',
  'utilities', 'civic_311', 'emergency',
];

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') return sendError(res, 405, 'method_not_allowed', 'Use GET');

  try {
    const sb = supabaseAnon();
    const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));

    // Group counts by category. Supabase JS doesn't expose GROUP BY directly,
    // so we fetch the (small) verified set's category column and tally.
    const { data, error } = await sb
      .from('resources')
      .select('category')
      .not('verified_at', 'is', null);
    if (error) return sendError(res, 500, 'db_error', error.message);
    for (const row of data ?? []) {
      if (row.category in counts) counts[row.category] += 1;
    }

    return sendJson(res, 200, {
      data: CATEGORIES.map((slug) => ({ slug, count: counts[slug] })),
    });
  } catch (e) {
    return sendError(res, 500, 'unexpected', e.message);
  }
}
