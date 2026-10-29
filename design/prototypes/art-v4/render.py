"""Render art-v4 samples: per-style sheets + 8x zooms + samples.png.
python3 render.py  (reads samples.json written by build.py)"""
import json, os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
BG = (0xe9, 0xdc, 0xc4)
SHEET_BG = (0x2b, 0x27, 0x2a)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONTB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def raw(p):
    rows, pal = p['grid'], p['pal']
    h, w = len(rows), max(len(r) for r in rows)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch == '.':
                continue
            if ch not in pal:
                raise KeyError(f"{p['id']}: key {ch!r} at {x},{y} not in palette")
            im.putpixel((x, y), hexrgb(pal[ch]) + (255,))
    return im


def card(p, size):
    """The portrait on the card colour at a css size (nearest neighbour)."""
    im = raw(p).resize((size, size), Image.NEAREST)
    bg = Image.new('RGBA', (size, size), BG + (255,))
    bg.alpha_composite(im)
    return bg.convert('RGB')


def font(sz, bold=False):
    return ImageFont.truetype(FONTB if bold else FONT, sz)


def style_sheet(style, items, out):
    pad = 16
    colw = 96 + 64 + 32 + pad * 4
    W = pad + colw * len(items)
    H = 40 + 96 + 30 + pad
    im = Image.new('RGB', (W, H), SHEET_BG)
    d = ImageDraw.Draw(im)
    d.text((pad, 10), style['title'], fill=(240, 232, 220), font=font(16, True))
    for i, p in enumerate(items):
        x = pad + i * colw
        y = 40
        for s in (96, 64, 32):
            im.paste(card(p, s), (x, y))
            x += s + pad
        d.text((pad + i * colw, y + 100), f"{p['name']}  ({len(p['grid'][0])}x{len(p['grid'])})", fill=(220, 210, 196), font=font(13))
    im.save(out)


def zoom(p, out, z=8):
    w = len(p['grid'][0]) * z
    scale = max(1, (32 * 8) // len(p['grid'][0]))
    im = raw(p)
    s = im.width * scale
    big = im.resize((s, s), Image.NEAREST)
    bg = Image.new('RGBA', (s, s), BG + (255,))
    bg.alpha_composite(big)
    bg.convert('RGB').save(out)


def samples(styles, out):
    pad = 14
    labw = 175
    cell = 96 + pad + 32 + pad
    W = labw + cell * 4 + pad
    rowh = 96 + 34
    H = 20 + rowh * len(styles) + pad
    im = Image.new('RGB', (W, H), SHEET_BG)
    d = ImageDraw.Draw(im)
    for r, (st, items) in enumerate(styles):
        y = 20 + r * rowh
        d.text((pad, y + 30), st['short'], fill=(240, 232, 220), font=font(15, True))
        d.text((pad, y + 52), st['sub'], fill=(190, 180, 168), font=font(11))
        for c, p in enumerate(items):
            x = labw + c * cell
            im.paste(card(p, 96), (x, y))
            im.paste(card(p, 32), (x + 96 + pad, y + 64))
            d.text((x, y + 100), p['name'], fill=(220, 210, 196), font=font(13))
    im.save(out)


if __name__ == '__main__':
    import sys
    SET = sys.argv[1] if len(sys.argv) > 1 else 'samples'
    data = json.load(open(os.path.join(HERE, SET + '.json')))
    allrows = []
    for st in data['styles']:
        items = st['portraits']
        d = os.path.join(HERE, SET, st['id'])
        os.makedirs(d, exist_ok=True)
        style_sheet(st, items, os.path.join(d, 'sheet.png'))
        for p in items:
            zoom(p, os.path.join(d, p['id'] + '-8x.png'))
        allrows.append((st, items))
    samples(allrows, os.path.join(HERE, SET + '.png'))
    print('ok')
