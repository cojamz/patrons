import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def alchemist_gold():
    c = C(N)
    pal = base(VDEEP, 'gold', p='#5b4a46', P='#514240', o='#8a4e3a', O='#6e3c2c', e='#ef8a36', E='#f6c24a',
               y='#f2cf5a', Y='#c3962c', Z='#fff0a8', g='#8d9296', G='#5f6469', q='#3b4250', Q='#2f3540',
               H='#160f0c', z='#2e2420', u='#7fc0c8', U='#4e8a92', m='#3a3534')
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'P')

    def furnace(l):                                 # brick furnace, a small fire mouth
        l.rect(0, 10, 16, 52, 'o'); l.rect(0, 4, 8, 10, 'o')
        l.ell(3, 30, 13, 44, 'm'); l.rect(3, 37, 13, 46, 'm')
        l.hl(0, 16, 20, 'O'); l.hl(0, 16, 28, 'O'); l.vl(8, 10, 20, 'O')
    bg(c, furnace, 'O')
    c.ell(5, 38, 11, 46, 'e'); c.ell(6, 41, 10, 46, 'E')

    def shelf(l):
        l.rect(42, 14, 62, 15, 'O')
        l.rect(44, 8, 46, 13, 'u'); l.rect(48, 10, 51, 13, 'g'); l.rect(55, 7, 57, 13, 'U')
    bg(c, shelf, None)

    def crucible(l):                                # stand with a pot of melting gold
        l.rect(47, 44, 48, 55, 'G'); l.rect(58, 44, 59, 55, 'G')
        l.poly([(44, 38), (62, 38), (59, 46), (47, 46)], 'g'); l.hl(45, 61, 38, 'E'); l.hl(46, 60, 39, 'y')
    bg(c, crucible, 'G')

    cx = 26
    DK = {'1': '2', 'q': 'Q', 'g': 'G', 'm': 'm'}

    def front(f):                                   # gold apron over a dark work shirt
        f.recolor('1', 'q'); f.recolor('2', 'Q')
        f.poly([(cx - 5, 34), (cx + 5, 34), (cx + 7, 48), (cx - 7, 48)], '1')
        f.rect(cx + 4, 37, cx + 7, 48, '2', ) if False else None
        f.vl(cx - 5, 31, 34, '1'); f.vl(cx + 4, 31, 34, '1')

    def goggles(f):                                 # pushed up on the forehead
        f.rect(cx - 6, 17, cx + 5, 18, 'm')
        f.rect(cx - 5, 15, cx - 2, 18, 'u'); f.rect(cx + 1, 15, cx + 4, 18, 'u')
        f.pts('w', [(cx - 4, 16), (cx + 2, 16)]); f.pts('U', [(cx - 2, 18), (cx + 4, 18)])

    def tongs(p):
        for i in range(14):
            p.px(35 + i, 41 - i // 3, 'g'); p.px(35 + i, 42 - i // 3, 'G')

    def nugget(f):
        f.ell(48, 34, 52, 38, 'E'); f.pts('Z', [(49, 35), (50, 35)]); f.pts('y', [(51, 37), (50, 38)])

    person(c, cx, 18, hs='crop', hk='H', hdk='z', mouth='smile', brows='soft', brow='H',
           shirt='1', sdk='2', sw=8, ww=7, th=14, pants='Q', pdk='Q', shoe='z', lh=7, front=front, hat=goggles, DK=DK,
           arms=[([(cx - 7, 37), (cx - 9, 42), (cx - 8, 47)], 4, 'q'),
                 ([(cx + 7, 37), (cx + 8, 43), (cx + 11, 42)], 4, 'q')],
           hands=[(cx - 10, 47, 'fist', False), (cx + 10, 40, 'grip', True)], props=tongs, post=nugget)
    return c.rows(), pal


PORTRAIT = ('gold.tinker', alchemist_gold)
