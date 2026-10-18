# Update the hosted portal for natural-task rehearsals

> The 17 October 2026 hosted release is already deployed and tested. See [HOSTED_REHEARSAL_STATUS.md](HOSTED_REHEARSAL_STATUS.md) for the current state and self-rehearsal/pilot gate. The steps below describe how to perform a future deployment; the current release uses a separate checkout instead of overwriting `/srv/security-trust/Research`.

This is the update path for the existing `nimnapathum.tech` portal. It prepares the two-service Next.js/NestJS site to serve natural-task ZIPs and receive six evidence files per task. Participant code/agent observers still run on the participant computer; the web app receives their outputs. The researcher stores consented Google Meet video in approved Drive storage and links it in the portal. The old checkpoint HTTP page is not part of the natural task, but the server-side assignment bridge still needs its private SQLite data directory.

**Do this during a maintenance window.** Copying code and rebuilding Next.js can affect a running site even before the manual restart. Back up PostgreSQL, the current `.env`, and any existing evidence/SQLite data first. Never copy these private files into Git. Check `df -h` and `free -h` before enabling uploads. Ubuntu 20.04 should be upgraded or replaced with a supported image before real participant collection; see [the original deployment guide](DEPLOY_ORACLE_CLOUD.md).

## 1. Put the pushed code on the VM

SSH to the VM and identify the checkout used by the systemd services. The paths below follow the original deployment guide. If `/srv/security-trust/Research` is a Git checkout, pull there with `git pull --ff-only origin main`. If it is a copy, pull in your source checkout and copy it into place without deleting runtime files:

```bash
git -C "$HOME/Research" pull --ff-only origin main
sudo rsync -a --exclude='.git/' --exclude='node_modules/' --exclude='.next/' \
  --exclude='.env' --exclude='.local-admin-credentials' --exclude='.local-evidence/' \
  --exclude='.local-packages/' --exclude='.local-logs/' --exclude='tmp/' \
  "$HOME/Research/" /srv/security-trust/Research/
sudo chown -R studyapp:studyapp /srv/security-trust/Research
```

Do not use both methods on the same checkout. If either pull reports local changes or a non-fast-forward, stop and inspect them; do not reset the VM checkout. Do not run `db:seed` or `admin:create` against the existing database.

## 2. Prepare private storage and environment

Use paths outside the Git checkout so future code updates cannot overwrite participant files:

```bash
sudo install -d -o studyapp -g studyapp -m 700 /srv/security-trust/study-data
sudo install -d -o studyapp -g studyapp -m 700 /srv/security-trust/evidence
sudo install -d -o studyapp -g studyapp -m 700 /srv/security-trust/packages
```

Set these values in `/srv/security-trust/Research/research-portal/.env`, preserving the existing `DATABASE_URL` and other secrets. Both API and web services load this file; use absolute paths:

```dotenv
STUDY_PROTOCOL=natural
CHECKPOINT_BRIDGE_ENABLED=1
STUDY_MATERIALS_ROOT=/srv/security-trust/Research/study-system
STUDY_DATA_DIR=/srv/security-trust/study-data
STUDY_EVIDENCE_ROOT=/srv/security-trust/evidence
STUDY_PACKAGE_ROOT=/srv/security-trust/packages
STUDY_PUBLIC_URL=https://nimnapathum.tech
NEXT_PUBLIC_PORTAL_URL=https://nimnapathum.tech
COOKIE_SECURE=true
```

If the VM already has assignment data in another `STUDY_DATA_DIR`, keep that existing path rather than starting a new SQLite allocation history. The two portal processes must use the same evidence root. Back up the PostgreSQL database **and** the evidence and assignment directories; `pg_dump` alone does not contain uploaded files.

## 3. Permit streamed evidence uploads and downloads in Nginx

The old Nginx example has `client_max_body_size 8m`; that can block transcript and code ZIP uploads. Add these locations inside the existing HTTPS `server` block for `nimnapathum.tech`, before the general `location /` block. Keep the existing login rate limit and proxy headers. Do not expose ports 3000, 4000, 4175, or PostgreSQL publicly.

```nginx
location ~ ^/api/participant/tasks/[^/]+/evidence$ {
    client_max_body_size 550m;
    proxy_http_version 1.1;
    proxy_request_buffering off;
    proxy_read_timeout 600s;
    proxy_send_timeout 600s;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_pass http://127.0.0.1:3000;
}

location ^~ /api/researcher/evidence/ {
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_read_timeout 600s;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_pass http://127.0.0.1:3000;
}
```

The application still caps each required evidence kind (for example 50 MiB for the agent transcript and 500 MiB for code history). The larger Nginx limit only allows those app-level checks to run. Video is no longer uploaded by participants. Test the Nginx configuration with `sudo nginx -t`, then reload it when you are ready.

## 4. Build, migrate, and restart manually

With Node 24 selected, run from `/srv/security-trust/Research/research-portal` as `studyapp`:

```bash
npm ci
npm run build
npm run db:migrate
```

The current local revision includes `004_study_phase.sql` and `005_natural_assessments.sql`. The first marks existing participant accounts as `legacy` and requires an explicit rehearsal, pilot or main phase on new accounts. The second stores append-only researcher entries of independent feature reviews. Back up the database before applying them; verify phase labels and review entry after restart. This revision has not been deployed by this document.

On a 1 GB VM, a production build may exceed available memory. Check memory and available swap before building; if it fails, build on a larger compatible Linux host and deploy the build artifacts, or increase VM resources. Do not treat a failed build as a deployable release. Once build, environment, storage, and Nginx checks pass, restart `security-trust-api.service` and `security-trust-web.service` using your normal manual procedure. The natural allocation bridge runs as a local CLI from the API; it does not require exposing the old checkpoint HTTP service to participants.

## 5. Verify the hosted release before a participant session

After restart:

```bash
curl -fsS http://127.0.0.1:4000/health
curl -I https://nimnapathum.tech/login
curl -i https://nimnapathum.tech/api/participant/tasks/probe/evidence
curl -i https://nimnapathum.tech/api/researcher/evidence/P00000000/P00000000-T1/final_manifest
```

The API health JSON must report `"protocol":"natural"`. Both evidence URLs should return JSON `401 Not signed in` without a cookie. A Next.js HTML `404` means the current route is not deployed; a JSON `404` from the participant route means `STUDY_PROTOCOL` is not `natural`. Log in with a disposable synthetic participant, complete pre-task questions, download a `-natural.zip`, and test all six uploads. Then sign in as a researcher, open **Evidence**, add a Drive link, check its access, download the six files, compare SHA-256 hashes, and inspect the agent transcript and code archive. Confirm that a participant cannot open the researcher download URL.

In the current local revision, natural **Analytics** shows phase-specific collection, confidence and snapshot review rather than historical controlled-checkpoint summaries. Security charts appear only after the researcher enters two completed independent reviews and a resolved outcome for the uploaded final hash. Natural mode and agent-origin exposure still require separate video/transcript coding and the analysis described in `study-system/analysis/README.md`. A successful web upload proves transfer and hash identity, not complete Antigravity capture or valid research data.
