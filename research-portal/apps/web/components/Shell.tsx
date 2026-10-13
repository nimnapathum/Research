import Link from 'next/link';
import type { StudyUser } from '@/lib/types';
import { Navigation } from './Navigation';

export function Shell({ user, children }: { user: StudyUser; children: React.ReactNode }) {
  const researcher = user.role === 'researcher';
  return <><header className="topbar"><div className="topbar-inner">
    <Link href="/dashboard" className="brand">Security Trust Study<small>Research portal</small></Link>
    <Navigation researcher={researcher} natural={process.env.STUDY_PROTOCOL === 'natural'} /></div></header><main className="page">{children}
    <footer className="footer">{process.env.STUDY_PROTOCOL === 'natural'
      ? 'Study portal · Follow your task page for capture, questions and evidence uploads.'
      : 'Controlled review portal · Proposal and decision records are saved in the checkpoint app.'}</footer>
  </main></>;
}
