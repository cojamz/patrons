# Caterer: a silver serving cloche on a platter, a shine down its dome, a sprig of parsley peeking out.
from common import *
ID = 'artifact.silver'
def draw():
    g = blank()
    ellipse(g, 16, 25, 15, 3.6)  # platter
    for x in range(N):
        for y in range(23, 29):
            if g.c[y][x] != '.' and y >= 26: g.c[y][x] = '2' if g.c[y][x] in '34' else '1'
    ellipse(g, 16, 23, 12, 13, clip=lambda x, y: y < 23)
    for x in range(4, 28): g.c[23][x] = 'M' if x > 6 else 'L'
    g.put(14, 6, [' 44 ', '4332', ' 32 '])  # knob
    for (x, y) in [(9, 13), (8, 14), (8, 15), (7, 16), (7, 17), (11, 12), (12, 11)]: g.c[y][x] = 'w'
    g.put(25, 21, ['EeE', 'EEee', ' Ee'])
    g.put(3, 21, ['E ', 'EeE'])
    return g.rows()
