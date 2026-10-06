export function BarChart({ rows, max, good = false }: { rows: { label: string; value: number }[]; max?: number; good?: boolean }) {
  const scale = max || Math.max(1, ...rows.map((row) => row.value));
  if (!rows.length) return <div className="empty">No data yet.</div>;
  return <div>{rows.map((row) => <div className="bar-row" key={row.label}>
    <span title={row.label}>{row.label}</span><div className="bar-track"><div className={`bar-fill ${good ? 'good' : ''}`} style={{ width: `${Math.max(0, Math.min(100, row.value / scale * 100))}%` }} /></div>
    <strong>{row.value}</strong></div>)}</div>;
}
