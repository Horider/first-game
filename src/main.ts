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

/** Largest whole-number zoom that fits the window, so every pixel stays square and sharp. */
function fitZoom() {
  const zoom = Math.max(1, Math.floor(Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height)));
  game.scale.setZoom(zoom);
}
window.addEventListener('resize', fitZoom);
game.events.once(Phaser.Core.Events.READY, fitZoom);
