# Shared helpers for the white-artifacts batch (doorway and shoulders as in example_launderer.py).
import sys, math
sys.path.insert(0, '/home/user/patrons/design/prototypes/art-v2')
from pix import G
N = 32

def door(g):
    for y in range(1, N):
        hw = 14 if y >= 15 else int(round(math.sqrt(max(0, 14.4 ** 2 - (15 - y) ** 2))))
        if hw > 1: g.put(16 - hw, y, ['c' + 'b' * (2 * hw - 2) + 'c'])

def shoulders(g, top=22, start=7, slope=3, cx=16, maxhalf=15, keys='4321'):
    hi, base, sh, dk = keys[0], keys[1], keys[2], keys[3]
    for y in range(top, N):
        half = min(maxhalf, start + (y - top) * slope)
        for x in range(max(0, cx - half), min(N, cx + half)):
            k = x - (cx - half); w = 2 * half
            g.c[y][x] = hi if k < 2 else (dk if k >= w - 1 else (sh if k >= w - 4 else base))

def new():
    g = G(N); door(g); return g

def head(g, x, y, rows, w=None):
    # hand-typed rows; every row must be the same width so columns line up
    w = w or max(len(r) for r in rows)
    for i, r in enumerate(rows):
        if len(r) != w: print('  width', y + i, len(r), '!=', w, repr(r))
    g.put(x, y, rows)

def blank():
    return G(N)

def shade(nx, ny, cuts=(-0.55, 0.15, 0.6)):
    # light from the top-left: nx, ny in -1..1 relative to the shape's center
    v = (nx + ny) / 1.4
    return '4' if v < cuts[0] else ('3' if v < cuts[1] else ('2' if v < cuts[2] else '1'))

def ellipse(g, cx, cy, rx, ry, fill=None, cuts=(-0.55, 0.15, 0.6), clip=None):
    for y in range(N):
        for x in range(N):
            dx, dy = (x + .5 - cx) / rx, (y + .5 - cy) / ry
            if dx * dx + dy * dy <= 1 and (clip is None or clip(x, y)):
                g.c[y][x] = fill if fill else shade(dx, dy, cuts)
