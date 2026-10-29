# Render v3 portraits.
#   python3 render.py sheet samples.json out.png [ids...]   every portrait at 4x, 2x, 1x on the table, 2x on a card, grey 2x
#   python3 render.py one samples.json <id> outdir          <id>-{1,2,4}x-{table,card}.png and <id>-grey-4x.png
#   python3 render.py swatches out.png                      every ramp
import json, sys
from PIL import Image, ImageDraw, ImageFont
import palette as P

N = 48
FILM = {':': 0.12, '^': 0.26, '"': 0.62}  # see-through keys: faint film, dim rim, bright rim

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

def grid(icon, sphere=None, door=True):
    """48x48 list of hex colors (None = transparent): doorway, sel-out outline, figure."""
    col, lit, shade, _ = P.palette(icon, sphere)
    pn = P.panel(sphere or icon.get('sphere'))
    px = icon['px']
    g = [[None] * N for _ in range(N)]
    if door:
        for y in range(N):
            for x in range(N):
                if not ARCH[y][x]: continue
                edge = any(not (0 <= x + a < N and 0 <= y + b < N and ARCH[y + b][x + a]) for a, b in ((1, 0), (-1, 0), (0, -1)))
                if edge: g[y][x] = pn['frame']; continue
                inner = any(not ARCH[y + b][x + a] for a, b in ((2, 0), (-2, 0), (0, -2)) if 0 <= x + a < N and 0 <= y + b < N)
                if inner and x > 24: g[y][x] = pn['lip']; continue  # the right jamb catches the light from the left
                g[y][x] = pn['lit'] if x + 0.6 * y < 24 else pn['back']
    at = lambda x, y: px[y][x] if 0 <= x < N and 0 <= y < N else '.'
    for y in range(N):
        for x in range(N):
            k = px[y][x]
            if k in FILM:  # film (a soap bubble): the doorway seen through a veil, never outlined
                g[y][x] = P.mix(g[y][x] or pn['back'], '#ffffff', FILM[k]); continue
            if k != '.': g[y][x] = col[k]; continue
            # sel-out: an empty pixel touching the figure takes that shape's outline; the shape's lit side
            # (this pixel sits to its left or above it) gets its darkest step, the shadow side a deeper tone
            for (a, b, litside) in ((1, 0, True), (0, 1, True), (-1, 0, False), (0, -1, False)):
                n = at(x + a, y + b)
                if n not in '.!' and n not in FILM:
                    g[y][x] = lit[n] if litside else shade[n]
                    if not litside: break
    return g

def image(icon, scale, bg=None, sphere=None, grey=False, door=True):
    g = grid(icon, sphere, door)
    im = Image.new('RGBA', (N * scale, N * scale), bg or (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for y in range(N):
        for x in range(N):
            c = g[y][x]
            if c: d.rectangle((x * scale, y * scale, x * scale + scale - 1, y * scale + scale - 1), fill=c)
    if grey:
        L = im.convert('L').convert('RGBA'); L.putalpha(im.getchannel('A')); im = L
        if bg: base = Image.new('RGBA', im.size, bg); base.alpha_composite(im); im = base
    return im

def font(sz):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', sz)

def sheet(icons, out):
    W = 4 * N + 2 * N + N + 2 * N + 2 * N + 6 * 16
    rowh = 4 * N + 34
    im = Image.new('RGB', (W, rowh * len(icons)), P.TABLE)
    d = ImageDraw.Draw(im)
    for r, ic in enumerate(icons):
        y0 = r * rowh + 8; x = 8
        for sc, bg, grey in ((4, None, False), (2, None, False), (1, None, False), (2, P.CARD, False), (2, None, True)):
            if bg:
                d.rectangle((x - 6, y0 - 6, x + N * sc + 6, y0 + N * sc + 6), fill=bg)
            t = image(ic, sc, grey=grey)
            im.paste(t, (x, y0), t)
            x += N * sc + 16
        n_cols = len({c for row in ic['px'] for c in row if c != '.'})
        d.text((8, y0 + 4 * N + 4), f"{ic['name']}  ({ic['id']}, {ic.get('sphere')}, {n_cols} keys)", fill='#f2e8d2', font=font(13))
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
        image(ic, 4, P.TABLE, grey=True).save(f"{od}/{ic['id']}-grey-4x.png")
