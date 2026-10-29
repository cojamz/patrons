import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(p='#4a2a3a', P='#3f2433', j='#a8303c', J='#7e2230', y='#e0b648', Y='#b08a2c', e='#f4ede1', E='#c9c1b4',
               s='#f3dc8a',
               a=VDEEP[0], A=VDEEP[1], L='#6e4430', h='#17100c', H='#3a2a24',
               **{'1': BLUE[0], '2': BLUE[1], '3': '#8fc0e8'})
    DK = {'1': '2', '2': '2', 'a': 'A', 'y': 'Y', '3': '1'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 0, 63, 2, 'P')
    for lx in (24, 38):                    # far stage lights, small
        c.rect(lx, 6, lx + 2, 7, 's')

    def curtains(l):                        # velvet curtains at the sides of the box
        l.poly([(0, 0), (16, 0), (12, 20), (6, 44), (0, 46)], 'j')
        l.poly([(63, 0), (48, 0), (52, 20), (58, 44), (63, 46)], 'j')
        l.pts('J', [(6, 4), (6, 5), (6, 6), (6, 7), (6, 8), (6, 9), (5, 10), (5, 11), (5, 12), (5, 13), (4, 14), (4, 15), (4, 16)])
        l.pts('J', [(57, 4), (57, 5), (57, 6), (57, 7), (57, 8), (57, 9), (58, 10), (58, 11), (58, 12), (58, 13), (59, 14), (59, 15), (59, 16)])
        l.rect(0, 0, 63, 3, 'J')
    bg(c, curtains, 'J')

    def front(f):                           # neckline on skin, pearls alternating light and dark
        f.poly([(26, 29), (38, 29), (36, 33), (28, 33)], 'a')
        for i, x in enumerate(range(27, 38, 2)):
            f.px(x, 31 + (1 if 29 < x < 35 else 0), 'e'); f.px(x + 1, 31 + (1 if 29 < x < 35 else 0), 'E')
        f.vl(32, 34, 43, '2')
    person(c, DK, hx=24, hy=11, size=16, skin='a', shade='A', mouth='smile', brows='soft', brow='h',
           hs='bun', hk='h', hd='H', side='R', cx=32, sw=10, ww=11, th=18, cloth='1', front=front,
           face=lambda h: None,
           arms=[([(22, 31), (17, 34), (17, 26)], 4, '1'), ([(42, 31), (46, 37), (44, 42)], 4, '1')],
           hands=[(15, 22, 'grip', False)],
           props=lambda p: pole(p, 16, 25, 30, 'y', 'Y'),
           post=lambda f: f.pts('y', [(36, 6), (37, 6), (37, 7)]))
    og = layer()                            # opera glasses on a gold handle
    og.ell(10, 17, 16, 23, 'y'); og.ell(17, 17, 23, 23, 'y')
    og.ell(11, 18, 15, 22, '3'); og.ell(18, 18, 22, 22, '3'); og.px(12, 19, 'e'); og.px(19, 19, 'e')
    outline_once(og); c.paste(og)
    hl = layer(); hand(hl, 14, 24, 'grip', 'a', 'A'); outline_once(hl); c.paste(hl)

    def rail(l):                            # gilded box rail
        l.rect(0, 46, 63, 63, 'j'); l.rect(0, 44, 63, 47, 'y'); l.hl(0, 63, 47, 'Y')
        for x in range(4, 64, 12):
            l.rect(x, 51, x + 6, 58, 'J')
    bg(c, rail)
    hl = layer(); hand(hl, 42, 41, 'flat', 'a', 'A', flip=True); outline_once(hl); c.paste(hl)
    return c.rows(), pal


PORTRAIT = ('market.patroness', draw)
