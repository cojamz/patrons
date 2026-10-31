import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(p='#d9c3a0', P='#cbb490', o='#8a5a36', O='#6b4227', d='#a8744a', e='#f4ede1', E='#cbc3b2',
               j='#c8423a', J='#9a2f2a', g='#6f9a5a', G='#557a45', q='#b9d3dc',
               a=OLIVE[0], A=OLIVE[1], h='#3a2620', H='#24170f', y='#f0c548',
               **{'1': PURPLE[0], '2': PURPLE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 'j': 'J'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 0, 63, 2, 'P'); c.rect(0, 54, 63, 63, 'P')

    def frames(l):                          # hallway: a mirror and a framed plant
        l.rect(44, 6, 58, 22, 'O'); l.rect(46, 8, 56, 20, 'q'); l.pts('e', [(48, 10), (49, 10), (48, 11)])
        l.rect(4, 8, 14, 20, 'O'); l.rect(5, 9, 13, 19, 'e'); l.ell(7, 11, 11, 17, 'g')
    bg(c, frames, 'O')

    def table(l):                           # little phone table
        l.rect(38, 40, 60, 42, 'd'); l.rect(40, 43, 41, 56, 'o'); l.rect(57, 43, 58, 56, 'o'); l.hl(38, 60, 42, 'O')
    bg(c, table)
    ph = layer()                            # the phone base
    ph.poly([(44, 39), (46, 33), (54, 33), (56, 39)], 'j'); ph.rect(43, 39, 57, 39, 'J'); ph.ell(47, 34, 52, 38, 'e')
    ph.rect(49, 36, 50, 36, 'O')
    outline_once(ph); c.paste(ph)
    # the cord curls from the base up to the receiver
    c.pts('J', [(44, 37), (43, 36), (42, 37), (41, 36), (40, 37), (39, 35), (40, 33), (39, 31), (40, 29)])

    person(c, DK, hx=17, hy=11, size=16, skin='a', shade='A', mouth='smirk', brows='soft', brow='H',
           hs='long', hk='h', hd='H', cx=25, sw=9, ww=8, th=18, cloth='1',
           face=lambda h: (h.px(16, 21, 'y'), h.px(21, 19, 'k'), h.px(22, 19, 'w'), h.px(27, 19, 'k'), h.px(28, 19, 'w')),
           lg=dict(gap=2, lw=4, lh=6, pants='2', pdark='2', shoe='O'),
           arms=[([(33, 30), (38, 33), (37, 26)], 4, '1'), ([(17, 31), (14, 37), (15, 43)], 4, '1')],
           hands=[(35, 21, 'grip', True), (13, 43, 'fist', False)])
    rc = layer()                            # receiver from ear to mouth, in the hand
    rc.rect(33, 16, 36, 19, 'j'); rc.rect(35, 19, 37, 24, 'j'); rc.rect(33, 24, 36, 27, 'j'); rc.vl(36, 16, 27, 'J')
    outline_once(rc); c.paste(rc)
    hl = layer(); hand(hl, 35, 21, 'grip', 'a', 'A', flip=True); c.paste(hl)
    return c.rows(), pal


PORTRAIT = ('purple.gossip', draw)
