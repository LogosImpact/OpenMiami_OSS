# MiaGPT transcript — Housing search (EN)

This is a saved transcript so reviewers can see what a working answer looks like without burning an Anthropic API key. The actual chat lives at `/chat` (see `api/chat/index.js`). Captured against the round-3 seed data (30 resources, EN/HT/ES/FR).

---

**user:** I'm a homeowner in Little Haiti worried about losing my house. Anyone helping with that?

**assistant** (tool_use): `query_resources` with `{ "category": "housing", "query": "anti-displacement homeowner Little Haiti" }`

**tool_result:** 3 matches — `LHRT Homeowner Anti-Displacement Assistance`, `LHRT Land & Property Strategy`, `Miami-Dade Public Housing and Community Development`.

**assistant:**

There are three programs that fit your situation, in order of how directly they match:

1. **LHRT Homeowner Anti-Displacement Assistance** — run by the Little Haiti Revitalization Trust (a board of the City of Miami) specifically for legacy Little Haiti homeowners facing property pressure. This is the most targeted match. [Source](https://www.miamigov.com/Government/Boards-Committees/Little-Haiti-Revitalization-Trust)

2. **LHRT Land & Property Strategy** — the Trust's broader work on land banking and acquisition in the Little Haiti boundary. Worth contacting if you also have questions about neighbors' properties or want to understand the long-term plan.

3. **Miami-Dade Public Housing and Community Development** — countywide. Section 8 / Housing Choice Voucher, affordable housing development. Broader scope; useful if LHRT's programs aren't the right fit.

A few practical notes: the Trust meets publicly — meeting schedules are on the Miami.gov page. Don't share personal financial details over chat; bring documentation in person or to a HUD-approved counselor.

If you'd like, I can also pull up legal aid resources (eviction defense, foreclosure prevention).

---

**Notes for reviewers:**
- The model called `query_resources` exactly once. It did not invent program names.
- All three resources cite the same `source_url` (the Trust homepage) because round-3 seed data uses provenance-anchor URLs rather than potentially-rotting deep links. See the provenance note in `db/seed.sql`.
- The closing offer ("legal aid") is reasonable — `legal` is a category in the directory.
