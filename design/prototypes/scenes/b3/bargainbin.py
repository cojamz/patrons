import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(p='#d9cfbd', P='#cbc0ac', u='#e8e2d6', j='#c8423a', J='#9a2f2a', o='#b98a5c', O='#8f6640',
               t='#5f9a8a', T='#467a6c', y='#f0c548', Y='#c09a2c', m='#a8acb4',
               a=OLIVE[0], A=OLIVE[1], h='#4a2e22', H='#2e1c14',
               **{'1': BLUE[0], '2': BLUE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 't': 'T', 'y': 'Y'}
    c.rect(0, 0, 63, 63, 'p')

    def awning(l):                          # shop awning, wide stripes
        for i, x in enumerate(range(0, 64, 8)):
            l.rect(x, 0, x + 7, 7, 'j' if i % 2 == 0 else 'u')
        for x in range(0, 64, 8):
            l.rect(x + 1, 8, x + 6, 9, 'J' if (x // 8) % 2 == 0 else 'P')
    bg(c, awning)
    c.rect(2, 14, 18, 36, 'P'); c.rect(4, 16, 16, 34, 'u')     # shop window, left
    c.rect(48, 14, 62, 36, 'P'); c.rect(50, 16, 60, 34, 'u')

    person(c, DK, hx=24, hy=12, size=16, skin='a', shade='A', mouth='grin', brows='soft', brow='H',
           hs='side', hk='h', hd='H', cx=32, sw=10, ww=9, th=16, cloth='1',
           front=lambda f: (f.poly([(28.5, 29), (35.5, 29), (32, 33)], 'u'), f.pts('u', [(32, 37), (32, 41)])),
           arms=[([(41, 32), (46, 30), (47, 22)], 4, '1'), ([(23, 32), (19, 38), (20, 43)], 4, '1')],
           hands=[(45, 18, 'grip', True), (18, 42, 'flat', False)])
    tp = layer()                            # the find: a little teapot held up
    tp.ell(42, 9, 52, 18, 't'); tp.rect(45, 7, 48, 8, 'T'); tp.pts('t', [(53, 11), (54, 10), (55, 9), (53, 12)])
    tp.pts('T', [(41, 12), (40, 13), (40, 14), (41, 15)]); tp.rect(49, 11, 51, 16, 'T')
    outline_once(tp); c.paste(tp)
    hl = layer(); hand(hl, 45, 17, 'grip', 'a', 'A', flip=True); outline_once(hl); c.paste(hl)

    def bin_(l):                            # the wooden bin, heaped
        l.rect(4, 44, 59, 63, 'o')
        for y in (50, 56):
            l.hl(4, 59, y, 'O')
        l.vl(4, 44, 63, 'O'); l.vl(59, 44, 63, 'O')
    j = layer()                             # jumble on top of the bin
    j.ell(6, 38, 15, 46, 'y'); j.rect(17, 40, 27, 46, 't'); j.ell(36, 39, 44, 46, 'j'); j.rect(46, 40, 57, 46, 'u')
    j.rect(29, 41, 34, 46, 'm')
    edged(j, 'O'); c.paste(j)
    bg(c, bin_)
    tag = layer()                           # a red price tag on the bin
    tag.poly([(40, 50), (52, 50), (52, 58), (40, 58), (37, 54)], 'j'); tag.px(40, 54, 'u')
    tag.rect(44, 53, 49, 54, 'u')
    outline_once(tag); c.paste(tag)
    return c.rows(), pal


PORTRAIT = ('market.bargainbin', draw)
