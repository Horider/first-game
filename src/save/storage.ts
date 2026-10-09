/** Progress kept in the player's browser: unlocked levels and best stars. */
export interface SaveData {
  version: 1;
  /** Best stars per level id; a level is unlocked when the previous one has any stars. */
  stars: Record<string, number>;
}

const KEY = 'kapli.save';

function empty(): SaveData {
  return { version: 1, stars: {} };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const data = JSON.parse(raw) as Partial<SaveData>;
    if (data.version !== 1 || typeof data.stars !== 'object' || !data.stars) return empty();
    const stars: Record<string, number> = {};
    for (const [id, n] of Object.entries(data.stars)) if (typeof n === 'number') stars[id] = Math.max(0, Math.min(3, n));
    return { version: 1, stars };
  } catch {
    // Private mode or blocked storage: play without remembering anything.
    return empty();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Same as above; progress just is not kept.
  }
}

export function recordWin(levelId: number, stars: number): SaveData {
  const data = loadSave();
  data.stars[levelId] = Math.max(data.stars[levelId] ?? 0, stars);
  writeSave(data);
  return data;
}

export function isUnlocked(data: SaveData, levelId: number): boolean {
  return levelId === 1 || (data.stars[levelId - 1] ?? 0) > 0;
}
