import { useEffect, useMemo, useRef, useState } from 'react';
import WorldMap, { type MapSelection } from '../map/WorldMap';
import { WORLD, boxFromBBox, type Box } from '../map/viewbox';
import { MAP } from '../map/mapData';
import { COUNTRIES } from '../data/countries';
import { CONTINENT_OF } from '../data/continents';
import type { Continent } from '../data/types';
import { makeRound, starsForRound, ROUND_LENGTH, tierName } from '../engine/quiz';
import type { GameId } from '../engine/progress';
import { dueForReview } from '../engine/progress';
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

/** Choice games reveal the answer after this many wrong tries (two retries). */
const REVEAL_AFTER = 3;

const CONTINENT_REGION: Record<Continent, string> = {
  'North America': 'northAmerica',
  'South America': 'southAmerica',
  Europe: 'europe',
  Africa: 'africa',
  Asia: 'asia',
  Oceania: 'oceania',
};

/** Zoom a map question to the target's continent so small countries are big. */
function findViewFor(iso2: string): Box {
  const region = MAP.regions[CONTINENT_REGION[CONTINENT_OF[iso2]]];
  return region ? boxFromBBox(region, 0.06) : WORLD;
}

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
  const { progress, dispatch } = useProgress();
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  // Review pool is snapshotted when the round is created (not mid-round).
  const round = useMemo(
    () => makeRound(game, tier, seed, dueForReview(progressRef.current)),
    [game, tier, seed],
  );

  const [index, setIndex] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const [misses, setMisses] = useState(0);
  const [wrongPicks, setWrongPicks] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [done, setDone] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);
  const [mapView, setMapView] = useState<Box>(() =>
    game === 'find' ? findViewFor(round[0].target) : WORLD,
  );

  const question = round[index];
  const target = COUNTRIES[question.target];
  const awaitingNext = feedback?.kind === 'correct' || feedback?.kind === 'wrong-reveal';
  const isLast = index + 1 >= ROUND_LENGTH;

  // Re-centre the map on each new question's continent (find game only).
  useEffect(() => {
    if (game === 'find') setMapView(findViewFor(round[index].target));
  }, [game, round, index]);

  const finish = (finalFirstTry: number) => {
    const stars = starsForRound(finalFirstTry);
    setStarsEarned(stars);
    dispatch({ type: 'earnStars', game, stars });
    setDone(true);
  };

  /** The child pressed Next: record the result (spaced repetition) and move on. */
  const goNext = () => {
    const gotFirstTry = feedback?.kind === 'correct' && misses === 0;
    dispatch(
      gotFirstTry
        ? { type: 'reviewCountry', iso2: question.target }
        : { type: 'missCountry', iso2: question.target },
    );
    const nextFirstTry = firstTry + (gotFirstTry ? 1 : 0);
    setFirstTry(nextFirstTry);
    setMisses(0);
    setWrongPicks(new Set());
    setFeedback(null);
    if (isLast) finish(nextFirstTry);
    else setIndex(index + 1);
  };

  const answer = (iso2: string) => {
    if (done || awaitingNext) return;

    if (iso2 === question.target) {
      setFeedback({
        kind: 'correct',
        text:
          misses === 0
            ? ['Yes! Amazing! 🎉', 'You got it! 🌟', 'Super! 🎈', 'Wow, first try! 🏆'][index % 4]
            : 'You found it! 🎉',
      });
      return;
    }

    const nextMiss = misses + 1;
    setMisses(nextMiss);

    if (game === 'find') {
      // the map game always lets you keep trying — it never reveals-and-skips
      const tapped = COUNTRIES[iso2];
      setFeedback({
        kind: 'wrong-retry',
        text: tapped ? `Not quite — that's ${tapped.name}! Try again!` : 'Not quite — keep looking!',
      });
      return;
    }

    // choice games: two guided retries, then reveal
    setWrongPicks((prev) => new Set(prev).add(iso2));
    if (nextMiss >= REVEAL_AFTER) {
      setFeedback({
        kind: 'wrong-reveal',
        text:
          game === 'flag'
            ? `This is ${target.name}'s flag — now you know it! 💡`
            : `${target.name} loves ${target.dish.name}. Yum! 💡`,
      });
    } else {
      setFeedback({
        kind: 'wrong-retry',
        text: nextMiss === 1 ? 'Not quite — try again! 🤔' : 'So close — one more try! 💪',
      });
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
    setWrongPicks(new Set());
    setFeedback(null);
    setDone(false);
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

  const optionDisabled = (iso2: string) =>
    wrongPicks.has(iso2) || (feedback?.kind === 'wrong-reveal' && iso2 !== question.target);
  const optionClass = (iso2: string, base: string) => {
    const reveal = feedback?.kind === 'wrong-reveal' && iso2 === question.target;
    const correct = feedback?.kind === 'correct' && iso2 === question.target;
    const wrong = wrongPicks.has(iso2);
    return `${base}${reveal || correct ? ' is-right' : ''}${wrong ? ' is-wrong' : ''}`;
  };

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
            Find <b>{target.name}</b>! <span className="hint">({target.famousFor})</span>
          </div>
          <div className="map-holder game-map">
            <WorldMap
              view={mapView}
              neutral
              onSelect={awaitingNext ? undefined : onMapSelect}
              pulse={misses >= 2 || awaitingNext ? question.target : null}
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
                <button
                  key={key}
                  className="chip"
                  onClick={() => setMapView(boxFromBBox(MAP.regions[key], 0.06))}
                >
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
                className={optionClass(iso2, 'option flag-option')}
                onClick={() => answer(iso2)}
                data-testid={`option-${iso2}`}
                disabled={optionDisabled(iso2)}
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
                className={optionClass(iso2, 'option dish-option')}
                onClick={() => answer(iso2)}
                data-testid={`option-${iso2}`}
                disabled={optionDisabled(iso2)}
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
        {feedback?.text ?? ' '}
      </div>

      {/* Change 1: the child presses Next themselves — time to read, and agency. */}
      {awaitingNext && (
        <button className="big-btn next-btn" onClick={goNext} data-testid="next-btn">
          {isLast ? 'See my stars →' : 'Next →'}
        </button>
      )}
    </div>
  );
}
