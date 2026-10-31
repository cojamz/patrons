# Shared parts for the whitepurple sweep: the Launderer's doorway, shoulders, shaded ellipses, width-checked rows.
import sys, math
sys.path.insert(0, '/home/user/patrons/design/prototypes/art-v2')
from pix import G
N = 32

def door(g):
    for y in range(1, N):
        hw = 14 if y >= 15 else int(round(math.sqrt(max(0, 14.4 ** 2 - (15 - y) ** 2))))
        if hw > 1: g.put(16 - hw, y, ['c' + 'b' * (2 * hw - 2) + 'c'])
    return g

def new(): return door(G(N))

def body(g, top=22, cx=16, start=7, grow=3, maxhalf=15, keys='4321'):
    L, B, S, D = keys
    for y in range(top, N):
        half = min(maxhalf, start + (y - top) * grow)
        for x in range(cx - half, cx + half):
            if not 0 <= x < N: continue
            k = x - (cx - half); w = 2 * half
            g.c[y][x] = L if k < 2 else (D if k >= w - 1 else (S if k >= w - 4 else B))
    return g

def at(g, x, y, rows, check=False):
    rows = rows.split('|') if isinstance(rows, str) else rows
    if check and len({len(r) for r in rows}) > 1:
        raise ValueError(f'uneven rows at {x},{y}: ' + ','.join(str(len(r)) for r in rows))
    return g.put(x, y, rows)

def dots(g, pts, k):
    for x, y in pts:
        if 0 <= x < N and 0 <= y < N: g.c[y][x] = k

def shade(nx, ny, cuts=(-0.55, 0.15, 0.6), keys='4321'):
    v = (nx + ny) / 1.4
    return keys[0] if v < cuts[0] else (keys[1] if v < cuts[1] else (keys[2] if v < cuts[2] else keys[3]))

def ellipse(g, cx, cy, rx, ry, fill=None, cuts=(-0.55, 0.15, 0.6), keys='4321', clip=None):
    for y in range(N):
        for x in range(N):
            dx, dy = (x + .5 - cx) / rx, (y + .5 - cy) / ry
            if dx * dx + dy * dy <= 1 and (clip is None or clip(x, y)):
                g.c[y][x] = fill if fill else shade(dx, dy, cuts, keys)

def recolor(g, box, mapping):
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            if g.c[y][x] in mapping: g.c[y][x] = mapping[g.c[y][x]]

FACE = [  # 16 wide, rows y..y+12 (the Launderer's face): 0 hairline, 2 brows, 3-4 eyes, 5 nose, 6 cheeks, 8-9 mouth, 12 chin
    'HSSSSSSSSSSSSssH',
    'SSSSSSSSSSSSSsst',
    'SSttSSSSSSttSsst',
    'SSwKSSSSSSwKSsst',
    'SSKKSSSSSSKKSsst',
    'SSSSSSStSSSSSsst',
    'SaaSSSttSSSSaast',
    'SSSSSSSSSSSSSsst',
    ' SSSSKSSSSKSsst ',
    ' SSSSSKKKKSSsst ',
    '  SSSSSSSSSSst  ',
    '   sSSSSSSSst   ',
    '    tsssssst    ',
]
MOUTHS = {
    'smile': [' SSSSKSSSSKSsst ', ' SSSSSKKKKSSsst '],
    'grin': [' SSSKwwwwwwKsst ', ' SSSSKKKKKKSsst '],
    'smirk': [' SSSSSSSSSKSsst ', ' SSSSSKKKKSSsst '],
    'flat': [' SSSSKKKKKKSsst ', ' SSSSSSSSSSSsst '],
    'frown': [' SSSSSKKKKSSsst ', ' SSSSKSSSSKSsst '],
    'open': [' SSSSSKKKKSSsst ', ' SSSSSKrrKSSsst '],
    'gold': [' SSSKwwGwwwKsst ', ' SSSSKKKKKKSsst '],
}
EYES = {
    'open': ['SSttSSSSSSttSsst', 'SSwKSSSSSSwKSsst', 'SSKKSSSSSSKKSsst'],
    'right': ['SSttSSSSSSttSsst', 'SSSwKSSSSSSwKsst', 'SSSKKSSSSSSKKsst'],
    'left': ['SSttSSSSSSttSsst', 'SwKSSSSSSwKSSsst', 'SKKSSSSSSKKSSsst'],
    'wink': ['SSttSSSSSttSSsst', 'SSwKSSSSSSSSSsst', 'SSKKSSSSSKKKKsst'],
    'closed': ['SSttSSSSSSttSsst', 'SSSSSSSSSSSSSsst', 'StKKtSSSStKKtsst'],
    'sleepy': ['SSSSSSSSSSSSSsst', 'SKKKKSSSSKKKKsst', 'SSwKSSSSSSwKSsst'],
    'stern': ['SKKKSSSSSSKKKsst', 'SSwKSSSSSSwKSsst', 'SSKKSSSSSSKKSsst'],
}
def face(g, x=8, y=9, eyes='open', mouth='smile', rows=None, ears=True, neck=True, cheeks=True):
    f = list(FACE)
    f[2:5] = EYES[eyes]; f[8:10] = MOUTHS[mouth]
    if not cheeks: f[6] = 'SSSSSSttSSSSSsst'
    for k, r in (rows or {}).items(): f[k] = r
    if neck: g.put(x + 6, y + 13, ['ssss', ' tt '])
    at(g, x, y, f)
    if ears:
        g.put(x - 1, y + 3, ['s', 's', 't']); g.put(x + 16, y + 3, ['t', 't', 't'])
    return g

SMALL = [  # 12 wide, for two heads in one doorway: 0 hairline, 1 brows, 2-3 eyes, 4 nose/cheeks, 5-6 mouth, 8 chin
    'HSSSSSSSSssH',
    'SSttSSSttSst',
    'SSwKSSSwKsst',
    'SSKKSSSKKsst',
    'SaaSSttSaast',
    'SSSKSSSKSsst',
    ' SSSKKKSSst ',
    '  SSSSSSst  ',
    '   tsssst   ',
]
SMOUTH = {
    'smile': ['SSSKSSSKSsst', ' SSSKKKSSst '],
    'grin': ['SSKwwwwKSsst', ' SSSKKKKSst '],
    'flat': ['SSSKKKKSSsst', ' SSSSSSSSst '],
    'open': ['SSSSKKSSSsst', ' SSSKrKSSst '],
    'smirk': ['SSSSSSSKSsst', ' SSSKKKSSst '],
}
SEYES = {
    'open': ['SSttSSSttSst', 'SSwKSSSwKsst', 'SSKKSSSKKsst'],
    'closed': ['SSttSSSttSst', 'SSSSSSSSSsst', 'StKKtStKKtst'],
    'sleepy': ['SSSSSSSSSSst', 'SKKKSSKKKsst', 'SSwKSSSwKsst'],
    'right': ['SSttSSSttSst', 'SSSwKSSSwKst', 'SSSKKSSSKKst'],
    'left': ['SttSSSttSSst', 'SwKSSSwKSsst', 'SKKSSSKKSsst'],
}
def small(g, x, y, eyes='open', mouth='smile', rows=None, ears=True, neck=True):
    f = list(SMALL)
    f[1:4] = SEYES[eyes]; f[5:7] = SMOUTH[mouth]
    for k, r in (rows or {}).items(): f[k] = r
    if neck: g.put(x + 4, y + 9, ['ssss', ' tt '])
    at(g, x, y, f)
    if ears:
        g.put(x - 1, y + 2, ['s', 't']); g.put(x + 12, y + 2, ['t', 't'])
    return g

def head(g, x, y, rows): return at(g, x, y, rows, check=True)

def sticker(g, x, y, rows, sides='lrtb'):
    """Draw rows with a 1px '.' gap around them so the renderer outlines the shape off whatever is behind it."""
    rows = rows.split('|') if isinstance(rows, str) else rows
    cells = {(x + i, y + j) for j, r in enumerate(rows) for i, ch in enumerate(r) if ch != ' '}
    nb = {'l': (-1, 0), 'r': (1, 0), 't': (0, -1), 'b': (0, 1)}
    for (a, b) in cells:
        for s in sides:
            dx, dy = nb[s]; p = (a + dx, b + dy)
            if p not in cells and 0 <= p[0] < N and 0 <= p[1] < N: g.c[p[1]][p[0]] = '.'
    return g.put(x, y, rows)

def gap_right(g, before):
    """After drawing a front figure over 'before', cut a 1px gap down its right side so it reads apart from the one behind."""
    for y in range(N):
        xs = [x for x in range(N) if g.c[y][x] != before[y][x]]
        if xs and max(xs) + 1 < N and before[y][max(xs) + 1] not in 'bc.': g.c[y][max(xs) + 1] = '.'

def snap(g): return [r[:] for r in g.c]
