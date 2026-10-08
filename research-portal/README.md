# Security Trust Study research portal

A localhost support app for the two-task coding-agent study. It uses Next.js 16 (participant/researcher pages), NestJS 12 (API), and PostgreSQL (accounts and study data). The first researcher login is `firstuser@gmail.com`; its randomly generated temporary password is in the ignored, mode-0600 file [`.local-admin-credentials`](.local-admin-credentials). Change it on the Account page.

For a hosted deployment, follow [the Oracle Cloud deployment guide](DEPLOY_ORACLE_CLOUD.md). It covers the supported Ubuntu image, PostgreSQL, systemd, Nginx, HTTPS, verification, and backups.

## What is working

- Email/password sign-in, session cookie, password change, researcher-created participant accounts.
- One acceleration and one exploration assignment per participant, with project A/B and checkpoint orders matching `study-system`.
- After the pre-task form, the participant opens Task 1 from the dashboard or is taken there automatically. With the local checkpoint bridge enabled, the task page offers the recorded-task ZIP containing `study/setup.mjs`, `study/client.mjs`, the Antigravity hook, optional cross-platform pointer recorder and private capture configuration. It shows the checkpoint link and live client/hook/pointer status. Task 2 opens after Task 1's recorded final code and after-task form are complete.
- Published pre-task, after-task, and after-both forms copied from `study-system/instruments/forms.json`; one response per stage/task; researcher form drafts, versioning, and publishing. A replay-interview note form is seeded as a draft.
- Participant IDE event JSON/JSONL upload; researcher IDE event, adjudicated `summary.json`, and `opportunities.csv` imports. Files are hashed, raw text is retained in PostgreSQL, and event IDs are deduplicated.
- Researcher dashboard, participant/form/import lists, responses, descriptive coverage and condition/class charts, and JSON export.
- Researcher-only **Research** library showing Markdown files from the research workspace, task materials, pilot guides, instruments, and study-system notes. Search by title or path and follow links between Markdown documents. The sidebar index is cached for 30 seconds. Switching documents fetches only the selected file and keeps up to eight recently viewed files in the browser; it does not render the whole page again.
- **Researchers** page for creating another researcher or supervisor login. The generated temporary password is shown once. New researcher accounts have the same access as the existing researcher account.

**The controlled checkpoint app in `../study-system/app` remains authoritative for exact proposal exposure, first keep/reject, confidence on the frozen code, and final artifact hashes.** The login portal now serves its participant-only instrumented package when the local bridge is enabled, using the exact portal assignment and a mirrored pre-task response. The older starter ZIP remains an inspection-only option. `study/setup.mjs` configures the Antigravity workspace hook; participants do not install a separate study extension in the standalone app. The `study-system/capture/extension/` files are unvalidated VS Code companion-extension source. Screen recordings, official agent transcripts, interviews, independent security reviews, and qualitative mode/check coding still follow the existing study protocol.

## Run locally

Use Node.js 24.21 or newer in the Node 24 line, npm, and PostgreSQL. On this machine, use `/opt/homebrew/opt/node@24/bin` first in `PATH`; the default Node 25 install currently has a broken Homebrew library link.

1. `cd research-portal`
2. `cp .env.example .env`; set `DATABASE_URL` to your PostgreSQL database. This checkout's ignored `.env` already points at the local `security_trust_portal` database.
3. `npm install`
4. Create the database if needed: `createdb -h 127.0.0.1 security_trust_portal`.
5. `npm run db:migrate`
6. `npm run db:seed`
7. Create the first researcher only if it does not already exist: `npm run admin:create -- firstuser@gmail.com`. This writes the temporary password to `.local-admin-credentials`; do not commit or send that file.
8. On this Mac, run `bash scripts/restart-local.sh`. It restarts the checkpoint app on port 4175, API on 4000 and web app on 3000, with the local bridge enabled. Open [http://127.0.0.1:3000](http://127.0.0.1:3000). It does not start PostgreSQL.

For manual startup, run the checkpoint app with Node 24 and the same `STUDY_DATA_DIR` used by the portal bridge; set `CHECKPOINT_BRIDGE_ENABLED=1`, `STUDY_MATERIALS_ROOT` to `study-system`, and `STUDY_PUBLIC_URL` to the participant-reachable checkpoint origin for both portal services. Then run `npm run dev:api` and `npm run dev:web`. A remote participant requires HTTPS for the checkpoint origin. The optional `compose.yaml` starts PostgreSQL 16 on local port 5433 when Docker is available; set `POSTGRES_PASSWORD` and adjust `DATABASE_URL`.

## Operator workflow

1. With the checkpoint service using the real private `STUDY_DATA_DIR`, first run `node ../study-system/app/cli.mjs create P014` for the next pseudonymous participant. Keep its token and hidden candidate-status mapping private. In the portal's **Participants** page, create the matching email/code and enter the **exact** project, condition and checkpoint orders printed by the CLI. The portal now requires explicit selections; it does not randomize or enforce balance. Temporary passwords appear once; transmit them privately. The bridge rejects a later mismatch with the existing checkpoint session.
2. Have the participant change their password and complete the pre-task form. Task 1 now shows **Download recorded-task ZIP**. The bridge checks the matching checkpoint assignment and mirrors the pre-task answer. The participant extracts that ZIP, opens only its folder in Antigravity, runs `node study/setup.mjs`, then keeps `node study/client.mjs` open. The task page shows "Study client connected" and, after agent activity, "Agent hook observed". An optional approved pointer recorder is described in [the cross-platform guide](../study-system/pilot/CROSS_PLATFORM_CAPTURE.md). The **Open checkpoint study page** button leads to the controlled proposal review.
3. After the checkpoint app confirms final code, the participant returns to the portal, marks the task submitted, and completes its after-task form. The portal requires a real checkpoint final snapshot and mirrors that form to the checkpoint app before Task 2 opens. Repeat for Task 2, then complete the after-both form in the portal. The checkpoint app suppresses duplicate questionnaires for portal-managed sessions. Review the interview draft, then publish an interview form if the protocol calls for participant-entered notes.
4. Run `node ../study-system/app/cli.mjs audit-measurements` with the checkpoint service's `STUDY_DATA_DIR`, or open its password-protected `/admin/audit` if configured. Attach the separately collected video and official agent transcript, and resolve warnings. The checkpoint app receives hook and optional pointer summaries through the client. Import an IDE event export into this portal only if you need its separate portal analytics. Import the adjudicated `opportunities.csv` and `summary.json` from `../study-system/analysis/export.mjs` after independent review.
5. Use **Analytics** to check denominators and missing data. Run the preregistered analysis from `study-system` for research conclusions; portal charts are descriptive monitoring. Native Antigravity, recording, and each participant OS still require rehearsal.
6. Use **Research** to read the Markdown documents in the browser. File contents are read when opened; sidebar titles and timestamps can take up to 30 seconds to refresh after an edit. For a VM, provide the same research directory tree or set `RESEARCH_DOCS_ROOT` to its absolute path.

To add your supervisor, open **Researchers**, enter their email and optional name, and create the account. Send the one-time password privately. Ask them to sign in and change it on **Account**. This is a full researcher account with access to identifiable study data and exports.

## Data and safeguards

The browser sends requests through Next.js route handlers; the Nest API receives session bearer tokens only from the web server. Session tokens are hashed in the database. Passwords use scrypt; participant codes and task IDs are validated; SQL uses parameters. The web cookie is HTTP-only and SameSite Lax. Mutation routes check request Origin. Set `COOKIE_SECURE=true` when the hosted site uses HTTPS. The Nest API should remain on a private loopback or internal network.

The local databases contain email addresses, form answers, imported event payloads, private checkpoint tokens, and raw study evidence. Restrict filesystem/database access and back them up under the approved retention policy. The portal still does not accept video/audio uploads. Its import format accepts the checkpoint app's normalized `raw/events.jsonl` and companion extension fallback JSONL after the selected participant/task is verified. The task page and ZIP read participant-facing materials from `../study-system`; set `STUDY_MATERIALS_ROOT` to that directory when needed. The package builder never includes stimuli, candidate labels or private adjudication files. Keep the checkpoint app and its SQLite data on the server, never in the participant workspace.

Before moving to a VM or live pilot, confirm the approved consent text and data-retention settings, perform an Antigravity extension/hook compatibility rehearsal, verify prompt/transcript and screen capture, and run the study's blinded security adjudication rehearsal. In-memory login throttling is only a localhost safeguard; add a shared rate limiter, HTTPS reverse proxy, managed secrets, backups, and access logs for hosted use.

The bridge checks that portal questionnaire answers match the current checkpoint instrument. Do not revise a published form during a participant session. The checkpoint app retains its candidate-status profile. Following the CLI-first allocation above keeps the portal's manually entered sequence aligned with the checkpoint service's balanced schedule; the bridge cannot repair an unbalanced sequence chosen independently.

## Verification

`npm run typecheck` and `npm run build` pass. `npm run test:participant-materials` checks sheets and starter ZIP contents. `npm run test:checkpoint-bridge` checks the instrumented ZIP, matching assignment and task gating without PostgreSQL. `npm run test:research-docs` checks document access. `node --env-file=.env scripts/smoke.mjs` exercises participant sign-in, form submission, recorded ZIP access, capture status, import and analytics when the local servers and PostgreSQL are running. It removes its temporary portal accounts and import; use a separate `STUDY_DATA_DIR` for smoke tests so checkpoint sessions do not remain in real pilot data.

## Layout

- `apps/web`: Next.js pages and same-origin API proxy.
- `apps/api`: NestJS authentication, study operations, import validation, and analytics endpoints.
- `db/001_init.sql`: PostgreSQL schema.
- `scripts`: migration, instrument seed, administrator bootstrap, smoke test.
- `data/default-forms.json`: local copy of the current study instrument draft; review wording before freezing the protocol.
