import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(p='#a9b0ae', P='#9aa19f', f='#7d8483', F='#6f7675', g='#d9dcd6', G='#b4b8b2', q='#3a3e44',
               y='#f0c548', Y='#c08f22', e='#f2e8d2', m='#8e9597', M='#6b7274',
               a=DEEP[0], A=DEEP[1], L='#8c5a3a', b=LIGHT[0], B=LIGHT[1], h='#241a18', H='#3e2c26',
               i='#9a5a32', I='#6e3c20', z='#4a3a34',
               **{'1': PURPLE[0], '2': PURPLE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 'b': 'B', 'y': 'Y', 'm': 'M'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'f'); c.hl(0, 63, 52, 'F')

    def timeclock(l):                       # the time clock with a rack of cards
        l.rect(40, 8, 56, 30, 'g'); l.rect(54, 8, 56, 30, 'G')
        l.ell(43, 10, 51, 18, 'e'); l.vl(47, 12, 14, 'q'); l.hl(47, 49, 14, 'q')
        l.rect(44, 22, 51, 23, 'q')
        l.rect(58, 6, 63, 32, 'G')
        for y in (8, 13, 18, 23, 28):
            l.rect(59, y, 62, y + 3, 'e')
    bg(c, timeclock, 'G')
    c.rect(2, 4, 16, 14, 'P'); c.rect(3, 5, 15, 13, 'g'); c.rect(4, 6, 14, 12, 'P')   # a dim window

    def legsA(f):
        pass
    # crew member A (cool deep brown): lunch pail, standing back-left
    person(c, DK, hx=10, hy=17, skin='a', shade='A', mouth='smile', brows='soft', brow='h',
           hs='crop', hk='h', hd='H', cx=17, sw=7, ww=7, th=13, cloth='1',
           lg=dict(gap=2, lw=4, lh=7, pants='2', pdark='2', shoe='z'),
           top=lambda f: hardhat(f, 10, 17, 14, 'y', 'Y'),
           face=lambda h: None,
           arms=[([(10, 35), (8, 41), (9, 45)], 3, '1'), ([(24, 35), (26, 40), (25, 44)], 3, '1')],
           hands=[(7, 45, 'grip', False), (24, 44, 'fist', True)])
    pail = layer()
    pail.rect(4, 48, 13, 54, 'm'); pail.rect(4, 48, 13, 49, 'M'); pail.rect(11, 50, 13, 54, 'M')
    outline_once(pail); c.paste(pail)
    # crew member B (fair): punching a card into the clock
    person(c, DK, hx=29, hy=16, skin='b', shade='B', mouth='grin', brows='soft', brow='I',
           hs='side', hk='i', hd='I', cx=36, sw=8, ww=7, th=14, cloth='1',
           lg=dict(gap=3, lw=4, lh=7, pants='2', pdark='2', shoe='z', stance=1),
           top=lambda f: hardhat(f, 29, 16, 14, 'y', 'Y'),
           arms=[([(43, 34), (47, 34), (48, 28)], 3, '1'), ([(29, 34), (27, 40), (29, 45)], 3, '1')],
           hands=[(46, 25, 'grip', True), (27, 45, 'fist', False)],
           props=lambda p: (p.rect(46, 17, 49, 25, 'y'), p.vl(49, 17, 25, 'Y'), p.hl(46, 49, 17, 'Y')))
    return c.rows(), pal


PORTRAIT = ('purple.crew', draw)
