/**
 * A decorative ring of the nine numbers, each in its own hue. It carries no
 * information, so it is hidden from assistive technology.
 */
export function NineDots({ size = 220 }: { size?: number }) {
  const c = size / 2;
  const r = size * 0.36;
  const nodes = Array.from({ length: 9 }, (_, i) => {
    const n = i + 1;
    const angle = (-90 + (360 / 9) * i) * (Math.PI / 180);
    return { n, x: c + r * Math.cos(angle), y: c + r * Math.sin(angle) };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false" className="max-w-full">
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line-strong)" strokeDasharray="2 6" />
      <circle cx={c} cy={c} r={r * 0.62} fill="none" stroke="var(--line)" />
      {nodes.map((node) => (
        <g key={node.n}>
          <circle cx={node.x} cy={node.y} r={size * 0.085} style={{ fill: `var(--n${node.n})`, stroke: `var(--d${node.n})`, strokeWidth: 1.5 }} />
          <text x={node.x} y={node.y + size * 0.03} textAnchor="middle" className="font-serif" style={{ fill: `var(--d${node.n})`, fontSize: size * 0.085 }}>
            {node.n}
          </text>
        </g>
      ))}
      <text x={c} y={c + size * 0.045} textAnchor="middle" className="font-serif" style={{ fill: 'var(--primary)', fontSize: size * 0.13 }}>
        9
      </text>
    </svg>
  );
}
