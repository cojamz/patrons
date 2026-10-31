import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def recluse():
    c = C(N)
    pal = {'k': INK, 'w': WHITE[0], 'W': WHITE[1],
           'p': '#4d4856', 'P': '#433f4c', 'q': '#2c3550', 'Q': '#3b4566', 'y': '#f4dc8a', 'Y': '#d6a84c',
           'c': '#6f8a6a', 'C': '#5a7356', 'o': '#7a5a3a', 'O': '#5e4429', 'e': '#e0723a',
           'd': OLIVE[0], 'D': OLIVE[1], 'H': '#3a3430', 'h': '#55504a', 'z': '#7a6a5a', 'n': '#6a6478', 'N': '#57526a'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'P')

    def window(l):
        l.rect(4, 6, 34, 40, 'o'); l.rect(6, 8, 32, 38, 'q'); l.ell(10, 11, 14, 15, 'y'); l.ell(11, 10, 15, 14, 'q', only='y')
        l.rect(6, 28, 32, 38, 'Q')
        l.vl(19, 8, 38, 'o'); l.hl(6, 32, 22, 'o')
        l.rect(0, 3, 40, 4, 'O')
        l.poly([(0, 5), (7, 5), (6, 46), (0, 46)], 'c'); l.poly([(4, 5), (7, 5), (6, 46), (4, 46)], 'C')
    bg(c, window, None)
    DK = {'w': 'W', 'd': 'D', 'n': 'N', 'o': 'O'}

    def shawl(f):
        f.poly([(27, 27), (45, 27), (43, 35), (36, 38), (29, 35)], 'n'); f.poly([(39, 27), (45, 27), (43, 35), (39, 37)], 'N')

    def holder(f):
        f.rect(45, 37, 52, 38, 'Y'); f.rect(47, 31, 49, 36, 'w'); f.vl(49, 31, 36, 'W'); f.pts('Y', [(53, 36), (54, 36), (55, 37), (54, 38), (53, 38)])   # holder with a ring handle
    person(c, DK, 29, 12, ('d', 'D'), 'long', 'H', 'h', mouth='flat', brows='stern', brow='H', cloth='w', cdark='W',
           sw=7, ww=7, th=14, pants=('w', 'W'), shoe='z', lh=8, front=shawl, top=holder,
           arms=[([(43, 30), (47, 35), (47, 38)], 3, 'w')],
           hands=[(45, 38, 'flat', True)])
    c.ell(47, 27, 49, 30, 'y'); c.px(48, 29, 'e')            # the flame, the one bright spot
    # the near curtain, held aside: it hides the recluse's left side
    cur = layer()
    cur.poly([(21, 5), (31, 5), (33, 20), (30, 30), (32, 46), (22, 46)], 'c')
    cur.poly([(21, 5), (25, 5), (26, 46), (22, 46)], 'C')
    edged(cur, 'C'); c.paste(cur)
    h = layer(); thick(h, [(33, 31), (31, 30)], 3, 'w'); hand(h, 28, 28, 'grip', 'd', 'D', flip=True)
    h.recolor('w', 'W', (33, 30, 34, 32)); outline_once(h); c.paste(h)
    return c.rows(), pal


PORTRAIT = ('trading.recluse', recluse)
