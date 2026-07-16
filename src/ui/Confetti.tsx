import { useMemo } from 'react';

/** Lightweight CSS confetti burst (no libraries, no per-frame JS). */
export default function Confetti({ pieces = 60 }: { pieces?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: (i * 37) % 100,
        delay: ((i * 13) % 40) / 100,
        duration: 1.6 + ((i * 7) % 12) / 10,
        color: ['#ff5d5d', '#ffb037', '#ffe74c', '#59cd90', '#4ecdc4', '#6c8dfa', '#c56cf0'][i % 7],
        spin: (i % 2 ? 1 : -1) * (360 + ((i * 31) % 360)),
        size: 7 + ((i * 11) % 8),
      })),
    [pieces],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {items.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            background: p.color,
            width: p.size,
            height: p.size * 0.55,
            ['--spin' as string]: `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}
