type Condition = 'acceleration' | 'exploration';
const colors: Record<Condition, string> = { acceleration: '#245a86', exploration: '#a85b28' };

export function OutcomeStackPlot({ rows }: { rows: { condition: Condition; secure: number;
  vulnerable: number; other: number; pending: number }[] }) {
  const parts = [
    ['secure', 'Secure', '#348069'], ['vulnerable', 'Vulnerable', '#b14d4d'],
    ['other', 'Other reviewed', '#9b7893'], ['pending', 'Pending', '#d4dce3']
  ] as const;
  return <div className="study-stack-plot" role="img" aria-label={rows.map((row) =>
    `${row.condition}: ${row.secure} secure, ${row.vulnerable} vulnerable, ${row.other} other reviewed, ${row.pending} pending`).join('; ')}>
    {rows.map((row) => { const total = row.secure + row.vulnerable + row.other + row.pending;
      return <div className="study-stack-row" key={row.condition}>
        <strong>{row.condition}</strong><div className="study-stack-track">
          {total > 0 && parts.map(([key, label, color]) => row[key] > 0 &&
            <span key={key} title={`${label}: ${row[key]}/${total}`} style={{ width: `${row[key] / total * 100}%`, background: color }} />)}
        </div><span>{total ? `${row.vulnerable}/${total} vulnerable` : 'No tasks'}</span>
      </div>; })}
    <div className="study-legend">{parts.map(([, label, color]) => <span key={label}><i style={{ background: color }} />{label}</span>)}</div>
  </div>;
}

export function ConfidenceOutcomePlot({ points }: { points: { id: string; condition: Condition;
  weakness: string; probability: number; secure: boolean }[] }) {
  if (!points.length) return <div className="empty">No hash-linked rating has an assessable final security review yet.</div>;
  const y = (probability: number) => 220 - probability * 1.8;
  const x = (point: typeof points[number], index: number) =>
    (point.secure ? 315 : 120) + (point.condition === 'acceleration' ? -15 : 15) + ((index % 3) - 1) * 4;
  return <div className="study-plot-scroll"><svg className="study-plot" viewBox="0 0 470 275" role="img"
    aria-label="Participant confidence in final-code security, grouped by independently assessed vulnerable or secure outcome and assigned condition">
    {[0, 25, 50, 75, 100].map((tick) => <g key={tick}><line x1="55" x2="440" y1={y(tick)} y2={y(tick)} stroke="#e0e6eb" />
      <text x="45" y={y(tick) + 4} textAnchor="end" className="study-axis">{tick}%</text></g>)}
    <text x="120" y="252" textAnchor="middle" className="study-axis">Vulnerable</text>
    <text x="315" y="252" textAnchor="middle" className="study-axis">Target secure</text>
    {points.map((point, index) => <circle key={point.id} cx={x(point, index)} cy={y(point.probability)}
      r="5" fill={colors[point.condition]} fillOpacity=".78" stroke="white" strokeWidth="1.2">
      <title>{point.id}: {point.weakness}, {point.condition}, {point.probability}% confidence, {point.secure ? 'secure' : 'vulnerable'}</title>
    </circle>)}
  </svg><div className="study-legend"><span><i style={{ background: colors.acceleration }} />Acceleration</span>
      <span><i style={{ background: colors.exploration }} />Exploration</span><span>Each dot is one reviewed feature (n={points.length})</span></div></div>;
}

export function PairedBrierPlot({ pairs }: { pairs: { participant: string; acceleration: number;
  exploration: number }[] }) {
  if (!pairs.length) return <div className="empty">Complete reviewed pairs are needed for this plot.</div>;
  const y = (score: number) => 220 - score * 180;
  return <div className="study-plot-scroll"><svg className="study-plot" viewBox="0 0 470 275" role="img"
    aria-label="Participant paired mean Brier scores in acceleration and exploration; lower is more accurate">
    {[0, .25, .5, .75, 1].map((tick) => <g key={tick}><line x1="55" x2="430" y1={y(tick)} y2={y(tick)} stroke="#e0e6eb" />
      <text x="45" y={y(tick) + 4} textAnchor="end" className="study-axis">{tick.toFixed(2)}</text></g>)}
    {pairs.map((pair) => <g key={pair.participant}><line x1="140" x2="345" y1={y(pair.acceleration)}
      y2={y(pair.exploration)} stroke="#a9b7c2" strokeWidth="1.5" />
      <circle cx="140" cy={y(pair.acceleration)} r="5" fill={colors.acceleration}><title>{pair.participant}: acceleration {pair.acceleration.toFixed(3)}</title></circle>
      <circle cx="345" cy={y(pair.exploration)} r="5" fill={colors.exploration}><title>{pair.participant}: exploration {pair.exploration.toFixed(3)}</title></circle></g>)}
    <text x="140" y="252" textAnchor="middle" className="study-axis">Acceleration</text>
    <text x="345" y="252" textAnchor="middle" className="study-axis">Exploration</text>
  </svg><p className="small muted">One line per complete participant (n={pairs.length}). Lower scores indicate more accurate probabilities.</p></div>;
}

export function CodeChangePlot({ rows }: { rows: { label: string; condition: Condition; changed: number;
  snapshots: number; added: number; removed: number }[] }) {
  if (!rows.length) return <div className="empty">No submitted task has a verified initial and final code ZIP yet.</div>;
  return <div className="study-change-plot">{rows.map((row) => <div className="study-change-row" key={row.label}>
    <span title={row.label}>{row.label}</span><div className="study-change-track"><span style={{
      width: `${row.changed / Math.max(1, row.snapshots - 1) * 100}%`, background: colors[row.condition] }} /></div>
    <strong>{row.changed}/{Math.max(0, row.snapshots - 1)}</strong>
  </div>)}<p className="small muted">Bar: snapshot intervals with a source change / all intervals. Lines added and removed are listed in the task table; neither measure identifies who edited the code or whether it is secure.</p></div>;
}
