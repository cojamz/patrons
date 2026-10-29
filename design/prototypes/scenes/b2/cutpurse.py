import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def cutpurse():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 't': '#d9c8a8', 'T': '#c9b693', 'f': '#b5a283', 'F': '#a39071',
           'u': '#5f87b0', 'U': '#4a6f96', 'o': '#9e7840', 'O': '#6e5028', 'r': '#d9534a', 'R': '#a83a35',
           'p': '#a83a35', 'P': '#7a2a2a', 'y': '#f2d27a', 'Y': '#c9a24a', 'g': '#c8ccd2',
           '1': MAGENTA[0], '2': MAGENTA[1], 's': MED[0], 'S': MED[1],
           'x': '#4a3a48', 'z': '#3a2a22', 'h': '#2b1d18'}
    c.rect(0, 0, 63, 63, 't'); c.rect(0, 52, 63, 63, 'f')

    def street(l):
        l.rect(0, 4, 20, 51, 'T'); l.rect(4, 10, 10, 20, 'F'); l.rect(12, 10, 17, 20, 'F')
        l.rect(6, 34, 14, 51, 'O'); l.px(12, 43, 'y')
        l.rect(46, 8, 63, 51, 'T'); l.rect(50, 14, 56, 24, 'F'); l.rect(50, 32, 56, 42, 'F')
        l.vl(33, 14, 51, 'F'); l.vl(34, 14, 51, 'F'); l.rect(31, 10, 36, 13, 'F'); l.hl(32, 35, 12, 'y')
    bg(c, street)
    c.hl(0, 63, 52, 'F')

    def purse(f, DK):
        f.pts('O', [(46, 43), (46, 44)])
        f.poly([(44, 45), (48, 45), (50, 49), (49, 52), (43, 52), (42, 49)], 'o')
        f.poly([(47, 46), (48, 45), (50, 49), (49, 52), (46, 52)], 'O')
        f.hl(44, 48, 45, 'y'); f.px(44, 49, 'y')

    def knife(p):
        p.pts('g', [(18, 36), (17, 37), (16, 38)]); p.pts('w', [(17, 36), (16, 37)])

    def hood(f):
        f.ell(24, 22, 45, 32, '2'); f.ell(26, 23, 43, 31, '1')
    person(c, 28, 12, 14, 's', 'S', '1', '2', th=14, sw=8, ww=7,
           lg=dict(pants='x', pdark='x', shoe='z', lh=10, stance=1),
           back=hood,
           arms=[([(29, 31), (25, 35), (21, 38)], 3, '1'), ([(41, 31), (44, 36), (45, 40)], 3, '1')],
           hands=[(19, 37, 'fist', False)],
           late=lambda f, DK: (purse(f, DK), hand(f, 44, 40, 'grip', 's', 'S', True)),
           mouth='grin', brows='soft', brow='h', hr=('short', 'h', 'z'), dk={'y': 'Y', 'o': 'O', 'p': 'P'})
    return c.rows(), pal


PORTRAIT = ('thieves.cutpurse', cutpurse)
