# Pocket Watch: a purple case with a gold crown and ring, a cream face with hour marks and hands, a gold chain.
from common import *
ID = 'artifact.purple'
def draw():
    g = blank()
    ellipse(g, 15, 18.5, 11, 11)
    ellipse(g, 15, 18.5, 8.2, 8.2, fill='W')
    for y in range(N):
        for x in range(N):
            if g.c[y][x] == 'W' and ((x + .5 - 15) + (y + .5 - 18.5)) > 6.5: g.c[y][x] = 'V'
    for (x, y) in [(15, 11), (14, 11), (21, 18), (21, 19), (15, 25), (14, 25), (8, 18), (8, 19)]: g.c[y][x] = 'K'
    for (x, y) in [(14, 18), (14, 17), (14, 16), (14, 15), (14, 14), (15, 18), (16, 19), (17, 20), (18, 21)]: g.c[y][x] = 'K'
    g.c[18][14] = 'x'
    g.put(13, 5, [' GG ', 'gGGg', ' gg ']) ; g.put(13, 2, [' GG ', 'G  g', ' gg '])
    g.put(13, 1, [' GG ', 'G  G'])
    g.put(16, 2, [' g', '  g', '   G', '    g', '     G', '      g', '      G', '     g', '    G'][0:0])
    for (x, y, c) in [(17, 2, 'g'), (18, 3, 'G'), (19, 3, 'g'), (20, 4, 'G'), (21, 4, 'g'), (22, 5, 'G'), (23, 6, 'g'), (24, 6, 'G'),
                      (25, 7, 'g'), (26, 8, 'G'), (27, 9, 'g'), (27, 10, 'G'), (28, 11, 'g'), (28, 12, 'G'), (29, 13, 'g')]: g.c[y][x] = c
    g.put(8, 11, ['ww', 'w'])
    return g.rows()
