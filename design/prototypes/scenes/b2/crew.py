import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def crew():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'b': '#3d3550', 'B': '#463d5c', 'f': '#2f2a3e', 'y': '#f3d27a',
           'g': '#9aa0a6', 'G': '#6d7378', 'e': '#c9a24a',
           '1': MAGENTA[0], '2': MAGENTA[1], 's': MED[0], 'S': MED[1], 'a': OLIVE[0], 'A': OLIVE[1],
           'x': '#2c2a36', 'X': '#45424f', 'z': '#3a2a22', 'h': '#241812', 'r': '#5a3a26', 'q': '#4b5a78'}
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 52, 63, 63, 'f')

    def door(l):
        l.rect(22, 4, 42, 51, 'B'); l.rect(24, 6, 40, 51, 'f')
    bg(c, door)

    # left crook (tan), knit cap
    def capL(f):
        f.ell(4, 9, 19, 18, 'x'); f.hl(4, 19, 17, 'X'); f.hl(4, 19, 18, 'X')
    person(c, 5, 13, 14, 's', 'S', '1', '2', th=14, sw=7, ww=6,
           lg=dict(pants='x', pdark='X', shoe='z', lh=10, stance=1),
           arms=[([(18, 32), (22, 37), (23, 41)], 4, '1')], hands=[(22, 40, 'grip', True)],
           mouth='grin', brows='soft', brow='h', hr=('crop', 'h', 'h'), hat=capL, dk={'x': 'X'})
    # right crook (golden olive), flat cap, a little taller
    def capR(f):
        f.hl(44, 55, 11, 'q'); f.rect(43, 12, 57, 15, 'q'); f.hl(40, 47, 16, 'q'); f.hl(43, 57, 15, 'x')
    person(c, 43, 13, 14, 'a', 'A', '1', '2', th=14, sw=8, ww=7,
           lg=dict(pants='q', pdark='x', shoe='z', lh=10),
           arms=[([(44, 32), (41, 37), (40, 41)], 4, '1')], hands=[(38, 40, 'grip', False)],
           mouth='smile', brows='stern', brow='r', hr=('short', 'r', 'h'), hat=capR, dk={'q': 'x'})

    # the safe they carry together
    s = layer()
    s.rect(22, 34, 41, 52, 'g'); s.rect(24, 36, 39, 50, 'G'); s.rect(25, 37, 38, 49, 'g')
    s.ell(28, 39, 34, 45, 'e'); s.vl(31, 39, 41, 'G'); s.rect(36, 41, 37, 46, 'G')
    s.rect(23, 52, 25, 53, 'G'); s.rect(38, 52, 40, 53, 'G')
    outline_once(s)
    for y in range(N):
        for x in range(N):
            if s.get(x, y) == 'k' and c.get(x, y) in 'sSaA12k':
                s.px(x, y, '.')
    c.paste(s)
    # hands over the safe edge
    for hx, fl in ((20, False), (40, True)):
        h = layer(); hand(h, hx, 39, 'grip', 's' if hx < 30 else 'a', 'S' if hx < 30 else 'A', fl)
        h.outline('k'); c.paste(h)
    return c.rows(), pal


PORTRAIT = ('thieves.crew', crew)
