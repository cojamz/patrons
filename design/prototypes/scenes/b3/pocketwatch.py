import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(p='#c9bfae', P='#b9ae9b', t='#5a7a8c', T='#486676', q='#c8dbe0', f='#8f8a82', F='#7c776f',
               y='#e0b648', Y='#b08a2c', e='#f2e8d2', g='#f0c548',
               a=OLIVE[0], A=OLIVE[1], h='#2e2420', H='#4a382e', n='#3e3a4a', N='#2e2b38', z='#3a2c26',
               **{'1': PURPLE[0], '2': PURPLE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 'y': 'Y', 'n': 'N'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 0, 63, 4, 'P')

    def train(l):                           # train car at the platform
        l.rect(0, 8, 63, 44, 't'); l.rect(0, 8, 63, 10, 'T'); l.hl(0, 63, 38, 'T')
        for x0 in (2, 46):
            l.rect(x0, 15, x0 + 14, 28, 'T'); l.rect(x0 + 1, 16, x0 + 13, 27, 'q')
    bg(c, train, 'T')
    c.rect(0, 45, 63, 63, 'f'); c.rect(0, 45, 63, 47, 'g'); c.hl(0, 63, 48, 'F')

    def top(f):                             # conductor's cap: flat top, front brim, gold badge
        f.rect(23, 7, 38, 12, '1'); f.rect(35, 7, 38, 12, '2')
        f.hl(22, 39, 13, 'N'); f.hl(23, 38, 14, 'N')
        f.rect(29, 9, 31, 10, 'y')

    def front(f):                           # waistcoat buttons and the watch chain
        for y in (32, 36, 40):
            f.px(31, y, 'y')
        f.pts('y', [(32, 37), (33, 38), (34, 38), (35, 37)])
    person(c, DK, hx=24, hy=12, skin='a', shade='A', mouth='smile', brows='stern', brow='h',
           hs='crop', hk='h', hd='H', cx=31, sw=8, ww=7, th=14, cloth='1', top=top, front=front,
           lg=dict(gap=2, lw=4, lh=10, pants='n', pdark='N', shoe='z'),
           arms=[([(39, 31), (44, 36), (42, 28)], 4, '1'), ([(23, 31), (20, 37), (22, 43)], 4, '1')],
           hands=[(41, 23, 'grip', True), (20, 43, 'fist', False)],
           props=lambda p: p.pts('y', [(40, 30), (39, 32), (38, 34), (37, 36)]))
    w = layer()                             # the open pocket watch, held up
    w.ell(40, 15, 48, 23, 'y'); w.ell(42, 17, 46, 21, 'e'); w.vl(44, 18, 19, 'k'); w.px(45, 19, 'k')
    w.pts('Y', [(47, 20), (47, 21), (46, 22)])
    w.rect(43, 13, 45, 14, 'Y')
    outline_once(w); c.paste(w)
    return c.rows(), pal


PORTRAIT = ('purple.pocketwatch', draw)
