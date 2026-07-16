import { useMemo, useState } from 'react';
import WorldMap, { type MapSelection } from '../map/WorldMap';
import { WORLD, boxFromBBox, type Box } from '../map/viewbox';
import { MAP } from '../map/mapData';
import { COUNTRIES } from '../data/countries';
import { makeRound, starsForRound, ROUND_LENGTH, tierName } from '../engine/quiz';
import type { GameId } from '../engine/progress';
import type { Tier } from '../data/types';
import { useProgress } from '../state/ProgressContext';
import Flag from '../ui/Flag';
import Stars from '../ui/Stars';
import Confetti from '../ui/Confetti';

export const GAME_TITLES: Record<GameId, string> = {
  find: 'Find the Country',
  flag: 'Match the Flag',
  dish: 'Guess the Food',
};

interface QuizGameProps {
  game: GameId;
  tier: Tier;
  onExit: () => void;
}

interface Feedback {
  kind: 'wrong-retry' | 'wrong-reveal' | 'correct';
  text: string;
}

export default function QuizGame({ game, tier, onExit }: QuizGameProps) {
  const { dispatch } = useProgress();
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const round = useMemo(() => makeRound(game, tier, seed), [game, tier, seed]);
  const [index, setIndex] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [done, setDone] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);
  const [mapView, setMapView] = useState<Box>(WORLD);

  const question = round[index];
  const target = COUNTRIES[question?.target];

  const finish = (finalFirstTry: number) => {
    const stars = starsForRound(finalFirstTry);
    setStarsEarned(stars);
    dispatch({ type: 'earnStars', game, stars });
    setDone(true);
  };

  const advance = (gotFirstTry: boolean) => {
    const nextFirstTry = firstTry + (gotFirstTry ? 1 : 0);
    setFirstTry(nextFirstTry);
    setMisses(0);
    setFeedback(null);
    setMapView(WORLD);
    if (index + 1 >= ROUND_LENGTH) {
      finish(nextFirstTry);
    } else {
      setIndex(index + 1);
    }
  };

  const answer = (iso2: string) => {
    if (done || feedback?.kind === 'correct' || feedback?.kind === 'wrong-reveal') return;
    if (iso2 === question.target) {
      const gotFirstTry = misses === 0;
      setFeedback({
        kind: 'correct',
        text: gotFirstTry
          ? ['Yes! Amazing! 🎉', 'You got it! 🌟', 'Super! 🎈', 'Wow, first try! 🏆'][index % 4]
          : 'You found it! 🎉',
      });
      setTimeout(() => advance(gotFirstTry), 900);
    } else if (game === 'find') {
      // the map game teaches and lets you keep trying — always completable
      const tapped = COUNTRIES[iso2];
      setMisses(misses + 1);
      setFeedback({
        kind: 'wrong-retry',
        text: tapped ? `Not quite — that's ${tapped.name}! Try again!` : `Not quite — keep looking!`,
      });
    } else {
      // choice games reveal the answer with a little teach, then move on
      setMisses(misses + 1);
      setFeedback({
        kind: 'wrong-reveal',
        text:
          game === 'flag'
            ? `Good try! This is ${target.name}'s flag — remember it for next time!`
            : `Good try! ${target.name} loves ${target.dish.name}. Yum!`,
      });
      setTimeout(() => advance(false), 2000);
    }
  };

  const onMapSelect = (sel: MapSelection) => {
    if (sel.kind === 'country') answer(sel.key);
  };

  const playAgain = () => {
    setSeed(Math.floor(Math.random() * 1e9));
    setIndex(0);
    setFirstTry(0);
    setMisses(0);
    setFeedback(null);
    setDone(false);
    setMapView(WORLD);
  };

  if (done) {
    return (
      <div className="game round-end" data-testid="round-end">
        {starsEarned >= 3 && <Confetti />}
        <h2>Round done! 🎉</h2>
        <div className="round-stars">
          <Stars earned={starsEarned} />
        </div>
        <p className="round-msg">
          {starsEarned === 3
            ? 'PERFECT! You are a superstar!'
            : starsEarned === 2
              ? 'Great job! Keep exploring!'
              : 'Nice work — every star counts!'}
        </p>
        <div className="round-actions">
          <button className="big-btn" onClick={playAgain} data-testid="play-again">
            Play again
          </button>
          <button className="big-btn alt" onClick={onExit}>
            All games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game" data-testid={`game-${game}`}>
      <div className="game-top">
        <button className="back-btn" onClick={onExit} aria-label="Back to games">
          ←
        </button>
        <div className="game-title">
          {GAME_TITLES[game]} · {tierName(tier)}
        </div>
        <div className="progress-dots" aria-label={`Question ${index + 1} of ${ROUND_LENGTH}`}>
          {Array.from({ length: ROUND_LENGTH }, (_, i) => (
            <span key={i} className={i < index ? 'dot done' : i === index ? 'dot now' : 'dot'} />
          ))}
        </div>
      </div>

      {game === 'find' && (
        <>
          <div className="game-prompt" data-testid="game-prompt" data-target={question.target}>
            Find <b>{target.name}</b>!{' '}
            <span className="hint">({target.famousFor})</span>
          </div>
          <div className="map-holder game-map">
            <WorldMap
              view={mapView}
              neutral
              onSelect={onMapSelect}
              pulse={misses >= 2 ? question.target : null}
            />
            <div className="chips">
              <button className="chip" onClick={() => setMapView(WORLD)}>
                🌍 World
              </button>
              {Object.entries({
                northAmerica: 'N. America',
                southAmerica: 'S. America',
                europe: 'Europe',
                africa: 'Africa',
                asia: 'Asia',
                oceania: 'Oceania',
              }).map(([key, label]) => (
                <button key={key} className="chip" onClick={() => setMapView(boxFromBBox(MAP.regions[key], 0.06))}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {game === 'flag' && (
        <>
          <div className="game-prompt" data-testid="game-prompt">
            Which flag belongs to <b>{target.name}</b>?
          </div>
          <div className="options flag-options">
            {question.options.map((iso2) => (
              <button
                key={iso2}
                className="option flag-option"
                onClick={() => answer(iso2)}
                data-testid={`option-${iso2}`}
                disabled={feedback?.kind === 'wrong-reveal' && iso2 !== question.target}
              >
                <Flag code={iso2} className="flag-choice" />
              </button>
            ))}
          </div>
        </>
      )}

      {game === 'dish' && (
        <>
          <div className="game-prompt" data-testid="game-prompt">
            Which food comes from <b>{target.name}</b>?
          </div>
          <div className="options dish-options">
            {question.options.map((iso2) => (
              <button
                key={iso2}
                className="option dish-option"
                onClick={() => answer(iso2)}
                data-testid={`option-${iso2}`}
                disabled={feedback?.kind === 'wrong-reveal' && iso2 !== question.target}
              >
                🍽️ {COUNTRIES[iso2].dish.name}
              </button>
            ))}
          </div>
        </>
      )}

      <div
        className={`feedback ${feedback ? `show ${feedback.kind}` : ''}`}
        data-testid="feedback"
        aria-live="polite"
      >
        {feedback?.text ?? ' '}
      </div>
    </div>
  );
}
