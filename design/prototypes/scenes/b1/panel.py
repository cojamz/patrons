import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *

DIG = {
    '9': ['###', '#.#', '###', '..#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
}


def draw():
    c = C(N)
    pal = base_pal(p='#585779', P='#4f4e6e', y='#f6d77e', Y='#c9a24a', o='#6a4a3a', O='#553a2d',
                   j='#f3ead2', J='#cfc2a0', n='#2a2633', z='#231c22', H='#1f1717', h='#5a361f', e='#e3b25a', E='#a87a32',
                   g='#8a8aa8')
    pal['1'], pal['2'] = RED
    pal['a'], pal['A'] = VDEEP
    pal['b'], pal['B'] = PALE
    pal['d'], pal['D'] = MED
    c.rect(0, 0, 63, 63, 'p')

    def back(l):                          # studio backdrop: a soft arc and three small lamps
        l.ell(-8, 6, 71, 60, 'P')
        for x in (10, 32, 54):
            l.rect(x - 2, 1, x + 1, 3, 'g'); l.hl(x - 1, x, 4, 'y')
    bg(c, back)

    def judge(hx, hy, skin, shade, hs, hk, hd, mouth, brows, digit, sw, side='L', brow=None):
        cx = hx + 7

        def card(f):
            cd = layer(); cd.rect(cx - 5, 38, cx + 4, 46, 'j'); cd.hl(cx - 5, cx + 4, 46, 'J')
            cd.stamp(cx - 2, 40, DIG[digit], {'#': '1'})
            over(f, cd, {'1': '2'})
            hl = layer(); hand(hl, cx - 8, 41, 'flat', skin, shade); over(f, hl, {'j': 'J'})
            hl = layer(); hand(hl, cx + 4, 41, 'flat', skin, shade, flip=True); over(f, hl, {'j': 'J'})

        person(c, hx=hx, hy=hy, size=14, skin=skin, shade=shade, hs=hs, hk=hk, hd=hd, side=side, mouth=mouth,
               brows=brows, brow=brow, shirt='1', sdark='2', cx=cx, sw=sw, ww=sw - 1, th=48 - hy - 15,
               arms=[([(cx - sw + 1, hy + 18), (cx - sw - 1, hy + 24), (cx - 5, 43)], 3),
                     ([(cx + sw - 1, hy + 18), (cx + sw + 1, hy + 24), (cx + 5, 43)], 3)],
               top=card)

    judge(4, 14, 'a', 'A', 'crop', 'H', 'n', 'smile', 'soft', '9', 7)
    judge(25, 11, 'b', 'B', 'side', 'e', 'E', 'flat', 'stern', '7', 6, brow='E')
    judge(46, 15, 'd', 'D', 'long', 'h', 'H', 'grin', 'soft', '8', 7)

    def desk(l):
        l.rect(0, 47, 63, 63, 'o'); l.hl(0, 63, 47, 'Y'); l.hl(0, 63, 48, 'O')
        l.rect(0, 54, 63, 55, 'O')
    bg(c, desk)
    return c.rows(), pal


PORTRAIT = ('red.panel', draw)
