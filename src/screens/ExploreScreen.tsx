import { useMemo, useState } from 'react';
import WorldMap, { type MapSelection } from '../map/WorldMap';
import { MAP } from '../map/mapData';
import { boxFromBBox, WORLD, type Box } from '../map/viewbox';
import { useProgress } from '../state/ProgressContext';
import CountryCard from './CountryCard';
import SearchOverlay from './SearchOverlay';

const REGION_CHIPS: { key: string; label: string }[] = [
  { key: 'world', label: '🌍 World' },
  { key: 'northAmerica', label: 'N. America' },
  { key: 'southAmerica', label: 'S. America' },
  { key: 'europe', label: 'Europe' },
  { key: 'tinyEurope', label: 'Tiny Europe 🔍' },
  { key: 'africa', label: 'Africa' },
  { key: 'asia', label: 'Asia' },
  { key: 'oceania', label: 'Oceania' },
  { key: 'caribbean', label: 'Caribbean 🏝️' },
  { key: 'pacificIslands', label: 'Pacific 🏝️' },
];

export default function ExploreScreen() {
  const [view, setView] = useState<Box>(WORLD);
  const [activeChip, setActiveChip] = useState('world');
  const [selection, setSelection] = useState<MapSelection | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const { progress } = useProgress();

  const visited = useMemo(() => new Set(progress.visited), [progress.visited]);

  const pickChip = (key: string) => {
    setActiveChip(key);
    setView(key === 'world' ? WORLD : boxFromBBox(MAP.regions[key], 0.06));
  };

  const onSelect = (sel: MapSelection) => setSelection(sel);

  const pickFromSearch = (iso2: string) => {
    setSearchOpen(false);
    setSelection({ kind: 'country', key: iso2 });
    setActiveChip('');
    setView(boxFromBBox(MAP.countries[iso2].panBox, 0.8));
  };

  return (
    <div className="explore">
      <div className="map-holder">
        <WorldMap view={view} selected={selection?.key} visited={visited} onSelect={onSelect} />
        <button className="search-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
          🔍
        </button>
        <div className="chips">
          {REGION_CHIPS.map((chip) => (
            <button
              key={chip.key}
              className={activeChip === chip.key ? 'chip active' : 'chip'}
              onClick={() => pickChip(chip.key)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
      {selection && (
        <CountryCard
          kind={selection.kind}
          code={selection.key}
          onClose={() => setSelection(null)}
        />
      )}
      {searchOpen && <SearchOverlay onPick={pickFromSearch} onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
