"""Cut the sprites the game uses out of the 32rogues sheets (sethbb.itch.io/32rogues).

usage: python3 scripts/import_32rogues.py <path to 32rogues folder> public/assets/sprites

Sheet indices follow the pack's *.txt files ("1.c" = row 1, column c), 32x32 per cell.
"""
import sys
from pathlib import Path
from PIL import Image, ImageOps

LIGHT_SKIN = (0xFC, 0xA8, 0x9D)  # the elf's skin tone from the pack palette


def hex_rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


OUTLINE = (0x1B, 0x0B, 0x0B, 255)


def outline(tile):
    """1px dark outline so green slimes stay readable on the green grass."""
    out = tile.copy()
    for y in range(32):
        for x in range(32):
            if tile.getpixel((x, y))[3]:
                continue
            near = [(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= x + dx < 32 and 0 <= y + dy < 32]
            if any(tile.getpixel(p)[3] for p in near):
                out.putpixel((x, y), OUTLINE)
    return out


# The pack draws characters facing left. Defenders are mirrored to face the enemies on the right;
# enemies already face left, the way they walk, and get an outline.
# The shield knight already holds his shield on the right, towards the enemies.
DEFENDERS = {'archer', 'archer2', 'swordsman', 'swordsman2'}
ENEMIES = {'slime', 'slime-big', 'slimebody', 'slimebody-twins'}

# name: (sheet, cell, skin recolor as (pack colour, only rows above this y) or None)
SPRITES = {
    'archer': ('rogues', '1.c', ('#a84111', 22)),       # ranger, lighter skin (boots keep their colour)
    'archer2': ('rogues', '1.e', None),                 # bandit with the hat
    'swordsman': ('rogues', '2.b', ('#a15c52', 32)),    # male fighter, lighter skin
    'swordsman2': ('rogues', '2.c', None),              # armoured knight
    'shieldbearer': ('rogues', '2.e', None),            # shield knight
    'slime': ('monsters', '3.a', None),
    'slime-big': ('monsters', '3.b', None),
    'slimebody': ('monsters', '3.c', None),
    'slimebody-twins': ('monsters', '3.d', None),
    'coin': ('items', '25.a', None),
    'wall': ('tiles', '2.a', None),                     # rough stone wall
}

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
sheets = {}
for name, (sheet, cell, recolor) in SPRITES.items():
    if sheet not in sheets:
        sheets[sheet] = Image.open(src / f'{sheet}.png').convert('RGBA')
    row, col = cell.split('.')
    x, y = (ord(col) - ord('a')) * 32, (int(row) - 1) * 32
    tile = sheets[sheet].crop((x, y, x + 32, y + 32))
    if recolor:
        old, below = hex_rgb(recolor[0]), recolor[1]
        for py in range(min(below, 32)):
            for px in range(32):
                r, g, b, a = tile.getpixel((px, py))
                if a and (r, g, b) == old:
                    tile.putpixel((px, py), (*LIGHT_SKIN, a))
    if name == 'coin':
        tile = tile.crop(tile.getbbox())  # just the coin, 6x5; the game scales it up
    if name in DEFENDERS:
        tile = ImageOps.mirror(tile)
    if name in ENEMIES:
        tile = outline(tile)
    tile.save(dst / f'{name}.png')
    print(name, tile.getbbox())
