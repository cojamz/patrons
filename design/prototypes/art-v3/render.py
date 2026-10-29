# Render v3 portraits.
#   python3 render.py sheet samples.json out.png [ids...]   every portrait at 4x, 2x, 1x on the card and the table, grey 2x
#   python3 render.py one samples.json <id> outdir          <id>-{1,2,4}x-{table,card}.png and <id>-grey-4x.png
#   python3 render.py swatches out.png                      every ramp
import json, sys
from PIL import Image, ImageDraw, ImageFont
import palette as P

N = 48
FILM = {':': ('ffffff', 0.14), '^': ('1c1424', 0.42), '"': ('ffffff', 0.85)}  # see-through: film, shade rim, lit rim

def arch_mask():
    """The doorway: inside the canvas less a 1px margin, round-topped (a half circle of radius 22.5)."""
    m = [[False] * N for _ in range(N)]
    cx, cy, r = 24.0, 23.5, 22.6
    for y in range(1, N):
        for x in range(1, N - 1):
            px, py = x + 0.5, y + 0.5
            if py < cy and (px - cx) ** 2 + (py - cy) ** 2 > r * r: continue
            m[y][x] = True
    return m

ARCH = arch_mask()

def grid(icon, sphere=None, door=False):
    """48x48 list of colors, None = transparent. A color is '#rrggbb', or '#rrggbbaa' for film.
    Members have no doorway (door=False): the card or seat behind them is the backdrop."""
    col, lit, shade, _ = P.palette(icon, sphere)
    px = icon['px']
    g = [[None] * N for _ in range(N)]
    if door:
        pn = P.panel(sphere or icon.get('sphere'))
        for y in range(N):
            for x in range(N):
                if not ARCH[y][x]: continue
                edge = any(not (0 <= x + a < N and 0 <= y + b < N and ARCH[y + b][x + a]) for a, b in ((1, 0), (-1, 0), (0, -1)))
                g[y][x] = pn['frame'] if edge else (pn['lit'] if x + 0.6 * y < 24 else pn['back'])
    at = lambda x, y: px[y][x] if 0 <= x < N and 0 <= y < N else '.'
    for y in range(N):
        for x in range(N):
            k = px[y][x]
            if k in FILM:  # film (a soap bubble): a color at an alpha over whatever is behind, never outlined
                g[y][x] = '#%s%02x' % (FILM[k][0], round(FILM[k][1] * 255)); continue
            if k != '.': g[y][x] = col[k]; continue
            # sel-out: an empty pixel touching the figure (4-neighbours) becomes an outline. If the shape is to its
            # right or below (the lit top-left side), the shape's own darkest step; otherwise the portrait's one
            # shared outline color (shade[]). The shadow side wins when both touch.
            for (a, b, litside) in ((1, 0, True), (0, 1, True), (-1, 0, False), (0, -1, False)):
                n = at(x + a, y + b)
                if n not in '.!' and n not in FILM:
                    g[y][x] = lit[n] if litside else shade[n]
                    if not litside: break
    return g

def _rgba(c):
    return tuple(int(c[i:i + 2], 16) for i in range(1, len(c), 2)) + (() if len(c) > 7 else (255,))

def image(icon, scale, bg=None, sphere=None, grey=False, door=False):
    g = grid(icon, sphere, door)
    layer = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    for y in range(N):
        for x in range(N):
            if g[y][x]: layer.putpixel((x, y), _rgba(g[y][x]))
    layer = layer.resize((N * scale, N * scale), Image.NEAREST)
    im = Image.new('RGBA', layer.size, bg or (0, 0, 0, 0)); im.alpha_composite(layer)
    if grey:
        L = im.convert('L').convert('RGBA'); L.putalpha(im.getchannel('A')); im = L
    return im

def font(sz):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', sz)

VIEWS = ((4, 'card', False), (4, 'table', False), (2, 'card', False), (2, 'table', False), (1, 'card', False),
         (1, 'table', False), (2, 'card', True))

def sheet(icons, out, guide=None):
    """Each portrait: 4x card, 4x table, 2x card, 2x table, 1x card, 1x table, grey 2x on the card."""
    pad = 10
    W = sum(N * s + 2 * pad for s, _, _ in VIEWS) + 8
    rowh = 4 * N + 2 * pad + 22
    im = Image.new('RGB', (W, rowh * len(icons)), '#2a2420')
    d = ImageDraw.Draw(im)
    for r, ic in enumerate(icons):
        y0 = r * rowh + pad; x = 4
        for sc, bgname, grey in VIEWS:
            bg = P.CARD if bgname == 'card' else P.TABLE
            d.rectangle((x, y0 - pad + 4, x + N * sc + 2 * pad - 4, y0 + N * sc + pad - 4), fill=bg)
            t = image(ic, sc, bg=bg, grey=grey)
            if guide: guide(t, ic, sc)
            im.paste(t, (x + pad - 2, y0), t)
            x += N * sc + 2 * pad
        g = grid(ic)
        cols = {c for row in g for c in row if c}
        d.text((8, y0 + 4 * N + pad - 2), f"{ic['name']}  ({ic['id']}, {ic.get('sphere')}, {len(cols)} colors incl. outline)",
               fill='#f2e8d2', font=font(13))
    im.save(out)

def swatches(out):
    rows = [('sphere ' + s, P.sphere_ramp(b)) for s, b in P.SPHERES.items()]
    rows += [('skin ' + s, P.skin_ramp(b)) for s, b in P.SKINS.items()]
    rows += [('hair ' + s, P.hair_ramp(b)) for s, b in P.HAIRS.items()]
    rows += [('mat ' + s, P.mat_ramp(b)) for s, b in P.MATERIALS.items()]
    rows += [('accent ' + s, P.mat_ramp(b)) for s, b in P.ACCENTS.items()]
    im = Image.new('RGB', (420, 22 * len(rows)), P.TABLE); d = ImageDraw.Draw(im)
    for i, (name, cs) in enumerate(rows):
        d.text((4, i * 22 + 4), name, fill='#f2e8d2', font=font(12))
        for j, c in enumerate(cs + [P.outline_of(cs[0])]):
            d.rectangle((150 + j * 44, i * 22 + 2, 150 + j * 44 + 40, i * 22 + 19), fill=c)
    im.save(out)

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'swatches': swatches(sys.argv[2]); sys.exit()
    icons = json.load(open(sys.argv[2]))
    if cmd == 'sheet':
        ids = sys.argv[4:]
        sheet([i for i in icons if not ids or i['id'] in ids], sys.argv[3])
    elif cmd == 'one':
        ic = next(i for i in icons if i['id'] == sys.argv[3]); od = sys.argv[4]
        for sc in (1, 2, 4):
            for nm, bg in (('table', P.TABLE), ('card', P.CARD)):
                image(ic, sc, bg).save(f"{od}/{ic['id']}-{sc}x-{nm}.png")
        image(ic, 4, P.CARD, grey=True).save(f"{od}/{ic['id']}-grey-4x.png")
