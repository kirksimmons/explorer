import { useEffect, useState } from 'react';
import { ProgressProvider, useProgress } from './state/ProgressContext';
import ExploreScreen from './screens/ExploreScreen';
import GamesHub from './screens/GamesHub';
import PassportScreen from './screens/PassportScreen';
import Intro from './screens/Intro';
import { newBadges, type Badge } from './engine/badges';
import Confetti from './ui/Confetti';

type Screen = 'explore' | 'games' | 'passport';

const TABS: { id: Screen; emoji: string; label: string }[] = [
  { id: 'explore', emoji: '🗺️', label: 'Explore' },
  { id: 'games', emoji: '🎮', label: 'Games' },
  { id: 'passport', emoji: '📔', label: 'Passport' },
];

function BadgeCelebration() {
  const { progress, dispatch } = useProgress();
  const [showing, setShowing] = useState<Badge | null>(null);

  useEffect(() => {
    if (showing) return;
    const fresh = newBadges(progress);
    if (fresh.length > 0) {
      setShowing(fresh[0]);
      dispatch({ type: 'markBadges', badges: [fresh[0].id] });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [progress, showing]);

  if (!showing) return null;
  return (
    <div className="badge-party" data-testid="badge-party" onClick={() => setShowing(null)}>
      <Confetti />
      <div className="badge-party-card">
        <div className="badge-party-emoji">{showing.emoji}</div>
        <h2>New badge!</h2>
        <p className="badge-party-name">{showing.name}</p>
        <button className="big-btn" onClick={() => setShowing(null)}>
          Yay!
        </button>
      </div>
    </div>
  );
}

function StorageNotice() {
  const { canPersist } = useProgress();
  const [dismissed, setDismissed] = useState(false);
  if (canPersist || dismissed) return null;
  return (
    <div className="storage-notice" onClick={() => setDismissed(true)}>
      This browser can't save stickers between visits — but you can still play!
    </div>
  );
}

function Shell() {
  const [screen, setScreen] = useState<Screen>('explore');
  return (
    <div className="app">
      <header className="top-bar">
        <div className="app-title">🌍 World Explorer</div>
        <nav className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={screen === tab.id ? 'tab active' : 'tab'}
              onClick={() => setScreen(tab.id)}
              data-testid={`tab-${tab.id}`}
            >
              <span className="tab-emoji">{tab.emoji}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>
      <main className="screen">
        {screen === 'explore' && <ExploreScreen />}
        {screen === 'games' && <GamesHub />}
        {screen === 'passport' && <PassportScreen />}
      </main>
      <BadgeCelebration />
      <StorageNotice />
      <Intro />
    </div>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <Shell />
    </ProgressProvider>
  );
}
