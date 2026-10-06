# Security Trust Study research portal

A localhost support app for the two-task coding-agent study. It uses Next.js 16 (participant/researcher pages), NestJS 12 (API), and PostgreSQL (accounts and study data). The first researcher login is `firstuser@gmail.com`; its randomly generated temporary password is in the ignored, mode-0600 file [`.local-admin-credentials`](.local-admin-credentials). Change it on the Account page.

## What is working

- Email/password sign-in, session cookie, password change, researcher-created participant accounts.
- One acceleration and one exploration assignment per participant, with project A/B and checkpoint orders matching `study-system`.
- Published pre-task, after-task, and after-both forms copied from `study-system/instruments/forms.json`; one response per stage/task; researcher form drafts, versioning, and publishing. A replay-interview note form is seeded as a draft.
- Participant IDE event JSON/JSONL upload; researcher IDE event, adjudicated `summary.json`, and `opportunities.csv` imports. Files are hashed, raw text is retained in PostgreSQL, and event IDs are deduplicated.
- Researcher dashboard, participant/form/import lists, responses, descriptive coverage and condition/class charts, and JSON export.

**The controlled checkpoint app in `../study-system/app` remains authoritative for exact proposal exposure, first keep/reject, confidence on the frozen code, and final artifact hashes.** This portal does not replace that flow or infer cognitive mode from event counts. Screen recordings, official agent transcripts, interviews, independent security reviews, and qualitative mode/check coding still follow the existing study protocol.

## Run locally

Use Node.js 24.21 or newer in the Node 24 line, npm, and PostgreSQL. On this machine, use `/opt/homebrew/opt/node@24/bin` first in `PATH`; the default Node 25 install currently has a broken Homebrew library link.

1. `cd research-portal`
2. `cp .env.example .env`; set `DATABASE_URL` to your PostgreSQL database. This checkout's ignored `.env` already points at the local `security_trust_portal` database.
3. `npm install`
4. Create the database if needed: `createdb -h 127.0.0.1 security_trust_portal`.
5. `npm run db:migrate`
6. `npm run db:seed`
7. Create the first researcher only if it does not already exist: `npm run admin:create -- firstuser@gmail.com`. This writes the temporary password to `.local-admin-credentials`; do not commit or send that file.
8. In separate terminals run `npm run dev:api` and `npm run dev:web`. Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

The API binds `127.0.0.1:4000`; the web app binds `127.0.0.1:3000`. For local production-mode verification use `npm run build`, then `npm run start -w @study/api` and `npm run start -w @study/web`. The optional `compose.yaml` starts PostgreSQL 16 on local port 5433 when Docker is available; set `POSTGRES_PASSWORD` and adjust `DATABASE_URL`.

## Operator workflow

1. Create the matching participant and two task IDs in the checkpoint app. In the portal's **Participants** page, enter that person's email/code and the same project, condition, and checkpoint orders. Temporary participant passwords appear once; transmit them privately.
2. Have the participant change their password, fill in the published pre-task form, and follow the checkpoint app instructions for each coding task. Use portal task statuses only as operational progress markers.
3. Collect the after-task form for each task and the after-both form. Review the interview draft, then publish an interview form if the protocol calls for participant-entered notes.
4. Upload each IDE event export with the correct participant. Import the adjudicated `opportunities.csv` and `summary.json` from `../study-system/analysis/export.mjs` after independent review.
5. Use **Analytics** to check denominators and missing data. Run the preregistered analysis from `study-system` for research conclusions; portal charts are descriptive monitoring.

## Data and safeguards

The browser sends requests through Next.js route handlers; the Nest API receives session bearer tokens only from the web server. Session tokens are hashed in the database. Passwords use scrypt; participant codes and task IDs are validated; SQL uses parameters. The web cookie is HTTP-only and SameSite Lax. Mutation routes check request Origin. Set `COOKIE_SECURE=true` when the hosted site uses HTTPS. The Nest API should remain on a private loopback or internal network.

The local database contains email addresses, form answers, imported event payloads, and raw analysis files. Restrict filesystem/database access and back up the database under the approved retention policy. The portal does not yet accept video/audio uploads or synchronize live checkpoint state. Its import format accepts the checkpoint app's normalized `raw/events.jsonl` and companion extension fallback JSONL after the selected participant/task is verified.

Before moving to a VM or live pilot, confirm the approved consent text and data-retention settings, perform an Antigravity extension/hook compatibility rehearsal, verify prompt/transcript and screen capture, and run the study's blinded security adjudication rehearsal. In-memory login throttling is only a localhost safeguard; add a shared rate limiter, HTTPS reverse proxy, managed secrets, backups, and access logs for hosted use.

## Verification

`npm run typecheck` and `npm run build` pass. `node --env-file=.env scripts/smoke.mjs` exercises both sign-ins, participant assignment, dashboard rendering, a pre-task response, IDE event import, and analytics; it removes its temporary participant and import. This script needs the local API, web app, database, and `.local-admin-credentials`.

## Layout

- `apps/web`: Next.js pages and same-origin API proxy.
- `apps/api`: NestJS authentication, study operations, import validation, and analytics endpoints.
- `db/001_init.sql`: PostgreSQL schema.
- `scripts`: migration, instrument seed, administrator bootstrap, smoke test.
- `data/default-forms.json`: local copy of the current study instrument draft; review wording before freezing the protocol.
