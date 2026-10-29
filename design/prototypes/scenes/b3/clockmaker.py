import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(p='#c8b08c', P='#b89f7b', o='#8a5a36', O='#6b4227', d='#a8744a',
               y='#e0b648', Y='#b08a2c', m='#a8acb4', M='#7c8088', e='#f2e8d2',
               a=PALE[0], A=PALE[1], h='#b3aca6', H='#857e78',
               **{'1': PURPLE[0], '2': PURPLE[1], 'q': '#3a3448', 'u': '#e8e2d6', 'U': '#c9c2b4'})
    DK = {'1': '2', '2': '2', 'a': 'A', 'u': 'U', 'U': 'U', 'h': 'H'}
    c.rect(0, 0, 63, 63, 'p')
    c.rect(0, 0, 63, 3, 'P')

    def wallclock(l):                      # big clock face, wood rim
        l.ell(2, 5, 19, 22, 'o'); l.ell(4, 7, 17, 20, 'e')
        l.vl(10, 9, 14, 'q'); l.hl(11, 14, 14, 'q')
        for (x, y) in ((10, 8), (16, 13), (10, 19), (5, 13)):
            l.px(x, y, 'O')
    bg(c, wallclock, 'O')

    def shelfclocks(l):                    # small clocks on a shelf at right
        l.rect(46, 20, 63, 21, 'o')
        l.rect(48, 12, 54, 19, 'o'); l.ell(49, 13, 53, 17, 'e'); l.px(51, 15, 'q')
        l.rect(57, 10, 62, 19, 'O'); l.ell(58, 11, 61, 14, 'e'); l.vl(59, 15, 18, 'y')
    bg(c, shelfclocks, 'O')

    def front(f):                          # white collar, cardigan buttons
        f.poly([(28.5, 27), (35.5, 27), (32, 32)], 'u')
        f.pts('U', [(32, 31), (32, 32)])
        for y in (35, 39):
            f.px(32, y, 'Y')
    person(c, DK, hx=24, hy=10, size=16, skin='a', shade='A', mouth='smile', brows='soft', brow='H',
           hs='bun', hk='h', hd='H', side='R', cx=32, sw=11, ww=11, th=17, cloth='1',
           front=front,
           arms=[([(22, 31), (18, 37), (19, 42)], 4, '1'), ([(42, 31), (47, 36), (45, 38)], 4, '1')],
           hands=[(16, 42, 'flat', False), (44, 36, 'grip', True)],
           face=lambda h: (h.ell(26, 16, 31, 21, 'q'), h.ell(27, 17, 30, 20, 'M'), h.px(28, 17, 'w'),
                           h.hl(32, 34, 18, 'q')),
           props=lambda p: (pole(p, 46, 28, 35, 'm', 'M')),
           post=lambda f: f.rect(45, 38, 47, 40, 'o'))

    def bench(l):
        l.rect(0, 44, 63, 47, 'd'); l.rect(0, 48, 63, 63, 'o'); l.hl(0, 63, 48, 'O')
        l.rect(6, 52, 26, 60, 'O'); l.rect(7, 53, 25, 59, 'o'); l.hl(14, 18, 56, 'y')
        l.rect(38, 52, 58, 60, 'O'); l.rect(39, 53, 57, 59, 'o'); l.hl(46, 50, 56, 'y')
    bg(c, bench)
    w = layer()                             # pocket watch open on the bench, gold, outlined
    w.ell(27, 37, 36, 46, 'y'); w.ell(29, 39, 34, 44, 'e'); w.px(31, 41, 'q'); w.hl(32, 33, 41, 'q'); w.px(31, 40, 'q')
    w.rect(31, 35, 32, 36, 'Y')
    w.pts('Y', [(36, 41), (36, 42), (35, 44), (35, 45), (34, 46)])
    outline_once(w); c.paste(w)
    g = layer()                             # a loose gear
    g.ell(49, 39, 57, 47, 'm')
    for (x, y) in ((53, 37), (53, 38), (59, 43), (58, 43), (53, 49), (53, 48), (47, 43), (48, 43), (50, 40), (56, 40), (50, 46), (56, 46)):
        g.px(x, y, 'm')
    g.ell(51, 41, 55, 45, 'M'); g.ell(52, 42, 54, 44, 'd')
    outline_once(g); c.paste(g)
    return c.rows(), pal


PORTRAIT = ('purple.clockmaker', draw)
