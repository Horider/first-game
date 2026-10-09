export const ECONOMY = {
  startCoins: 100,
  startHearts: 3,
  // Concept says +10 every 15 s; play-testing with a bot showed that is too little to
  // cover five lanes in wave 1, so the prototype pays +25 every 10 s.
  passiveIncome: 25,
  passiveEvery: 10,
  /** A dropped coin flies to the purse by itself after this many seconds. */
  coinAutoCollect: 5,
  /** Pause before every wave, including the first one. */
  betweenWaves: 10,
  /** Random gap between two enemies of one wave, seconds. */
  spawnGap: [1, 3] as const,
};
