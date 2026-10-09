import { defineConfig } from 'vite';

// GitHub Pages serves the game from https://<login>.github.io/first-game/
export default defineConfig({
  base: '/first-game/',
  build: { chunkSizeWarningLimit: 2000 },
});
