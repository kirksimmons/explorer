import { useMemo, useState } from 'react';
import { COUNTRIES } from '../data/countries';
import Flag from '../ui/Flag';
import { useProgress } from '../state/ProgressContext';

interface SearchOverlayProps {
  onPick: (iso2: string) => void;
  onClose: () => void;
}

/** A–Z country list with flags: the guaranteed way to reach any country. */
export default function SearchOverlay({ onPick, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const { progress } = useProgress();

  const sorted = useMemo(
    () => Object.values(COUNTRIES).sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  const q = query.trim().toLowerCase();
  const matches = q ? sorted.filter((c) => c.name.toLowerCase().includes(q)) : sorted;

  return (
    <div className="overlay" data-testid="search-overlay">
      <div className="overlay-bar">
        <input
          autoFocus
          type="search"
          placeholder="Type a country…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search countries"
        />
        <button className="card-close" onClick={onClose} aria-label="Close search">
          ✕
        </button>
      </div>
      <ul className="country-list">
        {matches.map((c) => (
          <li key={c.iso2}>
            <button className="country-row" onClick={() => onPick(c.iso2)}>
              <Flag code={c.iso2} className="flag-row" />
              <span className="country-row-name">{c.name}</span>
              {progress.visited.includes(c.iso2) && <span className="visited-mark">⭐</span>}
            </button>
          </li>
        ))}
        {matches.length === 0 && <li className="no-match">No country found — try fewer letters!</li>}
      </ul>
    </div>
  );
}
