import '@fontsource/press-start-2p/cyrillic-400.css';
import '@fontsource/press-start-2p/latin-400.css';
import Phaser from 'phaser';
import { VIEW } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: VIEW.width,
  height: VIEW.height,
  backgroundColor: '#14141c',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, GameScene, ResultScene],
});

/**
 * Whole-number zoom so every pixel stays square and sharp. On big screens the game
 * takes about 70% of the window instead of filling it; small phones get the largest fit.
 */
function fitZoom() {
  const fit = (share: number) => Math.floor(Math.min((window.innerWidth * share) / VIEW.width, (window.innerHeight * share) / VIEW.height));
  const zoom = Math.max(1, fit(0.7) >= 3 ? fit(0.7) : fit(1));
  game.scale.setZoom(zoom);
}
window.addEventListener('resize', fitZoom);
game.events.once(Phaser.Core.Events.READY, fitZoom);
