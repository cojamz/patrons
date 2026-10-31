import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(s='#f0c9a2', S='#e6b993', y='#fbe3a0', Y='#f5c46e', g='#86a868', G='#76985a', f='#c9b28e', 
               t='#7a5a3e', T='#5e4430', v='#5a7fb0', V='#3f5f8c', o='#e8964a',
               a=VDEEP[0], A=VDEEP[1], L='#6e4430', h='#1f1612', H='#3a2a24', n='#33333f', N='#26262f', z='#e8e2d6', Z='#b8b2a6',
               **{'1': PURPLE[0], '2': PURPLE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 'n': 'N', 'z': 'Z'}
    c.rect(0, 0, 63, 63, 's'); c.rect(0, 0, 63, 12, 'S')
    c.ell(40, 26, 58, 44, 'y'); c.ell(42, 28, 56, 42, 'Y', only='y')     # low dawn sun
    c.rect(0, 35, 63, 63, 'g'); c.rect(0, 35, 63, 38, 'G')
    c.rect(0, 56, 63, 63, 'f'); c.hl(0, 63, 56, 'G')

    def branch(l):                          # a bird on a branch, left
        l.rect(0, 14, 15, 15, 't'); l.rect(10, 12, 11, 13, 't')
        l.ell(5, 7, 11, 13, 'v'); l.ell(4, 6, 8, 10, 'v'); l.rect(9, 10, 11, 12, 'V'); l.px(3, 8, 'o'); l.px(6, 8, 'h')
    bg(c, branch, None)
    c.ell(4, 6, 8, 10, 'v'); c.px(3, 8, 'o'); c.px(6, 8, 'h'); c.rect(9, 10, 11, 12, 'V')

    f = layer()
    # running legs: near leg forward, far leg kicked back
    lg = layer()
    thick(lg, [(28, 41), (24, 47), (22, 53)], 4, 'n')
    thick(lg, [(35, 41), (38, 47), (43, 50)], 4, 'N')
    lg.rect(18, 54, 24, 56, 'z'); lg.hl(18, 24, 56, 'Z')
    lg.rect(42, 49, 47, 51, 'Z')

    def front(ff):
        ff.vl(32, 28, 40, 'z')               # zip
    person(f, DK, back=lambda ff: ff.paste(lg), hx=24, hy=11, skin='a', shade='A', mouth='grin', brows='soft', brow='h', glint='w',
           hs='crop', hk='h', hd='H', cx=31, sw=7, ww=6, th=14, cloth='1', front=front,
           face=lambda h: None,
           arms=[([(24, 29), (20, 33), (18, 37)], 4, '1'), ([(38, 30), (42, 35), (44, 40)], 4, '1')],
           hands=[(15, 36, 'fist', False), (43, 40, 'fist', True)])
    c.paste(f)
    return c.rows(), pal


PORTRAIT = ('purple.earlybird', draw)
