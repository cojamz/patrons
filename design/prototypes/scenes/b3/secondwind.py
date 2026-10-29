import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(p='#d6dde3', P='#c8d0d7', q='#a9b7c4', g='#4fa868', G='#3a8a52', f='#9aa3ab', F='#8a939b',
               o='#7a4a2e', O='#5a341e', y='#f0c548',
               a=MED[0], A=MED[1], h='#22181a', H='#3e2c2a', n='#3a3446', N='#2b2735', z='#2f2422', e='#e8e2d6',
               **{'1': PURPLE[0], '2': PURPLE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 'n': 'N', 'e': 'e', 'o': 'O'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'f'); c.hl(0, 63, 52, 'F')

    def chart(l):                           # a board with a rising line
        l.rect(36, 6, 61, 30, 'e'); l.rect(36, 6, 61, 7, 'q')
        for i, (x, y) in enumerate(((39, 26), (44, 23), (49, 24), (54, 16), (58, 11))):
            l.rect(x - 1, y, x, 28, 'q')
        pts = [(39, 25), (44, 22), (49, 23), (54, 15), (58, 10)]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            l.line(x0, y0, x1, y1, 'G'); l.line(x0, y0 - 1, x1, y1 - 1, 'g')
    bg(c, chart, 'q')
    c.rect(2, 4, 14, 52, 'P'); c.rect(4, 6, 12, 50, 'q')    # a glass door, left

    lg = layer()                            # mid-stride
    thick(lg, [(27, 42), (24, 48), (22, 53)], 4, 'n')
    thick(lg, [(33, 42), (36, 47), (38, 53)], 4, 'N')
    lg.rect(18, 53, 24, 55, 'z'); lg.rect(37, 53, 43, 55, 'z')

    def front(f):                           # shirt V and lapels
        f.poly([(27.5, 27), (34.5, 27), (31, 33)], 'e')
        f.pts('2', [(28, 28), (29, 30), (29, 31), (33, 28), (33, 30), (33, 31)])
    person(c, DK, back=lambda f: f.paste(lg), hx=24, hy=12, skin='a', shade='A', mouth='grin', brows='stern', brow='h',
           hs='bun', hk='h', hd='H', side='L', cx=31, sw=7, ww=6, th=15, cloth='1', front=front,
           arms=[([(38, 30), (44, 27), (45, 19)], 4, '1'), ([(24, 30), (20, 36), (19, 41)], 4, '1')],
           hands=[(43, 15, 'fist', True), (17, 41, 'grip', False)])
    bc = layer()                            # briefcase
    bc.rect(12, 44, 25, 53, 'o'); bc.rect(12, 44, 25, 45, 'O'); bc.rect(23, 46, 25, 53, 'O'); bc.rect(17, 48, 19, 49, 'y')
    bc.hl(16, 21, 43, 'O')
    outline_once(bc); c.paste(bc)
    hl = layer(); hand(hl, 16, 41, 'grip', 'a', 'A'); outline_once(hl); c.paste(hl)
    return c.rows(), pal


PORTRAIT = ('purple.secondwind', draw)
