export const ECONOMY = {
  startHearts: 3,
  // Concept says +10 every 15 s; play-testing with a bot showed that is too little to
  // cover five lanes in wave 1, so the prototype pays +25 every 10 s.
  passiveIncome: 25,
  passiveEvery: 10,
  /** A dropped coin flies to the purse by itself after this many seconds. */
  coinAutoCollect: 5,
  /** Time to set up before the first wave. */
  firstWave: 15,
  /** Pause between waves. */
  betweenWaves: 10,
};
