# OpenMiami_OSS — Architecture

## One-paragraph version

OpenMiami_OSS is a single, MIT-licensed monorepo for the OpenMiami / MiamiVerse civic stack. A Postgres + PostGIS database on Supabase (`api.openmiami.org`) holds a moderated directory of civic resources. Stateless serverless API routes expose verified resources, accept community suggestions, and return categories. Two front-end apps consume the API: **MiamiVerse** (Vercel) and **LHRT Finder** (Netlify). A shared package, **MiaGPT**, wraps Claude with multilingual system prompts (EN / HT / ES / FR) and a `query_resources` tool so any front end can host the chat experience.

```
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│  MiamiVerse    │    │  LHRT Finder   │    │   MiaGPT chat  │
│   (Vercel)     │    │   (Netlify)    │    │  (any host)    │
└───────┬────────┘    └───────┬────────┘    └───────┬────────┘
        │                     │                     │
        └────────────┬────────┴──────────┬──────────┘
                     │                   │
                     ▼                   ▼
            ┌────────────────────────────────┐
            │   api.openmiami.org            │
            │   /resources, /resources/:id,  │
            │   /categories, /suggest        │
            └────────────────┬───────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │  Supabase (Postgres │
                  │  + PostGIS + RLS)   │
                  │  resources,         │
                  │  resource_suggestions│
                  │  resources_audit    │
                  └─────────────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │  Anthropic Claude   │
                  │  (via MiaGPT)       │
                  └─────────────────────┘
```

## Repository layout

```
OpenMiami_OSS/
├── api/                  Vercel-style serverless functions
│   ├── _lib/             cors, supabase client, json helpers
│   ├── resources/        GET /resources, GET /resources/:id
│   ├── categories/       GET /categories
│   └── suggest/          POST /suggest
├── apps/
│   ├── miamiverse/       MiamiVerse front end (consolidate from hackathon repo)
│   └── lhrt-finder/      LHRT Finder front end (consolidate from hackathon repo)
├── db/
│   ├── schema.sql        Postgres / PostGIS schema + RLS + audit trigger
│   └── seed.sql          30 starter records with real source URLs
├── packages/
│   ├── miagpt/           Claude wrapper, tools, multilingual system prompts
│   └── languages/        en|ht|es|fr UI strings shared by all apps
├── docs/
│   ├── architecture.md   (this file)
│   ├── api-contract.md   request/response shapes, errors
│   └── language-pack-guide.md   how to add a language
├── README.md
├── ROADMAP.md
├── CONTRIBUTING.md
├── HISTORY.md
├── SEED-ISSUES.md
└── LICENSE
```

## Data model

- **`resources`** — published, moderator-verified civic resources. Public read via RLS, but only rows where `verified_at is not null`. Service role required to write.
- **`resource_suggestions`** — community submissions. Public insert via RLS; only service role can read/update (moderation queue).
- **`resources_audit`** — append-only log of every insert / update / delete to `resources`. Useful for accountability and rollback.

PostGIS is enabled for distance queries; `resources.location` is `geography(point, 4326)` with a GiST index. Languages are stored as a `text[]` with a GIN index so `?language=ht` filters use index ops.

## Privacy

- The `resources` table contains only **organization-level** contact info (website, public phone, public address). Never PII of beneficiaries.
- The `resource_suggestions` table is also org-level — but moderators are responsible for stripping any submitter PII before promoting a row.
- MiaGPT does not log user messages to disk. The prompts explicitly tell the assistant to discourage users from sharing PII.

## Hosting plan (deferred)

| Component       | Host     | Domain                       |
| --------------- | -------- | ---------------------------- |
| API             | Vercel   | api.openmiami.org            |
| MiamiVerse      | Vercel   | miamiverse.world             |
| LHRT Finder     | Netlify  | (TBD by LHRT team)           |
| Supabase        | Supabase | (managed)                    |
| MiaGPT          | embedded | runs on whichever app hosts  |

CORS is open to: `miamiverse.world`, `*.miamiverse.world`, `*.netlify.app`, `*.vercel.app`, `localhost:*`.
