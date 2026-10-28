# The calibration sheet: today beside three directions, at the board's real sizes (drawn at 2x for a sharp screen).
import json, sys, subprocess
from PIL import Image, ImageDraw, ImageFont
from pix import outline, render
S = '/tmp/claude-0/s/'
F = lambda n, b=True: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), n)
def today(name):
    g = json.load(open(S + name)); return render(g, {}, 1)
def lit(txt, pal):
    import importlib; P = importlib.import_module(pal)
    rows = open(txt).read().split('\n')
    return render(outline(rows, lambda hit: P.OUT.get(hit[0], '#0a0f0e')), P.PAL, 1)
def printed(txt):
    subprocess.run(['python3', 'c_print.py', txt, S + 'tmp_c.png', '#d49b27', '1'], check=True)
    return Image.open(S + 'tmp_c.png').copy()
cols = [
  ('Today', today('now_l.json'), today('now_p.json'), 'now', 24),
  ('1  Sharper pixels', lit('a_launderer.txt', 'pal_a_gold'), lit('a_prospector.txt', 'pal_a_gold'), 'a', 24),
  ('2  Bigger portraits', lit('b_launderer.txt', 'pal_b_gold'), lit('b_prospector.txt', 'pal_b_gold'), 'b', 32),
  ('3  Printed', printed('b_launderer.txt'), printed('b_prospector.txt'), 'c', 32),
]
CW, W, H = 635, 2540, 1260
sheet = Image.new('RGB', (W, H), '#191310'); d = ImageDraw.Draw(sheet)
def up(im, css):  # css px at 2x device pixels, integer scale
    k = css * 2 // im.width; return im.resize((im.width * k, im.height * k), Image.NEAREST)
for i, (title, mem, art, wk, grid) in enumerate(cols):
    x0 = i * CW + 20
    d.text((x0, 24), title, fill='#f2e8d2', font=F(34))
    # shop card: picture 48 css (B and C: 48 too, three device pixels per art pixel on this screen)
    d.rounded_rectangle((x0, 90, x0 + 210, 90 + 270), 14, fill='#d9ceb6')
    m = up(mem, 48); sheet.paste(m, (x0 + 105 - m.width // 2, 110), m)
    d.text((x0 + 105, 300), 'LAUNDERER', fill='#2b2018', font=F(20), anchor='mm')
    # the seat: member and artifact at the seat's size
    d.rounded_rectangle((x0 + 230, 90, x0 + 600, 360), 14, fill='#221a15')
    d.text((x0 + 250, 104), 'in a seat', fill='#a39078', font=F(20, False))
    ts = 24 if grid == 24 else 32
    d.rounded_rectangle((x0 + 250, 150, x0 + 250 + ts * 2 + 16, 150 + ts * 2 + 16), 8, fill='#6a4a1e')
    a = up(art, ts); sheet.paste(a, (x0 + 258, 158), a)
    m2 = up(mem, ts); sheet.paste(m2, (x0 + 250 + ts * 2 + 40, 158), m2)
    d.text((x0 + 250, 150 + ts * 2 + 40), 'artifact · member', fill='#a39078', font=F(18, False))
    # the wheel and its spaces
    wimg = Image.open(S + f'wheel-{wk}.png').convert('RGB').crop((716, 172, 716 + 600, 172 + 720))
    sheet.paste(wimg, (x0 + 5, 390))
notes = ['', 'Same size, cleaner light,\nwarm outlines, clearer props.', 'Bigger, more detailed people\nin their color\'s doorway.\nPixel lettering on the wheel.', 'Ink, paper and one color,\nlike a printed tarot card.']
for i, n in enumerate(notes):
    d.multiline_text((i * CW + 25, 1128), n, fill='#cfc2a6', font=F(26, False), spacing=8)
sheet.save(sys.argv[1])
