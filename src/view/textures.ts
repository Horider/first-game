import Phaser from 'phaser';
import { COLS, PLAYER_COLS, ROWS, VIEW } from '../config';
import { mulberry32 } from '../core/rng';

/** Palette picked from concept/field.png. */
export const COLORS = {
  panel: 0x14141c,
  card: 0x2c2c3a,
  cardBorder: 0x55556e,
  cardSelected: 0xe6b422,
  grassLight: '#5fb54a',
  grassDark: '#4c9a3c',
  grassDot: '#3c8d3c',
  alienLight: '#7b5aa6',
  alienDark: '#68498f',
  alienDot: '#5a3d80',
  stone: '#8a8a96',
  stoneDark: '#5a5a66',
  portalBg: '#2a1840',
  portalRing: '#b14cff',
  portalGlow: '#e7b3ff',
  portalCore: '#3a0a5c',
  gold: '#e6b422',
};

function rect(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Wall, checkerboard lanes and portals in one 176×80 image. */
function drawBoard(ctx: CanvasRenderingContext2D) {
  const { cell, boardX } = VIEW;
  const rand = mulberry32(3);

  // Stone wall: two-tone bricks with offset rows.
  rect(ctx, COLORS.stoneDark, 0, 0, boardX, ROWS * cell);
  for (let y = 0; y < ROWS * cell; y += 4) {
    const shift = (y / 4) % 2 === 0 ? 0 : 4;
    // The canvas clips bricks at the left edge; grass drawn next covers the right one.
    for (let x = -shift; x < boardX; x += 8) rect(ctx, COLORS.stone, x + 1, y + 1, 7, 3);
  }

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = boardX + col * cell;
      const y = row * cell;
      const even = (row + col) % 2 === 0;
      const ours = col < PLAYER_COLS;
      rect(ctx, ours ? (even ? COLORS.grassLight : COLORS.grassDark) : even ? COLORS.alienDark : COLORS.alienLight, x, y, cell, cell);
      const dot = ours ? COLORS.grassDot : COLORS.alienDot;
      for (let i = 0; i < 3; i++) rect(ctx, dot, x + 1 + Math.floor(rand() * 14), y + 1 + Math.floor(rand() * 14), 1, 1);
    }
  }

  // The border between our grass and alien ground.
  rect(ctx, '#ffffff', boardX + PLAYER_COLS * cell, 0, 1, ROWS * cell);

  // Portals: one purple ring per lane.
  const px = boardX + COLS * cell;
  rect(ctx, COLORS.portalBg, px, 0, cell, ROWS * cell);
  for (let row = 0; row < ROWS; row++) {
    const y = row * cell;
    rect(ctx, COLORS.portalRing, px + 4, y + 1, 8, 14);
    rect(ctx, COLORS.portalRing, px + 3, y + 3, 10, 10);
    rect(ctx, COLORS.portalGlow, px + 5, y + 2, 6, 12);
    rect(ctx, COLORS.portalGlow, px + 4, y + 4, 8, 8);
    rect(ctx, COLORS.portalRing, px + 6, y + 3, 4, 10);
    rect(ctx, COLORS.portalRing, px + 5, y + 5, 6, 6);
    rect(ctx, COLORS.portalCore, px + 7, y + 4, 2, 8);
    rect(ctx, COLORS.portalCore, px + 6, y + 6, 4, 4);
  }
}

function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const texture = scene.textures.createCanvas(key, w, h)!;
  draw(texture.getContext());
  texture.refresh();
}

const STAR = [
  '....#....',
  '....#....',
  '...###...',
  '#########',
  '.#######.',
  '..#####..',
  '..##.##..',
  '.##...##.',
  '.#.....#.',
];

/** Small procedural textures that have no sketch: board, arrow, stars, pause icon. */
export function createTextures(scene: Phaser.Scene) {
  canvasTexture(scene, 'board', VIEW.width, ROWS * VIEW.cell, drawBoard);

  canvasTexture(scene, 'arrow', 7, 3, (ctx) => {
    rect(ctx, '#8b5a2b', 1, 1, 5, 1);
    rect(ctx, '#e0e0e0', 6, 1, 1, 1);
    rect(ctx, '#e0e0e0', 0, 0, 1, 1);
    rect(ctx, '#e0e0e0', 0, 2, 1, 1);
  });

  for (const [key, color] of [['star', COLORS.gold], ['star-empty', '#3a3a4a']] as const) {
    canvasTexture(scene, key, 9, 9, (ctx) => {
      STAR.forEach((line, y) => [...line].forEach((c, x) => c === '#' && rect(ctx, color, x, y, 1, 1)));
    });
  }

  canvasTexture(scene, 'pause', 10, 10, (ctx) => {
    rect(ctx, '#55556e', 0, 0, 10, 10);
    rect(ctx, '#2c2c3a', 1, 1, 8, 8);
    rect(ctx, '#ffffff', 3, 3, 1, 4);
    rect(ctx, '#ffffff', 6, 3, 1, 4);
  });

  canvasTexture(scene, 'play', 10, 10, (ctx) => {
    rect(ctx, '#55556e', 0, 0, 10, 10);
    rect(ctx, '#2c2c3a', 1, 1, 8, 8);
    rect(ctx, '#ffffff', 4, 2, 1, 6);
    rect(ctx, '#ffffff', 5, 3, 1, 4);
    rect(ctx, '#ffffff', 6, 4, 1, 2);
  });

  canvasTexture(scene, 'pixel', 1, 1, (ctx) => rect(ctx, '#ffffff', 0, 0, 1, 1));
}
