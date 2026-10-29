import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(p='#2f3048', P='#282940', y='#f3dc8a', Y='#c9a24a', j='#a8303c', J='#7e2230', e='#f4ede1', E='#cfc8bc',
               f='#4a3a4a', a=DEEP[0], A=DEEP[1], L='#8e5c3c', b=LIGHT[0], B=LIGHT[1], h='#1f1612', H='#3a2a24',
               i='#d8b060', I='#a8843e', n='#26304a', N='#1e2639', z='#1f1a1a',
               **{'1': BLUE[0], '2': BLUE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 'b': 'B', 'n': 'N', 'e': 'E'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 54, 63, 63, 'f')
    for i, x in enumerate(range(3, 64, 8)):          # string of party lights
        c.px(x, 6 + (i % 2), 'y'); c.px(x + 1, 6 + (i % 2), 'Y')
    for x in range(0, 64):
        if x % 8 not in (3, 4):
            c.px(x, 5 + ((x // 4) % 2), 'P')

    # guest (fair), on the right, in a blue dress, waving
    person(c, DK, hx=37, hy=15, skin='b', shade='B', mouth='grin', brows='soft', brow='I',
           hs='long', hk='i', hd='I', cx=44, sw=7, ww=8, th=17, cloth='1',
           lg=dict(gap=2, lw=3, lh=7, pants='b', pdark='B', shoe='z'),
           arms=[([(51, 33), (55, 30), (55, 23)], 3, 'b'), ([(37, 33), (35, 38), (36, 43)], 3, 'b')],
           hands=[(54, 19, 'flat', True)])
    # host (brown), on the left, blue suit, holding up the invitation
    person(c, DK, hx=14, hy=13, skin='a', shade='A', mouth='smile', brows='soft', brow='h',
           hs='crop', hk='h', hd='H', cx=21, sw=8, ww=7, th=15, cloth='1',
           lg=dict(gap=2, lw=4, lh=9, pants='n', pdark='N', shoe='z'),
           front=lambda f: (f.poly([(17.5, 28), (24.5, 28), (21, 32)], 'e'), f.rect(20, 29, 21, 33, 'j'),
                            f.px(25, 32, 'e')),
           face=lambda h: None,
           arms=[([(28, 31), (32, 36), (36, 38)], 4, '1'), ([(13, 31), (9, 33), (8, 27)], 4, '1')],
           hands=[(6, 23, 'grip', False)])
    inv = layer()                           # the invitation card, gold edge
    inv.rect(3, 15, 13, 23, 'e'); inv.rect(3, 15, 13, 16, 'Y'); inv.rect(7, 19, 9, 20, 'j'); inv.px(9, 20, 'J')
    outline_once(inv); c.paste(inv)
    hl = layer(); hand(hl, 5, 22, 'grip', 'a', 'A'); outline_once(hl); c.paste(hl)

    def rope(l):                            # velvet rope, unhooked behind them
        l.rect(58, 40, 60, 54, 'Y'); l.rect(57, 38, 61, 40, 'y'); l.rect(56, 54, 62, 55, 'Y')
    bg(c, rope)
    for x in range(36, 58):                 # the velvet rope swag, behind them
        y = round(41 + 6 * (1 - ((x - 47) / 11) ** 2))
        for yy, k in ((y, 'j'), (y + 1, 'j'), (y + 2, 'J')):
            if c.get(x, yy) in 'pf':
                c.px(x, yy, k)
    return c.rows(), pal


PORTRAIT = ('market.plusone', draw)
