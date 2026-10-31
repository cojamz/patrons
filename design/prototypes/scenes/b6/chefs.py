import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'p': '#a9bcb4', 'P': '#9aaea6',          # kitchen wall, tile band
        'm': '#7c858a', 'M': '#646c71',          # stove / pot
        'o': '#8a6a4c', 'O': '#6e5238',          # counter, shelf, spoon
        'f': '#e9823a', 'y': '#f7d774',          # flame, steam glow
        'v': '#7fae5b', 'V': '#c74a3a',          # veg
        '1': YELLOW[0], '2': YELLOW[1], 'W': '#d8d0c4',
        'x': '#3d4250', 'z': '#2b211d',
        'h': '#2b1d18', 'H': '#4a332a', 'j': '#b0522c',
        'a': MED[0], 'A': MED[1], 's': PALE[0], 'S': PALE[1]})
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 14, 63, 26, 'P')

    def shelf(l):
        l.rect(34, 8, 62, 9, 'o')
        l.rect(37, 3, 41, 7, 'm'); l.rect(45, 4, 48, 7, 'V'); l.rect(52, 2, 56, 7, 'm')
    bg(c, shelf, 'O')

    def counter(l):
        l.rect(0, 46, 63, 63, 'O'); l.rect(0, 46, 63, 48, 'o')
    bg(c, counter, None)

    DK = {'1': '2', 'a': 'A', 's': 'S', 'w': 'W', 'h': 'H', 'm': 'M', 'j': 'H', 'o': 'O'}

    def toque(f, x, y, w):
        f.rect(x, y + 6, x + w - 1, y + 9, 'w'); f.hl(x, x + w - 1, y + 9, 'W')
        f.ell(x - 2, y, x + 4, y + 7, 'w'); f.ell(x + 2, y - 2, x + w - 3, y + 6, 'w'); f.ell(x + w - 5, y, x + w + 1, y + 7, 'w')
        f.pts('W', [(x + w, y + 4), (x + w - 1, y + 6), (x + 3, y + 1)])

    def jacket(cx, ty):
        def fr(f):
            f.pts('w', [(cx - 2, ty + 4), (cx - 2, ty + 7), (cx + 1, ty + 4), (cx + 1, ty + 7)])
            f.poly([(cx - 3, ty), (cx + 3, ty), (cx, ty + 2)], 'w')        # neckerchief knot area
        return fr

    # left chef (med): stirring a steaming pot on the counter
    def pot(f):
        f.rect(4, 36, 20, 47, 'm'); f.hl(3, 21, 36, 'M'); f.rect(16, 37, 20, 47, 'M')
        f.rect(1, 38, 3, 39, 'M'); f.rect(21, 38, 23, 39, 'M')

    def spoon(p):
        pole(p, 14, 21, 37, 'o', 'O')

    def steam(l):
        l.pts('w', [(8, 32), (9, 31), (9, 30), (8, 29), (8, 28), (9, 27)])
        l.pts('w', [(5, 30), (6, 29), (6, 28), (5, 27)])
    person(c, DK, hx=8, hy=16, skin='a', shade='A', mouth='smile', brows='soft', brow='h',
           hs='crop', hk='h', hd='H', cloth='1', cdark='2', cx=15, sw=7, ww=6, th=14,
           arms=[([(9, 33), (6, 35)], 3), ([(21, 34), (20, 31), (16, 29)], 3)],
           hands=[(13, 27, 'grip', False), (2, 35, 'grip', False)],
           top=lambda f: toque(f, 9, 7, 13), props=spoon, front=lambda f: (jacket(15, 31)(f), pot(f)),
           after=lambda f: steam(f))

    # right chef (pale): holding up a plated dish with a flourish
    def plate(f):
        # tasting spoon: bowl at the lips' corner, handle down to the hand
        f.ell(47, 28, 50, 31, 'm'); f.px(48, 29, 'w')
        f.pts('o', [(50, 31), (51, 32), (52, 33), (53, 34), (54, 35)])
        f.pts('O', [(51, 31), (52, 32), (53, 33), (54, 34), (55, 35)])
        hl = layer(); hand(hl, 52, 33, 'grip', 's', 'S'); over(f, hl, DK)

    def savour(h):
        happy_eyes(h, 37, 17, 16, 's')

    def moust(h):
        pass
    person(c, DK, hx=37, hy=17, size=16, skin='s', shade='S', mouth='smile', brows='soft', brow='j',
           hs='short', hk='j', hd='H', cloth='1', cdark='2', cx=45, sw=8, ww=7, th=14,
           arms=[([(38, 37), (35, 41), (37, 43)], 3), ([(52, 37), (57, 41), (55, 36)], 3)],
           hands=[(35, 40, 'thumb', False)], face=savour,
           top=lambda f: (toque(f, 38, 8, 15), plate(f)), front=jacket(45, 34))
    return c.rows(), pal


PORTRAIT = ('yellow.chefs', art)
