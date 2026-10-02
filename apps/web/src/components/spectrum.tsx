/** The nine colours as nine flat bars. Decoration only, so it is hidden from assistive technology. */
export function Spectrum({ className = 'h-2.5' }: { className?: string }) {
  return (
    <div className={`flex ${className}`} aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="flex-1" style={{ background: `var(--b${i + 1})` }} />
      ))}
    </div>
  );
}
