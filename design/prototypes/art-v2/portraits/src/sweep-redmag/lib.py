# Shared drawing kit for the redmag sweep (red + magenta). Follows portraits/example_launderer.py.
import sys, math
sys.path.insert(0, '/home/user/patrons/design/prototypes/art-v2')
from pix import G
N = 32

def doorway(g=None):
    g = g or G(N)
    for y in range(1, N):
        hw = 14 if y >= 15 else int(round(math.sqrt(max(0, 14.4 ** 2 - (15 - y) ** 2))))
        if hw > 1: g.put(16 - hw, y, ['c' + 'b' * (2 * hw - 2) + 'c'])
    return g

def shirt(g, cx=16, top=22, half0=7, slope=3, maxhalf=15, x0=0, x1=N, keys='4321', fold=True):
    """Shoulders lit from the top-left: a light edge, base, a 3-wide shade and a dark rim on the right."""
    L, B, S, D = keys
    for y in range(top, N):
        half = min(maxhalf, half0 + (y - top) * slope)
        lo, w = cx - half, 2 * half
        for x in range(max(x0, lo), min(x1, cx + half)):
            k = x - lo
            c = L if k < 2 else (D if k >= w - 1 else (S if k >= w - 4 else B))
            if y == top and L != B and 1 < k < w - 4: c = L  # light catching the top of the shoulders
            g.c[y][x] = c
    return g

TOPS = {16: [5, 3, 2, 1, 1], 14: [4, 2, 1, 1], 13: [4, 2, 1], 12: [3, 2, 1], 11: [3, 1, 1], 10: [3, 1], 9: [2, 1], 8: [2, 1], 7: [2, 1], 6: [1]}
CHINS = {16: [1, 1, 2, 3, 4], 15: [1, 1, 2, 3, 4], 14: [1, 1, 2, 3, 4], 13: [1, 2, 3, 4], 12: [1, 1, 2, 3], 11: [1, 2, 3], 10: [1, 2, 3], 9: [1, 2, 3], 8: [1, 2], 7: [1, 2], 6: [1, 2]}

def skull(g, x, y, w, h, top=None, chin=None, ears=None, jaw=None):
    """Skin from the crown (row y) to the chin (row y+h-1), lit top-left. ears=row offset for ears."""
    top = TOPS.get(w, [2, 1]) if top is None else top
    chin = jaw or (CHINS.get(w, [1, 2]) if chin is None else chin)
    for j in range(h):
        kc = j - (h - len(chin))
        ins = chin[kc] if kc >= 0 else (top[j] if j < len(top) else 0)
        L = w - 2 * ins
        if L <= 0: continue
        if j == h - 1: row = 't' + 's' * (L - 2) + 't' if L > 2 else 't' * L
        elif kc >= 1: row = 's' + 'S' * max(0, L - 4) + 'sst'[-min(3, L - 1):]
        elif L >= 7: row = 'S' * (L - 3) + 'sst'
        else: row = 'S' * (L - 2) + 'st'
        g.put(x + ins, y + j, [row[:L]])
    if ears is not None:
        g.put(x - 1, y + ears, ['s', 's', 't']); g.put(x + w, y + ears, ['t', 't', 't'])
    return g

def eye(g, x, y, s='dot'):
    E = {'dot': ['wK', 'KK'], 'big': ['wK', 'KK', 'tt'][:2], 'left': ['Kw', 'KK'], 'narrow': ['KK'], 'closed': ['tKKt'],
         'happy': [' KK ', 'K  K'], 'small': ['K', 'K'], 'tiny': ['K'], 'glint': ['wK', 'KK']}[s]
    g.put(x, y, E); return g

def layer(g, draw):
    """Draw a front layer with a 1px gap (renders as a dark line) where it overlaps what is already there."""
    f = G(N); draw(f)
    on = lambda x, y: 0 <= x < N and 0 <= y < N and f.c[y][x] != '.'
    for y in range(N):
        for x in range(N):
            if on(x, y): continue
            if any(on(a, b) for a, b in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))) and g.c[y][x] not in '.bci':
                g.c[y][x] = '.'
    for y in range(N):
        for x in range(N):
            if on(x, y): g.c[y][x] = f.c[y][x]
    return g

def recolor(g, box, mp):
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            if g.c[y][x] in mp: g.c[y][x] = mp[g.c[y][x]]

def blob(g, circles, keys='jhH', clip=None):
    """Union of circles (cx, cy, r) shaded per circle: light top-left, dark bottom-right (curls, fur, puffs)."""
    L, B, D = keys
    for (cx, cy, r) in circles:
        for y in range(int(cy - r - 1), int(cy + r + 2)):
            for x in range(int(cx - r - 1), int(cx + r + 2)):
                if not (0 <= x < N and 0 <= y < N): continue
                if clip and not clip(x, y): continue
                dx, dy = x + .5 - cx, y + .5 - cy
                if dx * dx + dy * dy > r * r: continue
                s = (dx + dy) / max(r, .1)
                g.c[y][x] = L if s < -.7 else (D if s > .55 else B)
    return g

def mouth(g, x, y, s):
    M = {'smile': ['K    K', ' KKKK '], 'grin': ['KKKKKK', 'KwwwwK', ' KKKK '], 'smirk': ['    K', 'KKKK '],
         'frown': [' KKKK ', 'K    K'], 'flat': ['KKKK'], 'open': [' KKKK ', 'KrqqrK', ' KKKK '], 'shout': ['KKKK', 'KrrK', 'KqqK', 'KKKK'],
         'o': ['KK', 'KK'], 'teeth': ['KKKKK', 'KwKwK', 'KKKKK'], 'small': ['K  K', ' KK ']}[s]
    g.put(x, y, M); return g
