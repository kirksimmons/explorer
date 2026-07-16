import { useEffect, useState } from 'react';
import { COUNTRIES } from '../data/countries';
import { TERRITORIES } from '../data/territories';
import Flag from '../ui/Flag';
import { useProgress } from '../state/ProgressContext';

interface CountryCardProps {
  kind: 'country' | 'territory';
  code: string;
  onClose: () => void;
}

/** Slide-up card with everything about a tapped country. */
export default function CountryCard({ kind, code, onClose }: CountryCardProps) {
  const { progress, dispatch } = useProgress();
  const [showLongAgo, setShowLongAgo] = useState(false);
  const [stickerPop, setStickerPop] = useState(false);

  const country = kind === 'country' ? COUNTRIES[code] : undefined;
  const territory = kind === 'territory' ? TERRITORIES[code] : undefined;

  useEffect(() => {
    setShowLongAgo(false);
    if (kind === 'country' && COUNTRIES[code] && !progress.visited.includes(code)) {
      dispatch({ type: 'visit', iso2: code });
      setStickerPop(true);
      const t = setTimeout(() => setStickerPop(false), 2200);
      return () => clearTimeout(t);
    }
    setStickerPop(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, kind]);

  if (kind === 'territory' && territory) {
    return (
      <div className="card" data-testid="territory-card">
        <button className="card-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="card-head">
          {code.startsWith('_') ? null : <Flag code={code} className="flag-big" />}
          <h2>{territory.name}</h2>
        </div>
        <p className="terr-blurb">{territory.blurb}</p>
      </div>
    );
  }

  if (!country) return null;

  const openLongAgo = () => {
    setShowLongAgo(true);
    dispatch({ type: 'longAgo', iso2: code });
  };

  return (
    <div className="card" data-testid="country-card">
      <button className="card-close" onClick={onClose} aria-label="Close">
        ✕
      </button>
      {stickerPop && (
        <div className="sticker-pop" data-testid="sticker-pop">
          🎉 New sticker for your passport!
        </div>
      )}
      <div className="card-head">
        <Flag code={code} className="flag-big" />
        <h2>{country.name}</h2>
      </div>
      <ul className="fact-rows">
        <li>
          <span className="row-icon">⭐</span>
          <span>
            <b>Capital:</b> {country.capital}
          </span>
        </li>
        <li>
          <span className="row-icon">💬</span>
          <span>
            <b>People speak:</b> {country.languages.join(', ')}
          </span>
        </li>
        <li>
          <span className="row-icon">🍽️</span>
          <span>
            <b>A favorite food:</b> {country.dish.name} — {country.dish.blurb}
          </span>
        </li>
      </ul>
      <div className="fun-facts">
        <h3>Did you know?</h3>
        {country.funFacts.map((fact, i) => (
          <p key={i} className="fun-fact">
            {['🤩', '🎈', '🔎'][i]} {fact}
          </p>
        ))}
      </div>
      {!showLongAgo ? (
        <button className="long-ago-btn" onClick={openLongAgo} data-testid="long-ago-btn">
          🦕 Long ago…
        </button>
      ) : (
        <div className="long-ago" data-testid="long-ago">
          <h3>🦕 Long ago…</h3>
          {country.longAgo.history.map((h, i) => (
            <p key={i}>{h}</p>
          ))}
          <p className="dino">
            <b>Dinosaur discovery:</b> {country.longAgo.dino.name} — {country.longAgo.dino.note}
          </p>
        </div>
      )}
    </div>
  );
}
