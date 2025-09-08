// frontend/src/components/RiskChart.js
export default function RiskChart({ series }) {
  if (!series?.length) return <div className="muted">No data.</div>;

  // Pull data
  const labels = series.map(p => p.label ?? String(series.indexOf(p) + 1));
  const values = series.map(p => Number(p.value));

  // Dimensions
  const W = 560, H = 200;
  const padL = 48, padR = 16, padT = 16, padB = 36;

  // Y scale with guard for flat series
  let minY = Math.min(...values);
  let maxY = Math.max(...values);
  if (minY === maxY) {
    // Expand by ±5% (minimum ±1) so it isn't flat
    const bump = Math.max(1, Math.abs(minY) * 0.05);
    minY -= bump;
    maxY += bump;
  }

  const x = i =>
    padL + (i * (W - padL - padR)) / (values.length - 1 || 1);
  const y = v =>
    padT + ((maxY - v) * (H - padT - padB)) / (maxY - minY);

  // Line path
  const path = values
    .map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`)
    .join(" ");

  // Y ticks (5)
  const yTicks = 5;
  const yTickVals = Array.from({ length: yTicks }, (_, k) =>
    minY + (k * (maxY - minY)) / (yTicks - 1)
  );

  // X ticks: pick ~5 evenly spaced labels
  const xTicks = Math.min(5, labels.length);
  const xTickIdxs = Array.from({ length: xTicks }, (_, k) =>
    Math.round((k * (labels.length - 1)) / (xTicks - 1 || 1))
  );

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="vital-chart">
      {/* Plot area bg (optional) */}
      <rect x="0" y="0" width={W} height={H} fill="none" />

      {/* Axes */}
      <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="#cbd5e1" />
      <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="#cbd5e1" />

      {/* Y grid + labels */}
      {yTickVals.map((v, i) => {
        const yy = y(v);
        return (
          <g key={`y-${i}`}>
            <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="#eef2f7" />
            <text x={padL - 8} y={yy + 4} textAnchor="end" className="axis-label">
              {formatNum(v)}
            </text>
          </g>
        );
      })}

      {/* X ticks + labels */}
      {xTickIdxs.map((idx, i) => {
        const xx = x(idx);
        return (
          <g key={`x-${i}`}>
            <line x1={xx} y1={H - padB} x2={xx} y2={H - padB + 6} stroke="#94a3b8" />
            <text x={xx} y={H - padB + 20} textAnchor="middle" className="axis-label">
              {labels[idx]}
            </text>
          </g>
        );
      })}

      {/* Line + points */}
      <path d={path} fill="none" stroke="#1f4ed8" strokeWidth="2" />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#1f4ed8" />
      ))}
    </svg>
  );
}

function formatNum(n) {
  // nice formatting for vitals (integers if close, else 1 decimal)
  const rounded = Math.round(n);
  return Math.abs(n - rounded) < 0.05 ? String(rounded) : n.toFixed(1);
}
