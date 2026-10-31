# Round two sheet: today's Launderer and Prospector beside the bigger portrait, then the wheel with two softer letterings.
import sys
from PIL import Image, ImageDraw, ImageFont
from compose import today, lit, up, F, S
W, H = 2540, 1290
sheet = Image.new('RGB', (W, H), '#191310'); d = ImageDraw.Draw(sheet)
def card(x, y, mem, css, label):
    d.rounded_rectangle((x, y, x + 230, y + 300), 14, fill='#d9ceb6')
    m = up(mem, css); sheet.paste(m, (x + 115 - m.width // 2, y + 22), m)
    d.text((x + 115, y + 270), 'LAUNDERER', fill='#2b2018', font=F(20), anchor='mm')
    d.text((x, y + 316), label, fill='#a39078', font=F(22, False))
def seat(x, y, mem, art, css, label):
    d.rounded_rectangle((x, y, x + 300, y + 170), 14, fill='#221a15')
    d.rounded_rectangle((x + 20, y + 30, x + 20 + css * 2 + 16, y + 30 + css * 2 + 16), 8, fill='#6a4a1e')
    a = up(art, css); sheet.paste(a, (x + 28, y + 38), a)
    m = up(mem, css); sheet.paste(m, (x + 50 + css * 2 + 16, y + 38), m)
    d.text((x, y + 186), label, fill='#a39078', font=F(22, False))
d.text((20, 20), 'Today', fill='#f2e8d2', font=F(32))
d.text((640, 20), 'Bigger portrait, accessories worn', fill='#f2e8d2', font=F(32))
nl, npros = today('now_l.json'), today('now_p.json')
bl, bp = lit('b2_launderer.txt', 'pal_b2_gold'), lit('b_prospector.txt', 'pal_b_gold')
card(20, 80, nl, 48, 'shop card'); seat(270, 80, nl, npros, 24, 'seat')
card(640, 80, bl, 64, 'shop card, picture a third bigger'); seat(890, 80, bl, bp, 32, 'seat, a third bigger')
big = up(bl, 128); sheet.paste(big, (1300, 70), big); d.text((1300, 340), 'up close', fill='#a39078', font=F(22, False))
for i, (k, t) in enumerate([('now', 'Wheel today'), ('b2', 'Pixel lettering on the rim only, spaces keep today\'s letters')]):
    x0 = 20 + i * 1260
    d.text((x0, 450), t, fill='#f2e8d2', font=F(28))
    w = Image.open(S + f'wheel-{k}.png').convert('RGB').crop((676, 172, 676 + 1200, 172 + 780))
    sheet.paste(w.crop((0, 0, 820, 780)).resize((820, 780)), (x0, 500)) if False else sheet.paste(w, (x0, 500))
sheet.save(sys.argv[1])
