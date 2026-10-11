import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { writeFile } from 'node:fs/promises';
import pg from 'pg';

const username = String(process.argv[2] || '').trim().toLowerCase();
if (!/^[a-z][a-z0-9_-]{2,39}$/.test(username)) throw new Error('Usage: npm run admin:create -- researcher-name');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const password = randomBytes(18).toString('base64url');
const salt = randomBytes(16).toString('hex');
const scrypt = promisify(scryptCallback);
const hash = await scrypt(password, Buffer.from(salt, 'hex'), 64,
  { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
const passwordHash = `scrypt:17:${salt}:${hash.toString('hex')}`;
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query('INSERT INTO users(username,password_hash,role) VALUES($1,$2,$3)', [username, passwordHash, 'researcher']);
  await writeFile('.local-admin-credentials', `Researcher username: ${username}\nTemporary password: ${password}\nChange it after first sign-in.\n`, { mode: 0o600, flag: 'wx' });
  console.log(`Researcher account: ${username}\nTemporary password saved to .local-admin-credentials (mode 0600).`);
} finally { await pool.end(); }
