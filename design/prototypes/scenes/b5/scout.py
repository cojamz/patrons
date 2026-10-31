import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def scout():
    c = C(N)
    pal = base(MED, 'grey', b='#cfe2e2', m='#a9c48e', M='#98b47e', l='#5f8a4e', L='#4e7640', g='#8fae6c',
               o='#c98a4a', O='#a86e36', h='#b8a57c', j='#958360', q='#2f3338', e='#9fb7c4', R='#c8463c',
               H='#2b1d17', z='#1a1210', n='#4b4f55')
    c.rect(0, 0, 63, 63, 'b')

    def hills(l):
        l.ell(-20, 22, 40, 60, 'm'); l.ell(26, 18, 84, 60, 'M')
    bg(c, hills, None)
    c.rect(0, 46, 63, 63, 'g')

    def trees(l):                                   # a few pines, two tones
        for (x, y, s) in ((4, 14, 6), (12, 20, 4), (52, 12, 6), (59, 18, 4)):
            l.poly([(x, y), (x + s + 1, y + s * 3), (x - s, y + s * 3)], 'l')
            l.poly([(x, y), (x + s + 1, y + s * 3), (x + 1, y + s * 3)], 'L')
            l.rect(x - 1, y + s * 3, x, y + s * 3 + 2, 'j')
    bg(c, trees, None)

    def tent(l):
        l.poly([(44, 46), (52, 32), (61, 46)], 'o'); l.poly([(52, 32), (61, 46), (54, 46)], 'O')
        l.poly([(50, 46), (52, 40), (54, 46)], 'j')
    bg(c, tent, None)

    cx = 28
    DK = {'1': '2', 'h': 'j', 'q': 'q', 'R': 'R'}

    def front(f):                                   # neckerchief and two shirt pockets
        f.poly([(cx - 4.5, 32), (cx + 4.5, 32), (cx, 38)], 'R')
        f.rect(cx - 6, 38, cx - 3, 41, '2'); f.rect(cx + 2, 38, cx + 5, 41, '2')
        f.rect(cx - 7, 44, cx + 7, 45, 'n')

    def hat(f):                                     # bucket hat
        f.ell(cx - 6, 11, cx + 5, 20, 'h'); f.rect(cx - 6, 16, cx + 5, 19, 'h')
        f.hl(cx - 9, cx + 8, 20, 'h'); f.hl(cx - 9, cx + 8, 21, 'j'); f.hl(cx - 6, cx + 5, 18, 'j')

    def binos(f):                                   # two round barrels poking forward, gap at the bridge
        a = layer()
        thick(a, [(cx - 7, 37), (cx - 11, 37), (cx - 8, 29)], 3, '1')
        thick(a, [(cx + 7, 37), (cx + 11, 37), (cx + 7, 29)], 3, '1')
        over(f, a, DK)
        p = layer()
        for x0 in (cx - 7, cx + 1):                 # two barrels, lenses facing us
            p.rect(x0, 21, x0 + 5, 26, 'n'); p.pts('.', [(x0, 21), (x0 + 5, 21), (x0, 26), (x0 + 5, 26)])
            p.ring(x0 + 1, 22, x0 + 4, 25, 'e'); p.rect(x0 + 2, 23, x0 + 3, 24, 'q'); p.px(x0 + 2, 23, 'w')
        p.rect(cx - 1, 23, cx, 24, 'q')
        over(f, p, DK)
        for (x, fl) in ((cx - 9, False), (cx + 5, True)):
            h_ = layer(); hand(h_, x, 25, 'grip', 's', 'S', fl); over(f, h_, DK)
        f.recolor('S', 's', (cx - 1, 25, cx + 1, 27))
        f.hl(cx - 1, cx + 1, 29, 'k')

    person(c, cx, 17, hs='crop', hk='H', hdk='z', mouth='none', brows='none',
           shirt='1', sdk='2', sw=8, ww=7, th=13, pants='n', pdk='n', shoe='z', lh=8, front=front, hat=hat, DK=DK,
           top=binos)
    return c.rows(), pal


PORTRAIT = ('benders.scout', scout)
