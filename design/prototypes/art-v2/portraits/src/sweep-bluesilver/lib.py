# Shared parts for the bluesilver sweep: the Launderer's doorway and shoulders, a lit face of any width,
# features (eyes, brows, mouths) and a few clothing helpers.
import sys, math
sys.path.insert(0, '/home/user/patrons/design/prototypes/art-v2')
from pix import G

N = 32

def new():
    g = G(N)
    for y in range(1, N):
        hw = 14 if y >= 15 else int(round(math.sqrt(max(0, 14.4 ** 2 - (15 - y) ** 2))))
        if hw > 1: g.put(16 - hw, y, ['c' + 'b' * (2 * hw - 2) + 'c'])
    return g

def at(g, x, y, rows):
    return g.put(x, y, rows.split('|') if isinstance(rows, str) else rows)

def dot(g, pts, k):
    for x, y in pts:
        if 0 <= x < N and 0 <= y < N: g.c[y][x] = k

def body(g, top=22, cx=16, start=7, grow=3, maxhalf=15, x0=0, x1=N, keys='4321'):
    """Shoulders lit from the top-left: light edge, base, shade band, dark edge."""
    L, B, S, D = keys
    for y in range(top, N):
        half = min(maxhalf, start + (y - top) * grow)
        for x in range(max(x0, cx - half), min(x1, cx + half)):
            k = x - (cx - half); w = 2 * half
            g.c[y][x] = L if k < 2 else (D if k >= w - 1 else (S if k >= w - 4 else B))
    return g

CHIN = {16: [1, 1, 2, 3, 4], 14: [1, 1, 2, 3, 4], 13: [1, 1, 2, 3], 12: [1, 1, 2, 3], 11: [1, 2, 3], 10: [1, 2, 3], 9: [1, 2, 3], 8: [1, 2]}

def face(g, x, y, w=16, h=13, ears=True, ear_row=3, neck=True):
    """Skin from forehead row y to the chin, lit from the top-left; ears and neck optional."""
    chin = CHIN.get(w, [1, 2, 3])
    for j in range(h):
        k = j - (h - len(chin)); ins = chin[k] if k >= 0 else 0
        L = w - 2 * ins
        if j == h - 1: row = 't' + 's' * (L - 2) + 't'
        elif k >= 2: row = 's' + 'S' * (L - 3) + 'st'
        else: row = 'S' * (L - 3) + 'sst'
        g.put(x + ins, y + j, [row])
    if ears:
        g.put(x - 1, y + ear_row, ['s', 's', 't']); g.put(x + w, y + ear_row, ['t', 't', 't'])
    if neck:
        nw = max(2, w // 4); nx = x + (w - nw) // 2
        g.put(nx, y + h, ['s' * (nw - 1) + 't', ' ' + 't' * (nw - 2) + ' ' if nw > 2 else 'tt'])
    return g

def eyes(g, x, y, gap, kind='open', brow='t'):
    """Left eye's top-left at (x, y); right eye at x+gap."""
    for ex in (x, x + gap):
        if kind == 'open': at(g, ex, y, ['wK', 'KK'])
        elif kind == 'right': at(g, ex, y, ['SwK'[1:] , 'KK'])  # same as open; pupils handled by caller
        elif kind == 'closed': at(g, ex, y + 1, ['KK'])
        elif kind == 'happy': at(g, ex, y, [' K' if False else 'KK', 'SS'] if False else ['tK', 'KS'] if ex == x else ['Kt', 'SK'])
        elif kind == 'line': at(g, ex, y + 1, ['KK'])
        if brow and kind != 'none': at(g, ex, y - 1, [brow * 2])
    return g
