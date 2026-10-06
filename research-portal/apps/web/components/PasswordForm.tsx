'use client';
import { FormEvent, useState } from 'react';
export function PasswordForm() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get('newPassword') !== data.get('confirmPassword')) {
      setError('The new passwords do not match.'); setBusy(false); return;
    }
    const response = await fetch('/api/backend/auth/change-password', { method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ currentPassword: data.get('currentPassword'), newPassword: data.get('newPassword') }) });
    const result = await response.json();
    if (response.ok) { form.reset(); setMessage('Password updated. Other signed-in devices were signed out.'); }
    else setError(result.message || 'Could not change password');
    setBusy(false);
  }
  return <form className="card" style={{ maxWidth: 560 }} onSubmit={submit}>
    <div className="form-field"><label htmlFor="currentPassword">Current password</label><input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" /></div>
    <div className="form-field"><label htmlFor="newPassword">New password</label><input id="newPassword" name="newPassword" type="password" minLength={12} required autoComplete="new-password" /></div>
    <div className="form-field"><label htmlFor="confirmPassword">Confirm new password</label><input id="confirmPassword" name="confirmPassword" type="password" minLength={12} required autoComplete="new-password" /></div>
    {error && <div className="alert error">{error}</div>}{message && <div className="alert success">{message}</div>}
    <button className="button" disabled={busy}>{busy ? 'Updating…' : 'Change password'}</button>
  </form>;
}
