# Big contact sheet: each portrait at 4x plus 1x seat size. usage: view.py in.json out.png [ids,comma]
import sys, json, math
sys.path.insert(0, '/home/user/patrons/design/prototypes/art-v2')
import kit, os
SC = int(os.environ.get('SC', 4)); P = 32 * SC
from PIL import Image, ImageDraw, ImageFont
icons = json.load(open(sys.argv[1]))
if len(sys.argv) > 3: want = sys.argv[3].split(','); icons = [i for i in icons if i['id'] in want]
icons = [i for i in icons if i.get('px')]
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
cols = int(os.environ.get('COLS', 5)); cw, ch = P + 90, P + 30
im = Image.new('RGB', (cols * cw, math.ceil(len(icons) / cols) * ch), kit.TABLE); d = ImageDraw.Draw(im)
for k, ic in enumerate(icons):
    x0, y0 = (k % cols) * cw, (k // cols) * ch
    d.rectangle((x0 + 4, y0 + 4, x0 + P + 8, y0 + P + 8), fill='#d9ceb6')
    b = kit.render(ic, ic['sphere'], SC); im.paste(b, (x0 + 6, y0 + 6), b)
    s = kit.render(ic, ic['sphere'], 1); im.paste(s, (x0 + P + 16, y0 + 10), s)
    s2 = kit.render(ic, ic['sphere'], 2); im.paste(s2, (x0 + P + 16, y0 + 50), s2)
    d.text((x0 + 6, y0 + P + 12), ic['name'][:28], fill='#f2e8d2', font=font)
im.save(sys.argv[2])
