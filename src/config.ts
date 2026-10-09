// Board geometry and simulation constants shared by core/ and the Phaser views.
export const ROWS = 5;
export const COLS = 9;
/** Columns 0..PLAYER_COLS-1 are the player's grass; the rest is alien ground. */
export const PLAYER_COLS = 5;

/** Native (unscaled) pixel layout, see architecture §3. */
export const VIEW = {
  width: 176,
  height: 108,
  cell: 16,
  panelHeight: 28,
  boardX: 16, // wall is 0..16, cells start here
} as const;

/** Fixed simulation step, seconds. */
export const STEP = 1 / 60;

export const DEBUG = new URLSearchParams(globalThis.location?.search ?? '').get('debug') === '1';
