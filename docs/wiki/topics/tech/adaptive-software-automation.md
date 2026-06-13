---
title: Adaptive Software Automation
type: topic
slug: adaptive-software-automation
date: 2026-05-13
updated: 2026-06-14
attributed_to: [tecxmate]
belongs_to: [tecxmate]
source: chat
status: active
tags: [automation, github-actions, cron-jobs, ai-agents]
related: [2026-05-13-adaptive-software-automation-vision, feedback-agent-pipeline]
---

## Summary
Tecxmate's long-term template goal is an adaptive web app system that collects user feedback and telemetry, turns small issues into repair tasks, lets AI agents propose fixes, and opens pull requests for human review.

## Current state
Vietnamy now implements the first narrow feedback-to-agent loop through the Feedback Agent Pipeline. In-app reports are stored in the ops store, agents can list and claim reports, and prepared fixes stop at `fixed_pending_approval` until Niko approves merge/deploy.

The broader template vision still includes GitHub Actions, cron jobs or scheduled jobs, Google Forms, GA4, logs, and AI coding agents.

## Target loop
1. Collect feedback from in-app reports, Google Forms, GA4 events, logs, and support notes.
2. Normalize the signals into structured issues with source, severity, reproduction context, and evidence.
3. Use scheduled automation to select small, low-risk fixes.
4. Let an AI coding agent create a branch, patch the issue, run checks, and prepare screenshots or preview links.
5. Open a pull request with a concise risk summary.
6. Tecxmate reviews and approves or rejects the PR, including from a phone.

## Feasibility
This is possible if it is treated as assisted repair rather than unsupervised deployment. The practical boundary is: automation may triage, patch, test, and open PRs; Tecxmate remains the merge/deploy reviewer.

Good first candidates:
- Broken links and obvious copy issues.
- Small UI regressions.
- Missing loading, empty, or error states.
- Analytics instrumentation gaps.
- Simple validation bugs.
- Documentation drift.

High-risk areas that should stay human-led:
- Auth, permissions, and security-sensitive code.
- Payments and billing.
- Data migrations and destructive operations.
- Large architecture changes.
- Ambiguous product behavior.

## Success Pattern
The template should bias future projects toward GitHub Actions, cron jobs, and automation-first workflows where routine checks and small fixes can be prepared automatically while preserving human review.

## Open questions
- Which feedback store should be the default: GitHub Issues, a database table, Linear, Notion, or another queue?
- Which mobile PR review surface should be optimized first: GitHub mobile, Vercel preview links, or a custom review dashboard?
- What severity and confidence thresholds should allow an agent to open a PR automatically?

## History
- 2026-06-14: Added the first implemented feedback-to-agent pipeline using `feedback_reports`, admin lifecycle APIs, and `scripts/feedback-agent-pipeline.mjs`.
- 2026-05-13: Tecxmate described the adaptive software goal and asked to document the role of GitHub Actions, cron jobs, and automation.
