# Language Pack Guide

OpenMiami is multilingual from day one. We ship four packs:

| Code | Name             | Notes                                  |
| ---- | ---------------- | -------------------------------------- |
| `en` | English          | Default fallback.                      |
| `ht` | Kreyòl Ayisyen   | Primary language for Little Haiti.     |
| `es` | Español          | Primary for parts of Wynwood / Miami.  |
| `fr` | Français         | For Francophone Caribbean diaspora.    |

## File layout

```
packages/languages/
├── en.json   ← canonical schema (every other file mirrors its keys)
├── ht.json
├── es.json
└── fr.json
```

Every file has the same top-level shape:

```json
{
  "_meta": { "language": "ht", "name": "Kreyòl Ayisyen", "rtl": false },
  "common":     { ... },
  "categories": { ... },   // mirrors db enum resource_category
  "suggest":    { ... },
  "miagpt":     { ... }
}
```

## Adding a new language

1. **Pick the ISO 639-1 code.** Two letters, lowercase.
2. **Copy `en.json` to `<code>.json`.** Translate every value. Keep keys identical.
3. **Update `_meta`.** Set `language` and `name` (in the language itself: e.g. `"name": "Português"`). Set `rtl` to `true` only for right-to-left scripts.
4. **Add a system prompt for MiaGPT** at `packages/miagpt/prompts/<code>.md`. Keep the structure of `en.md`. If you don't add a prompt, MiaGPT falls back to English.
5. **Update the supported list** in three places:
   - `packages/miagpt/index.js` → `SUPPORTED_LANGS`
   - `packages/miagpt/tools.js` → `query_resources.input_schema.properties.language.enum`
   - `api/_lib` validators (e.g. `api/resources/index.js` `language` enum check, `api/suggest/index.js` `LANGS` set)
   - `db/schema.sql` constraint? — currently no enum constraint on `languages text[]`, so DB does not need a change.
6. **Add tests** that cover the new pack — at minimum, that every key in `en.json` is present in `<code>.json`.

## Translation principles

- Translate meaning, not words. "Mom and Pop Small Business Grant" should not be literally translated; if a community-recognized translation exists, use it. Otherwise leave the proper noun in English and add a parenthetical gloss.
- Use plain language. Aim for ~6th-grade reading level in every language.
- Be consistent with diacritics — Kreyòl uses `ò`, `è`, `ã` etc.; Spanish uses `ñ`, `á`, `í`, `ó`; French uses `ç`, `é`, `è`, `ê`.
- Avoid English idioms unless you can localize them.

## Reviewer checklist

- [ ] All keys from `en.json` exist in the new pack.
- [ ] No keys present that aren't in `en.json`.
- [ ] `_meta.language` matches the file name.
- [ ] No machine-translation artifacts (literal pronoun translation, awkward word order, untranslated brand names).
- [ ] Native or near-native speaker has signed off in the PR.
