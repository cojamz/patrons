import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(p='#c9b9a0', P='#baa98f', d='#6e4a32', D='#58392a', q='#bfd3d8', v='#ecd59c', Q='#a7bfc5',
               y='#e0b648', Y='#b08a2c', j='#9a2f3a', J='#76222c', f='#a89a86', F='#968873',
               a=LIGHT[0], A=LIGHT[1], h='#6a4428', H='#4a2c18', n='#2b3a5c', N='#223050', z='#2a221e',
               **{'1': BLUE[0], '2': BLUE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 'n': 'N', 'y': 'Y'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 54, 63, 63, 'f'); c.hl(0, 63, 54, 'F')

    def canopy(l):                          # entrance canopy with scalloped edge
        l.rect(0, 0, 63, 6, 'j')
        for x in range(0, 64, 6):
            l.ell(x, 4, x + 5, 9, 'j')
        l.hl(0, 63, 2, 'J')
    bg(c, canopy, 'J')

    def doorway(l):                         # the doorway, warm light inside
        l.rect(44, 12, 62, 54, 'd'); l.rect(47, 15, 62, 54, 'v')
    bg(c, doorway, 'D')

    def leaf(l):                            # the door swung open toward us, hinged at the jamb
        l.poly([(38, 9), (47, 14), (47, 55), (38, 59)], 'd')
        l.poly([(40, 13), (45, 16), (45, 51), (40, 54)], 'q')
        l.rect(39, 30, 40, 38, 'y')
    bg(c, leaf, 'D')

    def top(f):                             # peaked cap, gold band
        f.rect(22, 7, 37, 12, 'n'); f.rect(34, 7, 37, 12, 'N')
        f.hl(22, 37, 11, 'y'); f.hl(22, 37, 12, 'Y')
        f.hl(22, 38, 13, 'k' if False else 'N'); f.hl(23, 36, 14, 'N')

    def front(f):                           # double row of gold buttons, a sash
        for y in (32, 36, 40):
            f.px(27, y, 'y'); f.px(32, y, 'y')
        f.hl(22, 37, 43, 'n')
    person(c, DK, hx=23, hy=12, skin='a', shade='A', mouth='smile', brows='soft', brow='H',
           hs='crop', hk='h', hd='H', cx=30, sw=8, ww=7, th=15, cloth='1', front=front,
           lg=dict(gap=2, lw=4, lh=8, pants='n', pdark='N', shoe='z'),
           arms=[([(37, 31), (41, 37), (40, 35)], 4, '1'), ([(22, 31), (17, 34), (13, 31)], 4, '1')],
           hands=[(9, 28, 'flat', False)],
           top=lambda f: (top(f), f.pts('a', [(13, 26), (13, 25)]), f.px(13, 27, 'A')))
    hl = layer(); hand(hl, 38, 32, 'grip', 'a', 'A', flip=True); outline_once(hl); c.paste(hl)
    c.rect(39, 30, 40, 31, 'y'); c.rect(39, 35, 40, 37, 'Y')   # handle shows above and below the grip
    return c.rows(), pal


PORTRAIT = ('market.doorman', draw)
