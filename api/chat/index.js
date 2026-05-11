// POST /chat
// BYOK streaming chat over MiaGPT. Body:
//   { messages: [{role, content}], lang: 'en'|'ht'|'es'|'fr', anthropicKey: 'sk-...' }
//
// The user's Anthropic key is read from the request body (BYOK pattern from
// the live demo) and never persisted. Falls back to process.env.ANTHROPIC_API_KEY
// for local dev only.
//
// SSE frames: `data: {"type":"text","text":"…"}\n\n`
//             `data: {"type":"tool_use","name":"query_resources","input":{...}}\n\n`
//             `data: {"type":"tool_result","name":"query_resources","count":N}\n\n`
//             `data: {"type":"done"}\n\n`
//             `data: {"type":"error","message":"…"}\n\n`

import { applyCors } from '../_lib/cors.js';
import { sendError, readJsonBody } from '../_lib/json.js';
import { listResources } from '../_lib/db.js';
import { createMiaGPT } from '@openmiami/miagpt';

const MAX_TURNS = 4; // user → assistant → tool → assistant ⇒ 4 internal turns max

function writeFrame(res, obj) {
  res.write(`data: ${JSON.stringify(obj)}\n\n`);
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return sendError(res, 405, 'method_not_allowed', 'Use POST');

  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    return sendError(res, 400, e.message === 'payload_too_large' ? 'payload_too_large' : 'invalid_json', 'Could not parse JSON body');
  }

  const lang = ['en', 'ht', 'es', 'fr'].includes(body.lang) ? body.lang : 'en';
  const apiKey = (body.anthropicKey || '').toString().trim() || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return sendError(res, 400, 'missing_key', 'anthropicKey is required (or set ANTHROPIC_API_KEY for dev)');
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return sendError(res, 400, 'invalid_input', 'messages must be a non-empty array');
  }

  // Normalize messages into Anthropic's content-block shape.
  const messages = body.messages.map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: typeof m.content === 'string' ? [{ type: 'text', text: m.content }] : m.content,
  }));

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const mia = createMiaGPT({ apiKey });

    let turn = 0;
    while (turn < MAX_TURNS) {
      turn += 1;
      // Pending tool_use blocks observed in this turn — must be answered before
      // the next request to Anthropic.
      const pendingToolUses = [];

      for await (const ev of mia.stream({ messages, lang })) {
        if (ev.type === 'text') {
          writeFrame(res, { type: 'text', text: ev.text });
        } else if (ev.type === 'tool_use') {
          pendingToolUses.push(ev);
          writeFrame(res, { type: 'tool_use', name: ev.name, input: ev.input });
        } else if (ev.type === 'done') {
          // fall through to handle tool calls (if any)
        }
      }

      if (pendingToolUses.length === 0) break;

      // Append the assistant's message containing the tool_use blocks, then a
      // single user message carrying all tool_result blocks for the next turn.
      messages.push({
        role: 'assistant',
        content: pendingToolUses.map((t) => ({
          type: 'tool_use', id: t.id, name: t.name, input: t.input,
        })),
      });

      const toolResults = [];
      for (const t of pendingToolUses) {
        let resultPayload;
        if (t.name === 'query_resources') {
          const input = t.input ?? {};
          const { data, total, error } = await listResources({
            q: input.query,
            category: input.category,
            language: input.language,
            limit: Math.min(input.limit ?? 8, 20),
            offset: 0,
          });
          resultPayload = error
            ? { error }
            : { total, results: data.map(({ description, ...r }) => ({ ...r, description: description?.slice(0, 280) })) };
          writeFrame(res, { type: 'tool_result', name: t.name, count: data?.length ?? 0 });
        } else {
          resultPayload = { error: `unknown tool: ${t.name}` };
        }
        toolResults.push({
          type: 'tool_result',
          tool_use_id: t.id,
          content: JSON.stringify(resultPayload),
        });
      }
      messages.push({ role: 'user', content: toolResults });
    }

    writeFrame(res, { type: 'done' });
  } catch (e) {
    writeFrame(res, { type: 'error', message: e.message ?? String(e) });
  } finally {
    res.end();
  }
}
