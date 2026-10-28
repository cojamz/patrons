# Impressionist: a painter's palette (green), blobs of every color, a thumb hole, a brush laid across it.
from common import *
ID = 'artifact.echo'
def draw():
    g = blank()
    ellipse(g, 16, 16.5, 14, 10.5)
    for y in range(N):  # the notch on the right side
        for x in range(N):
            if (x + .5 - 29) ** 2 / 9 + (y + .5 - 21) ** 2 / 7 <= 1: g.c[y][x] = '.'
    ellipse(g, 9.5, 20, 2.2, 1.8, fill='.')
    blob = lambda k, l, d: [f' {k}{k} ', f'{k}{l}{k}{d}', f'{k}{k}{k}{d}', f' {d}{d} ']
    g.put(6, 10, blob('x', 'q', 'r')); g.put(12, 7, blob('y', 'w', 'U')); g.put(18, 8, blob('Y', 'w', 'n'))
    g.put(23, 11, blob('P', 'w', 'p')); g.put(12, 23, blob('W', 'w', 'V')); g.put(17, 21, blob('n', 'G', 'g'))
    # brush lying across
    for i in range(14):
        x, y = 14 + i, 20 - i
        if 0 <= y < N: g.c[y][x] = 'O'; g.c[y + 1][x] = 'o' if i < 13 else g.c[y + 1][x]
    g.put(10, 22, ['  LM', ' LMN', 'EE ', 'E  '][:2])
    g.put(9, 24, ['EE', 'E'])
    g.put(11, 23, ['LM']); g.put(12, 22, ['LM'])
    g.put(5, 9, ['ww', 'w'])
    return g.rows()
