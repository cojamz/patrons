# Shared pieces for the red-guests batch: the Launderer's doorway and shoulders, a lit face, and helpers.
import sys, math
sys.path.insert(0, "/home/user/patrons/design/prototypes/art-v2")
from pix import G

N = 32

def doorway(g):
    for y in range(1, N):
        hw = 14 if y >= 15 else int(round(math.sqrt(max(0, 14.4 ** 2 - (15 - y) ** 2))))
        if hw > 1: g.put(16 - hw, y, ['c' + 'b' * (2 * hw - 2) + 'c'])

def shoulders(g, cx=16, top=22, base=7, step=3, maxhalf=15, x0=0, x1=N):
    """Shirt in the member's color, lit from the top-left (the Launderer's)."""
    for y in range(top, N):
        half = min(maxhalf, base + (y - top) * step)
        for x in range(max(x0, cx - half), min(x1, cx + half)):
            k = x - (cx - half); w = 2 * half
            g.c[y][x] = '4' if k < 2 else ('1' if k >= w - 1 else ('2' if k >= w - 4 else '3'))

# Inset schedule for the last rows of a face (the Launderer's chin: 1,1,2,3,4).
CHIN = {16: [1, 1, 2, 3, 4], 14: [1, 1, 2, 3], 12: [1, 2, 3], 11: [1, 2, 3], 10: [1, 2, 3]}

def face(g, x, y, w=16, h=13, ears=True, ear_row=3):
    """Skin block from the forehead row y down to the chin, lit top-left.
    Returns nothing; features go on top with g.put."""
    chin = CHIN.get(w, [1, 2, 3])
    for j in range(h):
        k = j - (h - len(chin))
        ins = chin[k] if k >= 0 else 0
        L = w - 2 * ins
        if j == h - 1:
            row = 't' + 's' * (L - 2) + 't'
        elif k >= 2:
            row = 's' + 'S' * (L - 3) + 'st'
        elif ins:
            row = 'S' * (L - 3) + 'sst' if L > 6 else 'S' * (L - 2) + 'st'
        else:
            row = 'S' * (w - 3) + 'sst'
        g.put(x + ins, y + j, [row])
    if ears:
        g.put(x - 1, y + ear_row, ['s', 's', 't'])
        g.put(x + w, y + ear_row, ['t', 't', 't'])

def eyes(g, x, y, gap=8, brow=True, glint=True):
    e = ['wK', 'KK'] if glint else ['KK', 'KK']
    g.put(x, y, e); g.put(x + gap, y, e)
    if brow: g.put(x, y - 1, ['tt']); g.put(x + gap, y - 1, ['tt'])

def build(fn, path):
    g = G(N); fn(g); rows = g.rows()
    open(path, 'w').write('\n'.join(rows))
    return rows
