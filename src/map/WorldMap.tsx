import { memo, useMemo } from 'react';
import { MAP, DOT_COUNTRIES } from './mapData';
import { CONTINENT_OF } from '../data/continents';
import type { Box } from './viewbox';
import { WORLD_W, WORLD_H, transformFor, scaleOf } from './viewbox';

export type MapSelection = { kind: 'country' | 'territory'; key: string };

interface WorldMapProps {
  view: Box;
  selected?: string | null;
  /** Countries visited (get a little star dot in explore mode). */
  visited?: Set<string>;
  onSelect?: (sel: MapSelection) => void;
  /** Quiz mode: same fill for every country so colors don't give hints. */
  neutral?: boolean;
  /** Pulse this country as a hint. */
  pulse?: string | null;
}

// Static layers: country/territory paths never change, so they are memoized
// hard and only className-level state (selected/pulse) re-renders.
const TerritoryPaths = memo(function TerritoryPaths({
  onSelect,
}: {
  onSelect?: (sel: MapSelection) => void;
}) {
  return (
    <g>
      {Object.entries(MAP.territories).map(([key, shape]) => (
        <path
          key={key}
          d={shape.path}
          className="terr"
          onClick={onSelect ? () => onSelect({ kind: 'territory', key }) : undefined}
        />
      ))}
    </g>
  );
});

const CountryPath = memo(
  function CountryPath({
    iso2,
    path,
    className,
    onSelect,
  }: {
    iso2: string;
    path: string;
    className: string;
    onSelect?: (sel: MapSelection) => void;
  }) {
    return (
      <path
        d={path}
        className={className}
        data-iso2={iso2}
        onClick={onSelect ? () => onSelect({ kind: 'country', key: iso2 }) : undefined}
      />
    );
  },
  (a, b) => a.className === b.className && a.onSelect === b.onSelect,
);

const CONTINENT_CLASS: Record<string, string> = {
  Africa: 'c-africa',
  Asia: 'c-asia',
  Europe: 'c-europe',
  'North America': 'c-namerica',
  'South America': 'c-samerica',
  Oceania: 'c-oceania',
};

export default function WorldMap({
  view,
  selected,
  visited,
  onSelect,
  neutral,
  pulse,
}: WorldMapProps) {
  const k = scaleOf(view);
  const transform = useMemo(() => transformFor(view), [view]);
  const dotR = Math.max(1.6, 5 / k);
  // At world zoom the dots would overlap their bigger neighbours and steal
  // taps; tiny countries are reached by zooming in (chips) or via search.
  const showDots = k >= 1.8;

  return (
    <svg
      className="world-map"
      viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <g className="map-pan" style={{ transform, strokeWidth: Math.min(1, 1.2 / k) }}>
        <TerritoryPaths onSelect={onSelect} />
        <g>
          {Object.entries(MAP.countries).map(([iso2, shape]) => {
            const classes = [
              'country',
              neutral ? 'c-neutral' : CONTINENT_CLASS[CONTINENT_OF[iso2]],
              selected === iso2 ? 'is-selected' : '',
              pulse === iso2 ? 'is-pulse' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <CountryPath
                key={iso2}
                iso2={iso2}
                path={shape.path}
                className={classes}
                onSelect={onSelect}
              />
            );
          })}
        </g>
        {/* hit dots so micro-countries stay tappable once zoomed in */}
        <g style={{ display: showDots ? undefined : 'none' }}>
          {DOT_COUNTRIES.map((iso2) => {
            const [cx, cy] = MAP.countries[iso2].centroid;
            return (
              <circle
                key={iso2}
                cx={cx}
                cy={cy}
                r={dotR}
                className={[
                  'hit-dot',
                  selected === iso2 ? 'is-selected' : '',
                  pulse === iso2 ? 'is-pulse' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-iso2={iso2}
                onClick={onSelect ? () => onSelect({ kind: 'country', key: iso2 }) : undefined}
              />
            );
          })}
        </g>
        {/* visited stars */}
        {visited && !neutral && (
          <g className="visited-layer">
            {[...visited].map((iso2) => {
              const shape = MAP.countries[iso2];
              if (!shape) return null;
              const [cx, cy] = shape.centroid;
              return (
                <circle key={iso2} cx={cx} cy={cy} r={Math.max(1.2, 2.4 / k)} className="visited-dot" />
              );
            })}
          </g>
        )}
      </g>
    </svg>
  );
}
