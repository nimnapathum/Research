'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: fields.get('email'), password: fields.get('password') }) });
      const result = await response.json();
      if (!response.ok) throw new Error(Array.isArray(result.error) ? result.error[0] : result.error || 'Sign-in failed');
      router.replace('/dashboard'); router.refresh();
    } catch (failure) { setError((failure as Error).message); setBusy(false); }
  }
  return <div className="login-shell"><div className="card">
    <p className="eyebrow">Research study access</p><h1>Sign in</h1>
    <p>Continue your assigned tasks, questionnaires, and evidence uploads.</p>
    <form onSubmit={submit}>
      <div className="form-field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required /></div>
      <div className="form-field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
      {error && <div className="alert error" role="alert">{error}</div>}
      <button className="button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form><p className="small" style={{ marginTop: 18, marginBottom: 0 }}>Accounts are created by the researcher. Contact the study team if you need access.</p>
  </div></div>;
}
