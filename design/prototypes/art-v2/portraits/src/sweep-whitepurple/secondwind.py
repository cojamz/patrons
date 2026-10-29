# Go-Getter: one more push. A runner in a sweatband with spiky hair, a fierce determined grin, a sweat drop flying
# off, a track jacket with racing stripes and a race bib pinned on; motion streaks behind.
from lib import *
def draw():
    g = new()
    for (x, y, n) in ((2, 10, 4), (3, 13, 3), (2, 16, 4), (3, 19, 2)): at(g, x, y, ['i' * n])
    body(g, top=22, start=8)
    for y in range(22, 32):  # racing stripes down each sleeve
        for x in (3, 5, 26, 28):
            if g.c[y][x] in '1234': g.c[y][x] = 'W'
    at(g, 12, 22, ['W      W', ' W    W ', '  WWWW  '])  # collar trim
    at(g, 11, 26, ['NWWWWWWWWN', 'WWWWKKWWWV', 'WWWKKKWWWV', 'WWWWKKWWWV', 'WWWWKKWWWV', 'WWWKKKKWVV'])  # race bib "1"
    head(g, 8, 2, [
        '  H  H   H  H   ',
        ' HhH hjH HhH H  ',
        ' HhjHhjhHhjhHhH ',
        'HhjjhhjjhhhhhhhH',
        'RqqqRRRRRRRRRRrr',
        'RRRRRRRRRRRRRrrr',
        'rRRRRRRRRRRRRrrr',
    ])
    face(g, y=9, eyes='stern', mouth='grin', rows={0: 'HSSSSSSSSSSSSssH', 2: 'SKKSSSSSSSSKKsst'})
    at(g, 25, 9, [' i', 'iw', 'ii'])  # sweat drop
    return g
