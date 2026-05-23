---
title: Claude (Anthropic)
type: stakeholder
slug: claude-opus
date: 2026-05-23
updated: 2026-05-24
attributed_to: [claude-opus]
belongs_to: [claude-opus]
source: chat
status: active
tags: [agent, ai]
related: [vietnamy-app]
role: agent
---

## Summary
AI coding agent (Claude Code, Opus 4.7 / 1M context) operating under `AGENTS.md` and `CLAUDE.md`. Pairs with [niko] in interactive sessions to design, implement, document, and operate the Vietnamy codebase. Authored the two-tier TTS cache design, the Tone Trainer module, the Professional and Heritage curricula, and most infrastructure scripts (warm-up, backfill, backup, mirror, rename, cleanup).

## Areas of responsibility
- Drafting and implementing technical proposals (with Niko's approval before risky actions).
- Long-running scripts (warm-up, backfill, mirror) and tracking their background tasks.
- Wiki and docs upkeep — this stakeholder is responsible for keeping the wiki current.

## Contributions
See entries in [log.md](../log.md) tagged `attributed_to: [claude-opus]`.

## Known limitations
- Cannot directly interact with the Azure Portal, Supabase Dashboard, or Zeabur UI. Niko handles all dashboard-side changes.
- Reads environment variables only via `.env` files and the running server's response headers. Service-role keys are pasted into local `.env` by Niko when needed for ad-hoc scripts.
- Does not deploy on Niko's behalf. Pushes to `main` and lets Zeabur / Vercel auto-deploy.
