import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def saboteur():
    c = C(N)
    pal = base(PALE, 'grey', p='#3c4250', P='#353a47', f='#2e323d', g='#8d9296', G='#6b7075', e='#c9ced3',
               R='#c8463c', T='#9a3328', u='#4f86c6', U='#3b6a9e', y='#f6d24a', Y='#fff3b0',
               h='#25252b', j='#3a3a42', H='#8a5a32', z='#5e3c1e', q='#4b4f55', o='#e07a3a')
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 54, 63, 63, 'f')
    c.rect(48, 4, 58, 7, 'y'); c.hl(47, 59, 8, 'P')   # one caged work light

    def panel(l):                                   # power panel with its cables
        l.rect(3, 12, 22, 38, 'g'); l.rect(5, 14, 20, 36, 'G'); l.rect(6, 15, 19, 35, 'g')
        for y in (18, 24, 30):
            l.rect(8, y, 10, y + 3, 'e'); l.rect(14, y, 16, y + 3, 'e')
    bg(c, panel, 'G')
    for (x, k, d) in ((8, 'R', 'T'), (14, 'u', 'U')):
        c.rect(x, 39, x + 1, 54, k); c.vl(x + 1, 39, 54, d)

    cx = 40
    DK = {'1': '2', 'h': 'j', 'q': 'q'}

    def front(f):                                   # coveralls: zip and a pocket
        f.vl(cx, 33, 46, '2'); f.rect(cx + 2, 37, cx + 5, 40, '2')

    def beanie(f):
        f.ell(cx - 7, 13, cx + 6, 23, 'h'); f.rect(cx - 7, 19, cx + 6, 21, 'j')
        f.recolor('s', 'S', (cx - 7, 22, cx + 6, 22))

    def cutters(p):                                 # long cutters reaching to the red cable
        for i in range(10):
            p.px(cx - 19 - i, 44 + (i > 6), 'e'); p.px(cx - 19 - i, 45 + (i > 6), 'G')
        p.pts('e', [(10, 44), (10, 47)])

    def snip(f):
        f.rect(8, 45, 9, 46, 'p'); f.pts('R', [(7, 47), (7, 48)])
        f.pts('y', [(6, 43), (11, 42), (5, 46)]); f.pts('Y', [(7, 44), (10, 43)])

    person(c, cx, 17, hs='short', hk='H', hdk='z', mouth='smirk', brows='angry', brow='z',
           shirt='1', sdk='2', sw=8, ww=7, th=14, pants='1', pdk='2', shoe='h', lh=7, front=front, hat=beanie, DK=DK,
           arms=[([(cx - 7, 37), (cx - 11, 45), (cx - 16, 45)], 4, '1'),
                 ([(cx + 7, 37), (cx + 9, 42), (cx + 8, 47)], 4, '1')],
           hands=[(cx - 20, 43, 'grip', False), (cx + 6, 47, 'fist', True)], props=cutters, post=snip)
    return c.rows(), pal


PORTRAIT = ('benders.saboteur', saboteur)
