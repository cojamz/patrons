import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def robinhood():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 't': '#a9c79a', 'T': '#98b889', 'f': '#7e9e6a', 'F': '#6e8e5c',
           'o': '#8a5a34', 'O': '#6a4224', 'g': '#4f7a4a', 'G': '#43693f', 'y': '#f2d27a', 'Y': '#c9a24a',
           '1': MAGENTA[0], '2': MAGENTA[1], 'v': VDEEP[0], 'V': VDEEP[1], 'u': '#6a4430',
           'h': '#1c120e', 'x': '#4a3a48', 'z': '#3a2a22', 'm': '#d9c8a8', 'M': '#b0a080', 'e': '#e8e2d0'}
    c.rect(0, 0, 63, 63, 't'); c.rect(0, 50, 63, 63, 'f')

    def trees(l):
        l.rect(4, 0, 9, 50, 'o'); l.rect(55, 0, 60, 50, 'o'); l.vl(8, 0, 50, 'O'); l.vl(59, 0, 50, 'O')
        l.ell(-6, -6, 20, 14, 'g'); l.ell(44, -8, 70, 12, 'g'); l.ell(14, -6, 50, 6, 'G')
    bg(c, trees)

    def bow(p):
        # bow held upright in the left hand: a curved stave and a string
        P = [(15, 15), (12, 19), (10, 24), (10, 34), (12, 39), (15, 43)]
        for a, b in zip(P, P[1:]):
            p.line(a[0], a[1], b[0], b[1], 'o'); p.line(a[0] + 1, a[1], b[0] + 1, b[1], 'O')
        p.vl(16, 16, 42, 'e')

    def bag(f, DK):
        f.ell(42, 14, 51, 24, 'm'); f.rect(45, 11, 48, 14, 'm'); f.ell(48, 17, 51, 23, 'M'); f.hl(44, 49, 14, 'Y')
        f.pts('y', [(46, 18), (47, 18), (45, 20)])

    def hat(f):
        f.poly([(23, 13), (30, 6), (40, 9), (42, 13)], '1'); f.poly([(34, 8), (40, 9), (42, 13), (36, 13)], '2')
        f.pts('e', [(36, 7), (37, 6), (38, 5), (39, 4), (40, 3)]); f.pts('W' if False else 'm', [(37, 7), (38, 6), (39, 5)])

    def pouch(f):
        f.ell(33, 40, 39, 47, 'm'); f.ell(36, 42, 39, 47, 'M'); f.hl(34, 37, 40, 'Y')

    def quiver(f):
        f.rect(37, 24, 40, 36, 'o'); f.pts('e', [(38, 22), (38, 23), (40, 21), (40, 23)])
    person(c, 24, 13, 14, 'v', 'V', '1', '2', th=15, sw=8, ww=7,
           lg=dict(pants='x', pdark='x', shoe='z', lh=9, stance=1),
           back=quiver,
           front=lambda f, DK: (f.hl(25, 39, 39, 'O'), f.rect(31, 38, 32, 40, 'Y')),
           arms=[([(25, 32), (20, 32), (15, 30)], 3, '1'), ([(38, 32), (43, 36), (48, 34)], 3, '1')],
           hands=[(12, 28, 'grip', False)],
           late=lambda f, DK: (pouch(f), hand(f, 47, 32, 'flat', 'v', 'V', True), f.stamp(48, 28, ['.yy.', 'yyyY', '.YY.'])),
           mouth='smile', brows='soft', brow='h', hr=('crop', 'h', 'u'), hat=hat,
           dk={'m': 'M', 'o': 'O'}, under_=bow)
    return c.rows(), pal


PORTRAIT = ('thieves.robinhood', robinhood)
