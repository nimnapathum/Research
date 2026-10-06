import Link from 'next/link';
import type { StudyUser } from '@/lib/types';
import { LogoutButton } from './LogoutButton';

export function Shell({ user, children }: { user: StudyUser; children: React.ReactNode }) {
  const researcher = user.role === 'researcher';
  return <><header className="topbar"><div className="topbar-inner">
    <Link href="/dashboard" className="brand">Security Trust Study<small>Research portal</small></Link>
    <nav className="nav" aria-label="Main navigation">
      <Link href="/dashboard">Overview</Link>
      {researcher ? <>
        <Link href="/researcher/research">Research</Link>
        <Link href="/researcher/participants">Participants</Link>
        <Link href="/researcher/questionnaires">Questionnaires</Link>
        <Link href="/researcher/imports">Imports</Link>
        <Link href="/researcher/analytics">Analytics</Link>
        <Link href="/researcher/responses">Responses</Link>
        <Link href="/researcher/accounts">Researchers</Link>
      </> : <Link href="/participant/upload">Upload events</Link>}
      <Link href="/account">Account</Link><LogoutButton />
    </nav></div></header><main className="page">{children}
    <footer className="footer">Local study operations portal. Controlled proposal exposure and first-decision records remain in the checkpoint app until the protocol is deliberately migrated.</footer>
  </main></>;
}
