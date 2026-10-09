import { VIEW } from '../config';

/** Board cells and positions in native pixels (x in cells may be fractional). */
export const cellX = (x: number) => VIEW.boardX + x * VIEW.cell;
export const rowY = (row: number) => VIEW.panelHeight + row * VIEW.cell;

export function cellAt(px: number, py: number): { row: number; col: number } | null {
  const col = Math.floor((px - VIEW.boardX) / VIEW.cell);
  const row = Math.floor((py - VIEW.panelHeight) / VIEW.cell);
  if (row < 0 || row >= 5 || col < 0 || col >= 9) return null;
  return { row, col };
}

/** Where coins fly when they are collected (the purse icon in the panel). */
export const PURSE = { x: 59, y: 14 };
