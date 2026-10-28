# Shared pieces for the green-magenta batch, following portraits/example_launderer.py (the approved model).
import sys, math
sys.path.insert(0, '/home/user/patrons/design/prototypes/art-v2')
from pix import G
N = 32

def doorway():
    g = G(N)
    for y in range(1, N):
        hw = 14 if y >= 15 else int(round(math.sqrt(max(0, 14.4 ** 2 - (15 - y) ** 2))))
        if hw > 1: g.put(16 - hw, y, ['c' + 'b' * (2 * hw - 2) + 'c'])
    return g

def body(g, cx=16, top=22, half0=7, slope=3, maxhalf=15, x0=None, x1=None):
    for y in range(top, N):
        half = min(maxhalf, half0 + (y - top) * slope)
        lo, hi = cx - half, cx + half
        for x in range(lo, hi):
            if x0 is not None and x < x0: continue
            if x1 is not None and x >= x1: continue
            k = x - lo; w = 2 * half
            g.c[y][x] = '4' if k < 2 else ('1' if k >= w - 1 else ('2' if k >= w - 4 else '3'))

def neck(g, x=14, y=22): g.put(x, y, ['ssss', ' tt '])

CROWN = ['    SSSSSSSS    ', '  SSSSSSSSSSSS  ', ' SSSSSSSSSSSSSs ', 'SSSSSSSSSSSSSsst', 'SSSSSSSSSSSSSsst', 'SSSSSSSSSSSSSsst']
FACE = ['SSSSSSSSSSSSSsst', 'SSSSSSSSSSSSSsst', 'SSSSSSSSSSSSSsst', 'SSSSSSSSSSSSSsst', 'SSSSSSSSSSSSSsst',
        'SSSSSSStSSSSSsst', 'SSSSSSttSSSSSsst', 'SSSSSSSSSSSSSsst', ' SSSSSSSSSSSsst ', ' SSSSSSSSSSSsst ',
        '  SSSSSSSSSSst  ', '   sSSSSSSSst   ', '    tsssssst    ']

def head(g, x=8, y=9, eyes='dot', brows='flat', mouth='smile', cheeks=True, ears=True, crown=True):
    if crown: g.put(x, y - 6, CROWN)
    g.put(x, y, FACE)
    if ears: g.put(x - 1, y + 3, ['s', 's', 't']); g.put(x + 16, y + 3, ['t', 't', 't'])
    L, R = x + 2, x + 10; ey = y + 3
    if brows == 'flat': g.put(L, ey - 1, ['tt']); g.put(R, ey - 1, ['tt'])
    elif brows == 'dark': g.put(L, ey - 1, ['HH']); g.put(R, ey - 1, ['HH'])
    elif brows == 'angry': g.put(L - 1, ey - 2, ['K  ', ' KK']); g.put(R, ey - 2, ['  K', 'KK '])
    elif brows == 'worried': g.put(L, ey - 2, ['  ', 'KK']); g.put(L + 1, ey - 2, ['K']); g.put(R, ey - 2, ['K ', 'KK'])
    elif brows == 'raised': g.put(L, ey - 2, ['tt']); g.put(R, ey - 2, ['tt'])
    if eyes == 'dot': g.put(L, ey, ['wK', 'KK']); g.put(R, ey, ['wK', 'KK'])
    elif eyes == 'right': g.put(L, ey, ['wK', 'wK']); g.put(R, ey, ['wK', 'wK'])
    elif eyes == 'left': g.put(L, ey, ['Kw', 'Kw']); g.put(R, ey, ['Kw', 'Kw'])
    elif eyes == 'happy': g.put(L - 1, ey, [' KK ', 'K  K']); g.put(R - 1, ey, [' KK ', 'K  K'])
    elif eyes == 'closed': g.put(L - 1, ey + 1, ['tKKt']); g.put(R - 1, ey + 1, ['tKKt'])
    elif eyes == 'narrow': g.put(L, ey, ['tt', 'KK']); g.put(R, ey, ['tt', 'KK'])
    elif eyes == 'wink': g.put(L, ey, ['wK', 'KK']); g.put(R - 1, ey + 1, ['KKK'])
    if cheeks: g.put(x + 1, y + 6, ['aa']); g.put(x + 12, y + 6, ['aa'])
    m = x + 5; my = y + 8
    if mouth == 'smile': g.put(m, my, ['K    K', ' KKKK '])
    elif mouth == 'grin': g.put(m, my, ['KKKKKK', ' KwwK '])
    elif mouth == 'smirk': g.put(m + 1, my, ['    K', 'KKKK '])
    elif mouth == 'frown': g.put(m, my, [' KKKK ', 'K    K'])
    elif mouth == 'flat': g.put(m + 1, my + 1, ['KKKK'])
    elif mouth == 'open': g.put(m + 1, my - 1, ['tKKt', 'KrrK', 'tKKt'])
    elif mouth == 'o': g.put(m + 2, my, ['KK', 'KK'])
    return g

def mini(g, x, y, eyes='dot', mouth='smile', cheeks=True):
    """A small head 10 wide, 11 tall, for group cards."""
    g.put(x, y, ['  SSSSSS  ', ' SSSSSSSs ', 'SSSSSSSSss', 'SSSSSSSSst', 'SSSSSSSSst', 'SSSSSSSSst',
                 'SSSSStSSst', 'SSSSSSSSst', ' SSSSSSst ', '  SSSSst  ', '   tsst   '])
    if eyes == 'dot': g.put(x + 1, y + 4, ['wK   wK', 'KK   KK'])
    elif eyes == 'narrow': g.put(x + 1, y + 4, ['tt   tt', 'KK   KK'])
    elif eyes == 'open': g.put(x + 1, y + 4, ['wK   wK', 'KK   KK'])
    elif eyes == 'happy': g.put(x + 1, y + 4, ['KK   KK', '        '])
    if cheeks: g.put(x, y + 7, ['a      a'])
    if mouth == 'smile': g.put(x + 3, y + 8, ['K  K', ' KK '])
    elif mouth == 'open': g.put(x + 4, y + 7, ['KK', 'rK', ' t'][:2])
    elif mouth == 'flat': g.put(x + 3, y + 8, ['KKK'])
    elif mouth == 'smirk': g.put(x + 3, y + 8, ['   K', 'KKK '])
    return g

def bubble(o, size=5, fill='i'):
    if size == 5: return [f' {o*3} ', f'{o}w{fill*2}{o}', f'{o}{fill*3}{o}', f'{o}{fill*3}{o}', f' {o*3} ']
    return [f' {o*2} ', f'{o}w{fill}{o}', f'{o}{fill*2}{o}', f' {o*2} ']

NOTE = ['  KK', '  KK', '  K ', ' KK ', 'KKK ', 'KK  ']

def layer(g, draw):
    """Draw a front layer with a 1px gap (rendered dark) where it overlaps what's already there."""
    f = G(N); draw(f)
    on = lambda x, y: 0 <= x < N and 0 <= y < N and f.c[y][x] != '.'
    for y in range(N):
        for x in range(N):
            if on(x, y): continue
            if any(on(a, b) for a, b in ((x-1, y), (x+1, y), (x, y-1), (x, y+1))) and g.c[y][x] not in '.bci':
                g.c[y][x] = '.'
    for y in range(N):
        for x in range(N):
            if on(x, y): g.c[y][x] = f.c[y][x]
    return g

def oval(g, cx, cy, rx, ry, rim='G', rim2='g', fill='i'):
    for y in range(N):
        for x in range(N):
            d = ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2
            if d <= 1:
                inner = ((x + .5 - cx) / (rx - 1.2)) ** 2 + ((y + .5 - cy) / (ry - 1.2)) ** 2
                g.c[y][x] = fill if inner <= 1 else (rim if (x + .5 - cx) + (y + .5 - cy) < 0 else rim2)
