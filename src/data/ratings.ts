import { DEFENDERS, type DefenderType } from './defenders';
import { ENEMIES, type EnemyType } from './enemies';

/** Power, speed and life on a 0–10 scale, for the info panel. */
export interface Ratings {
  power: number;
  speed: number;
  life: number;
}

/** Scale a value so the strongest unit of its group gets 10, rounding up so small gaps still show. */
function score(value: number, max: number): number {
  if (value <= 0) return 0;
  return Math.ceil((value / max) * 10 - 1e-9);
}

/** Health spans 60 to 950, so it is scored on a square-root curve to keep archers off zero. */
const lifeScore = (hp: number, max: number) => score(Math.sqrt(hp), Math.sqrt(max));

const defenderTypes = Object.keys(DEFENDERS) as DefenderType[];
const enemyTypes = Object.keys(ENEMIES) as EnemyType[];
const attacksPerSecond = (t: DefenderType) => (DEFENDERS[t].attackEvery > 0 ? 1 / DEFENDERS[t].attackEvery : 0);

/** Defenders: power = damage per hit, speed = attacks per second, life = health. */
export function defenderRatings(type: DefenderType): Ratings {
  const max = (f: (t: DefenderType) => number) => Math.max(...defenderTypes.map(f));
  return {
    power: score(DEFENDERS[type].damage, max((t) => DEFENDERS[t].damage)),
    speed: score(attacksPerSecond(type), max(attacksPerSecond)),
    life: lifeScore(DEFENDERS[type].hp, max((t) => DEFENDERS[t].hp)),
  };
}

/** Orcs: power = damage per second, speed = walking speed, life = base health. */
export function enemyRatings(type: EnemyType): Ratings {
  const max = (f: (t: EnemyType) => number) => Math.max(...enemyTypes.map(f));
  return {
    power: score(ENEMIES[type].dps, max((t) => ENEMIES[t].dps)),
    speed: score(ENEMIES[type].speed, max((t) => ENEMIES[t].speed)),
    life: lifeScore(ENEMIES[type].hp, max((t) => ENEMIES[t].hp)),
  };
}
