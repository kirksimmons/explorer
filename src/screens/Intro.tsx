import { useState } from 'react';
import { loadItem, saveItem } from '../engine/storage';

const SEEN_KEY = 'world-explorer-intro-v1';

const STEPS = [
  {
    emoji: '🗺️',
    title: 'Welcome, Explorer!',
    body: 'Tap any country on the map to see its flag, a favourite food, and fun facts.',
  },
  {
    emoji: '🎮',
    title: 'Play games!',
    body: 'Find countries, match flags, and guess foods to earn ⭐ stars and cool badges.',
  },
  {
    emoji: '📔',
    title: 'Fill your passport!',
    body: 'Every country you visit gets a sticker. Can you collect the whole world?',
  },
];

/** A three-step welcome shown once on the very first run. */
export default function Intro() {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(() => loadItem(SEEN_KEY) !== 'yes');

  if (!open) return null;

  const close = () => {
    saveItem(SEEN_KEY, 'yes');
    setOpen(false);
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="intro" data-testid="intro">
      <div className="intro-card">
        <button className="intro-skip" onClick={close} data-testid="intro-skip">
          Skip
        </button>
        <div className="intro-emoji">{current.emoji}</div>
        <h2>{current.title}</h2>
        <p>{current.body}</p>
        <div className="intro-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={i === step ? 'dot now' : i < step ? 'dot done' : 'dot'} />
          ))}
        </div>
        <div className="intro-actions">
          {step > 0 && (
            <button className="big-btn alt" onClick={() => setStep(step - 1)}>
              ← Back
            </button>
          )}
          {isLast ? (
            <button className="big-btn" onClick={close} data-testid="intro-start">
              Let's go! 🚀
            </button>
          ) : (
            <button
              className="big-btn"
              onClick={() => setStep(step + 1)}
              data-testid="intro-next"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
