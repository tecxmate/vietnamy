# What this repo is for

This repository contains two things that are easy to confuse:

1. **A React web app** — 68 pages, ~37,600 lines, at `src/`.
2. **An Express server** — `server/server.js`, ~3,000 lines, deployed by
   Zeabur to `vietnamy.tecxmate.com`.

Only the second one is on the critical path for the mobile app.

## The decision

**The Flutter app in `Vietnamy_APP` is the product.** The React app is not
a second implementation of it and should stop being maintained as one.

Before this was written down, the same product was being built twice —
68 React pages and 43 Flutter screens, both implementing lessons, a
dictionary, grammar, practice and gamification. Every feature cost two
builds, and the two drifted. That is the single largest source of effort
in this codebase, and it buys nothing a user can tell apart.

What this means in practice:

- **Do not** port new app features into `src/`.
- **Do** keep the web app running. It is not deleted and not broken; it
  works and it can serve as a demo, a marketing surface, or the admin CMS
  it already contains at `/admin/*`.
- Bug fixes to the web app are fine. Feature parity with the app is not a
  goal any more.

## `server/server.js` is not optional

This is the part that surprises people. The Express server here is the
**live backend for the mobile app's dictionary and AI tutor.**

`Vietnamy_APP` points `AppConstants.dictionaryBaseUrl` at
`https://vietnamy.tecxmate.com/api`, and two of its data sources use it:

- `dictionary_remote_data_source.dart`
- `ai_tutor_remote_data_source.dart`

So `POST /api/tutor` at `server/server.js` is the tutor a real user talks
to on their phone. There is a second, fuller tutor in `Vietnamy_Backend`
(`ai-tutor.service.ts`, with session persistence) and the app does not call
it. Changing that one instead of this one deploys cleanly and changes
nothing.

**Deleting or archiving this repo would take the app's dictionary and tutor
down.** Retiring the web UI does not retire the server.

The server also solely owns mail, feedback, in-app messages, notifications
and uploads — none of which exist anywhere else.

## Where it should end up

One backend, and it should be the NestJS one in `Vietnamy_Backend`: it is
the fuller implementation on both overlapping features and already owns
auth, study, library, video and gamification.

The blocker is data. The NestJS dictionary reads `.db` files from
`src/databases/` that are 100 MB+ and not in git, and they are not deployed
there yet. Until they are, this server stays exactly where it is.

`Vietnamy_APP/docs/BACKENDS.md` has the endpoint-by-endpoint map.
