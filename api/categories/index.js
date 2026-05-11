// GET /categories
// Returns the list of supported resource categories with counts.
// Clients render localized labels from packages/languages/<lang>.json.

import { applyCors } from '../_lib/cors.js';
import { categoryCounts } from '../_lib/db.js';
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
    const { data: counts, error } = await categoryCounts();
    if (error) return sendError(res, 500, 'db_error', error);
    return sendJson(res, 200, {
      data: CATEGORIES.map((slug) => ({ slug, count: counts[slug] ?? 0 })),
    });
  } catch (e) {
    return sendError(res, 500, 'unexpected', e.message);
  }
}
