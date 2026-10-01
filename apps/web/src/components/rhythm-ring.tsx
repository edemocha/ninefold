/** The nine-day rhythm as a ring of nine, with one number lit. */
export function RhythmRing({ lit, size = 168, label }: { lit: number; size?: number; label?: string }) {
  const r = 62;
  const c = size / 2;
  const nodes = Array.from({ length: 9 }, (_, i) => {
    const n = i + 1;
    const angle = (-90 + (360 / 9) * i) * (Math.PI / 180);
    return { n, x: c + r * Math.cos(angle) * (size / 168), y: c + r * Math.sin(angle) * (size / 168) };
  });
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label ?? `Nine-day rhythm: day ${lit} of 9 is lit`}
      className="shrink-0"
    >
      <circle cx={c} cy={c} r={r * (size / 168)} fill="none" stroke="var(--line-strong)" strokeDasharray="2 5" />
      {nodes.map((node) => {
        const on = node.n === lit;
        return (
          <g key={node.n}>
            <circle
              cx={node.x}
              cy={node.y}
              r={on ? 17 : 13}
              style={{ fill: on ? `var(--d${node.n})` : `var(--n${node.n})`, stroke: on ? `var(--d${node.n})` : 'var(--line)' }}
            />
            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              className="font-serif"
              style={{ fill: on ? '#ffffff' : `var(--d${node.n})`, fontSize: on ? 16 : 13 }}
            >
              {node.n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
