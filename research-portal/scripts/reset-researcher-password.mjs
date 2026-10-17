import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { open, unlink } from 'node:fs/promises';
import { promisify } from 'node:util';
import pg from 'pg';

const username = String(process.argv[2] || '').trim().toLowerCase();
if (!/^[a-z][a-z0-9_-]{2,39}$/.test(username)) {
  throw new Error('Usage: npm run admin:reset-password -- researcher-username');
}
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
let credentialPath;
let committed = false;
try {
  const account = await pool.query(
    `SELECT id FROM users WHERE username=$1 AND role='researcher' AND disabled_at IS NULL`,
    [username],
  );
  if (account.rowCount !== 1) throw new Error(`No active researcher account named ${username}`);

  const password = randomBytes(18).toString('base64url');
  const salt = randomBytes(16).toString('hex');
  const key = await promisify(scryptCallback)(password, Buffer.from(salt, 'hex'), 64,
    { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  const hash = `scrypt:17:${salt}:${key.toString('hex')}`;
  credentialPath = `.researcher-recovery-${username}-${Date.now()}.txt`;
  const file = await open(credentialPath, 'wx', 0o600);
  try {
    await file.writeFile(`Researcher username: ${username}\nTemporary password: ${password}\nChange it after sign-in.\n`);
  } finally {
    await file.close();
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await client.query(
      `UPDATE users SET password_hash=$1
       WHERE id=$2 AND role='researcher' AND disabled_at IS NULL RETURNING id`,
      [hash, account.rows[0].id],
    );
    if (updated.rowCount !== 1) throw new Error('Researcher account changed during recovery');
    await client.query('UPDATE login_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL',
      [account.rows[0].id]);
    await client.query(
      `INSERT INTO audit_actions(action,target_type,target_id,details)
       VALUES('researcher_password_recovery','user',$1,$2::jsonb)`,
      [account.rows[0].id, JSON.stringify({ username })],
    );
    await client.query('COMMIT');
    committed = true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  console.log(`Password reset for ${username}. Read ${credentialPath} locally (mode 0600), then change the password after sign-in.`);
} catch (error) {
  if (credentialPath && !committed) await unlink(credentialPath).catch(() => {});
  throw error;
} finally {
  await pool.end();
}
