# Update and restart the hosted portal

Use `scripts/deploy-hosted.sh` on the Oracle VM after the desired changes have been committed and pushed to `origin/main`. Run it when no participant session is active. It is designed for the current two-service, isolated-release deployment described in [HOSTED_REHEARSAL_STATUS.md](HOSTED_REHEARSAL_STATUS.md).

## First use

The VM needs the new script before it can run it. Sign in over SSH as the normal Ubuntu user and run:

```sh
git -C ~/Research pull --ff-only origin main
bash ~/Research/research-portal/scripts/deploy-hosted.sh --dry-run
bash ~/Research/research-portal/scripts/deploy-hosted.sh
```

For later deployments, the script itself pulls `origin/main`; only the last two commands are needed. `--dry-run` checks the local paths, active release, Git branch, and Node version without changing the server. The script stops the web and API services during the build, so the site will be briefly unavailable.

The script stages a new release under `/srv/security-trust/releases`, copies the active secret environment file, backs up the local PostgreSQL database and service overrides, runs `npm ci`, the production build and migrations, switches the two systemd services, then checks the local API, web login, and public login. It keeps private study data, evidence, and packages in their existing directories. On a build or startup failure, it restores the previous service settings and tries to restart the earlier release. Database migrations are not automatically reversed.

The built-in backup covers the database, environment file, and service overrides. Keep a separate encrypted backup of `/srv/security-trust/study-data`, `/srv/security-trust/evidence`, and `/srv/security-trust/packages` according to the approved retention plan; the database dump alone cannot restore a complete study record.

If the dry run reports a different source checkout, database name, or Node path, set the relevant `SOURCE_CHECKOUT`, `DB_NAME`, or `NODE_BIN` environment variable for that command. See `--help` for all supported overrides. Do not run this script on the local Mac.

After it reports success, open the hosted participant login and researcher pages. For a release that changes the study flow, run the repeatable checks in [HOSTED_REHEARSAL_STATUS.md](HOSTED_REHEARSAL_STATUS.md) before a participant session. If it fails, inspect the service log command printed by the script and keep the backup directory it reports.
