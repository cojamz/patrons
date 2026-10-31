import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def taxman():
    c = C(N)
    pal = base(PALE, 'gold', p='#c99a82', P='#bb8c74', f='#a8a39b', F='#98938b', u='#4d7aa0', U='#3e6688',
               y='#f2cf5a', Y='#c3962c', h='#2f2a33', j='#4a4450', o='#9a7048', O='#765232',
               H='#7a5232', z='#4e3420', q='#3b3a48', m='#f0e6d0', M='#d4c8b0', e='#e8eef0')
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'f'); c.hl(0, 63, 52, 'F')

    def door(l):                                    # a front door and its step
        l.rect(2, 8, 20, 52, 'O'); l.rect(4, 10, 18, 52, 'u')
        l.rect(9, 13, 16, 26, 'U'); l.rect(9, 30, 16, 48, 'U')
        l.ell(5, 30, 7, 32, 'y')
        l.rect(0, 52, 22, 55, 'F')
    bg(c, door, None)

    def win(l):
        l.rect(48, 8, 60, 24, 'O'); l.rect(50, 10, 58, 22, 'e'); l.vl(54, 10, 22, 'O')
    bg(c, win, None)

    cx = 38
    DK = {'1': '2', 'h': 'j', 'o': 'O', 'm': 'M'}

    def front(f):                                   # long coat: buttons, collar
        f.rect(cx - 1, 34, cx, 52, '2')
        f.pts('Y', [(cx + 2, 38), (cx + 2, 42), (cx + 2, 46)])

    def hat(f):                                     # bowler
        f.ell(cx - 6, 12, cx + 5, 22, 'h'); f.rect(cx - 6, 18, cx + 5, 21, 'h')
        f.hl(cx - 9, cx + 8, 21, 'h'); f.hl(cx - 8, cx + 7, 22, 'h')
        f.pts('j', [(cx - 4, 14), (cx - 3, 13), (cx - 5, 15)])
        f.recolor('s', 'S', (cx - 7, 23, cx + 6, 23))

    def ledger(f):                                  # ledger tucked under the far arm
        p = layer(); p.rect(cx + 5, 37, cx + 11, 46, 'o'); p.vl(cx + 5, 37, 46, 'm'); p.vl(cx + 6, 37, 46, 'M')
        over(f, p, DK)

    person(c, cx, 18, hs='short', hk='H', hdk='z', mouth='smirk', brows='stern',
           shirt='1', sdk='2', sw=8, ww=8, th=18, pants='q', pdk='q', shoe='h', lh=3, lw=4, front=front, hat=hat, DK=DK,
           arms=[([(cx - 7, 37), (cx - 11, 43), (cx - 16, 40)], 4, '1'),
                 ([(cx + 7, 37), (cx + 9, 42), (cx + 8, 46)], 4, '1')],
           hands=[(cx - 20, 39, 'flat', False), (cx + 6, 46, 'fist', True)], top=ledger)
    return c.rows(), pal


PORTRAIT = ('gold.taxman', taxman)
