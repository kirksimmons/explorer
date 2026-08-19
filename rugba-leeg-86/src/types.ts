export interface Vec2 {
  x: number;
  y: number;
}

export type PlayerState = 'run' | 'ragdoll' | 'gettingUp';

export interface Player {
  id: number;
  team: 0 | 1;
  pos: Vec2;
  vel: Vec2;
  state: PlayerState;
  stateTimer: number; // time left in ragdoll/gettingUp
  turbo: number;
  fireStreak: number;
  onFire: boolean;
  jank: boolean; // this ragdoll slides comically far
}

export interface Ball {
  pos: Vec2;
  z: number;
  vz: number;
  vel: Vec2;
  carrier: number | null;
  inFlight: 'pass' | 'kick' | null;
  passTarget: number | null;
}

export type GamePhase =
  | 'title'
  | 'kickoff'
  | 'openPlay'
  | 'tackleMade'
  | 'playTheBall'
  | 'try'
  | 'kickMeter'
  | 'halftime'
  | 'fulltime';

export type HandoverReason = 'sixthTackle' | 'knockOn' | 'touch' | 'kickCaught';

export type SimEvent =
  | { type: 'tackle' }
  | { type: 'bigHit' }
  | { type: 'knockOn' }
  | { type: 'handover'; reason: HandoverReason }
  | { type: 'pass' }
  | { type: 'kick' }
  | { type: 'try'; team: 0 | 1 }
  | { type: 'kickGood'; points: number }
  | { type: 'kickMissed' }
  | { type: 'onFire'; playerId: number }
  | { type: 'lastTackle' }
  | { type: 'whistle' }
  | { type: 'halftime' }
  | { type: 'fulltime' };

export interface MatchState {
  phase: GamePhase;
  phaseTimer: number;
  players: Player[];
  ball: Ball;
  score: [number, number];
  tackleCount: number;
  attackingTeam: 0 | 1;
  mark: Vec2; // play-the-ball spot
  clock: number;
  half: 1 | 2;
  clockExpired: boolean;
  controlledId: number;
  rngState: number;
  shake: number;
  events: SimEvent[];
  // kick meter
  meterT: number; // sweep position 0..1 (bounces)
  meterDir: 1 | -1;
  meterKind: 'conversion' | 'dropGoal' | null;
  meterZone: number; // sweet-zone half-width as fraction
}

export interface InputState {
  moveX: number; // -1..1
  moveY: number;
  sprintHeld: boolean;
  passPressed: boolean;
  kickPressed: boolean;
  startPressed: boolean; // tap/enter to advance title/halftime/fulltime
}
