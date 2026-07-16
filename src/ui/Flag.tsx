import { FLAGS } from '../map/mapData';

/** Renders a bundled flag SVG (4:3). Trusted build-time asset markup. */
export default function Flag({ code, className }: { code: string; className?: string }) {
  const svg = FLAGS[code];
  if (!svg) return null;
  return (
    <span
      className={`flag ${className ?? ''}`}
      role="img"
      aria-label={`Flag`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
