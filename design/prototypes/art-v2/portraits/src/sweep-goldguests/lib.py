# Shared pieces for the goldguests sweep: the Launderer's doorway, lit shoulders, parametric faces, features.
import sys, math
sys.path.insert(0, "/home/user/patrons/design/prototypes/art-v2")
from pix import G
N = 32

def new():
    g = G(N)
    for y in range(1, N):
        hw = 14 if y >= 15 else int(round(math.sqrt(max(0, 14.4 ** 2 - (15 - y) ** 2))))
        if hw > 1: g.put(16 - hw, y, ['c' + 'b' * (2 * hw - 2) + 'c'])
    return g

def P(g, x, y, rows):
    """put, but rows may be one multi-line string; ' ' is transparent."""
    if isinstance(rows, str): rows = rows.strip('\n').split('\n')
    return g.put(x, y, rows)

def at(g, x, y, ch):
    if 0 <= x < N and 0 <= y < N: g.c[y][x] = ch

def torso(g, cx=16, top=22, half0=7, step=3, maxhalf=15, x0=0, x1=N, ramp='4321', bottom=N - 1):
    """Shoulders/shirt lit from the top-left: 4 on the left rim, 3 base, 2 shade, 1 the far rim.
    The top row of each shoulder slope is lit (4), the underside of the far shoulder dark."""
    hi, base, sh, dk = ramp
    for y in range(top, bottom + 1):
        half = min(maxhalf, half0 + (y - top) * step)
        L, R = cx - half, cx + half
        for x in range(max(x0, L), min(x1, R)):
            k = x - L; w = R - L
            c = hi if k < 2 else (dk if k >= w - 1 else (sh if k >= w - 4 else base))
            g.c[y][x] = c

CHIN = {16: [1, 1, 2, 3, 4], 15: [1, 1, 2, 3, 4], 14: [1, 1, 2, 3], 13: [1, 1, 2, 3], 12: [1, 2, 3],
        11: [1, 2, 3], 10: [1, 2, 3], 9: [1, 2, 3], 8: [1, 2]}
TOP = {16: [4, 2, 1], 15: [4, 2, 1], 14: [3, 1], 13: [3, 1], 12: [3, 1], 11: [2, 1], 10: [2, 1], 9: [2, 1], 8: [2]}

def face(g, x, y, w=16, h=19, ears=True, ear_row=None, shade=None, round_top=True):
    """Skin from the crown (row y) to the chin (row y+h-1), lit from the top-left: s on the right, t the far edge
    and under the chin. Hair and hats go on top."""
    chin = CHIN.get(w, [1, 2, 3]); top = TOP.get(w, [2, 1]) if round_top else []
    shade = shade if shade is not None else (2 if w >= 12 else 1)
    for j in range(h):
        k = j - (h - len(chin))
        ins = chin[k] if k >= 0 else (top[j] if j < len(top) else 0)
        L = w - 2 * ins
        if L < 3: continue
        if j == h - 1:
            row = 't' + 's' * (L - 2) + 't'
        elif k >= 1:
            row = 'S' * (L - 1 - shade) + 's' * shade + 't'
            if k >= 2: row = 's' + row[1:]
        else:
            row = 'S' * (L - 1 - shade) + 's' * shade + 't'
        g.put(x + ins, y + j, [row])
    if ears:
        er = ear_row if ear_row is not None else int(h * 0.48)
        g.put(x - 1, y + er, ['s', 'S', 't']); g.put(x + w, y + er, ['t', 's', 't'])

def neck(g, x=14, y=22, w=4):
    P(g, x, y, ['s' * (w - 1) + 't', ' ' + 't' * (w - 2) + ' '])

def eyes(g, x, y, gap=8, kind='open', brow='t'):
    """Left eye's top-left at (x, y); 2x2 each; gap = distance between their left columns."""
    L, R = x, x + gap
    if kind == 'open':
        P(g, L, y, ['wK', 'KK']); P(g, R, y, ['wK', 'KK'])
    elif kind == 'side':        # both looking to the viewer's right
        P(g, L, y, ['Sw', 'KK']); P(g, R, y, ['Sw', 'KK']); at(g, L + 1, y, 'K'); at(g, R + 1, y, 'K'); at(g, L, y, 'w'); at(g, R, y, 'w')
        P(g, L, y, ['wK', 'wK']); P(g, R, y, ['wK', 'wK'])
    elif kind == 'sidel':       # looking to the viewer's left
        P(g, L, y, ['Kw', 'Kw']); P(g, R, y, ['Kw', 'Kw'])
    elif kind == 'happy':
        P(g, L - 1, y, [' KK ', 'K  K']); P(g, R - 1, y, [' KK ', 'K  K'])
    elif kind == 'shut':
        P(g, L - 1, y + 1, ['KKKK']); P(g, R - 1, y + 1, ['KKKK'])
    elif kind == 'narrow':
        P(g, L, y, ['tt', 'KK']); P(g, R, y, ['tt', 'KK'])
    elif kind == 'wink':        # left open, right winking
        P(g, L, y, ['wK', 'KK']); P(g, R - 1, y, [' KK ', 'K  K'])
    elif kind == 'winkl':
        P(g, L - 1, y, [' KK ', 'K  K']); P(g, R, y, ['wK', 'KK'])
    elif kind == 'wide':
        P(g, L, y, ['wK', 'KK']); P(g, R, y, ['wK', 'KK'])
    if brow and kind not in ('happy',):
        bb = brow if isinstance(brow, tuple) else (brow, brow)
        for (ex, b) in ((L, bb[0]), (R, bb[1])):
            if b == 'up':   P(g, ex, y - 2, ['tt'])
            elif b == 'angry_l': P(g, ex - 1, y - 2, ['KK', '  K'])
            elif b == 'angry_r': P(g, ex, y - 2, [' KK', 'K'])
            elif b == 'sad_l': P(g, ex, y - 2, [' K', 'K'])
            elif b == 'sad_r': P(g, ex, y - 2, ['K', ' K'])
            elif b == 'raised': P(g, ex, y - 2, ['HH'])
            elif b == 'H': P(g, ex, y - 1, ['HH'])
            elif b == 'none': pass
            else: P(g, ex, y - 1, [b * 2])

def torso_vee(g, cx=16, top=22, depth=9, half=3, fill='W', every=3, ledge='4', redge='2'):
    for y in range(top, min(N, top + depth)):
        h = max(0, half - (y - top) // every)
        for x in range(cx - h, cx + h): g.c[y][x] = fill
        if h and ledge: g.c[y][cx - h - 1] = ledge
        if h and redge: g.c[y][cx + h] = redge

def coin(g, x, y):
    P(g, x, y, [' GG ', 'GwGg', 'GGgg', ' gg '])

def stack(g, x, y, n=3):
    rows = [' GGG ', 'GwGGg']
    for k in range(n - 1): rows += ['ggggg', 'GGGGg']
    rows += ['ggggg']
    P(g, x, y, rows)

def mirror(rows):
    return [r[::-1] for r in rows]

def cone(g, bx, by, tx, ty, half, stripes=('R', 'Y'), shade='q', dark='r'):
    """A party-hat cone from base centre (bx,by) to tip (tx,ty), half-width `half` at the base, banded."""
    ax, ay = tx - bx, ty - by; L2 = ax * ax + ay * ay; L = L2 ** .5
    for y in range(N):
        for x in range(N):
            px, py = x - bx, y - by
            t = (px * ax + py * ay) / L2
            if t < 0 or t > 1: continue
            d = (px * ay - py * ax) / L
            w = half * (1 - t) + .35
            if abs(d) <= w:
                c = stripes[int(t * 6) % len(stripes)]
                if d > w - 1.1 and c == stripes[0]: c = dark
                elif d < -w + 1.1 and c == stripes[0]: c = shade
                g.c[y][x] = c
