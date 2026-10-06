import Link from 'next/link';
import type { StudyUser } from '@/lib/types';
import { Navigation } from './Navigation';

export function Shell({ user, children }: { user: StudyUser; children: React.ReactNode }) {
  const researcher = user.role === 'researcher';
  return <><header className="topbar"><div className="topbar-inner">
    <Link href="/dashboard" className="brand">Security Trust Study<small>Research portal</small></Link>
    <Navigation researcher={researcher} /></div></header><main className="page">{children}
    <footer className="footer">Local study operations portal. Controlled proposal exposure and first-decision records remain in the checkpoint app until the protocol is deliberately migrated.</footer>
  </main></>;
}
