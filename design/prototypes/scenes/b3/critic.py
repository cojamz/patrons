import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(p='#7e3f3f', P='#703636', y='#f3dc8a', e='#f4ede1', E='#d3cbbd', m='#a8acb4', M='#7c8088',
               g='#6f9a5a', o='#c9873a', O='#9a6328', j='#3a2a2e', d='#d9b16c',
               a=OLIVE[0], A=OLIVE[1], h='#6a4428', H='#4a2c18', b='#2b3a5c',
               **{'1': BLUE[0], '2': BLUE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 'e': 'E', 'b': 'b'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 30, 63, 63, 'P')

    def sconce(l):                          # two small wall lamps
        for x in (6, 52):
            l.rect(x, 12, x + 5, 16, 'y'); l.rect(x + 2, 17, x + 3, 20, 'O')
    bg(c, sconce)

    def top(f):                             # beret, tipped to the right
        f.ell(25, 6, 42, 14, 'b'); f.rect(32, 5, 33, 6, 'b')
    person(c, DK, hx=24, hy=11, size=16, skin='a', shade='A', mouth='frown', brows='stern', brow='H',
           hs='crop', hk='h', hd='H', cx=32, sw=10, ww=10, th=16, cloth='1', top=top,
           
           arms=[([(22, 31), (18, 37), (20, 41)], 4, '1'), ([(42, 31), (46, 36), (44, 41)], 4, '1')])

    def table(l):                           # white tablecloth
        l.rect(0, 43, 63, 63, 'e'); l.hl(0, 63, 43, 'E'); l.rect(0, 58, 63, 63, 'E')
    bg(c, table)
    pl = layer()                            # a plate of food
    pl.ell(4, 42, 24, 50, 'm'); pl.ell(6, 43, 22, 49, 'e'); pl.ell(9, 44, 17, 48, 'o'); pl.ell(14, 43, 19, 46, 'g')
    pl.pts('O', [(10, 47), (12, 47), (14, 47)])
    edged(pl, 'M'); c.paste(pl)
    nb = layer()                            # notebook and pen
    nb.rect(36, 40, 49, 50, 'e'); nb.rect(36, 40, 37, 50, 'E')
    for y in (43, 45, 47):
        nb.hl(39, 47, y, 'M')
    outline_once(nb); c.paste(nb)
    hl = layer(); hand(hl, 18, 40, 'flat', 'a', 'A'); hand(hl, 43, 40, 'grip', 'a', 'A', flip=True); outline_once(hl)
    c.paste(hl)
    c.pts('O', [(45, 37), (45, 38), (45, 39)]); c.pts('j', [(46, 36), (46, 37), (46, 38), (46, 39)])
    c.pts('O', [(44, 43), (43, 43)])
    return c.rows(), pal


PORTRAIT = ('market.critic', draw)
