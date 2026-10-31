# Shared parts for the purple-blue batch: the Launderer's doorway, shoulders, and a base face to edit.
import sys, math
sys.path.insert(0, '/home/user/patrons/design/prototypes/art-v2')
from pix import G

N = 32

def door(g):
    for y in range(1, N):
        hw = 14 if y >= 15 else int(round(math.sqrt(max(0, 14.4 ** 2 - (15 - y) ** 2))))
        if hw > 1: g.put(16 - hw, y, ['c' + 'b' * (2 * hw - 2) + 'c'])
    return g

def body(g, top=22, cx=16, start=7, grow=3, maxhalf=15, keys='4321'):
    """Shoulders in the member's color, lit from the left."""
    L, B, S, D = keys
    for y in range(top, N):
        half = min(maxhalf, start + (y - top) * grow)
        for x in range(cx - half, cx + half):
            if not 0 <= x < N: continue
            k = x - (cx - half); w = 2 * half
            g.c[y][x] = L if k < 2 else (D if k >= w - 1 else (S if k >= w - 4 else B))
    return g

FACE = [  # x 8..23, rows 9..21 (the Launderer's face)
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

def face(g, x=8, y=9, rows=None, ears=True, neck=True):
    f = [list(r) for r in FACE]
    for k, r in (rows or {}).items():
        f[k] = list(r)
    if neck: g.put(x + 6, y + 13, ['ssss', ' tt '])
    g.put(x, y, [''.join(r) for r in f])
    if ears:
        g.put(x - 1, y + 3, ['s', 's', 't']); g.put(x + 16, y + 3, ['t', 't', 't'])
    return g

def at(g, x, y, rows):
    return g.put(x, y, rows.split('|') if isinstance(rows, str) else rows)

def dots(g, pts, k):
    for x, y in pts: g.c[y][x] = k

def new():
    return door(G(N))
