'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AnalysisRefresh() {
  const router = useRouter();
  const [checked, setChecked] = useState('');
  function refresh() { router.refresh(); setChecked(new Date().toLocaleTimeString()); }
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [router]);
  return <div className="analysis-refresh"><button className="button secondary" type="button" onClick={refresh}>Refresh analysis</button>
    <span className="small muted">Updates each minute while this tab is visible{checked ? ` · checked ${checked}` : ''}</span></div>;
}
