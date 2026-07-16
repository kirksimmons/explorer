/** A row of earned/empty stars, e.g. round results. */
export default function Stars({ earned, max = 3 }: { earned: number; max?: number }) {
  return (
    <span className="stars" aria-label={`${earned} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < earned ? 'star on' : 'star'}>
          ⭐
        </span>
      ))}
    </span>
  );
}
