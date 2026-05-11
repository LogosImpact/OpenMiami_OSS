# OpenMiami API Contract

Base URL: `https://api.openmiami.org`

All responses are JSON. All endpoints accept and respond with `application/json; charset=utf-8`.

## CORS

The API allows the following origins:

| Origin                               | Notes                          |
| ------------------------------------ | ------------------------------ |
| `https://miamiverse.world`           | Production MiamiVerse          |
| `https://*.miamiverse.world`         | Subdomains (preview, app, etc) |
| `https://*.netlify.app`              | LHRT Finder (Netlify previews) |
| `https://*.vercel.app`               | MiamiVerse previews            |
| `http://localhost:*`                 | Local development              |

Preflight `OPTIONS` requests return `204` with `Access-Control-Allow-Methods: GET,POST,OPTIONS` and `Access-Control-Allow-Headers: Content-Type, Authorization`.

## Common error shape

```json
{ "error": { "code": "invalid_input", "message": "name required" } }
```

| HTTP | code                  | When                                   |
| ---- | --------------------- | -------------------------------------- |
| 400  | `invalid_json`        | Body is not valid JSON                 |
| 400  | `invalid_input`       | Validation failed (message has detail) |
| 400  | `invalid_id`          | Path id is not a UUID                  |
| 400  | `invalid_zipcode`     | `zipcode` is not 5 digits              |
| 400  | `invalid_language`    | `language` not in `en\|ht\|es\|fr`     |
| 400  | `payload_too_large`   | Body exceeds 64 KB                     |
| 404  | `not_found`           | Resource does not exist or unverified  |
| 405  | `method_not_allowed`  | Wrong HTTP method                      |
| 429  | `rate_limited`        | See **Rate limits** below              |
| 500  | `db_error`            | Underlying database error              |
| 500  | `unexpected`          | Anything else                          |

## Rate limits

- **Anonymous** (`/resources`, `/resources/:id`, `/categories`): 60 requests / minute / IP.
- **Anonymous** (`POST /suggest`): 5 requests / minute / IP, 50 / day / IP.
- Rate limits are not yet enforced at the application layer — they are enforced via Supabase / edge config in production. Clients should treat `429 rate_limited` as authoritative regardless.

## `Resource` object

```json
{
  "id": "uuid",
  "name": "string",
  "provider_type": "lhrt | city_of_miami | miami_dade_311 | miami_dade_county | state | federal | nonprofit | mutual_aid | faith_based | business",
  "category": "housing | food | health | mental_health | small_business | workforce | education | youth | seniors | immigration | legal | arts_culture | climate_resilience | transit | utilities | civic_311 | emergency",
  "description": "string | null",
  "eligibility": { /* free-form jsonb, optional */ },
  "languages": ["en", "ht", "es", "fr"],
  "contact": { "website": "https://...", "phone": "...", "address": "..." },
  "source_url": "https://...",
  "verified_at": "2026-04-26T00:00:00Z",
  "created_at": "2026-04-26T00:00:00Z"
}
```

Notes
- `verified_at` is always set on returned rows (RLS hides unverified rows from the public read endpoints).
- `contact` is org-level only — never PII.

---

## `GET /resources`

Search and list verified resources.

### Query parameters

| Name       | Type    | Default | Description                                       |
| ---------- | ------- | ------- | ------------------------------------------------- |
| `q`        | string  | —       | Free-text match against `name` and `description`. |
| `category` | string  | —       | One of the `Resource.category` values.            |
| `provider` | string  | —       | One of the `Resource.provider_type` values.       |
| `language` | string  | —       | `en\|ht\|es\|fr`. Filters by languages array.     |
| `verse`    | string  | —       | Verse slug (`lhrt`, `openmiami`, `miamiverse`, `floridaverse`, `sustainacities`). Rolls up to include the slug's verse and all descendants. |
| `zipcode`  | string  | —       | 5-digit ZIP. Used for proximity ranking.          |
| `limit`    | integer | 20      | 1..50.                                            |
| `offset`   | integer | 0       | For pagination.                                   |

### Response 200

```json
{
  "data": [ /* Resource, ... */ ],
  "page": { "limit": 20, "offset": 0, "total": 30 }
}
```

### Example

```bash
curl 'https://api.openmiami.org/resources?category=food&language=ht&limit=5'
```

---

## `GET /resources/:id`

### Path parameters

| Name | Type | Description                |
| ---- | ---- | -------------------------- |
| `id` | UUID | The resource's primary id. |

### Response 200

```json
{ "data": { /* Resource */ } }
```

### Response 404

```json
{ "error": { "code": "not_found", "message": "Resource not found" } }
```

### Example

```bash
curl 'https://api.openmiami.org/resources/00000000-0000-0000-0000-000000000000'
```

---

## `GET /categories`

Returns the canonical list of categories with counts of verified resources.

### Response 200

```json
{
  "data": [
    { "slug": "housing",          "count": 4 },
    { "slug": "food",             "count": 2 },
    { "slug": "health",           "count": 3 },
    { "slug": "small_business",   "count": 5 },
    { "slug": "civic_311",        "count": 6 }
  ]
}
```

Localized labels live in `packages/languages/<lang>.json` under `categories.<slug>` — clients render the display name from there.

### Example

```bash
curl 'https://api.openmiami.org/categories'
```

---

## `POST /suggest`

Public submission endpoint. Backed by `resource_suggestions` (RLS allows insert-only). Suggestions are reviewed by moderators before they appear on the public listing.

### Request body

```json
{
  "name": "Required, ≤ 200 chars",
  "source_url": "https://... (optional but encouraged)",
  "description": "≤ 2000 chars",
  "category": "optional, must be a valid category slug",
  "provider_type": "optional, must be a valid provider type",
  "languages": ["en", "ht"],
  "contact": { "website": "https://..." },
  "submitter_note": "≤ 1000 chars, optional"
}
```

### Response 201

```json
{ "data": { "id": "uuid", "status": "pending", "created_at": "2026-04-26T00:00:00Z" } }
```

### Response 400

```json
{ "error": { "code": "invalid_input", "message": "name required" } }
```

### Example

```bash
curl -X POST 'https://api.openmiami.org/suggest' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Example Mutual Aid Pantry",
    "source_url": "https://example.org",
    "description": "Free pantry, every Saturday 10am.",
    "category": "food",
    "provider_type": "mutual_aid",
    "languages": ["en","es","ht"],
    "contact": { "website": "https://example.org" },
    "submitter_note": "I volunteer here"
  }'
```

---

## `POST /chat`

BYOK streaming chat. Wraps the MiaGPT package's tool-loop server-side: when the model requests `query_resources`, the route executes it against the same `listResources` helper used by `/resources` and feeds the result back into the next turn. Frames are emitted as Server-Sent Events.

### Request body

```json
{
  "messages": [
    { "role": "user", "content": "Where can I get free food in Little Haiti?" }
  ],
  "lang": "en",
  "anthropicKey": "sk-ant-..."
}
```

- `anthropicKey` is required (or set `ANTHROPIC_API_KEY` server-side for dev). The key is **never persisted** server-side.
- `lang` is one of `en | ht | es | fr` (default `en`).

### Response (SSE)

```
data: {"type":"text","text":"There are a few options…"}

data: {"type":"tool_use","name":"query_resources","input":{"category":"food"}}

data: {"type":"tool_result","name":"query_resources","count":3}

data: {"type":"text","text":"… **Feeding South Florida** …"}

data: {"type":"done"}
```

Error frames:

```
data: {"type":"error","message":"…"}
```

### Example

```bash
curl -N -X POST http://localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [{"role":"user","content":"free food in Little Haiti"}],
    "lang": "en",
    "anthropicKey": "sk-ant-..."
  }'
```

---

## Versioning

The API is currently `v0` — the path prefix is implicit. Breaking changes will be announced in `HISTORY.md` and rolled out under a `/v1/` path prefix.
