# Close-up viewer: python3 view.py <json> <out.png> [scale] [ids...]  -> grid of portraits at scale, plus a 32px seat strip.
import sys, json
sys.path.insert(0, "/home/user/patrons/design/prototypes/art-v2")
import kit
from PIL import Image, ImageDraw, ImageFont
icons = json.load(open(sys.argv[1])); out = sys.argv[2]
sc = int(sys.argv[3]) if len(sys.argv) > 3 else 4
ids = sys.argv[4:]
if ids: icons = [i for i in icons if any(x in i['id'] for x in ids)]
cols = 6 if len(icons) > 3 else len(icons); cw = 32 * sc + 8; ch = 32 * sc + 24
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
rows = (len(icons) + cols - 1) // cols
per = 12; srows = (len(icons) + per - 1) // per; seatH = srows * 72 + 8
im = Image.new('RGB', (cols * cw, rows * ch + seatH * 2), kit.TABLE); d = ImageDraw.Draw(im)
for k, ic in enumerate(icons):
    x0, y0 = (k % cols) * cw + 4, (k // cols) * ch + 4
    r = kit.render(ic, ic['sphere'], sc); im.paste(r, (x0, y0), r)
    d.text((x0, y0 + 32 * sc + 2), ic['id'][:24], fill='#f2e8d2', font=font)
# seat strips at 2x of 32px (true pixels doubled), in sphere then colorless
for s, sph in enumerate([None, 'colorless']):
    strip = Image.new('RGB', (min(len(icons), per) * 36 + 4, srows * 36), kit.TABLE)
    for k, ic in enumerate(icons):
        r = kit.render(ic, sph or ic['sphere'], 1); strip.paste(r, (4 + (k % per) * 36, 2 + (k // per) * 36), r)
    strip = strip.resize((strip.width * 2, strip.height * 2), Image.NEAREST)
    im.paste(strip.crop((0, 0, min(strip.width, im.width), strip.height)), (0, rows * ch + s * seatH))
im.save(out)
