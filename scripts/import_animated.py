"""Turn the animated character sheets (animated-v2 heroes, orcs-animated enemies) into game strips.

usage: python3 scripts/import_animated.py <animated-v2 folder> <orcs-animated folder> public/assets/sprites

Each source sheet is 1448x1086: 4 columns x 3 rows of ~362px cells (idle, run, class action),
painted at a high resolution and not quite aligned to the cells. For every frame we collect the
blobs whose centre lies in that cell, find the character's feet (lowest opaque row) and body
centre (median opaque column), scale down so the character is about one board cell tall, and
paste it into a fixed-size frame with the feet at the same spot. Output: one horizontal strip per
character, 12 frames of FRAME_W x FRAME_H (idle 0-3, run 4-7, action 8-11).

Needs Pillow, numpy and scipy.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

CELL = 362
SCALE = 1 / 8           # 362px cell -> ~45px; characters end up 28-37px tall
FRAME_W, FRAME_H = 48, 40
FOOT_X, FOOT_Y = 24, 38  # where the body centre / feet land inside a frame

HEROES = {
    'archer': 'archer-level-1', 'archer2': 'archer-level-2', 'archer3': 'archer-level-3',
    'swordsman': 'warrior-level-1', 'swordsman2': 'warrior-level-2', 'swordsman3': 'warrior-level-3',
    'shieldbearer': 'shieldbearer-level-1', 'shieldbearer2': 'shieldbearer-level-2',
    'shieldbearer3': 'shieldbearer-level-3',
}
ORCS = {
    f'orc-{kind}{lvl}': f'orc-{kind}-level-{lvl}'
    for kind in ('raider', 'hunter', 'bulwark', 'shaman') for lvl in (1, 2, 3)
}


def frames_of(sheet: Image.Image):
    """Yield 12 RGBA arrays, one per cell, each holding only the blobs centred in that cell."""
    rgba = np.asarray(sheet.convert('RGBA'))
    solid = rgba[..., 3] > 40
    labels, count = ndimage.label(solid, structure=np.ones((3, 3)))
    centres = ndimage.center_of_mass(solid, labels, range(1, count + 1))
    sizes = ndimage.sum(solid, labels, range(1, count + 1))
    cell_of = np.zeros(count + 1, dtype=int) - 1
    for i, ((cy, cx), size) in enumerate(zip(centres, sizes), start=1):
        if size < 12:
            continue  # specks
        cell_of[i] = min(2, int(cy // CELL)) * 4 + min(3, int(cx // CELL))
    for cell in range(12):
        mask = cell_of[labels] == cell
        frame = rgba.copy()
        frame[~mask] = 0
        yield frame


def place(frame: np.ndarray) -> Image.Image:
    ys, xs = np.nonzero(frame[..., 3] > 40)
    foot_y = ys.max()
    # Body centre: median column of the lower two thirds, so raised weapons do not pull it.
    top = ys.min()
    low = ys > top + (foot_y - top) / 3
    centre_x = int(np.median(xs[low]))
    big = Image.fromarray(frame, 'RGBA').convert('RGBa')
    w, h = round(big.width * SCALE), round(big.height * SCALE)
    small = big.resize((w, h), Image.LANCZOS).convert('RGBA')
    px = np.array(small)
    px[..., 3] = np.where(px[..., 3] >= 110, 255, 0)
    out = Image.new('RGBA', (FRAME_W, FRAME_H))
    out.paste(Image.fromarray(px, 'RGBA'), (FOOT_X - round(centre_x * SCALE), FOOT_Y - round(foot_y * SCALE)))
    return out


def convert(src: Path, dst: Path):
    sheet = Image.open(src)
    strip = Image.new('RGBA', (FRAME_W * 12, FRAME_H))
    for i, frame in enumerate(frames_of(sheet)):
        strip.paste(place(frame), (i * FRAME_W, 0))
    strip.save(dst)
    print(dst.name, strip.getbbox())


heroes, orcs, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
for name, file in HEROES.items():
    convert(heroes / f'{file}.png', out / f'{name}.png')
for name, file in ORCS.items():
    convert(orcs / f'{file}.png', out / f'{name}.png')
