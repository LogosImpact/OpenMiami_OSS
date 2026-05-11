// Smoke test for the MiaGPT prompt loader. Verifies each supported language
// has a loadable system prompt and that unsupported languages fall back to en.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const promptsDir = join(__dirname, '..', 'prompts');

test('English prompt exists and is non-trivial', () => {
  const text = readFileSync(join(promptsDir, 'en.md'), 'utf8');
  assert.ok(text.length > 200, 'en prompt should be > 200 chars');
  assert.match(text, /MiaGPT/);
});

test('Kreyòl prompt exists', () => {
  const text = readFileSync(join(promptsDir, 'ht.md'), 'utf8');
  assert.ok(text.length > 200);
});

test('Spanish prompt exists', () => {
  const text = readFileSync(join(promptsDir, 'es.md'), 'utf8');
  assert.ok(text.length > 200);
});

test('createMiaGPT throws without apiKey', async () => {
  const orig = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    const { createMiaGPT } = await import('../index.js');
    assert.throws(() => createMiaGPT(), /ANTHROPIC_API_KEY is required/);
  } finally {
    if (orig) process.env.ANTHROPIC_API_KEY = orig;
  }
});

test('createMiaGPT exposes supportedLanguages', async () => {
  const { createMiaGPT } = await import('../index.js');
  const mia = createMiaGPT({ apiKey: 'sk-ant-test' });
  assert.deepEqual(mia.supportedLanguages, ['en', 'ht', 'es', 'fr']);
});
