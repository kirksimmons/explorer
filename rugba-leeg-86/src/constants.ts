// All tuning lives here. Distances in internal pixels, times in seconds.
export const VIEW_W = 480;
export const VIEW_H = 270;

export const FIELD_W = 1000;
export const FIELD_H = 220;
export const FIELD_Y = 44; // field strip's top edge within the 270px view (grandstand above)
export const TRY_LINE_A = 100; // team 1 scores here (attacks -x)
export const TRY_LINE_B = 900; // team 0 scores here (attacks +x)
export const DEAD_A = 60;
export const DEAD_B = 940;

export const SIM_DT = 1 / 60;
export const PLAYERS_PER_TEAM = 7;

export const PLAYER_SPEED = 85;
export const SPRINT_MULT = 1.5;
export const ONFIRE_MULT = 1.15;
export const TURBO_MAX = 100;
export const TURBO_DRAIN = 45;
export const TURBO_REGEN = 18;
export const PLAYER_ACCEL = 8; // vel lerp rate per second

export const CONTACT_RADIUS = 10;
export const BUMP_WIN_CHANCE = 0.55;
export const BUMP_ONFIRE_BONUS = 0.25;
export const TACKLE_KNOCKON_CHANCE = 0.04;
export const BIGHIT_KNOCKON_CHANCE = 0.12;
export const RAGDOLL_TIME = 1.2;
export const RAGDOLL_JANK_CHANCE = 0.15;
export const TACKLE_HITSTOP = 0.4;

export const PASS_SPEED = 220;
export const PASS_MAX_DIST = 90;
export const PASS_BEHIND_TOLERANCE = 2;

export const KICK_SPEED = 260;
export const KICK_GRAVITY = 420;
export const KICK_BOUNCE_JANK = 60;
export const PICKUP_RADIUS = 8;
export const DROP_GOAL_RANGE = 220; // max distance from posts to offer drop goal

export const PLAY_THE_BALL_TIME = 0.8;
export const DEFENSE_RETREAT_DIST = 55;

export const AI_PASS_PANIC_DIST = 18;
export const SUPPORT_SLOT_DEPTH = 20;
export const SUPPORT_SLOT_SPACING = 22;
export const DEFENSE_LINE_OFFSET = 30;

export const HALF_LENGTH = 150;
export const TACKLES_PER_SET = 6;
export const POINTS_TRY = 4;
export const POINTS_CONVERSION = 2;
export const POINTS_DROP_GOAL = 1;
export const CONVERSION_SWEEP_SPEED = 1.6; // full sweeps per second
export const CONVERSION_ZONE = 0.18;
export const DROPGOAL_ZONE = 0.1;

export const RUBBERBAND_PER_POINT = 0.015;
export const RUBBERBAND_CAP = 0.12;

export const SHAKE_TACKLE = 3;
export const SHAKE_BIGHIT = 7;
export const SHAKE_TRY = 5;
export const FIRE_STREAK_N = 3;

export const HUMAN_TEAM = 0;
