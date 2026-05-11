# Web3 Considerations

This is a deliberately skeptical, deliberately open-minded note about where Web3 components do and do not belong in OpenMiami / SustainaCities.

> **Default posture:** Web3 is opt-in, never required. The base stack runs on plain Postgres + Supabase + Vercel. Web3 modules sit *next to* it, not under it. A resident should never need a wallet to find a food pantry.

## Where Web3 helps

### 1. Community-owned data coops

Civic data the community generates (e.g. hyperlocal climate sensors, mutual-aid signals, neighborhood reports) is a candidate for a community-owned data layer where:

- **Ocean Protocol** can wrap a dataset as a tokenized data NFT, allowing controlled access and revenue-share back to contributors.
- **dClimate** offers comparable plumbing for climate-and-resilience data.

These let the community license aggregate, anonymized data to academic or commercial partners while keeping ownership distributed. They are **not** appropriate for personal-identifying or surveillance-prone data.

### 2. Provenance and audit trail

Anchoring critical state changes (a moderator approving a resource, a community vote on LHRT priorities, a release of grant funds) to a public chain provides tamper-evident history beyond what `resources_audit` gives us. This is a "nice to have," not a "must have."

### 3. Module marketplace ("dApp store")

A modular app store where civic-tech modules can be:

- Licensed to other CityVerses (FloridaVerse, BroowardVerse, …)
- Combined and remixed by communities
- Compensated when adopted

A public ledger lets us track licensing terms and revenue-share without a centralized intermediary. This is a 12–18 month track, not a Q1 task.

## Where Web3 does *not* belong

### 1. Resident-facing UX

A resident looking for a food pantry, a 311 service, or a Kreyòl-speaking clinician should not have to:
- install MetaMask,
- pay gas,
- understand seed phrases,
- think about chains at all.

Any feature that puts a wallet between a resident and a public service is a regression. Web3 modules sit behind the public benefit interface, not in front of it.

### 2. Personally identifying data

PII on a public ledger is a permanent privacy disaster. Even "private" L2 patterns leak through metadata. Resident PII never goes on chain — full stop. (And the project policy is that we don't store PII server-side either, which makes the question moot for our base data model.)

### 3. Pay-to-access civic services

Tokens, NFTs, or any other gating mechanism for accessing public-benefit services are out of scope. The whole point is access.

## Module boundaries

If/when Web3 modules ship, they live in clearly demarcated packages:

```
packages/
├── miagpt/                 base, no Web3
├── languages/              base, no Web3
├── web3-data-coop/         opt-in data-licensing layer (Ocean / dClimate)
├── web3-provenance/        optional anchor of moderator events
└── web3-marketplace/       dApp-store licensing / royalties
```

Each module is its own npm package with its own dependencies. Removing them is `rm -rf packages/web3-*`.

## Tradeoffs to litigate before building any of this

1. **Energy and footprint** — we publicly favor energy-efficient consensus (PoS / rollups). Bitcoin-style PoW is off the table for civic infrastructure.
2. **Counterparty risk** — Ocean / dClimate / etc. are independent projects. We pin versions, audit upgrades, and keep the option to fork.
3. **Regulatory clarity** — token-economics in a public-benefit context is an open legal question. Any token issuance is gated on legal review and explicit board approval.
4. **Reversibility** — every Web3 module must be designed to be turn-off-able without breaking the base stack.

## Decision log

- 2026-04-26 — Web3 components are out of scope for the consolidation pass and the MVP. Captured here so the door is open for the community-data-coop and dApp-store tracks once the base stack is in production. See ROADMAP "Eventually" section.
