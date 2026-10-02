import type { Circle } from '@numerology/composer';

/**
 * Everyone's personal-year number on the nine-number ring. A number that
 * someone is on is filled; the letters of the people on it sit just outside.
 * The legend under it says the same in words, so the picture adds nothing a
 * screen reader would miss.
 */
export function RhythmCircle({ circle, size = 280 }: { circle: Circle; size?: number }) {
  const k = size / 280;
  const c = size / 2;
  const r = 92 * k;
  const label = `Nine-number cycle. ${circle.members.map((m) => `${m.label} ${m.label === 'You' ? 'are' : 'is'} on ${m.year}`).join('. ')}.`;

  return (
    <figure className="flex flex-col items-center gap-3" data-testid="rhythm-circle">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="max-w-full shrink-0">
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line-strong)" strokeDasharray="2 5" />
        {circle.ring.map((node, i) => {
          const angle = (-90 + (360 / 9) * i) * (Math.PI / 180);
          const x = c + r * Math.cos(angle);
          const y = c + r * Math.sin(angle);
          const lx = c + (r + 34 * k) * Math.cos(angle);
          const ly = c + (r + 34 * k) * Math.sin(angle);
          const lit = node.letters.length > 0;
          return (
            <g key={node.number}>
              <circle
                cx={x}
                cy={y}
                r={(lit ? 19 : 14) * k}
                style={{ fill: lit ? `var(--d${node.number})` : `var(--n${node.number})`, stroke: lit ? `var(--d${node.number})` : 'var(--line)' }}
              />
              <text x={x} y={y + 5 * k} textAnchor="middle" className="font-serif" style={{ fill: lit ? '#ffffff' : `var(--d${node.number})`, fontSize: (lit ? 17 : 13) * k }}>
                {node.number}
              </text>
              {lit ? (
                <text x={lx} y={ly + 4 * k} textAnchor="middle" className="font-mono" style={{ fill: 'var(--ink-strong)', fontSize: 12 * k, fontWeight: 600 }}>
                  {node.letters.join('·')}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <figcaption className="max-w-[28rem] text-center text-sm text-muted">Each letter is a person, with the legend below. People on the same number are in the same year number.</figcaption>
    </figure>
  );
}
