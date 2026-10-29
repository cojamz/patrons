import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def insider():
    c = C(N)
    pal = base(OLIVE, 'grey', p='#4f6670', P='#455b64', f='#3d4f57', d='#7a5a3e', D='#5e4430', y='#f5dc8a', Y='#e9c46a',
               m='#e2c58e', M='#c4a46c', R='#c0473c', H='#2a1e1a', z='#14100e', q='#33373d', u='#6fa0c8', e='#e8e2d4')
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 53, 63, 63, 'f')

    def door(l):                                    # a door left ajar, light spilling out
        l.rect(4, 8, 22, 53, 'D'); l.rect(6, 10, 20, 53, 'y'); l.rect(6, 10, 14, 53, 'd')
        l.px(13, 32, 'Y'); l.px(13, 33, 'Y')
        l.poly([(20, 53), (26, 63), (6, 63), (6, 53)], 'Y')
    bg(c, door, None)

    def sign(l):                                    # a little 'staff only' plate
        l.rect(44, 12, 58, 17, 'e'); l.hl(46, 56, 14, 'P'); l.hl(46, 52, 15, 'P')
    bg(c, sign, None)

    cx = 38
    DK = {'1': '2', 'm': 'M', 'q': 'q', 'e': 'e'}

    def front(f):                                   # grey suit, dark tie, ID badge on a lanyard
        f.poly([(cx - 4.5, 34), (cx + 4.5, 34), (cx, 40)], 'e')
        f.rect(cx - 1, 35, cx, 40, 'q')
        f.line(cx - 4, 35, cx - 4, 39, 'u'); f.rect(cx - 6, 40, cx - 3, 44, 'e'); f.hl(cx - 5, cx - 4, 42, 'u')

    def secret(f):                                  # envelope marked secret, held close
        p = layer(); p.rect(cx + 2, 40, cx + 11, 46, 'm'); p.line(cx + 2, 40, cx + 6, 43, 'M'); p.line(cx + 11, 40, cx + 7, 43, 'M')
        p.rect(cx + 8, 44, cx + 9, 45, 'R')
        over(f, p, DK)
        h_ = layer(); hand(h_, cx + 6, 45, 'grip', 's', 'S', True); over(f, h_, DK)

    person(c, cx, 17, hs='side', hk='H', hdk='z', mouth='smirk', brows='stern',
           shirt='1', sdk='2', sw=8, ww=7, th=14, pants='q', pdk='q', shoe='z', lh=6, front=front, DK=DK,
           arms=[([(cx - 7, 37), (cx - 9, 42), (cx - 8, 46)], 4, '1'),
                 ([(cx + 7, 37), (cx + 10, 42), (cx + 9, 46)], 4, '1')],
           hands=[(cx - 10, 47, 'fist', False)], top=secret)
    return c.rows(), pal


PORTRAIT = ('benders.insider', insider)
