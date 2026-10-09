import { beforeEach, describe, expect, it } from 'vitest';
import { isUnlocked, loadSave, recordWin } from '../src/save/storage';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  } as Storage;
});

describe('save', () => {
  it('starts with only level 1 open', () => {
    const save = loadSave();
    expect(isUnlocked(save, 1)).toBe(true);
    expect(isUnlocked(save, 2)).toBe(false);
  });

  it('a win opens the next level and keeps the best stars', () => {
    recordWin(1, 2);
    recordWin(1, 1);
    const save = loadSave();
    expect(save.stars[1]).toBe(2);
    expect(isUnlocked(save, 2)).toBe(true);
    expect(isUnlocked(save, 3)).toBe(false);
  });

  it('a broken save is replaced by an empty one', () => {
    store.set('kapli.save', '{not json');
    expect(loadSave().stars).toEqual({});
  });
});
