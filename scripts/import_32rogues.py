"""Cut the coin and the wall tile out of the 32rogues sheets (sethbb.itch.io/32rogues).

usage: python3 scripts/import_32rogues.py <path to 32rogues folder> public/assets/sprites

Sheet indices follow the pack's *.txt files ("1.c" = row 1, column c), 32x32 per cell.
"""
import sys
from pathlib import Path
from PIL import Image

SPRITES = {
    'coin': ('items', '25.a'),
    'wall': ('tiles', '2.a'),  # rough stone wall
}

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
sheets = {}
for name, (sheet, cell) in SPRITES.items():
    if sheet not in sheets:
        sheets[sheet] = Image.open(src / f'{sheet}.png').convert('RGBA')
    row, col = cell.split('.')
    x, y = (ord(col) - ord('a')) * 32, (int(row) - 1) * 32
    tile = sheets[sheet].crop((x, y, x + 32, y + 32))
    if name == 'coin':
        tile = tile.crop(tile.getbbox())  # just the coin, 6x5; the game scales it up
    tile.save(dst / f'{name}.png')
    print(name, tile.getbbox())
