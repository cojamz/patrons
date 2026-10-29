import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def frontrunner():
    c = C(N)
    pal = base(LIGHT, 'grey', b='#bcd6e2', m='#8d8a96', M='#7f7c88', o='#c0624a', O='#ad5640', e='#d6dadd',
               H='#e2b44e', z='#b8862e', q='#4b4f55', Q='#3b3f45', t='#5b6068')
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 22, 63, 38, 'm')
    for x in range(2, 64, 9):                       # the stand crowd, a few heads
        c.ell(x, 24 + (x % 4), x + 4, 28 + (x % 4), 'M')
    c.rect(0, 38, 63, 63, 'o')
    c.hl(0, 63, 46, 'O'); c.hl(0, 63, 56, 'O')

    cx = 32
    DK = {'1': '2', 'w': 'e', 'q': 'Q'}

    def front(f):                                   # race bib with a big 1
        f.rect(cx - 4, 36, cx + 3, 42, 'w'); f.vl(cx, 37, 41, 'k'); f.px(cx - 1, 38, 'k')
        f.recolor('1', 's', (0, 30, 63, 32)) if False else None

    person(c, cx, 16, hs='short', hk='H', hdk='z', mouth='grin', brows='soft', brow='z',
           shirt='1', sdk='2', sw=7, ww=6, th=12, pants='q', pdk='Q', shoe='t', lh=9, stance=2, front=front, DK=DK,
           arms=[([(cx - 6, 34), (cx - 11, 30), (cx - 14, 20)], 3, 's'),
                 ([(cx + 6, 34), (cx + 11, 30), (cx + 14, 20)], 3, 's')],
           hands=[(cx - 16, 16, 'fist', False), (cx + 13, 16, 'fist', True)])
    # the finish tape, snapped at his chest and trailing
    for (x0, x1, y0, y1) in ((0, cx - 8, 41, 39), (cx + 8, 63, 39, 43)):
        c.line(x0, y0, x1, y1, 'w'); c.line(x0, y0 + 1, x1, y1 + 1, 'e')
    return c.rows(), pal


PORTRAIT = ('benders.frontrunner', frontrunner)
