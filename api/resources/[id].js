// GET /resources/:id
// Returns one resource by UUID. 404 if not found or not verified.

import { applyCors } from '../_lib/cors.js';
import { getResource } from '../_lib/db.js';
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
    const { data, error } = await getResource(id);
    if (error) return sendError(res, 500, 'db_error', error);
    if (!data) return sendError(res, 404, 'not_found', 'Resource not found');
    return sendJson(res, 200, { data });
  } catch (e) {
    return sendError(res, 500, 'unexpected', e.message);
  }
}
