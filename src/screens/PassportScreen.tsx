import { COUNTRIES } from '../data/countries';
import { CONTINENT_OF, ALL_ISO2 } from '../data/continents';
import { CONTINENTS, type Continent } from '../data/types';
import { BADGES } from '../engine/badges';
import { useProgress } from '../state/ProgressContext';
import Flag from '../ui/Flag';

const BY_CONTINENT: Record<Continent, string[]> = {
  Africa: [], Asia: [], Europe: [], 'North America': [], 'South America': [], Oceania: [],
};
for (const iso2 of ALL_ISO2) BY_CONTINENT[CONTINENT_OF[iso2]].push(iso2);
for (const list of Object.values(BY_CONTINENT)) {
  list.sort((a, b) => (COUNTRIES[a]?.name ?? a).localeCompare(COUNTRIES[b]?.name ?? b));
}

export default function PassportScreen() {
  const { progress } = useProgress();
  const visited = new Set(progress.visited);

  return (
    <div className="passport" data-testid="passport">
      <h2>📔 My Passport</h2>
      <p className="passport-sub">
        Tap countries on the map to collect their stickers! {visited.size} of {ALL_ISO2.length}{' '}
        collected.
      </p>

      <div className="badge-shelf" data-testid="badge-shelf">
        {BADGES.map((b) => {
          const earned = b.earned(progress);
          return (
            <div
              key={b.id}
              className={earned ? 'badge earned' : 'badge'}
              title={earned ? b.name : b.hint}
            >
              <span className="badge-emoji">{b.emoji}</span>
              <span className="badge-name">{b.name}</span>
              {!earned && <span className="badge-hint">{b.hint}</span>}
            </div>
          );
        })}
      </div>

      {CONTINENTS.map((continent) => {
        const codes = BY_CONTINENT[continent];
        const got = codes.filter((c) => visited.has(c)).length;
        return (
          <section key={continent} className="passport-page">
            <h3>
              {continent}{' '}
              <span className="page-count">
                {got}/{codes.length}
              </span>
            </h3>
            <div className="sticker-grid">
              {codes.map((iso2) =>
                visited.has(iso2) ? (
                  <div key={iso2} className="sticker got" title={COUNTRIES[iso2]?.name ?? iso2}>
                    <Flag code={iso2} className="flag-sticker" />
                    <span className="sticker-name">{COUNTRIES[iso2]?.name ?? iso2}</span>
                  </div>
                ) : (
                  <div key={iso2} className="sticker empty" title="Not found yet!">
                    <span className="sticker-slot">?</span>
                  </div>
                ),
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
