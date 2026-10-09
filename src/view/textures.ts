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

/** Checkerboard lanes and portals in one image; the stone wall is drawn from the pack's tile. */
function drawBoard(ctx: CanvasRenderingContext2D) {
  const { cell, boardX } = VIEW;
  const rand = mulberry32(3);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = boardX + col * cell;
      const y = row * cell;
      const even = (row + col) % 2 === 0;
      const ours = col < PLAYER_COLS;
      rect(ctx, ours ? (even ? COLORS.grassLight : COLORS.grassDark) : even ? COLORS.alienDark : COLORS.alienLight, x, y, cell, cell);
      const dot = ours ? COLORS.grassDot : COLORS.alienDot;
      for (let i = 0; i < 5; i++) {
        const dx = 2 + Math.floor(rand() * 27);
        const dy = 2 + Math.floor(rand() * 27);
        rect(ctx, dot, x + dx, y + dy, 2, 1);
        if (ours && i % 2 === 0) rect(ctx, dot, x + dx + 1, y + dy - 2, 1, 2); // a tuft of grass
      }
    }
  }

  // The border between our grass and alien ground.
  rect(ctx, '#ffffff', boardX + PLAYER_COLS * cell, 0, 1, ROWS * cell);

  // Portals: one purple ring per lane, drawn on a 2× grid to match the 32 px sprites.
  const px = boardX + COLS * cell;
  const p = (color: string, x: number, y: number, w: number, h: number) => rect(ctx, color, px + x * 2, y * 2, w * 2, h * 2);
  rect(ctx, COLORS.portalBg, px, 0, cell, ROWS * cell);
  for (let row = 0; row < ROWS; row++) {
    const y = row * 16;
    p(COLORS.portalRing, 4, y + 1, 8, 14);
    p(COLORS.portalRing, 3, y + 3, 10, 10);
    p(COLORS.portalGlow, 5, y + 2, 6, 12);
    p(COLORS.portalGlow, 4, y + 4, 8, 8);
    p(COLORS.portalRing, 6, y + 3, 4, 10);
    p(COLORS.portalRing, 5, y + 5, 6, 6);
    p(COLORS.portalCore, 7, y + 4, 2, 8);
    p(COLORS.portalCore, 6, y + 6, 4, 4);
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

  // Arrow in the pack's palette: green fletching, orange shaft, pale tip.
  canvasTexture(scene, 'arrow', 12, 5, (ctx) => {
    rect(ctx, '#e17b50', 2, 2, 8, 1);
    rect(ctx, '#def9fc', 10, 1, 1, 3);
    rect(ctx, '#def9fc', 11, 2, 1, 1);
    rect(ctx, '#07bb79', 0, 0, 2, 1);
    rect(ctx, '#07bb79', 0, 4, 2, 1);
    rect(ctx, '#07bb79', 1, 1, 2, 1);
    rect(ctx, '#07bb79', 1, 3, 2, 1);
  });

  // Level-up badge shown over defenders that can be upgraded.
  canvasTexture(scene, 'upgrade', 7, 7, (ctx) => {
    rect(ctx, '#1b0b0b', 0, 0, 7, 7);
    rect(ctx, '#00ff8c', 3, 1, 1, 5);
    rect(ctx, '#00ff8c', 2, 2, 3, 1);
    rect(ctx, '#00ff8c', 1, 3, 5, 1);
  });

  for (const [key, color] of [['star', COLORS.gold], ['star-empty', '#3a3a4a']] as const) {
    canvasTexture(scene, key, 9, 9, (ctx) => {
      STAR.forEach((line, y) => [...line].forEach((c, x) => c === '#' && rect(ctx, color, x, y, 1, 1)));
    });
  }

  canvasTexture(scene, 'pause', 8, 8, (ctx) => {
    rect(ctx, '#ffffff', 1, 1, 2, 6);
    rect(ctx, '#ffffff', 5, 1, 2, 6);
  });

  canvasTexture(scene, 'play', 8, 8, (ctx) => {
    for (let i = 0; i < 4; i++) rect(ctx, '#ffffff', 2 + i, 1 + i, 1, 6 - i * 2);
  });

  canvasTexture(scene, 'pixel', 1, 1, (ctx) => rect(ctx, '#ffffff', 0, 0, 1, 1));
}
