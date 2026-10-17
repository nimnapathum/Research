# Hosted natural-study rehearsal and pilot gate

Updated 17 October 2026. The hosted portal at **https://nimnapathum.tech** is running the natural-task protocol (`natural-2026-10-13-r3`). Its current deployment is the isolated release `/srv/security-trust/releases/a81b916`; that directory name is historical, so check `git rev-parse HEAD` for the actual commit. The older, locally modified checkout at `/srv/security-trust/Research` was left untouched.

## What is working now

The API and web services are active. Public login returns HTTP 200; private evidence routes return JSON 401 without a session. A disposable hosted test passed researcher-created participant allocation through the private SQLite bridge, participant login, assignment of both conditions/projects, and cleanup. A second disposable test passed both task ZIP downloads, package freezing, both after-task forms, seven evidence receipts for each task, both submissions, the final form, researcher retrieval, and archive/hash audits. A separate run passed a **9 MiB** upload through public Nginx. These tests use synthetic text as a video placeholder; they establish portal behavior, not the quality of actual recordings or agent capture.

The services use private directories `/srv/security-trust/study-data`, `/srv/security-trust/evidence`, and `/srv/security-trust/packages` owned by `studyapp`. A pre-deployment PostgreSQL dump and service/config copies are in `/srv/security-trust/backups/20261017-natural-predeploy` (root-only). Evidence and SQLite state must be included in later backups; the database dump alone is incomplete.

## Your self-rehearsal on the real participant computer

1. Sign in at the hosted site with a researcher username (for example `firstuser`; the login field is a **username**, not an email address). If the password is forgotten, use `npm run admin:reset-password -- firstuser` from the deployed `research-portal` directory as `studyapp`; read the generated mode-0600 credential file over SSH, sign in, and change the password. Do not send the password through chat or add it to Git.
2. In **Researcher → Participants**, create one account clearly labelled `SELF REHEARSAL`. Record its assigned code and temporary password in the approved private researcher log. This account and its data must stay out of pilot analysis. Do not reuse its code for a real participant.
3. On the actual participant computer, sign in as that participant. Complete the neutral pre-task form. Start Task 1, download its `-natural.zip`, and extract it. Open **only the extracted project folder** in Antigravity. Follow `study/START_HERE.md` and the task page. Use the neutral practice first, as described in [NATURAL_PRACTICE.md](../study-system/pilot/NATURAL_PRACTICE.md).
4. Set up the workspace observer, then start its watcher, the code watcher, and screen recording **before the first measured prompt**. Use a fresh agent conversation and a small natural edit. After the first response, inspect a raw observer sample for the actual prompt and reply. Run at least one code check. Record the installed IDE/model/OS/Node versions and any setup help or gaps. Follow [AGENT_OBSERVER_GUIDE.md](../study-system/pilot/AGENT_OBSERVER_GUIDE.md).
5. Freeze final code with `study/capture.mjs snapshot`, rate that exact final hash with `study/rate.mjs` before seeing hidden test results, stop the watchers after the agent is idle, and stop the recording. Upload the seven named files shown on the task page. Submit the after-task form and Task 1. Repeat with a new workspace and conversation for Task 2, then complete the final form and interview rehearsal.
6. As researcher, open **Evidence** and download both task records. Compare hashes, open and play the *real* recording, read the actual conversation and tool actions, inspect initial/changed/final snapshots, and run `python3 study-system/analysis/audit_natural_evidence.py EVIDENCE_TASK_FOLDER`. Log whether agent-origin edits, human checks and final code can actually be reconstructed. The synthetic portal test cannot establish this.

Use [NATURAL_SESSION_RUNBOOK.md](../study-system/pilot/NATURAL_SESSION_RUNBOOK.md) for timing, neutral facilitator wording, data-quality decisions and session closure. Record pass/fail with observed file or timestamp on the actual host. If the tested IDE/OS combination changes, repeat its capture check.

## Gate before inviting pilot participants

The web path is ready for **self-rehearsal**. Real participant pilots require these remaining checks:

- Complete and log the real Antigravity/recording rehearsal above, including a recording-sized transfer and playback, actual prompt/reply coverage, tool activity, and correct task timestamps.
- Run the security adjudication rehearsal on secure and vulnerable SQL-injection and path-traversal reference implementations, then on the self-rehearsal final code. Keep attack fixtures and expected labels outside participant packages. Record reviewer disagreements and tool blind spots.
- Confirm the approved consent and data-retention wording covers this natural workflow, screen/video, raw agent transcript, local snapshots, hosted storage, interview and withdrawal. The researcher has reported ethics approval; check the exact approved materials against the deployed flow.
- Freeze the pilot version of task cards, forms, IDE/model settings and allowed variation. Separate rehearsal records from pilot analysis. Treat observed interaction mode as coded evidence, not as a fact proved by the assigned condition.
- Put the hosted VM on a supported security-update path before collecting identifiable recordings: it is Ubuntu 20.04 and `pro status` reports **not attached** to Ubuntu Pro. [Canonical says 20.04 standard security maintenance ended in May 2025](https://ubuntu.com/20-04). Upgrade/rebuild the VM or attach an eligible Ubuntu Pro subscription, then repeat the hosted smoke checks.
- Establish and test an encrypted backup and restore procedure covering PostgreSQL, `study-data`, `evidence`, `packages`, and the secret environment file under the approved retention rules. A local one-time dump is not a recovery plan.

Do not treat the portal **Analytics** page as the final research analysis. Natural-task outcomes require blinded final-code adjudication and the analysis tables in [study-system/analysis/README.md](../study-system/analysis/README.md). If a recording or upload needs replacement, keep the original and log the correction; the portal has no fully audited replacement/waiver flow yet.

## Repeatable hosted checks and rollback

Run when no participant is active. The scripts use disposable accounts and remove their evidence; the assignment check briefly reserves and cancels the newest SQLite allocation, so do not create another account concurrently.

```sh
cd /srv/security-trust/releases/a81b916/research-portal
PORTAL_BASE_URL=https://nimnapathum.tech node --env-file=.env scripts/smoke-assignment.mjs
PORTAL_BASE_URL=https://nimnapathum.tech node --env-file=.env scripts/smoke-natural.mjs
PORTAL_BASE_URL=https://nimnapathum.tech SMOKE_LARGE_UPLOAD=1 node --env-file=.env scripts/smoke-natural.mjs
```

Run those as `studyapp` on the VM. If deployment fails, the previous checkout and the pre-deployment config copies remain available. Repoint the two systemd release overrides to the previous checkout and restore its environment and Nginx config, then `daemon-reload`, `nginx -t`, and restart/reload services. Do **not** restore the pre-deployment database dump over newer participant data. Reconcile files and schema first.
