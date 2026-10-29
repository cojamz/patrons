# Early Bird: up before dawn and never misses a turn. A bright-eyed morning person with a neat side part, a little
# yellow songbird perched on the shoulder with a worm in its beak, the sun rising in the doorway behind, a zipped purple windbreaker.
from lib import *
def draw():
    g = new()
    for y in range(N):  # the rising sun low on the left, rays above
        for x in range(N):
            if g.c[y][x] == 'b' and (x - 6) ** 2 + (y - 17) ** 2 <= 16: g.c[y][x] = 'Y' if (x - 6) ** 2 + (y - 17) ** 2 > 6 else 'G'
    for x, y in ((2, 12), (6, 10), (10, 12), (2, 16), (3, 14), (9, 11)): g.c[y][x] = 'Y'
    body(g, top=22, start=8)
    at(g, 13, 22, ['1 1', '1 1', '1 1', '1M1', '1 1', '1 1', '1 1', '1 1', '1 1', '1 1'])  # zipper
    at(g, 14, 22, ['M', 'L', 'M', 'L', 'M', 'L', 'M', 'L', 'M', 'L'])
    at(g, 9, 22, ['44', '443']); at(g, 19, 22, ['221', ' 211'])  # stand-up collar
    head(g, 8, 3, [
        '                ',
        '    HHhhhhhH    ',
        '  HhjjjjhhhhhH  ',
        ' HhjjjhhhhhhhhH ',
        'HhjjhhhhhhhhhhhH',
        'HhhhHhhhhhhhhhhH',
    ])
    sticker(g, 23, 12, ['   YYY  ', '  YYYKY ', ' gYYYYYnn', 'ggYgggY  ', 'g YYgggY ', '  YYYYYq ', '   n n q ', '       q '])  # songbird, worm in beak
    face(g, y=9, mouth='grin', rows={0: 'HSSSSSSSSSSSSssH'})
    return g
