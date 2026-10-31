# before-after.png: each sample's old 32px portrait (old kit, 3x = 96px) beside the new 48px one (2x = 96px), on the table.
import json, os, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'art-v2'))
import kit                      # the old renderer (art-v2/kit.py)
import render, palette as P
SPH = {'benders.launderer': 'colorless', 'thieves.kingpin': 'magenta', 'purple.nightowl': 'purple', 'benders.hr': 'colorless',
       'market.doorman': 'blue', 'yellow.pilgrim': 'yellow'}
old = {o['id']: o for o in json.load(open(os.path.join(HERE, 'old6.json')))}
new = json.load(open(os.path.join(HERE, 'samples.json')))
W, H = 3 * 96 + 48, 96 + 40
im = Image.new('RGB', (W * 3 + 24, H * 2 + 24), P.TABLE); d = ImageDraw.Draw(im)
for i, p in enumerate(new):
    x0, y0 = 24 + (i % 3) * W, 16 + (i // 3) * H
    o = kit.render(old[p['id']], SPH[p['id']], 3); im.paste(o, (x0, y0), o)
    n = render.image(p, 2); im.paste(n, (x0 + 96 + 24, y0), n)
    d.text((x0, y0 + 100), f"{p['name']}: old 32px x3  |  new 48px x2", fill='#bfae94', font=render.font(12))
im.save(os.path.join(HERE, 'before-after.png'))
