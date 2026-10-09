import { COLS, ROWS } from '../../config';
import { ECONOMY } from '../../data/economy';
import { ENEMIES, type EnemyType } from '../../data/enemies';
import { emit, newId, type GameState } from '../GameState';

function buildQueue(state: GameState, index: number): EnemyType[] {
  const wave = state.level.waves[index];
  const queue: EnemyType[] = [];
  for (const type of Object.keys(ENEMIES) as EnemyType[]) {
    for (let i = 0; i < (wave[type] ?? 0); i++) queue.push(type);
  }
  // Fisher-Yates with the seeded rng, so mixed waves interleave enemy types.
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(state.rng() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  return queue;
}

function spawnGap(state: GameState): number {
  const [min, max] = state.level.spawnGap;
  return min + state.rng() * (max - min);
}

function spawn(state: GameState, type: EnemyType): void {
  const def = ENEMIES[type];
  const hp = Math.round(def.hp * state.level.hpScale);
  const row = Math.floor(state.rng() * ROWS);
  const id = newId(state);
  state.enemies.push({ id, type, row, x: COLS, hp, maxHp: hp, speed: def.speed, state: 'walk' });
  state.wave.spawned++;
  emit(state, { type: 'enemySpawned', id, enemy: type, row });
}

export function startWave(state: GameState): void {
  const wave = state.wave;
  wave.phase = 'spawning';
  wave.queue = buildQueue(state, wave.index);
  wave.timer = 0;
  emit(state, {
    type: 'waveStarted',
    wave: wave.index + 1,
    total: state.level.waves.length,
    big: !!state.level.waves[wave.index].big,
  });
}

export function wavesSystem(state: GameState, dt: number): void {
  const wave = state.wave;
  switch (wave.phase) {
    case 'break':
      wave.timer -= dt;
      if (wave.timer <= 0) startWave(state);
      break;
    case 'spawning':
      wave.timer -= dt;
      if (wave.timer <= 0) {
        const next = wave.queue.shift();
        if (next) spawn(state, next);
        if (wave.queue.length === 0) wave.phase = 'clearing';
        else wave.timer = spawnGap(state);
      }
      break;
    case 'clearing':
      if (state.enemies.length === 0) {
        if (wave.index + 1 >= state.level.waves.length) {
          wave.phase = 'done';
        } else {
          wave.index++;
          wave.phase = 'break';
          wave.timer = ECONOMY.betweenWaves;
        }
      }
      break;
    case 'done':
      break;
  }
}
