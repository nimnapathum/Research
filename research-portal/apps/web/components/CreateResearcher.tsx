'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CreateResearcher() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [createdEmail, setCreatedEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setTemporaryPassword('');
    try {
      const response = await fetch('/api/backend/researcher/accounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not create researcher account');
      setCreatedEmail(data.email); setTemporaryPassword(data.temporary_password);
      setEmail(''); setDisplayName(''); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create researcher account'); }
    finally { setBusy(false); }
  }
  return <form className="card stack" onSubmit={submit}><h2>Add a researcher or supervisor</h2>
    <p className="small">This account receives the same researcher access as yours, including participant data, imports, exports, and account creation.</p>
    <div className="grid two"><label>Email<input type="email" required maxLength={254} value={email}
      onChange={(event) => setEmail(event.target.value)} /></label>
      <label>Name (optional)<input maxLength={120} value={displayName}
        onChange={(event) => setDisplayName(event.target.value)} /></label></div>
    <button className="button" disabled={busy}>{busy ? 'Creating…' : 'Create researcher account'}</button>
    {error && <p className="alert error" role="alert">{error}</p>}
    {temporaryPassword && <div className="notice" role="status"><strong>{createdEmail}</strong>
      <p>Temporary password (shown once): <span className="code">{temporaryPassword}</span></p>
      <p>Give it to the account holder privately. They can change it on the Account page.</p></div>}
  </form>;
}
