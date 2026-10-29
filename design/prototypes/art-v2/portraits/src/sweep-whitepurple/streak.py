# Hot Streak: on fire. Hair blazing up into flames, a cocky open grin, star sparkles, a letterman jacket with a gold
# number and a chain; the flames climb the doorway.
from lib import *
def draw():
    g = new()
    for x, y in ((3, 8), (27, 12), (4, 17)): at(g, x - 1, y - 1, [' w ', 'wGw', ' w '])
    body(g, top=22, start=8)
    at(g, 12, 22, ['WWWWWWWW', ' WWWWWW ', '  WVVW  '])  # tee under the jacket
    for y in range(22, 32):  # cream sleeves of the letterman jacket
        for x in range(N):
            if g.c[y][x] in '1234' and (x < 6 or x > 25): g.c[y][x] = 'W' if x < 6 else 'V'
    at(g, 7, 26, ['GGG', 'g G', ' Gg', 'Gg ', 'GGG'])  # gold "2"
    at(g, 13, 23, ['g    g', ' g  g ', '  GG  '])  # chain
    head(g, 6, 0, [
        '     G      G      ',
        '    GY     YG   G  ',
        '   GYY  G  YYG  YG ',
        '  GYqY GY YqYY GYY ',
        '  YqqY YqYYqqYGYqY ',
        ' YqRqqYqRqqRRqYqRqY',
        ' qRRRqqRRRqRrRqRRRq',
        '  RrRRRRrRRRRRrRRr ',
        '  rHHrHrrHHrrHHrr  ',
    ])
    face(g, y=9, mouth='grin', rows={0: 'HSSSSSSSSSSSSssH', 2: 'SSKtSSSSSSKtSsst'})
    return g
