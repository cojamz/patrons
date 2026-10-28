# Portrait kit (Cory, 2026-10-28: the Launderer is the model). 32x32 grids of one-character palette keys.
# The same keys and colors live in src/v4/art/portrait.js; change both together.
#   python3 kit.py check portraits/<batch>.json          validate every grid
#   python3 kit.py sheet portraits/<batch>.json out.png  contact sheet: each at 32px (seat) and 64px (shop), on table and card
import json, sys, math
from PIL import Image, ImageDraw, ImageFont

TABLE = '#191310'
SPHERES = {'gold': '#e2962c', 'red': '#e0645a', 'magenta': '#d4508f', 'green': '#5fb37c', 'silver': '#a3b3c2',
           'white': '#eef3f8', 'purple': '#9a62e6', 'yellow': '#d3dd48', 'blue': '#6aa6dc', 'colorless': '#8d9693'}
SKIN = ['#f1d3b0', '#e2b48c', '#c68c5f', '#9a6440', '#6e4428']
HAIR = ['#2b1d16', '#5a3420', '#8c4a22', '#c98f3e', '#e7d29a', '#9a9a9a', '#7a2f2f', '#3a3a5a']
def hx(c): return [int(c[i:i + 2], 16) for i in (1, 3, 5)]
def mix(a, b, t): A, B = hx(a), hx(b); return '#' + ''.join('%02x' % round(x + (y - x) * t) for x, y in zip(A, B))
FIXED = {
    'K': '#1a1420', 'w': '#ffffff', 'W': '#f4ecd8', 'V': '#c9b79a',
    'L': '#ece6da', 'M': '#b4aea6', 'N': '#6c6670', 'D': '#2c3448',
    'G': '#ffe08a', 'g': '#c98a1c',
    'R': '#c4533f', 'r': '#8a3428', 'q': '#e98a6e',
    'U': '#4a80b8', 'u': '#2f5a85', 'E': '#5fa36f', 'e': '#3a6e48',
    'P': '#8a5cc8', 'p': '#5a3a8a', 'O': '#9a6a3e', 'o': '#5e3e22', 'Y': '#f2d24a',
    'x': '#e0645a', 'y': '#6aa6dc', 'z': '#5fb37c', 'n': '#e2962c',
}
FAMILY_DARK = {**{k: '#141018' for k in 'KwWVLMNDiYxyzn'}, 'G': '#3a2008', 'g': '#3a2008', 'R': '#3a120c', 'r': '#3a120c', 'q': '#3a120c',
               'U': '#0e1c2c', 'u': '#0e1c2c', 'E': '#0e2416', 'e': '#0e2416', 'P': '#1e1030', 'p': '#1e1030', 'O': '#24140a', 'o': '#24140a'}
KEYS = set('1234bcSsta' + 'Hhj' + ''.join(FIXED) + 'i')

def hash_id(s):
    h = 2166136261
    for ch in str(s): h ^= ord(ch); h = (h * 16777619) & 0xffffffff
    return h

def palette(sphere, pid):
    base = SPHERES.get(sphere, sphere if str(sphere).startswith('#') else SPHERES['colorless'])
    h = hash_id(pid); skin = SKIN[h % len(SKIN)]; hair = HAIR[(h >> 3) % len(HAIR)]
    p = dict(FIXED)
    p.update({'1': mix(base, '#1e1020', .62), '2': mix(base, '#3a1830', .36), '3': base, '4': mix(base, '#fff4e0', .45),
              'b': mix(base, TABLE, .8), 'c': mix(base, TABLE, .6),
              'S': skin, 's': mix(skin, '#7a3a2a', .18), 't': mix(skin, '#5a2418', .4), 'a': mix(skin, '#e05a5a', .35),
              'H': mix(hair, '#000000', .35), 'h': hair, 'j': mix(hair, '#ffffff', .3)})
    p['i'] = mix(p['b'], '#ffffff', .1)
    dark = dict(FAMILY_DARK)
    dark.update({k: mix(p['1'], '#000000', .45) for k in '1234'})
    dark.update({k: mix(p['b'], '#000000', .5) for k in 'bci'})
    dark.update({k: mix(p['t'], '#000000', .5) for k in 'Ssta'})
    dark.update({k: mix(p['H'], '#000000', .5) for k in 'Hhj'})
    return p, dark

def colored(px, sphere, pid):
    p, dark = palette(sphere, pid); n = len(px)
    g = [[p[ch] if ch != '.' else None for ch in row] for row in px]
    for y in range(n):
        for x in range(n):
            if px[y][x] != '.': continue
            for a, b in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= a < n and 0 <= b < n and px[b][a] != '.': g[y][x] = dark[px[b][a]]; break
    return g

def check(icon):
    errs = []; px = icon['px']
    if len(px) != 32 or any(len(r) != 32 for r in px): errs.append('not 32x32')
    bad = sorted({ch for r in px for ch in r if ch != '.' and ch not in KEYS})
    if bad: errs.append('unknown keys ' + ''.join(bad))
    if icon.get('kind') == 'member':
        filled = sum(ch != '.' for r in px for ch in r)
        if filled < 600: errs.append(f'only {filled} filled cells: a portrait fills its doorway')
        if not any(ch in 'Ss' for r in px for ch in r) and not icon.get('nohead'): errs.append('no face (S/s)')
    return [f"{icon['id']}: {e}" for e in errs]

def render(icon, sphere, scale):
    g = colored(icon['px'], sphere, icon['id']); n = len(g)
    im = Image.new('RGBA', (n * scale, n * scale), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for y, row in enumerate(g):
        for x, c in enumerate(row):
            if c: d.rectangle((x * scale, y * scale, x * scale + scale - 1, y * scale + scale - 1), fill=c)
    return im

def sheet(icons, out):
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
    cols = 6; cw, ch = 200, 230; rows = math.ceil(len(icons) / cols)
    im = Image.new('RGB', (cols * cw, rows * ch), TABLE); d = ImageDraw.Draw(im)
    for k, ic in enumerate(icons):
        x0, y0 = (k % cols) * cw, (k // cols) * ch
        sph = ic.get('sphere', 'colorless')
        d.rounded_rectangle((x0 + 6, y0 + 6, x0 + 140, y0 + 150), 8, fill='#d9ceb6')
        big = render(ic, sph, 2); im.paste(big, (x0 + 9, y0 + 9), big)
        small = render(ic, sph, 1); im.paste(small, (x0 + 150, y0 + 20), small)
        tiny = render(ic, 'colorless', 1); im.paste(tiny, (x0 + 150, y0 + 70), tiny)
        d.text((x0 + 8, y0 + 158), ic['name'][:26], fill='#f2e8d2', font=font)
        d.text((x0 + 8, y0 + 176), ic['id'][:28], fill='#a39078', font=font)
    im.save(out)

if __name__ == '__main__':
    cmd, path = sys.argv[1], sys.argv[2]
    icons = json.load(open(path))
    if cmd == 'check':
        errs = [e for ic in icons for e in check(ic)]
        print('\n'.join(errs) if errs else f'ok: {len(icons)} icons')
        sys.exit(1 if errs else 0)
    if cmd == 'sheet': sheet(icons, sys.argv[3])
