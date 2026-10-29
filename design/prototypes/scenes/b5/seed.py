import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def treasurer():
    c = C(N)
    pal = base(PALE, 'gold', p='#9a9590', P='#8c8782', b='#c9dce4', o='#8a5434', O='#6a3d25', d='#a2683f',
               y='#f2cf5a', Y='#c3962c', Z='#f8e39a', H='#a0612e', z='#73431e', e='#b9bec4', E='#8d9399', t='#5b3a52')
    c.rect(0, 0, 63, 63, 'p')

    def window(l):
        l.ell(4, 4, 12, 12, 'P'); l.ell(5, 5, 11, 11, 'b'); l.rect(5, 8, 11, 18, 'b'); l.rect(4, 8, 4, 19, 'P'); l.rect(12, 8, 12, 19, 'P'); l.hl(4, 12, 19, 'P')
    bg(c, window, None)

    def chest(l):                                   # a closed chest: domed lid, brass trim, the lock
        l.ell(12, 40, 52, 54, 'd'); l.rect(12, 47, 52, 63, 'o')
        l.hl(12, 52, 47, 'O'); l.hl(12, 52, 48, 'Y'); l.rect(12, 57, 52, 58, 'O')
        l.rect(12, 43, 13, 63, 'Y'); l.rect(51, 43, 52, 63, 'Y')
        l.rect(29, 49, 35, 56, 'Y'); l.rect(30, 50, 34, 55, 'y'); l.rect(32, 52, 32, 54, 'O')
    bg(c, chest, 'O')
    c.pts('Z', [(20, 47), (27, 47), (40, 47)])     # coins glinting at the lid seam

    cx = 31
    DK = {'1': '2', 'e': 'E', 't': 't'}

    def front(f):                                   # robe collar and sash
        f.poly([(cx - 4.5, 27), (cx + 4.5, 27), (cx, 32)], 't')
        f.poly([(cx - 9, 34), (cx - 7, 32), (cx + 9, 38), (cx + 8, 40)], '2')

    def key(f):                                     # both hands at the lock, turning the key
        p = layer()
        p.ring(20, 48, 25, 53, 'e'); p.ring(21, 49, 24, 52, 'E')
        p.hl(26, 31, 51, 'e'); p.hl(26, 31, 52, 'E')
        over(f, p, DK)
        h_ = layer(); hand(h_, 21, 49, 'grip', 's', 'S'); over(f, h_, DK)
        h_ = layer(); hand(h_, 36, 46, 'flat', 's', 'S', True); over(f, h_, DK)

    person(c, cx, 10, size=16, hs='long', hk='H', hdk='z', mouth='smile', brows='soft',
           shirt='1', sdk='2', sw=10, ww=9, th=19, behind=True, front=front, DK=DK,
           arms=[([(cx - 8, 31), (cx - 12, 40), (cx - 9, 48)], 5, '1'),
                 ([(cx + 8, 31), (cx + 11, 40), (cx + 7, 45)], 5, '1')],
           top=key)
    return c.rows(), pal


PORTRAIT = ('gold.seed', treasurer)
