import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def watchdog():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'W': '#cfd6d8', 'b': '#3a3550', 'B': '#433d5c', 'y': '#f3d27a',
           'c': '#24222c', 'C': '#3a3746', 'g': '#a9aeac', 'r': '#9a3446', 'R': '#7a2838',
           '1': MAGENTA[0], '2': MAGENTA[1], 'd': OLIVE[0], 'D': OLIVE[1], 'n': '#6e2348', 'e': '#8c5a3a',
           'h': '#1e1410', 'x': '#2c2a36', 'X': '#45424f', 'q': '#4d4a5c'}
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 52, 63, 63, 'B')
    c.rect(0, 0, 63, 20, 'B')
    for x in (6, 30, 54):
        c.rect(x - 2, 5, x + 2, 6, 'y')

    def car(l):
        l.poly([(0, 30), (10, 22), (54, 22), (63, 30), (63, 50), (0, 50)], 'c')
        l.rect(4, 24, 60, 30, 'C'); l.vl(32, 24, 30, 'c'); l.hl(0, 63, 38, 'C')
        l.ell(4, 44, 16, 56, 'c'); l.ell(47, 44, 59, 56, 'c'); l.ell(8, 48, 12, 52, 'g'); l.ell(51, 48, 55, 52, 'g')
    bg(c, car)
    c.rect(0, 57, 63, 63, 'r'); c.hl(0, 63, 57, 'R')

    def crossed(f, DK):
        u = layer(); thick(u, [(21, 32), (19, 37), (21, 42)], 4, '1'); thick(u, [(43, 32), (45, 37), (43, 41)], 4, '1'); over(f, u, DK)
        # lower forearm band (right arm across, hand at the left), then the upper band over it
        a = layer(); a.rect(22, 41, 42, 44, '2'); a.hl(22, 42, 44, 'n')
        a.stamp(19, 41, ['.dd', 'ddd', 'DdD', '.D.'] if False else ['.dd', 'ddd', 'DdD']); over(f, a, DK)
        b = layer(); b.rect(21, 37, 41, 40, '2'); b.hl(21, 41, 40, 'n')
        b.stamp(42, 37, ['dd.', 'ddd', 'DdD']); over(f, b, DK)

    def shades(f):
        f.rect(26, 19, 31, 21, 'x'); f.rect(34, 19, 39, 21, 'x'); f.hl(31, 34, 19, 'x')
        f.px(27, 19, 'W'); f.px(35, 19, 'W')
        f.pts('X', [(41, 22), (41, 23), (41, 24), (42, 25), (42, 26)])
    person(c, 24, 11, 16, 'd', 'D', '1', '2', th=19, sw=12, ww=11,
           lg=dict(pants='x', pdark='X', shoe='c', lh=6, lw=5, gap=2),
           front=lambda f, DK: (f.poly([(29, 29), (35, 29), (32, 35)], 'w'), f.rect(31, 30, 32, 36, 'x')),
           late=crossed, mouth='flat', brows='stern', brow='h', hr=('crop', 'h', 'x'), hat=shades,
           dk={'x': 'X', 'w': 'W', '2': 'n', '1': '2'})
    return c.rows(), pal


PORTRAIT = ('thieves.watchdog', watchdog)
