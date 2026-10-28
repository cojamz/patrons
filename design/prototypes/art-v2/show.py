import sys, importlib
from pix import *
from PIL import Image
# usage: show.py out.png scale name:palette_module ...
out, scale = sys.argv[1], int(sys.argv[2]); ims = []
for spec in sys.argv[3:]:
    name, palmod, mode = spec.split(':')
    rows = open(name).read().split('\n')
    P = importlib.import_module(palmod)
    rows = outline(rows, P.ink if mode == 'ink' else (lambda hit: P.OUT.get(hit[0], 'k')))
    ims.append(render(rows, {**P.PAL, 'k': P.PAL.get('k', '#0a0f0e')}, scale))
W = sum(i.width for i in ims) + 16 * (len(ims) + 1); H = max(i.height for i in ims) + 32
c = Image.new('RGBA', (W, H), (25, 19, 16, 255)); x = 16
for i in ims: c.alpha_composite(i, (x, 16)); x += i.width + 16
c.save(out)
