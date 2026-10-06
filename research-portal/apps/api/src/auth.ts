import { BadRequestException, Body, CanActivate, Controller, ExecutionContext, ForbiddenException,
  Get, Injectable, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { DbService } from './db.service';

const derive = (password: string, salt: Buffer) => new Promise<Buffer>((resolve, reject) => {
  scryptCallback(password, salt, 64, { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 },
    (error, key) => error ? reject(error) : resolve(key));
});
export type StudyUser = { id: string; email: string; role: 'researcher' | 'participant'; participant_code: string | null; display_name: string | null };
export type StudyRequest = Request & { studyUser: StudyUser; sessionToken: string };
const dummyHash = `scrypt:17:${'0'.repeat(32)}:${'0'.repeat(128)}`;
const attempts = new Map<string, { count: number; until: number }>();

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12 || password.length > 200) throw new BadRequestException('Password must have 12–200 characters');
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, Buffer.from(salt, 'hex'));
  return `scrypt:17:${salt}:${key.toString('hex')}`;
}
async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, power, saltHex, hashHex] = stored.split(':');
  if (algorithm !== 'scrypt' || power !== '17' || !saltHex || !hashHex) return false;
  const actual = await derive(password, Buffer.from(saltHex, 'hex'));
  const expected = Buffer.from(hashHex, 'hex');
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}
function digest(token: string) { return createHash('sha256').update(token).digest('hex'); }
export function researcherOnly(user: StudyUser) {
  if (user.role !== 'researcher') throw new ForbiddenException('Researcher access required');
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly db: DbService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<StudyRequest>();
    const token = /^Bearer ([A-Za-z0-9_-]{30,})$/.exec(request.headers.authorization || '')?.[1];
    if (!token) throw new UnauthorizedException();
    const result = await this.db.query<StudyUser>(`SELECT u.id,u.email,u.role,u.participant_code,u.display_name
      FROM login_sessions s JOIN users u ON u.id=s.user_id
      WHERE s.token_hash=$1 AND s.expires_at>now() AND s.revoked_at IS NULL AND u.disabled_at IS NULL`, [digest(token)]);
    if (!result.rows[0]) throw new UnauthorizedException();
    request.studyUser = result.rows[0];
    request.sessionToken = token;
    return true;
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly db: DbService) {}
  @Post('login')
  async login(@Body() body: { email?: string; password?: string }) {
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 200) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const attempt = attempts.get(email);
    if (attempt && attempt.count >= 5 && attempt.until > Date.now()) throw new ForbiddenException('Try again later');
    const account = await this.db.query<StudyUser & { password_hash: string }>(`SELECT id,email,role,participant_code,display_name,password_hash
      FROM users WHERE lower(email)=$1 AND disabled_at IS NULL`, [email]);
    const correct = await verifyPassword(password, account.rows[0]?.password_hash || dummyHash);
    if (!account.rows[0] || !correct) {
      attempts.set(email, { count: (attempt?.until && attempt.until > Date.now() ? attempt.count : 0) + 1,
        until: Date.now() + 15 * 60_000 });
      throw new UnauthorizedException('Invalid email or password');
    }
    attempts.delete(email);
    const token = randomBytes(32).toString('base64url');
    const days = Math.max(1, Math.min(30, Number(process.env.SESSION_DAYS || 7)));
    await this.db.query(`INSERT INTO login_sessions(token_hash,user_id,expires_at)
      VALUES($1,$2,now()+($3::int * interval '1 day'))`, [digest(token), account.rows[0].id, days]);
    await this.db.query(`INSERT INTO audit_actions(actor_id,action,target_type,target_id)
      VALUES($1,'login','user',$2)`, [account.rows[0].id, account.rows[0].id]);
    const { password_hash: _hidden, ...user } = account.rows[0];
    return { token, user };
  }
  @UseGuards(SessionGuard) @Get('me')
  me(@Req() request: StudyRequest) { return request.studyUser; }
  @UseGuards(SessionGuard) @Post('logout')
  async logout(@Req() request: StudyRequest) {
    await this.db.query('UPDATE login_sessions SET revoked_at=now() WHERE token_hash=$1', [digest(request.sessionToken)]);
    return { ok: true };
  }
  @UseGuards(SessionGuard) @Post('change-password')
  async changePassword(@Req() request: StudyRequest, @Body() body: { currentPassword?: string; newPassword?: string }) {
    const account = await this.db.query<{ password_hash: string }>('SELECT password_hash FROM users WHERE id=$1', [request.studyUser.id]);
    if (!account.rows[0] || !await verifyPassword(String(body?.currentPassword || ''), account.rows[0].password_hash)) {
      throw new ForbiddenException('Current password is incorrect');
    }
    const hash = await hashPassword(String(body?.newPassword || ''));
    await this.db.transaction(async (client) => {
      await client.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, request.studyUser.id]);
      await client.query('UPDATE login_sessions SET revoked_at=now() WHERE user_id=$1 AND token_hash<>$2',
        [request.studyUser.id, digest(request.sessionToken)]);
      await client.query(`INSERT INTO audit_actions(actor_id,action,target_type,target_id)
        VALUES($1,'change_password','user',$2)`, [request.studyUser.id, request.studyUser.id]);
    });
    return { ok: true };
  }
}
