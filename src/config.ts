// Board geometry and simulation constants shared by core/ and the Phaser views.
export const ROWS = 5;
export const COLS = 9;
/** Columns 0..PLAYER_COLS-1 are the player's grass; the rest is alien ground. */
export const PLAYER_COLS = 5;

/** Native (unscaled) pixel layout. Cells match the 32×32 sprites of the 32rogues pack. */
export const VIEW = {
  width: 352, // wall 32 + 9 cells × 32 + portals 32
  height: 216, // panel 56 + 5 lanes × 32
  cell: 32,
  panelHeight: 56,
  boardX: 32, // the wall is 0..32, cells start here
} as const;

/** Fixed simulation step, seconds. */
export const STEP = 1 / 60;

export const DEBUG = new URLSearchParams(globalThis.location?.search ?? '').get('debug') === '1';
