// @openmiami/miagpt — multilingual civic chat wrapper around Claude.
// MIT License.
//
// Usage:
//   import { createMiaGPT } from '@openmiami/miagpt';
//   const mia = createMiaGPT({ apiKey: process.env.ANTHROPIC_API_KEY });
//   for await (const ev of mia.stream({ messages, lang: 'ht' })) { ... }
//
// Streaming events follow the Anthropic Messages SSE shape, surfaced as
// async iterator deltas:
//   { type: 'text', text }                 — assistant token chunk
//   { type: 'tool_use', name, input }      — model wants to call a tool
//   { type: 'tool_result', name, content } — caller-supplied tool result
//   { type: 'done', stop_reason, usage }
//
// The wrapper does NOT execute tools. Hosts (api.openmiami.org, MiamiVerse)
// are responsible for executing `query_resources` against Supabase and
// passing the result back via mia.stream({ messages: [...prior, toolResult] }).

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tools as defaultTools } from './tools.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPPORTED_LANGS = ['en', 'ht', 'es', 'fr'];
const PROMPT_CACHE = new Map();

function loadSystemPrompt(lang) {
  if (PROMPT_CACHE.has(lang)) return PROMPT_CACHE.get(lang);
  // Kreyòl, Spanish, English have dedicated prompts; French falls back to English.
  const file = ['en', 'ht', 'es'].includes(lang) ? `${lang}.md` : 'en.md';
  const text = readFileSync(join(__dirname, 'prompts', file), 'utf8');
  PROMPT_CACHE.set(lang, text);
  return text;
}

export function createMiaGPT({
  apiKey = process.env.ANTHROPIC_API_KEY,
  model = 'claude-sonnet-4-6',
  maxTokens = 1024,
  tools = defaultTools,
} = {}) {
  if (!apiKey) throw new Error('createMiaGPT: ANTHROPIC_API_KEY is required');
  const client = new Anthropic({ apiKey });

  async function* stream({ messages, lang = 'en', extraSystem }) {
    const language = SUPPORTED_LANGS.includes(lang) ? lang : 'en';
    const baseSystem = loadSystemPrompt(language);

    // Prompt caching: keep the long, stable system prompt cacheable across turns.
    const system = [
      { type: 'text', text: baseSystem, cache_control: { type: 'ephemeral' } },
      ...(extraSystem ? [{ type: 'text', text: extraSystem }] : []),
    ];

    const response = await client.messages.stream({
      model,
      max_tokens: maxTokens,
      system,
      tools,
      messages,
    });

    let stopReason = null;
    let usage = null;

    for await (const event of response) {
      switch (event.type) {
        case 'content_block_delta':
          if (event.delta?.type === 'text_delta') {
            yield { type: 'text', text: event.delta.text };
          } else if (event.delta?.type === 'input_json_delta') {
            // Tool input streamed as JSON deltas; emitted whole on stop.
          }
          break;
        case 'content_block_stop':
          if (event.content_block?.type === 'tool_use') {
            yield {
              type: 'tool_use',
              id: event.content_block.id,
              name: event.content_block.name,
              input: event.content_block.input,
            };
          }
          break;
        case 'message_delta':
          if (event.delta?.stop_reason) stopReason = event.delta.stop_reason;
          if (event.usage) usage = event.usage;
          break;
        case 'message_stop':
          // Final message available via response.finalMessage() if needed.
          break;
        default:
          break;
      }
    }

    yield { type: 'done', stop_reason: stopReason, usage };
  }

  return { stream, supportedLanguages: SUPPORTED_LANGS };
}

export { defaultTools as tools };
