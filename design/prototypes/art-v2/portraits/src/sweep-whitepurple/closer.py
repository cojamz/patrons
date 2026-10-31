# Closer: the salesman who seals it at the last minute. Slick pompadour, a knowing wink and smirk, a pen tucked behind
# his ear, sharp purple suit with wide lapels, gold tie, a pocket square; a signed contract with a red wax seal beside him.
from lib import *
def draw():
    g = new()
    sticker(g, 1, 9, ['WWWWWV', 'WKKKWV', 'WWWWWV', 'WKKWKV', 'WWWWWV', 'WKKKWV', 'WWWWWV', 'WKWKKV', 'WWWWqR', 'WWWWRr', 'VVVVrr'], sides='rtb')  # signed contract, red wax seal
    body(g, top=22, start=8)
    for k in range(7):  # shirt V, lapels edged dark, the left lapel catching light
        y = 22 + k; l = 11 + k // 1 if k < 5 else 15; r = 20 - k if k < 5 else 16
        for x in range(l, r + 1): g.c[y][x] = 'W' if x < r else 'V'
        if k < 6:
            g.c[y][l - 1] = '1'; g.c[y][r + 1] = '1'; g.c[y][l - 2] = '4'; g.c[y][l - 3] = '4'; g.c[y][r + 2] = '2'
    at(g, 15, 22, ['gG', 'GG', 'Gg', 'GG', 'gg', 'Gg', 'gg', 'gg'])  # gold tie
    at(g, 23, 25, ['Gw', 'GG'])  # pocket square
    head(g, 8, 2, [
        '   HHhhhhhH     ',
        '  HhjjjjhhhhH   ',
        ' HhjjjhhhhhhhH  ',
        'HhjjhhhhhhhhhhH ',
        'HhhhhhhhhhhhhhhH',
        'HhhhHhhhhhhhhhhH',
        'HhHSSSSSSSSSSHhH',
    ])
    face(g, y=9, eyes='wink', mouth='grin', rows={0: 'HSSSSSSSSSSSSssH', 1: 'hSSSSSSSSSSSSsst'})
    at(g, 24, 9, ['  Y', ' YK', 'YKY', 'YY ', 'G  '][::1])  # pen behind the ear
    return g
