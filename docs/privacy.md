# Privacy & Data Posture

OpenMiami is a public-benefit platform. This document is what we promise residents, contributors, and partners about how data flows through the system.

## TL;DR

- **No PII columns in the database.** Anything we store is org-level public information.
- **No logs of MiaGPT user messages.** The chat is in-memory and ephemeral.
- **No surveillance, no fingerprinting, no third-party trackers.**
- **Community-empowering, not community-extractive.** When commercial value comes out of this stack, the licensing model funnels value back to the community — not the other way around.

---

## What we store

### `resources`
Org-level public info only: name, type, category, website, public phone, public address. No personal info about residents or beneficiaries.

### `resource_suggestions`
Community submissions, written by humans. Submitter info is **not** required and is **not** persisted. The `submitter_note` field is free-text — moderators are responsible for redacting any PII a submitter accidentally pasted before promoting a row to `resources`.

### `resources_audit`
Append-only log of who changed `resources`. The `changed_by` column stores a Supabase `auth.uid()` — that is, a moderator account, not a resident.

### `resource_url_checks`
Automated link-health log. No identifiers other than the resource id and HTTP status.

### `verses`
Civic-jurisdiction tree (SustainaCities → FloridaVerse → MiamiVerse → OpenMiami / LHRT). No PII.

### What we do **not** store

- Resident names, addresses, phone numbers, immigration status, SSN, DOB, or any government identifiers.
- IP addresses (beyond ephemeral edge-rate-limit windows enforced by the host).
- MiaGPT user messages or transcripts.
- Browser fingerprints, ad IDs, third-party analytics cookies.
- Geolocation pings from end users.

---

## RLS-enforced boundaries

| Table                  | Anon read         | Anon write              | Service role |
| ---------------------- | ----------------- | ----------------------- | ------------ |
| `resources`            | Verified rows     | ❌                      | Full         |
| `resource_suggestions` | ❌                | ✅ insert only          | Full         |
| `resources_audit`      | ❌                | ❌                      | Full         |
| `resource_url_checks`  | ❌                | ❌                      | Full         |
| `verses`               | ✅ (whole tree)   | ❌                      | Full         |

Anything not in this table is closed by default.

---

## MiaGPT (chat assistant)

The MiaGPT package wraps the Anthropic Claude API. The system prompts in every supported language explicitly:

1. Tell the assistant **never** to ask for PII.
2. Tell the assistant **never** to claim it stores or remembers user input.
3. Require it to ground answers in `query_resources` results, not memory.

Front ends embedding MiaGPT must:

- Not log user messages to disk, analytics, or any third-party service.
- Not persist chat history in `localStorage` or `sessionStorage` (project policy).
- Display a privacy banner at the start of each conversation: "MiaGPT does not store your messages. Don't include personal info."

---

## Threat model

### What a malicious actor *could* do

- **Submit spam to `POST /suggest`.** Mitigated by: rate limits, moderator review queue, CAPTCHA at the front end (TBD), and `resource_suggestions` being write-only for anonymous users.
- **Scrape `GET /resources`.** This is by design — the data is public, MIT-licensed, and we ship a CSV export endpoint to make scraping unnecessary.
- **Attempt SQL injection through query params.** Mitigated by: parameterized Supabase queries, length and shape validation in API routes, RLS as the last line of defense.

### What a malicious actor *cannot* do

- Read the suggestion queue (RLS).
- Read the audit log (RLS).
- Modify `resources` directly (RLS — service role required).
- Correlate user identities across services (we don't store identities).

### Insider risk

A compromised moderator account could promote bad data into `resources`. Mitigations:

- Two approvals required for `db/schema.sql` and RLS-policy changes.
- `resources_audit` captures every change with the moderator id; rollback is a single SQL statement.
- Quarterly audit review by maintainers.

---

## Freemium / commercial posture

The OSS code is **MIT-licensed forever** and free to run. We support a freemium commercial track for partners who want hosted, supported, or extended deployments:

| Tier                  | What it includes                                                 |
| --------------------- | ---------------------------------------------------------------- |
| **Open source**       | Everything in this repo. MIT. Self-host whatever you want.       |
| **Hosted community**  | Free hosted instance for verified non-profits and cities.        |
| **Hosted partner**    | Paid SLA, custom domain, branded MiaGPT, moderator support.      |
| **Reseller / module** | Licensing terms for organizations that want to bundle OpenMiami modules into their own product or app store (including the planned dApp store). |

Commercial agreements **never** entail selling resident data. Resident data is community-owned. Commercial value comes from infrastructure, support, customization, and curation work — not data extraction.

If a partner wants to participate in a community-data-coop arrangement (Ocean Protocol / dClimate / similar), the data flow is governed separately under explicit consent and revenue-share — see [`web3-considerations.md`](./web3-considerations.md).

---

## Reporting a privacy concern

Email `security@logosimpact.org` (or reach a maintainer privately on the LogosImpact org). Acknowledgement within 72 hours.

We coordinate disclosure with reporters and credit researchers in `HISTORY.md` once a fix has shipped.
