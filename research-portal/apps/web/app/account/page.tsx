import { serverApi } from '@/lib/server-api';
import type { StudyUser } from '@/lib/types';
import { Shell } from '@/components/Shell';
import { PasswordForm } from '@/components/PasswordForm';

export default async function AccountPage() {
  const user = await serverApi<StudyUser>('auth/me');
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Account</p><h1>Sign-in settings</h1>
    <p>{user.email} · {user.role}{user.participant_code ? ` · ${user.participant_code}` : ''}</p></div></div>
    <PasswordForm />
  </Shell>;
}
