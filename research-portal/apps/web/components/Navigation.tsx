'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from './LogoutButton';

const researcherLinks = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/researcher/research', label: 'Research' },
  { href: '/researcher/participants', label: 'Participants' },
  { href: '/researcher/questionnaires', label: 'Questionnaires' },
  { href: '/researcher/evidence', label: 'Evidence' },
  { href: '/researcher/imports', label: 'Imports' },
  { href: '/researcher/analytics', label: 'Analytics' },
  { href: '/researcher/responses', label: 'Responses' },
  { href: '/researcher/accounts', label: 'Researchers' },
  { href: '/account', label: 'Account' },
];
const participantLinks = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/participant/upload', label: 'Upload events' },
  { href: '/account', label: 'Account' },
];

export function Navigation({ researcher, natural = false }: { researcher: boolean; natural?: boolean }) {
  const pathname = usePathname();
  const links = researcher ? researcherLinks.filter((link) => natural
    ? link.href !== '/researcher/imports' : link.href !== '/researcher/evidence')
    : participantLinks.filter((link) => !natural || link.href !== '/participant/upload');
  return <nav className="nav" aria-label="Main navigation">
    {links.map(({ href, label }) => {
      const active = pathname === href ||
        (href === '/dashboard' && (pathname.startsWith('/forms/') || pathname.startsWith('/participant/tasks/'))) ||
        (href === '/researcher/evidence' && pathname.startsWith('/researcher/evidence/'));
      return <Link href={href} key={href} className={active ? 'active' : undefined}
        aria-current={active ? 'page' : undefined}>{label}</Link>;
    })}
    <LogoutButton />
  </nav>;
}
