"""Cut Orc animations from the Tiny RPG Character Asset Pack (zerie.itch.io) into game sheets.

Each 100x100 pack frame is cropped to the 50x50 middle (the character is ~22x16 px)
and mirrored, because the pack's characters face right and our enemies walk left.

usage: python3 scripts/import_pack.py "<pack>/Characters(100x100 split)/Orc/Orc" public/assets/sprites
"""
import sys
from pathlib import Path
from PIL import Image, ImageOps

FRAME, CROP = 100, (25, 25, 75, 75)
ANIMS = {'walk': 'Orc_Walk.png', 'attack': 'Orc_Attack01.png', 'hurt': 'Orc_Hurt.png', 'death': 'Orc_Death.png'}

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
for name, file in ANIMS.items():
    strip = Image.open(src / file).convert('RGBA')
    count = strip.width // FRAME
    size = CROP[2] - CROP[0]
    sheet = Image.new('RGBA', (size * count, size))
    for i in range(count):
        frame = strip.crop((i * FRAME + CROP[0], CROP[1], i * FRAME + CROP[2], CROP[3]))
        sheet.paste(ImageOps.mirror(frame), (i * size, 0))
    sheet.save(dst / f'orc-{name}.png')
    print(f'orc-{name}.png', count, 'frames')
