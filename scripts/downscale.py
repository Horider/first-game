"""Shrink concept sprites (drawn at 8x) to 1x game sprites with nearest-neighbor."""
import sys
from pathlib import Path
from PIL import Image

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
for f in sorted(src.glob('*.png')):
    im = Image.open(f).convert('RGBA')
    small = im.resize((im.width // 8, im.height // 8), Image.NEAREST)
    small.save(dst / f.name)
    print(f.name, small.size)
