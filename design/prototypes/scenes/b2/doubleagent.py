import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def doubleagent():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'W': '#cfc6b6', 'b': '#4a5470', 'B': '#3f4862', 'f': '#5a6078', 'F': '#4e546b',
           'y': '#f3d27a', 'g': '#a9aeac', 'G': '#7d8381', 'r': '#d9534a',
           '1': MAGENTA[0], '2': MAGENTA[1], 'u': '#5f87b0', 'U': '#46688e', 'c': '#c9a87a', 'C': '#a0804f',
           'd': DEEP[0], 'D': DEEP[1], 'e': '#8c5a3a', 'h': '#1e1410', 'x': '#2c2a36', 'z': '#3a2a22'}
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 50, 63, 63, 'f'); c.hl(0, 63, 50, 'F')

    def booth(l):
        l.rect(44, 12, 63, 50, 'g'); l.rect(46, 18, 61, 30, 'b'); l.rect(42, 8, 63, 12, 'G')
        l.px(53, 22, 'y'); l.px(54, 22, 'y')
    bg(c, booth, 'G')

    def arm_bar(l):
        l.rect(0, 30, 16, 32, 'w')
        for x in range(1, 17, 6):
            l.rect(x, 30, x + 2, 32, 'r')
        l.rect(14, 28, 18, 50, 'G')
    bg(c, arm_bar)

    def coat(f, DK):
        # trench coat: magenta, belt, open collar showing a blue shirt
        f.poly([(28.5, 28), (35.5, 28), (32, 36)], '1'); f.rect(31, 28, 32, 29, '2')
        f.hl(24, 40, 39, 'C'); f.rect(31, 38, 33, 40, 'y')
        f.pts('C', [(28, 28), (28, 29), (29, 30), (29, 31), (30, 32), (36, 28), (36, 29), (35, 30), (35, 31), (34, 32)])

    def passport(col, dcol, x, y):
        def fn(f, DK):
            f.rect(x, y, x + 5, y + 7, col); f.vl(x + 5, y, y + 7, dcol); f.pts('y', [(x + 2, y + 3), (x + 3, y + 3)])
        return fn

    def hat(f):
        f.rect(26, 6, 38, 11, 'x'); f.hl(22, 42, 12, 'x'); f.hl(21, 43, 13, 'x'); f.hl(26, 38, 10, '1')
    person(c, 25, 13, 14, 'd', 'D', 'c', 'C', th=19, sw=8, ww=8,
           lg=dict(pants='x', pdark='x', shoe='z', lh=5, stance=1),
           front=coat,
           arms=[([(26, 32), (21, 34), (17, 30)], 3, 'c'), ([(38, 32), (43, 34), (47, 30)], 3, 'c')],
           late=lambda f, DK: (passport('1', '2', 13, 21)(f, DK), passport('u', 'U', 46, 21)(f, DK),
                               hand(f, 14, 27, 'grip', 'd', 'D'), hand(f, 46, 27, 'grip', 'd', 'D', True)),
           mouth='smirk', brows='stern', brow='h', hr=('short', 'h', 'x'),
           dk={'u': 'U', '1': '2'})
    return c.rows(), pal


PORTRAIT = ('thieves.doubleagent', doubleagent)
