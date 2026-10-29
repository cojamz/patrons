import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(p='#c9b8d0', P='#b8a6c0', o='#a2683f', O='#7d4f2e', i='#d6e6ea', I='#c3d8de',
                   n='#3a3644', N='#4b4656', z='#2a2220', H='#3b2a22', h='#2a1d18',
                   # the reflection: the same colours seen through glass
                   g='#86b49a', G='#6f9a86', s='#b9a08e', S='#a08878', q='#5a6872', Q='#6f7e88')
    pal['1'], pal['2'] = GREEN
    pal['a'], pal['A'] = MED
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 53, 63, 63, 'P')

    def frame(l):                         # a tall standing mirror
        l.ell(31, 3, 63, 20, 'o'); l.rect(31, 11, 63, 55, 'o')
        l.rect(34, 57, 36, 60, 'O'); l.rect(58, 57, 60, 60, 'O')
    bg(c, frame, 'O')
    glass = layer(); glass.ell(34, 6, 60, 20, 'i'); glass.rect(34, 13, 60, 53, 'i')
    c.paste(glass)
    c.poly([(54, 12), (58, 12), (40, 52), (37, 48)], 'I', only='i')

    def body(mouth, brows):
        return dict(skin='a', shade='A', hs='short', hk='H', hd='h', mouth=mouth, brows=brows,
                    shirt='1', sdark='2', sw=7, ww=6, th=12,
                    lg=dict(pants='n', pdark='N', shoe='z', lh=8), DK={'n': 'N'})

    pose = dict(hx=8, hy=14, cx=15,
                arms=[([(9, 32), (6, 37), (7, 42)], 4), ([(21, 32), (25, 32), (26, 25)], 4)],
                hands=[(5, 42, 'fist', False), (24, 21, 'flat', False)])
    # the reflection: the same wave, flipped, tinted, kept inside the glass - but it smiles slyly
    r = person(c, **body('smirk', 'soft'), **pose, layer_out=True)
    tint = {'1': 'g', '2': 'G', 'a': 's', 'A': 'S', 'H': 'q', 'h': 'q', 'n': 'q', 'N': 'Q', 'z': 'q', 'k': 'Q', 'w': 'i', 'r': 'S'}
    for y in range(N):
        for x in range(N):
            v = r.get(66 - x, y)
            if v != '.' and glass.get(x, y) != '.':
                c.px(x, y, tint.get(v, v))

    # the person: startled, waving at the glass
    person(c, **body('o', 'soft'), **pose)
    return c.rows(), pal


PORTRAIT = ('echo.doppel', draw)
