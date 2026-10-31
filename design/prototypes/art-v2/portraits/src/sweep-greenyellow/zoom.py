# Usage: python3 zoom.py <json> <out.png> [ids,comma] [scale] — portraits at scale plus 32px, labelled.
import sys, json
sys.path.insert(0, '/home/user/patrons/design/prototypes/art-v2')
from kit import render
from PIL import Image, ImageDraw
icons = json.load(open(sys.argv[1]))
if len(sys.argv) > 3 and sys.argv[3] not in ('', 'all'): ids = sys.argv[3].split(','); icons = [i for i in icons if i['id'] in ids]
sc = int(sys.argv[4]) if len(sys.argv) > 4 else 4
cw = 32 * sc + 60; cols = 4; rows = (len(icons) + cols - 1) // cols
im = Image.new('RGB', (cols * cw, rows * (32 * sc + 24)), '#d9ceb6'); d = ImageDraw.Draw(im)
for k, ic in enumerate(icons):
    x0, y0 = (k % cols) * cw, (k // cols) * (32 * sc + 24)
    b = render(ic, ic['sphere'], sc); im.paste(b, (x0 + 4, y0 + 4), b)
    s = render(ic, ic['sphere'], 1); im.paste(s, (x0 + 32 * sc + 10, y0 + 4), s)
    d.text((x0 + 4, y0 + 32 * sc + 8), ic['name'], fill='#000')
im.save(sys.argv[2])
