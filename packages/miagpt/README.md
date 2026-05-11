# @openmiami/miagpt

Multilingual Claude wrapper for civic chat. Bundled with the OpenMiami_OSS monorepo; the live demo at https://impact-lab-miami.vercel.app/ uses the same pattern.

## Install

Workspace dependency:

```json
{ "dependencies": { "@openmiami/miagpt": "*" } }
```

Or standalone (after publish):

```bash
npm install @openmiami/miagpt @anthropic-ai/sdk
```

## Usage

```js
import { createMiaGPT } from '@openmiami/miagpt';

const mia = createMiaGPT({ apiKey: process.env.ANTHROPIC_API_KEY });

for await (const ev of mia.stream({
  messages: [{ role: 'user', content: 'Where can I get free food in Little Haiti?' }],
  lang: 'en',
})) {
  if (ev.type === 'text') process.stdout.write(ev.text);
  if (ev.type === 'tool_use') {
    // Host is responsible for executing query_resources against the API
    // and feeding the tool_result back into the next mia.stream() call.
  }
}
```

## Model split (Sonnet + Haiku)

Per the live demo, MiaGPT uses two models:

| Role          | Model                          | Why                                                  |
| ------------- | ------------------------------ | ---------------------------------------------------- |
| Reasoning     | `claude-sonnet-4-6` (default)  | Tool selection, plan, final response generation.     |
| Ranking       | `claude-haiku-4-5-20251001`    | Cheap re-ranking of `query_resources` results.       |

Both are overridable at construction time:

```js
const mia = createMiaGPT({
  apiKey,
  model: 'claude-sonnet-4-6',
  rankerModel: 'claude-haiku-4-5-20251001',
});

const ranked = await mia.rank({
  candidates: results, // from /resources
  intent: { category: 'food', zipcode: '33127' },
  lang: 'ht',
});
```

The Sonnet/Haiku split was Sol's call in the live demo (Discord, 2026-05-02): *"Updated it to use Sonnet for reasoning and Haiku for ranking instead of Opus to save on cost while we test."*

## Languages

- `en` — English (default fallback)
- `ht` — Kreyòl Ayisyen
- `es` — Spanish
- `fr` — French (uses English system prompt; add `prompts/fr.md` to upgrade)

The system prompt is cache-controlled (`cache_control: { type: 'ephemeral' }`) so repeated turns within a session reuse the prompt cache.

## Tools

The only built-in tool is `query_resources`. It is invoked by the model; the host executes it by calling the OpenMiami API's `/resources` endpoint, then passes the result back as a `tool_result` content block in the next turn.

See `api/chat/index.js` for a reference tool-loop implementation.

## Privacy

MiaGPT does not log user messages. The system prompts explicitly direct the assistant to discourage users from sharing PII (full name, SSN, immigration status, etc.). See `docs/privacy.md` in the monorepo root.
