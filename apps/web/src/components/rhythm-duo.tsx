/**
 * The nine-number cycle as a ring, with two markers: a filled one for you and
 * an outlined one for the other person. The caption under it says the same in
 * words, so the picture adds nothing a screen reader would miss.
 */
export function RhythmDuo({
  you,
  other,
  otherLabel,
  size = 208,
}: {
  you: number;
  other: number;
  otherLabel: string;
  size?: number;
}) {
  const k = size / 208;
  const r = 76 * k;
  const c = size / 2;
  const nodes = Array.from({ length: 9 }, (_, i) => {
    const n = i + 1;
    const angle = (-90 + (360 / 9) * i) * (Math.PI / 180);
    return { n, x: c + r * Math.cos(angle), y: c + r * Math.sin(angle) };
  });
  const same = you === other;
  const label = same
    ? `Nine-number cycle. You and ${otherLabel} are both on ${you}.`
    : `Nine-number cycle. You are on ${you}. ${otherLabel} is on ${other}.`;

  return (
    <figure className="flex flex-col items-center gap-3" data-testid="rhythm-duo">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="max-w-full shrink-0">
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line-strong)" strokeDasharray="2 5" />
        {nodes.map((node) => {
          const isYou = node.n === you;
          const isOther = node.n === other;
          const lit = isYou || isOther;
          return (
            <g key={node.n}>
              {isOther ? (
                <circle cx={node.x} cy={node.y} r={(isYou ? 23 : 19) * k} fill="none" style={{ stroke: 'var(--accent)', strokeWidth: 3 }} />
              ) : null}
              <circle
                cx={node.x}
                cy={node.y}
                r={(lit ? 17 : 13) * k}
                style={{
                  fill: isYou ? `var(--d${node.n})` : isOther ? '#ffffff' : `var(--b${node.n})`,
                  stroke: isOther && !isYou ? `var(--d${node.n})` : 'none',
                  strokeWidth: 2,
                }}
              />
              <text
                x={node.x}
                y={node.y + 5 * k}
                textAnchor="middle"
                className="font-display"
                style={{ fill: isYou ? '#ffffff' : 'var(--ink-strong)', fontSize: (lit ? 17 : 13) * k, fontWeight: 800 }}
              >
                {node.n}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-ink-strong">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-3.5 rounded-full" style={{ background: `var(--d${you})` }} aria-hidden="true" />
          You: {you}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-3.5 rounded-full bg-white" style={{ border: '3px solid var(--accent)' }} aria-hidden="true" />
          {otherLabel}: {other}
        </span>
      </figcaption>
    </figure>
  );
}
