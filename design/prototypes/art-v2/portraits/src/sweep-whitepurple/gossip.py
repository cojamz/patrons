# Gossip: hair in rollers under a scarf, big gold hoops, eyes darting sideways, a hand cupped to her mouth to pass
# it on; little whisper marks drifting out of the doorway.
from lib import *
def draw():
    g = new()
    at(g, 25, 9, ['ww ', '  w', 'ww '][:3]); at(g, 25, 14, [' w', 'w ', ' w'])
    body(g, top=22, start=8)
    at(g, 12, 22, ['4      2', ' 4    2 ', '  4222  '])
    for x, y in ((6, 26), (10, 28), (22, 27), (26, 25), (18, 30)): g.c[y][x] = '4'  # polka dots
    head(g, 8, 2, [
        '   WWxxWWyyWW   ',
        '  WxxWWyyWWzzW  ',
        ' WWxxWWyyWWzzWW ',
        'qRRRRRRRRRRRRRRr',
        'RqqRRRRRRRRRRRrr',
        'HhhjjhhhhhhhjhhH',
        'HhjjhhhhhhhhhhhH',
    ])
    face(g, y=9, eyes='right', mouth='open', rows={0: 'HSSSSSSSSSSSSssH', 2: 'SStSSSSSSStSSsst'})
    at(g, 6, 13, ['G', 'G', 'g']); at(g, 5, 14, ['G']); at(g, 7, 15, ['g'])  # hoop
    at(g, 24, 13, ['G', 'G', 'g']); at(g, 25, 14, ['g'])
    sticker(g, 22, 14, ['SsSs ', 'StStS', 'tSSSs', 'tSSss', 'tSSst', ' tsst', '  tt '])  # hand raised to the mouth
    return g
