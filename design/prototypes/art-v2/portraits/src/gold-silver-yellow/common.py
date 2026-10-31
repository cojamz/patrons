# Shared pieces for the gold/silver/yellow batch, after portraits/example_launderer.py.
import sys, math
sys.path.insert(0, '/home/user/patrons/design/prototypes/art-v2')
from pix import G

def doorway():
    g = G(32)
    for y in range(1, 32):
        hw = 14 if y >= 15 else int(round(math.sqrt(max(0, 14.4 ** 2 - (15 - y) ** 2))))
        if hw > 1: g.put(16 - hw, y, ['c' + 'b' * (2 * hw - 2) + 'c'])
    return g

def shoulders(g, cx=16, top=22, slope=3, start=7, maxhalf=15, ramp='4321'):
    hi, sh, base, dk = ramp[0], ramp[2], ramp[1], ramp[3]
    for y in range(top, 32):
        half = min(maxhalf, start + (y - top) * slope)
        for x in range(cx - half, cx + half):
            if not (0 <= x < 32): continue
            k = x - (cx - half); w = 2 * half
            g.c[y][x] = hi if k < 2 else (dk if k >= w - 1 else (sh if k >= w - 4 else base))

# 16-wide head, top at y, chin at y+18. Brows y+8, eyes y+9..10, nose y+11..12, mouth y+14..15.
HEAD = [
    '    SSSSSSSS    ',
    '  SSSSSSSSSSSs  ',
    ' SSSSSSSSSSSSss ',
    'SSSSSSSSSSSSSsss',
    'SSSSSSSSSSSSSsss',
    'SSSSSSSSSSSSSsst',
    'SSSSSSSSSSSSSsst',
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

def head(g, x=8, y=3, ears=True, cheeks=True):
    rows = [r if cheeks else r.replace('a', 'S') for r in HEAD]
    g.put(x, y, rows)
    if ears:
        g.put(x - 1, y + 9, ['s', 's', 't']); g.put(x + 16, y + 9, ['t', 't', 't'])

def neck(g, x=14, y=22):
    g.put(x, y, ['ssss', ' tt '])

MOUTHS = {  # 6 wide at head x+5, y+14
    'smile': ['K    K', ' KKKK '],
    'grin':  ['KKKKKK', 'KwwwwK', ' KKKK '],
    'goldgrin': ['KKKKKK', 'KwGwwK', ' KKKK '],
    'frown': [' KKKK ', 'K    K'],
    'flat':  ['      ', ' KKKK '],
    'smirk': ['     K', '  KKK '],
    'open':  ['  KK  ', ' KrrK ', '  KK  '],
    'laugh': ['KKKKKK', 'KrrrrK', ' KrrK '],
    'tiny':  ['      ', '  KK  '],
    'gap':   ['KKKKKK', 'KwKwwK', ' KKKK '],
}
def mouth(g, kind, x=8, y=3, dx=0):
    rows = MOUTHS[kind]
    # clear the template mouth first
    g.put(x + 5 + 0, y + 14, ['SSSSSS', 'SSSSSS'])
    g.put(x + 5 + dx, y + 14, rows)

def eyes(g, kind, x=8, y=3):
    L, R = x + 2, x + 10
    if kind == 'normal': return
    g.put(L, y + 8, ['SS', 'SS', 'SS']); g.put(R, y + 8, ['SS', 'SS', 'SS'])
    if kind == 'happy':      # closed, smiling arcs
        g.put(L - 1, y + 9, [' KK ', 'K  K']); g.put(R - 1, y + 9, [' KK ', 'K  K'])
    elif kind == 'shut':     # calm, closed
        g.put(L - 1, y + 10, ['KKKK']); g.put(R - 1, y + 10, ['KKKK'])
    elif kind == 'squint':   # suspicious
        g.put(L, y + 8, ['tt', '  ', 'KK']); g.put(R, y + 8, ['tt', '  ', 'KK'])
        g.put(L - 1, y + 9, ['tttt']); g.put(R - 1, y + 9, ['tttt'])
    elif kind == 'lidded':   # haughty, half shut
        g.put(L, y + 7, ['tt']); g.put(R, y + 7, ['tt'])
        g.put(L, y + 9, ['tt', 'KK']); g.put(R, y + 9, ['tt', 'KK'])
    elif kind == 'wide':
        g.put(L, y + 7, ['tt']); g.put(R, y + 7, ['tt'])
        g.put(L, y + 9, ['wK', 'KK']); g.put(R, y + 9, ['wK', 'KK'])
    elif kind == 'up':       # looking up, dreamy
        g.put(L, y + 8, ['tt', 'KK', 'Kw']); g.put(R, y + 8, ['tt', 'KK', 'Kw'])

def vneck(g, fill='W', top=22, bottom=31, half=4, every=3, cx=16, ledge='4', redge='2', minhalf=1):
    for y in range(top, bottom + 1):
        h = max(minhalf, half - (y - top) // every)
        for x in range(cx - h, cx + h): g.c[y][x] = fill
        if ledge: g.c[y][cx - h - 1] = ledge
        if redge: g.c[y][cx + h] = redge

def build(entries, sphere, path=None):
    out = []
    for pid, name, fn in entries:
        g = fn(); rows = g.rows()
        out.append({'id': pid, 'name': name, 'kind': 'member', 'sphere': sphere, 'px': rows})
    return out

# 10-wide small head for group cards: top y, chin y+11. Eyes y+5..6 at x+1, x+6; mouth y+8..9.
SMALL = [
    '  SSSSSs  ',
    ' SSSSSSSs ',
    'SSSSSSSSss',
    'SSSSSSSSst',
    'SttSSSttst',
    'SwKSSSwKst',
    'SKKSSSKKst',
    'SSSSStSSst',
    'aSKSSSSKat',
    ' SSKKKKst ',
    '  SSSSst  ',
    '   tsst   ',
]
SMOUTH = {'smile': ['SKSSSSKa', 'SSKKKKSs'], 'laugh': ['aSKKKKSa', 'SSKrrKSs', ' SSKKSs'], 'flat': ['SSSSSSSS', 'SSKKKKSs'],
          'o': ['aSSKKSSa', 'SSKrrKSs', ' SSKKSs'], 'grin': ['aKKKKKKa', 'SKwwwwKs', ' SSKKSs']}
def small(g, x, y, mouth='smile', ears=True):
    g.put(x, y, SMALL)
    g.put(x + 1, y + 8, SMOUTH[mouth])
    if ears: g.put(x - 1, y + 5, ['s', 't']); g.put(x + 10, y + 5, ['t', 't'])

def body(g, cx, top, half0=4, slope=2, maxhalf=8, ramp='4321', bottom=31):
    hi, base, sh, dk = ramp[0], ramp[1], ramp[2], ramp[3]
    for y in range(top, bottom + 1):
        half = min(maxhalf, half0 + (y - top) * slope)
        for x in range(cx - half, cx + half):
            if not (0 <= x < 32): continue
            k = x - (cx - half); w = 2 * half
            g.c[y][x] = hi if k < 2 else (dk if k >= w - 1 else (sh if k >= w - 3 else base))
