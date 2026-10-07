# Deploy the research portal on Oracle Cloud

This guide deploys the current `research-portal` code with PostgreSQL on one Oracle Cloud VM. It is written for a new VM, a domain name such as `study.example.org`, and an Ubuntu 24.04 image. Replace the example domain, IP address, email, and paths with yours. Run the commands in order; commands marked **Mac** run on your computer, and the others run over SSH on the VM.

## 0. Resolve the Ubuntu 20.04 image first

Your current VM uses Ubuntu 20.04. For a new deployment, **create a replacement VM using Ubuntu 24.04 LTS before entering participant data**. Ubuntu 20.04 ended standard security maintenance in May 2025, and the PostgreSQL project's package repository removed its Ubuntu 20.04 packages in July 2025. Ubuntu 20.04's default PostgreSQL 12 also predates the built-in `gen_random_uuid()` used by this portal's schema. Recreating an empty VM is simpler than two sequential operating-system upgrades (20.04 → 22.04 → 24.04). Keep the same SSH key if convenient and assign a public IP to the new VM. Delete the unused old VM only after the new site works.

Sources: [Ubuntu 20.04 support](https://ubuntu.com/20-04), [PostgreSQL repository support](https://www.postgresql.org/download/linux/ubuntu/), [PostgreSQL 13's built-in UUID change](https://www.postgresql.org/docs/release/13.0/), [Ubuntu release-upgrade path](https://ubuntu.com/server/docs/upgrade-introduction/).

If you cannot replace the 20.04 VM, pause before collecting real data. The workable alternatives are a supported OS upgrade, or Ubuntu Pro Extended Security Maintenance plus a supported external PostgreSQL 13+ service. The standard Ubuntu 20.04 PostgreSQL package alone is unsuitable for this schema.

## 1. Prepare Oracle networking and a domain

1. In Oracle Cloud, put the VM in a **public subnet** with a public IP, an internet gateway, and a route to it. Note the public IP and the private SSH key path.
2. In the subnet security list or the VM's network security group, allow inbound TCP **22 from your own public IP**, and TCP **80 and 443 from the internet**. Keep 3000, 4000, and 5432 closed to the internet. Retain outbound access for package downloads and certificate renewal.
3. Create a DNS **A** record, for example `study.example.org → VM_PUBLIC_IP`. Wait until `dig +short study.example.org` returns the VM IP. A domain is needed for the HTTPS certificate and participant sign-in.
4. Connect as Ubuntu's default user:

   ```bash
   ssh -i /path/to/oracle-private-key ubuntu@VM_PUBLIC_IP
   ```

Oracle references: [connecting to a Linux instance](https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/connect-to-linux-instance.htm), [network security groups](https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/networksecuritygroups.htm), [public IP requirements](https://docs.oracle.com/en-us/iaas/Content/Network/Tasks/managingpublicIPs.htm).

## 2. Install the VM packages

Check that the replacement image says `24.04` before continuing:

```bash
cat /etc/os-release
uname -m
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl xz-utils git rsync nginx postgresql postgresql-client openssl
sudo systemctl enable --now postgresql nginx
```

If Ubuntu's firewall is active, allow SSH **before** allowing web traffic:

```bash
sudo ufw status
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

Do not enable UFW just for this guide if it is currently inactive; Oracle's network rules already apply. PostgreSQL stays on loopback. See [Ubuntu's PostgreSQL installation guide](https://ubuntu.com/server/docs/how-to/databases/install-postgresql/).

Install the Node.js version in this repository's `.node-version` file. Select the binary matching `uname -m`:

```bash
NODE_VERSION=24.21.0
case "$(uname -m)" in
  x86_64) NODE_ARCH=x64 ;;
  aarch64) NODE_ARCH=arm64 ;;
  *) echo "Unsupported CPU architecture"; exit 1 ;;
esac
curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz"
curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt"
grep " node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz$" SHASUMS256.txt | sha256sum -c -
sudo tar -xJf "node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz" -C /opt
sudo ln -sfn "/opt/node-v${NODE_VERSION}-linux-${NODE_ARCH}/bin/node" /usr/local/bin/node
sudo ln -sfn "/opt/node-v${NODE_VERSION}-linux-${NODE_ARCH}/bin/npm" /usr/local/bin/npm
node --version
npm --version
```

Check that the checksum says `OK`. Node's [official download archive](https://nodejs.org/download/release/latest-v24.x/) lists both CPU variants and checksums.

## 3. Copy the project without local secrets

Create an account used only to run this portal:

```bash
sudo useradd --system --user-group --home-dir /srv/security-trust --shell /usr/sbin/nologin studyapp
sudo install -d -o studyapp -g studyapp -m 750 /srv/security-trust
```

Use one of these two ways to put the **whole Research repository** on the VM. The whole repository is needed because the Research page reads its Markdown files.

**If the latest work is committed and the GitHub repository is accessible from the VM:**

```bash
git clone https://github.com/nimnapathum/Research.git "$HOME/Research"
sudo rsync -a --exclude='.git/' --exclude='node_modules/' --exclude='.env' --exclude='.local-admin-credentials' "$HOME/Research/" /srv/security-trust/Research/
sudo chown -R studyapp:studyapp /srv/security-trust/Research
```

If GitHub asks for authentication, use a properly scoped GitHub credential or the next method. Do not copy a local `.env`, local administrator password file, `node_modules`, or build directories.

**If the latest work is only on your Mac**, run this on the **Mac** from the Research folder, then run the last two commands on the VM:

```bash
cd /Users/nimnapathum/Documents/ChatGPT/Research
rsync -av --exclude='.git/' --exclude='node_modules/' --exclude='.next/' --exclude='dist/' --exclude='.env' --exclude='.local-admin-credentials' --exclude='*.log' --exclude='*.dump' --exclude='tmp/' --exclude='output/' -e 'ssh -i /path/to/oracle-private-key' ./ ubuntu@VM_PUBLIC_IP:~/Research/
```

```bash
sudo rsync -a "$HOME/Research/" /srv/security-trust/Research/
sudo chown -R studyapp:studyapp /srv/security-trust/Research
```

Review any other local-only files before the Mac transfer. Do not copy recordings, transcripts, database dumps, or participant exports as part of the application deployment.

## 4. Create PostgreSQL database and server secrets

Use the Ubuntu 24.04 PostgreSQL package. Create a login role with a strong password made of hex characters, then create an empty database owned by that role:

```bash
openssl rand -hex 24
sudo -u postgres psql
```

Inside `psql`, enter these lines. `\password` prompts privately for the password generated above:

```sql
CREATE ROLE study_portal LOGIN;
\password study_portal
CREATE DATABASE security_trust_portal OWNER study_portal;
\q
```

Create the VM's environment file:

```bash
sudo install -o studyapp -g studyapp -m 600 /dev/null /srv/security-trust/Research/research-portal/.env
sudo nano /srv/security-trust/Research/research-portal/.env
```

Put in these values, replacing the password and domain. **Do not include quote marks or spaces around `=`.** The hex password needs no URL escaping.

```dotenv
DATABASE_URL=postgresql://study_portal:YOUR_HEX_PASSWORD@127.0.0.1:5432/security_trust_portal
API_HOST=127.0.0.1
API_PORT=4000
API_INTERNAL_URL=http://127.0.0.1:4000
NEXT_PUBLIC_PORTAL_URL=https://study.example.org
COOKIE_SECURE=true
SESSION_DAYS=7
RESEARCH_DOCS_ROOT=/srv/security-trust/Research
```

Check permissions without printing the password:

```bash
sudo chown studyapp:studyapp /srv/security-trust/Research/research-portal/.env
sudo chmod 600 /srv/security-trust/Research/research-portal/.env
sudo stat -c '%a %U %G %n' /srv/security-trust/Research/research-portal/.env
```

For a separately hosted PostgreSQL service, use its private endpoint and provider-required TLS settings in `DATABASE_URL` instead. Keep database access limited to the VM. Do not open port 5432 to the internet.

## 5. Install, build, migrate, and create the first researcher

```bash
sudo -u studyapp env PATH=/usr/local/bin:/usr/bin:/bin bash -c 'cd /srv/security-trust/Research/research-portal && npm ci && npm run build && npm run db:migrate && npm run db:seed && npm run admin:create -- firstuser@gmail.com'
```

The last command is for an **empty, new database only**. It creates the first researcher account and a password file readable only on the VM. Read it privately and sign in later at the HTTPS address:

```bash
sudo cat /srv/security-trust/Research/research-portal/.local-admin-credentials
```

Change that password on the portal's Account page. Do not paste it into chat or copy it into the repository. If you restore an existing database, skip `db:seed` and `admin:create`; the existing accounts and forms are already there. Run `db:migrate` after restoring.

### Optional: move an existing local database

For a clean pilot, the new empty database above is usually easier. If you need your **existing** accounts, forms, or portal data, stop after `npm ci && npm run build` in the command above and use this path **instead of creating the admin account**. Check that the local database does not contain unwanted test or participant data before copying it.

On the **Mac**, use your local PostgreSQL username; `pg_dump` will prompt for its password when required:

```bash
pg_dump -h 127.0.0.1 -U YOUR_LOCAL_DB_USER -Fc -f portal.dump security_trust_portal
scp -i /path/to/oracle-private-key portal.dump ubuntu@VM_PUBLIC_IP:~/portal.dump
```

On the **VM**, restore into the empty `security_trust_portal` database from step 4, then apply any newer migrations:

```bash
sudo install -o postgres -g postgres -m 600 "$HOME/portal.dump" /var/lib/postgresql/portal.dump
sudo -u postgres pg_restore --exit-on-error --no-owner --no-acl --role=study_portal -d security_trust_portal /var/lib/postgresql/portal.dump
sudo -u studyapp env PATH=/usr/local/bin:/usr/bin:/bin bash -c 'cd /srv/security-trust/Research/research-portal && npm run db:migrate'
```

Use the existing researcher password after a restore. Store or remove the temporary dump files according to your approved retention policy.

## 6. Keep the API and web app running with systemd

Create `/etc/systemd/system/security-trust-api.service` with `sudo nano`:

```ini
[Unit]
Description=Security Trust portal API
After=network-online.target postgresql.service
Wants=network-online.target

[Service]
Type=simple
User=studyapp
Group=studyapp
WorkingDirectory=/srv/security-trust/Research/research-portal/apps/api
Environment=NODE_ENV=production
EnvironmentFile=/srv/security-trust/Research/research-portal/.env
ExecStart=/usr/local/bin/node --env-file=../../.env dist/main.js
Restart=on-failure
RestartSec=3
UMask=0077
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/security-trust-web.service`:

```ini
[Unit]
Description=Security Trust portal web
After=network-online.target security-trust-api.service
Wants=network-online.target
Requires=security-trust-api.service

[Service]
Type=simple
User=studyapp
Group=studyapp
WorkingDirectory=/srv/security-trust/Research/research-portal/apps/web
Environment=NODE_ENV=production
EnvironmentFile=/srv/security-trust/Research/research-portal/.env
ExecStart=/usr/local/bin/node ../../node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000
Restart=on-failure
RestartSec=3
UMask=0077
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

Start both and check their **local-only** endpoints:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now security-trust-api.service security-trust-web.service
sudo systemctl --no-pager --full status security-trust-api.service security-trust-web.service
curl -fsS http://127.0.0.1:4000/health
curl -I http://127.0.0.1:3000/login
```

The first `curl` must report `"ok":true`. Next.js [recommends a reverse proxy for self-hosted deployments](https://nextjs.org/docs/app/guides/self-hosting), configured next.

## 7. Put Nginx and HTTPS in front

Create `/etc/nginx/sites-available/security-trust`:

```nginx
limit_req_zone $binary_remote_addr zone=study_login:10m rate=10r/m;

server {
    listen 80;
    server_name study.example.org;
    client_max_body_size 8m;

    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    location = /api/auth/login {
        limit_req zone=study_login burst=10 nodelay;
        proxy_pass http://127.0.0.1:3000;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

The `Host` and `X-Forwarded-Proto` headers matter because the portal checks request origins. Nginx's [proxy header documentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html) describes these settings. Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/security-trust /etc/nginx/sites-enabled/security-trust
sudo nginx -t
sudo systemctl reload nginx
curl -I http://study.example.org/login
```

Only after DNS and port 80 work, install a certificate with Certbot:

```bash
sudo apt install -y snapd
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sfn /snap/bin/certbot /usr/local/bin/certbot
sudo certbot --nginx -d study.example.org --redirect
sudo certbot renew --dry-run
curl -I https://study.example.org/login
```

Follow Certbot's prompt for a certificate contact email. The certificate and renewal procedure are documented by [Certbot for Nginx](https://certbot.eff.org/instructions?ws=nginx&os=snap). The portal sets `COOKIE_SECURE=true`, so use its HTTPS URL for sign-in.

## 8. Check the actual portal before inviting participants

1. Sign in at `https://study.example.org/login` as `firstuser@gmail.com` with the temporary password; change it under **Account**.
2. Open **Research** and confirm the Markdown library loads. If it is empty, check `RESEARCH_DOCS_ROOT` and the copied repository tree.
3. Create a disposable researcher and participant account. Sign in as each in a private browser window; verify the participant sees only their own portal. Remove or deactivate pilot accounts according to your study procedure.
4. Check a pre-task questionnaire, an after-task questionnaire, and a small IDE event upload using nonparticipant sample data. Check the upload appears in researcher views.
5. Reboot the VM once; confirm HTTPS, sign-in, and both services return. Run `sudo systemctl status security-trust-api security-trust-web nginx postgresql`.
6. Complete the research protocol's separate checkpoint, IDE capture, consent, screen recording, interview, and security-adjudication rehearsals before real data collection. The portal's analytics are descriptive study monitoring, not the final security analysis.

Do not upload real participant recordings to this portal; its current upload path handles IDE events and study data, not video/audio files.

## 9. Back up and update

Back up PostgreSQL with a restricted file, then move the backup to encrypted storage covered by your ethics-approved retention plan. For example:

```bash
sudo install -d -o postgres -g postgres -m 700 /var/backups/security-trust
sudo -u postgres pg_dump -Fc security_trust_portal -f /var/backups/security-trust/portal-$(date +%F).dump
sudo ls -lh /var/backups/security-trust/
```

Test restoration into a separate database before relying on the backup. PostgreSQL documents [custom-format `pg_dump`](https://www.postgresql.org/docs/current/app-pgdump.html) and [`pg_restore`](https://www.postgresql.org/docs/current/app-pgrestore.html). Also back up the server `.env` securely; the dump alone does not contain that connection password. Decide the backup frequency and retention from your approved research data policy.

For a code update, first back up the database. Then update `~/Research` from GitHub or repeat the Mac `rsync`, and run:

```bash
sudo systemctl stop security-trust-web security-trust-api
sudo rsync -a --exclude='.git/' --exclude='node_modules/' --exclude='.env' --exclude='.local-admin-credentials' "$HOME/Research/" /srv/security-trust/Research/
sudo chown -R studyapp:studyapp /srv/security-trust/Research
sudo -u studyapp env PATH=/usr/local/bin:/usr/bin:/bin bash -c 'cd /srv/security-trust/Research/research-portal && npm ci && npm run build && npm run db:migrate'
sudo systemctl start security-trust-api security-trust-web
curl -fsS http://127.0.0.1:4000/health
```

Never rerun `admin:create` on an established database. Review form-version changes before running `db:seed` again.

## 10. Troubleshooting

| Symptom | Check |
| --- | --- |
| SSH times out | VM public IP, Oracle ingress for port 22, your current IP, and private-key permissions. |
| Domain or certificate fails | DNS A record, Oracle ports 80/443, Nginx status, and any active UFW rules. |
| Nginx returns 502 | `sudo journalctl -u security-trust-web -u security-trust-api -n 100 --no-pager` and the local `curl` commands. |
| API health fails | PostgreSQL status, database password in `.env`, and `journalctl` for the API. |
| Login loops on HTTPS | Confirm `COOKIE_SECURE=true`, valid certificate, and HTTPS URL. |
| Form actions return 403 | Confirm Nginx forwards the original `Host` and `X-Forwarded-Proto`; use one canonical HTTPS domain. |
| Research page is empty | Check `RESEARCH_DOCS_ROOT=/srv/security-trust/Research` and file permissions. |
| Upload returns 413 | Keep Nginx `client_max_body_size 8m` above the API's 6 MB JSON limit; use smaller event batches when needed. |
| Build process is killed | Check VM free memory (`free -h`); use a VM with more memory for the build. |

For service logs, use `sudo journalctl -u security-trust-api -u security-trust-web -f`. Avoid sharing logs publicly because participant identifiers or import errors may appear in them.
