import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def conmen():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1', '1': GREY[0], '2': GREY[1],
           'p': '#9fb0a8', 'f': '#a9a39a', 'F': '#958f86', 'o': '#c9a066', 'O': '#9e7840',
           'r': '#c9443c', 'R': '#9e342e', 'n': '#8fb877', 'N': '#5d8a50', 'x': '#3a3640', 'X': '#4b4652',
           'a': PALE[0], 'A': PALE[1], 'u': OLIVE[0], 'U': OLIVE[1], 'H': '#5a3a26', 'h': '#3a2418', 'J': '#1f1714',
           'z': '#55504a', 'q': '#4a5262', 'Q': '#3a4150'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 48, 63, 63, 'f'); c.hl(0, 63, 48, 'F')

    DK = {'1': '2', 'a': 'A', 'u': 'U', 'x': 'X', 'n': 'N', 'q': 'Q'}

    # the shill, olive, a friendly equal: tucking the winnings into his jacket
    def bill_up(f):
        p = layer(); bill(p, 36, 25, 6, 5); over(f, p, {'n': 'N'})

    def cap(f):
        f.rect(40, 9, 53, 13, 'q'); f.hl(41, 52, 8, 'q'); f.rect(36, 13, 46, 14, 'Q'); f.rect(48, 9, 53, 13, 'Q')
    person(c, DK, 40, 13, ('u', 'U'), 'crop', 'h', 'H', mouth='grin', brows='soft', brow='h', cloth='1', cdark='2',
           sw=7, ww=6, th=12, pants=('q', 'Q'), shoe='z', lh=10, top=lambda f: (cap(f), bill_up(f)),
           arms=[([(53, 31), (52, 37), (44, 31)], 3, '1'), ([(41, 31), (39, 37), (40, 42)], 3, '1')],
           hands=[(40, 28, 'fist', True), (38, 42, 'fist', False)])

    # the crate and the shell game
    def crate(l):
        l.rect(8, 40, 36, 58, 'o'); l.rect(8, 40, 36, 41, 'O'); l.hl(8, 36, 49, 'O'); l.vl(8, 40, 58, 'O'); l.vl(36, 40, 58, 'O')
    bg(c, crate, None)

    # the lead, light: bowler hat, hands on the cups
    def bowler(f):
        f.ell(13, 6, 27, 16, 'x'); f.rect(13, 12, 27, 13, '2'); f.hl(10, 30, 14, 'x'); f.hl(11, 29, 15, 'X')
        f.rect(23, 7, 26, 11, 'X')

    def tie(f):
        f.poly([(18, 31), (22, 31), (20, 37)], 'w'); f.rect(19, 31, 21, 33, 'r'); f.pts('R', [(21, 33)])
    person(c, DK, 13, 15, ('a', 'A'), 'side', 'H', 'h', mouth='smirk', brows='soft', brow='h', cloth='1', cdark='2',
           sw=8, ww=7, th=9, nolegs=True, front=tie, top=bowler,
           arms=[([(14, 33), (11, 36), (13, 33)], 3, '1'), ([(27, 33), (31, 36), (31, 33)], 3, '1')],
           hands=[(12, 31, 'flat', False), (29, 31, 'flat', True)])
    cups = layer()
    for x0 in (12, 20, 28):
        cups.poly([(x0 + 1, 35), (x0 + 4, 35), (x0 + 5, 40), (x0, 40)], 'r'); cups.vl(x0 + 4, 36, 39, 'R')
    outline_once(cups)
    c.paste(cups)
    c.recolor('k', 'O', (8, 41, 36, 41))
    c.rect(25, 39, 26, 40, 'w')
    return c.rows(), pal


PORTRAIT = ('benders.conmen', conmen)
