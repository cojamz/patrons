# Round three sheet: the Launderer who does the washing, the lettering candidates, the wheel in the default pick.
import sys, importlib
from PIL import Image, ImageDraw
from compose import today, lit, up, F, S

W, H = 2540, 2540
sheet = Image.new('RGB', (W, H), '#191310'); d = ImageDraw.Draw(sheet)
def card(x, y, mem, css):
    d.rounded_rectangle((x, y, x + 230, y + 300), 14, fill='#d9ceb6')
    m = up(mem, css); sheet.paste(m, (x + 115 - m.width // 2, y + 22), m)
    d.text((x + 115, y + 270), 'LAUNDERER', fill='#2b2018', font=F(20), anchor='mm')
def seat(x, y, mem, css):
    d.rounded_rectangle((x, y, x + 200, y + 120), 14, fill='#221a15')
    m = up(mem, css); sheet.paste(m, (x + 100 - m.width // 2, y + 60 - m.height // 2), m)
nl = today('now_l.json'); bl = lit('b3_launderer.txt', 'pal_b3_neutral')
d.text((20, 20), 'Today', fill='#f2e8d2', font=F(32)); d.text((560, 20), 'Launderer, round three', fill='#f2e8d2', font=F(32))
card(20, 80, nl, 48); seat(270, 80, nl, 24)
card(560, 80, bl, 64); seat(810, 80, bl, 32)
big = up(bl, 160); sheet.paste(big, (1060, 70), big)
d.text((20, 440), 'Lettering: slightly pixelated, still readable', fill='#f2e8d2', font=F(32))
spec = Image.open(S + 'spec.png').convert('RGB').crop((0, 0, 2540, 760)); sheet.paste(spec, (0, 490))
for i, (k, t) in enumerate([('now', 'Wheel today'), ('hj', 'Wheel in 5 Handjet')]):
    x0 = 20 + i * 1260
    d.text((x0, 1290), t, fill='#f2e8d2', font=F(32))
    w = Image.open(S + f'wheel-{k}.png').convert('RGB').crop((676, 172, 676 + 1200, 172 + 1180)); sheet.paste(w, (x0, 1350))
sheet.save(sys.argv[1])
