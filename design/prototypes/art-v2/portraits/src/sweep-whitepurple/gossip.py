# Gossip: hair in rollers under a scarf, big gold hoops, eyes darting sideways, mouth open mid-story,
# a speech bubble full of dots floating beside her.
from lib import *
def draw():
    g = new()
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
    sticker(g, 23, 4, [' wwwwww ', 'wwwwwwww', 'wKwKwKww', 'wwwwwwww', ' wwwwww ', '  ww    ', ' w      '])  # psst...
    at(g, 24, 6, ['K K K'])
    return g
