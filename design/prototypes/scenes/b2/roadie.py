import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def roadie():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'b': '#4d4860', 'B': '#58526c', 'f': '#5e5468', 'F': '#4f465a',
           'g': '#9aa0a6', 'G': '#6d7378', 'x': '#26252c', 'X': '#575663', 'y': '#f3d68a',
           '1': GREEN[0], '2': GREEN[1], 'j': '#4b5a78', 'J': '#3a4660', 'z': '#5a3e2c',
           's': MED[0], 'S': MED[1], 'H': '#2e2220', 'r': '#c06a3a'}
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 52, 63, 63, 'f')
    c.hl(0, 63, 52, 'F')

    def truss(l):
        l.hl(0, 63, 2, 'G'); l.hl(0, 63, 7, 'G')
        for x in range(2, 64, 6):
            l.line(x, 3, x + 3, 6, 'G')
        for x in (10, 52):
            l.rect(x - 2, 8, x + 2, 12, 'X'); l.hl(x - 1, x + 1, 12, 'y')
    bg(c, truss)
    c.poly([(8, 13), (13, 13), (19, 51), (2, 51)], 'B')
    c.poly([(50, 13), (55, 13), (62, 51), (44, 51)], 'B')

    def cases(l):
        l.rect(46, 34, 62, 51, 'x'); l.rect(47, 35, 61, 50, 'X')
        l.rect(46, 34, 48, 36, 'g'); l.rect(60, 34, 62, 36, 'g'); l.rect(46, 49, 48, 51, 'g'); l.rect(60, 49, 62, 51, 'g')
        l.hl(51, 57, 42, 'g')
        l.rect(2, 42, 14, 51, 'x'); l.rect(3, 43, 13, 50, 'X'); l.hl(6, 10, 46, 'g')
    bg(c, cases)
    # cable on the floor

    def amp(f, DK):
        f.rect(21, 33, 42, 49, 'x')
        f.rect(23, 35, 40, 47, 'X')
        f.rect(23, 35, 40, 37, 'x'); f.pts('g', [(26, 36), (29, 36), (32, 36)]); f.pts('y', [(37, 36)])
        f.ell(26, 38, 37, 47, 'x'); f.ell(29, 41, 34, 45, 'G')
        f.rect(21, 33, 23, 35, 'g'); f.rect(40, 33, 42, 35, 'g'); f.rect(21, 47, 23, 49, 'g'); f.rect(40, 47, 42, 49, 'g')

    def hatf(f):
        cap(f, 25, 12, 14, 'j', 'J', bill_dir=-1)
    person(c, 25, 12, 14, 's', 'S', '1', '2', th=13, sw=8, ww=7,
           lg=dict(pants='j', pdark='J', shoe='z', lh=10, stance=1),
           front=amp,
           arms=[([(25, 30), (21, 35), (21, 39)], 4, '1'), ([(39, 30), (43, 35), (43, 39)], 4, '1')],
           hands=[(18, 39, 'grip', False), (42, 39, 'grip', True)],
           mouth='grin', brows='soft', brow='H', hr=('crop', 'H', 'z'), hat=hatf,
           dk={'x': 'x', 'X': 'X', 'g': 'G', 'j': 'J'})
    return c.rows(), pal


PORTRAIT = ('echo.roadie', roadie)
