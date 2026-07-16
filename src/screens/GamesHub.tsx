import { useState } from 'react';
import type { GameId } from '../engine/progress';
import type { Tier } from '../data/types';
import { unlockedTier, totalStars, TIER_2_STARS, TIER_3_STARS } from '../engine/progress';
import { tierName } from '../engine/quiz';
import { useProgress } from '../state/ProgressContext';
import QuizGame, { GAME_TITLES } from './QuizGame';

const GAME_EMOJI: Record<GameId, string> = { find: '🗺️', flag: '🚩', dish: '🍽️' };
const GAME_BLURB: Record<GameId, string> = {
  find: 'Tap the right country on the map',
  flag: 'Pick the matching flag',
  dish: 'Guess which food comes from where',
};

export default function GamesHub() {
  const { progress } = useProgress();
  const [playing, setPlaying] = useState<{ game: GameId; tier: Tier } | null>(null);

  if (playing) {
    return <QuizGame game={playing.game} tier={playing.tier} onExit={() => setPlaying(null)} />;
  }

  const maxTier = unlockedTier(progress);
  const total = totalStars(progress);
  const starsToNext =
    maxTier === 1 ? TIER_2_STARS - total : maxTier === 2 ? TIER_3_STARS - total : 0;

  return (
    <div className="games-hub" data-testid="games-hub">
      <h2>
        Pick a game! <span className="total-stars">⭐ {total}</span>
      </h2>
      {starsToNext > 0 && (
        <p className="unlock-hint">
          {starsToNext} more ⭐ to unlock {tierName((maxTier + 1) as Tier)} questions!
        </p>
      )}
      {(Object.keys(GAME_TITLES) as GameId[]).map((game) => (
        <div key={game} className="game-card" data-testid={`game-card-${game}`}>
          <div className="game-card-head">
            <span className="game-emoji">{GAME_EMOJI[game]}</span>
            <div>
              <h3>{GAME_TITLES[game]}</h3>
              <p>{GAME_BLURB[game]}</p>
            </div>
            <span className="game-stars">⭐ {progress.stars[game]}</span>
          </div>
          <div className="tier-row">
            {([1, 2, 3] as Tier[]).map((tier) => {
              const locked = tier > maxTier;
              return (
                <button
                  key={tier}
                  className={locked ? 'tier-btn locked' : 'tier-btn'}
                  disabled={locked}
                  onClick={() => setPlaying({ game, tier })}
                  data-testid={`play-${game}-${tier}`}
                >
                  {locked ? '🔒 ' : ''}
                  {tierName(tier)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
