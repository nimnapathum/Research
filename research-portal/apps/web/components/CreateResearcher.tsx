'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CreateResearcher() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [createdUsername, setCreatedUsername] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setTemporaryPassword('');
    try {
      const response = await fetch('/api/backend/researcher/accounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not create researcher account');
      setCreatedUsername(data.username); setTemporaryPassword(data.temporary_password);
      setUsername(''); setDisplayName(''); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create researcher account'); }
    finally { setBusy(false); }
  }
  return <form className="card stack" onSubmit={submit}><h2>Add a researcher or supervisor</h2>
    <p className="small">This account receives the same researcher access as yours, including participant data, imports, exports, and account creation.</p>
    <div className="grid two"><label>Username<input required minLength={3} maxLength={40}
      pattern="[A-Za-z][A-Za-z0-9_-]{2,39}" autoCapitalize="none" spellCheck={false}
      value={username} onChange={(event) => setUsername(event.target.value)} /></label>
      <label>Name (optional)<input maxLength={120} value={displayName}
        onChange={(event) => setDisplayName(event.target.value)} /></label></div>
    <button className="button" disabled={busy}>{busy ? 'Creating…' : 'Create researcher account'}</button>
    {error && <p className="alert error" role="alert">{error}</p>}
    {temporaryPassword && <div className="notice" role="status"><strong>{createdUsername}</strong>
      <p>Temporary password (shown once): <span className="code">{temporaryPassword}</span></p>
      <p>Give it to the account holder privately. They can change it on the Account page.</p></div>}
  </form>;
}
