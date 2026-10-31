# Drawing toolkit for v3 portraits: a 48x48 grid of palette keys (see palette.py / FORMAT.md).
# Shapes are masks (sets of (x, y)); a pixel is in a shape when its centre is. Light comes from the top-left.
# The sel-out outline against the doorway is drawn by render.py; edge() draws it between overlapping shapes.
import math

FAMILIES = ['12345', 'ABCD', 'EFGH', 'IJKL', 'MNOP', 'QRST', 'UVWX', 'abcd', 'efgh', 'ijkl', 'mnop', 'qrst', 'uvwx']
FAM = {k: f for f in FAMILIES for k in f}
LIGHT = (-0.45, -0.55, 0.70)
_n = math.sqrt(sum(v * v for v in LIGHT)); LIGHT = tuple(v / _n for v in LIGHT)

def step(k, d):
    """The key d steps lighter (d>0) or darker (d<0) in the same ramp, clamped."""
    f = FAM.get(k)
    if not f: return k
    return f[max(0, min(len(f) - 1, f.index(k) + d))]

def darkest(k): f = FAM.get(k); return f[0] if f else 'z'

class Canvas:
    def __init__(s, n=48):
        s.n = n; s.g = [['.'] * n for _ in range(n)]

    # ---- reading / writing
    def get(s, x, y): return s.g[y][x] if 0 <= x < s.n and 0 <= y < s.n else '.'
    def set(s, x, y, k):
        if 0 <= x < s.n and 0 <= y < s.n: s.g[y][x] = k
    def rows(s): return [''.join(r) for r in s.g]
    def mask_of(s, keys): return {(x, y) for y in range(s.n) for x in range(s.n) if s.g[y][x] in keys}
    def filled(s): return {(x, y) for y in range(s.n) for x in range(s.n) if s.g[y][x] != '.'}

    # ---- shapes (return masks)
    def ellipse(s, cx, cy, rx, ry):
        return {(x, y) for y in range(s.n) for x in range(s.n) if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1}
    def poly(s, pts):
        out = set()
        for y in range(s.n):
            for x in range(s.n):
                px, py, inside = x + .5, y + .5, False
                j = len(pts) - 1
                for i in range(len(pts)):
                    xi, yi = pts[i]; xj, yj = pts[j]
                    if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi) + xi: inside = not inside
                    j = i
                if inside: out.add((x, y))
        return out
    def rect(s, x0, y0, x1, y1): return {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)}
    def line(s, x0, y0, x1, y1):
        out = set(); dx, dy = abs(x1 - x0), -abs(y1 - y0); sx = 1 if x0 < x1 else -1; sy = 1 if y0 < y1 else -1; e = dx + dy
        while True:
            out.add((x0, y0))
            if x0 == x1 and y0 == y1: return out
            e2 = 2 * e
            if e2 >= dy: e += dy; x0 += sx
            if e2 <= dx: e += dx; y0 += sy

    # ---- painting
    def fill(s, mask, k, only=None):
        for x, y in mask:
            if only is None or s.get(x, y) in only: s.set(x, y, k)
    def shade(s, mask, keys, cx, cy, rx, ry, cuts, light=LIGHT, flat=0.0):
        """Paint mask with ramp keys from a lit ellipsoid (cx, cy, rx, ry): cuts are the intensity thresholds between
        keys (len(keys)-1 of them). flat in 0..1 flattens the form (cloth, planes)."""
        for x, y in mask:
            dx, dy = (x + .5 - cx) / rx, (y + .5 - cy) / ry
            dz = math.sqrt(max(0.0, 1 - dx * dx - dy * dy))
            nx, ny, nz = dx * (1 - flat), dy * (1 - flat), dz + flat
            l = math.sqrt(nx * nx + ny * ny + nz * nz) or 1
            v = (nx * light[0] + ny * light[1] + nz * light[2]) / l
            i = sum(v > c for c in cuts)
            s.set(x, y, keys[i])
    def outside(s, mask, k, cx, cy, rx, ry, only=None):
        """Terminator shading: pixels of mask outside the ellipse take k (offset the ellipse up-left of the form to
        leave a clean crescent of shadow on the lower right)."""
        e = s.ellipse(cx, cy, rx, ry)
        for p in mask - e:
            if only is None or s.get(*p) in only: s.set(p[0], p[1], k)
    def rim(s, mask, k, dx, dy, depth=1, only=None):
        """Light (or shadow) rim: pixels of mask within depth steps of its edge in direction (dx, dy).
        rim(m, '4', -1, -1, 2) lights the top-left edge two pixels deep."""
        hit = [p for p in mask if any((p[0] + dx * i, p[1] + dy * i) not in mask for i in range(1, depth + 1))]
        for p in hit:
            if only is None or s.get(*p) in only: s.set(p[0], p[1], k)
    def put(s, x0, y0, rows, keep='. '):
        """Overlay hand-drawn rows; characters in keep leave the pixel as it is."""
        for j, r in enumerate(rows):
            for i, ch in enumerate(r):
                if ch not in keep: s.set(x0 + i, y0 + j, ch)
    def shift(s, mask, d, only=None):
        """Move every key in mask d steps lighter/darker in its own ramp (e.g. a figure standing further back)."""
        for x, y in mask:
            k = s.get(x, y)
            if k != '.' and (only is None or k in only): s.set(x, y, step(k, d))
    def edge(s, front, key=None, width=1):
        """Sel-out between overlapping shapes: pixels just outside front that hold something else get front's darkest
        key (or key). Only the shadow sides (right, below) when width==1 gives the lighter look; this does all sides."""
        out = set()
        for x, y in front:
            for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                p = (x + a, y + b)
                if p not in front and s.get(*p) != '.': out.add((p, s.get(x, y)))
        for (x, y), k in out: s.set(x, y, key or darkest(k))
    def inner_edge(s, mask, key_fn, sides=((1, 0), (-1, 0), (0, 1), (0, -1))):
        """Pixels of mask on its own border (toward the listed sides) get key_fn(current key)."""
        hit = [(x, y) for x, y in mask if any((x + a, y + b) not in mask for a, b in sides)]
        for x, y in hit: s.set(x, y, key_fn(s.get(x, y)))
    def clean(s, mask=None, protect=''):
        """Remove orphans: a pixel whose four neighbours all differ from it and three or more agree takes their key."""
        for _ in range(2):
            ch = []
            for y in range(s.n):
                for x in range(s.n):
                    if mask is not None and (x, y) not in mask: continue
                    k = s.g[y][x]
                    if k in protect or k == '.': continue
                    nb = [s.get(x + a, y + b) for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))]
                    if k in nb: continue
                    best = max(set(nb), key=nb.count)
                    if nb.count(best) >= 3 and best != '.': ch.append((x, y, best))
            for x, y, k in ch: s.g[y][x] = k

def orphans(rows, protect='!yz^":'):
    """List single pixels with no same-key 4-neighbour (lint for a portrait)."""
    n = len(rows); out = []
    for y in range(n):
        for x in range(n):
            k = rows[y][x]
            if k == '.' or k in protect: continue
            if not any(0 <= x + a < n and 0 <= y + b < n and rows[y + b][x + a] == k for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                out.append((x, y, k))
    return out
