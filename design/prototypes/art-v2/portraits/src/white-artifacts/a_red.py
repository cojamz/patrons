# Recruiter: a red megaphone, a cream band round the cone, a wooden pistol grip, sound rings coming out.
from common import *
ID = 'artifact.red'
def draw():
    g = blank()
    g.put(12, 18, ['OOO', 'OOo', 'OOo', ' OOo', ' OOo', ' Ooo', '  oo'])  # grip
    g.put(15, 19, ['N', 'NN'])  # trigger
    cy = 14.5
    for x in range(8, 25):
        h = 2.2 + (x - 8) * 0.42
        for y in range(N):
            d = (y + .5 - cy) / h
            if abs(d) <= 1:
                g.c[y][x] = '4' if d < -0.6 else ('3' if d < 0.2 else ('2' if d < 0.75 else '1'))
                if x in (18, 19): g.c[y][x] = 'W' if d < 0.4 else 'V'
    for y in range(4, 26):  # the bell rim, seen from the side
        d = (y + .5 - cy) / 10.6
        if abs(d) <= 1: g.c[y][25] = 'L' if d < 0.3 else 'M'
    g.put(3, 12, [' MLL', 'NMLLL', 'NMMLM', 'NMMMM', ' NNN'])  # mouthpiece
    g.put(8, 13, ['N', 'N', 'N'])
    for (x, y0, y1) in [(28, 11, 18), (30, 8, 21)]:  # sound rings
        for y in range(y0, y1 + 1): g.c[y][x] = '4'
        g.c[y0 - 1][x - 1] = '4'; g.c[y1 + 1][x - 1] = '4'
    g.put(10, 9, ['w', 'ww']) ; g.c[8][13] = '.'
    g.put(11, 11, ['w'])
    return g.rows()
