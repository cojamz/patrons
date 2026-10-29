import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def dabblers():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1', '1': GREY[0], '2': GREY[1],
           'p': '#d9cbb3', 'P': '#cbbca2', 'o': '#a8783f', 'O': '#7e5a2c',
           'r': '#d9534a', 'g': '#5aa05a', 'm': '#c2457f', 'v': '#7a4fa8', 'b': '#4f82c4', 'y': '#f0c548',
           'u': MED[0], 'U': MED[1], 'c': LIGHT[0], 'C': LIGHT[1], 'H': '#2a1c14', 'h': '#c98a3a', 'j': '#9a6224',
           'z': '#55504a', 'q': '#4a5262'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 50, 63, 63, 'P')

    def easel(l):
        l.line(4, 52, 10, 10, 'O'); l.line(5, 52, 11, 10, 'O'); l.line(18, 52, 12, 10, 'O'); l.line(19, 52, 13, 10, 'O')
        l.rect(1, 12, 21, 32, 'w'); l.rect(1, 33, 21, 34, 'O')
        l.ell(4, 16, 12, 26, 'b'); l.ell(10, 20, 18, 29, 'y'); l.rect(5, 26, 9, 30, 'r')
    bg(c, easel, 'P')
    c.recolor('P', 'O', (0, 12, 22, 34))
    c.recolor('P', 'P', (0, 0, 63, 63))

    def shelf(l):
        l.hl(40, 63, 12, 'O'); l.hl(40, 63, 13, 'O')
        for i, x in enumerate(range(42, 62, 5)):
            l.rect(x, 7, x + 2, 11, 'rgvm'[i])
    bg(c, shelf, None)
    DK = {'1': '2', 'u': 'U', 'c': 'C', 'o': 'O', 'w': 'w'}

    # painter, mid-brown, palette full of every colour
    def palette(f):
        f.ell(28, 38, 38, 44, 'w')
        for (x, y, k) in ((30, 39, 'r'), (33, 39, 'g'), (36, 40, 'b'), (30, 42, 'y'), (33, 42, 'v'), (36, 42, 'm')):
            f.px(x, y, k); f.px(x + 1, y, k)

    def brush(p):
        p.line(16, 22, 20, 28, 'O'); p.line(17, 22, 21, 28, 'o'); p.px(15, 21, 'm'); p.px(16, 21, 'm')
    person(c, DK, 22, 14, ('u', 'U'), 'short', 'H', 'h', mouth='smile', brows='soft', brow='H', cloth='1', cdark='2',
           sw=7, ww=6, th=12, pants=('q', 'q'), shoe='z', lh=9, top=palette,
           arms=[([(23, 32), (19, 35), (20, 30)], 3, '1'), ([(35, 32), (37, 37), (35, 41)], 3, '1')],
           hands=[(18, 26, 'grip', False), (33, 40, 'flat', True)], props=brush)

    # musician, light, strumming a guitar
    def guitar(f):
        f.ell(42, 36, 53, 46, 'o'); f.ell(48, 38, 53, 46, 'O', only='o'); f.ell(46, 39, 48, 41, 'H')
        f.line(49, 37, 58, 26, 'O'); f.line(50, 37, 59, 26, 'O'); f.rect(58, 24, 61, 26, 'H')
    person(c, DK, 43, 13, ('c', 'C'), 'long', 'h', 'j', mouth='grin', brows='soft', brow='j', cloth='1', cdark='2',
           sw=7, ww=6, th=12, pants=('q', 'q'), shoe='z', lh=10, front=guitar,
           arms=[([(56, 31), (59, 32), (58, 28)], 3, '1'), ([(44, 31), (42, 36), (45, 40)], 3, '1')],
           hands=[(56, 27, 'grip', True), (44, 39, 'fist', False)])
    return c.rows(), pal


PORTRAIT = ('benders.dabblers', dabblers)
