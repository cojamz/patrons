import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(p='#c9b8d0', P='#b8a6c0', o='#a2683f', O='#7d4f2e', i='#d6e6ea', I='#c3d8de',
                   n='#3a3644', N='#4b4656', z='#2a2220', H='#3b2a22', h='#2a1d18', y='#f3d27a', j='#f3ead2',
                   # the reflection: the same colours seen through glass
                   g='#86b49a', G='#6f9a86', s='#b9a08e', S='#a08878', q='#5a6872', Q='#6f7e88')
    pal['1'], pal['2'] = GREEN
    pal['a'], pal['A'] = MED
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 53, 63, 63, 'P')

    def frame(l):                         # a tall standing mirror
        l.ell(33, 3, 61, 20, 'o'); l.rect(33, 11, 61, 55, 'o')
        l.rect(36, 57, 38, 60, 'O'); l.rect(56, 57, 58, 60, 'O')
    bg(c, frame, 'O')
    glass = layer(); glass.ell(36, 6, 58, 20, 'i'); glass.rect(36, 13, 58, 53, 'i')
    c.paste(glass)
    c.poly([(52, 12), (56, 12), (40, 50), (38, 46)], 'I', only='i')

    def body(mouth, brows):
        def front(f):
            f.poly([(-1, 0), (0, 0), (0, 1)], '1')
        return dict(skin='a', shade='A', hs='short', hk='H', hd='h', mouth=mouth, brows=brows,
                    shirt='1', sdark='2', sw=7, ww=6, th=12,
                    lg=dict(pants='n', pdark='N', shoe='z', lh=8), DK={'n': 'N'})

    # the reflection, drawn as a person, flipped, tinted, kept inside the glass
    r = person(c, hx=40, hy=15, cx=47, **body('smirk', 'stern'),
               arms=[([(41, 33), (38, 38), (39, 42)], 4), ([(53, 33), (55, 38), (54, 43)], 4)],
               hands=[(37, 42, 'fist', False), (53, 43, 'fist', False)], layer_out=True)
    tint = {'1': 'g', '2': 'G', 'a': 's', 'A': 'S', 'H': 'q', 'h': 'q', 'n': 'q', 'N': 'Q', 'z': 'q', 'k': 'Q', 'w': 'i', 'r': 'S'}
    for y in range(N):
        for x in range(N):
            v = r.get(x, y)
            if v != '.' and glass.get(x, y) != '.':
                c.px(x, y, tint.get(v, v))

    # the person: startled, leaning back from the glass
    person(c, hx=10, hy=14, cx=17, **body('o', 'soft'),
           arms=[([(11, 32), (8, 37), (9, 42)], 4), ([(23, 32), (27, 35), (29, 30)], 4)],
           hands=[(7, 42, 'fist', False), (28, 26, 'flat', False)])
    return c.rows(), pal


PORTRAIT = ('echo.doppel', draw)
