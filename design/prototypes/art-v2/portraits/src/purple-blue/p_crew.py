# Shift Crew: two workers in hard hats squeezed into the doorway, high-vis stripes on their vests.
from lib import *
ID, NAME, SPHERE = 'purple.crew', 'Shift Crew', 'purple'
def worker(g, x, y, mouth, hair):
    at(g, x, y, ['   YYYYYY   ', '  YwYYYYYn  ', ' YYwYYYYYnn ', ' YYYYYYYYnn ', 'GGGGGGGGGGgg', f'{hair}SSSSSSSSs{hair.upper()}',
                 'SSttSSSttSst', 'SwKSSSwKSsst', 'SKKSSSKKSsst', 'SaSSStSSasst', mouth, ' SSSSSSSsst ', '  tssssst   '])
    at(g, x - 1, y + 7, ['s', 't']); at(g, x + 12, y + 7, ['t', 't'])
def draw():
    g = new()
    body(g, start=12)
    worker(g, 3, 6, 'SSSKWWWKSsst', 'h')
    worker(g, 17, 5, 'SSSSKKKSSsst', 'h')
    for x in range(1, 31):  # a reflective band on each vest
        for y in (27, 28):
            if g.c[y][x] != '.': g.c[y][x] = 'Y' if y == 27 else 'n'
    for y in range(20, 32): g.c[y][16] = '1' if g.c[y][16] != '.' else '.'
    at(g, 9, 22, ['Y', 'Y', 'Y', 'Y', 'Y']); at(g, 22, 22, ['Y', 'Y', 'Y', 'Y', 'Y'])
    at(g, 8, 19, ['ss']); at(g, 22, 18, ['ss', 'tt'])
    return g
