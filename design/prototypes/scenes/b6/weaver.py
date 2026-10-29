import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'p': '#c7b49a', 'P': '#b8a58b',          # workshop wall, floor
        'o': '#9a7350', 'O': '#76553a',          # loom frame, stool
        'q': '#e8e0d0', 'Q': '#cfc5b2',          # warp threads
        'e': '#d0524a', 'u': '#4f86c6', 'g': '#5fae6a', 'm': '#b0509a',   # woven bands
        'n': '#c7d5dc',                          # window light
        '1': YELLOW[0], '2': YELLOW[1],
        'x': '#55506a', 'z': '#2b211d',
        'h': '#1f1714', 'H': '#3a2a22',
        's': DEEP[0], 'S': DEEP[1]})
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 50, 63, 63, 'P')

    def window(l):
        l.rect(4, 6, 15, 20, 'o'); l.rect(5, 7, 14, 19, 'n'); l.vl(9, 7, 19, 'o'); l.vl(10, 7, 19, 'o')
    bg(c, window, 'O')

    def basket(l):
        l.rect(2, 44, 12, 52, 'o'); l.ell(2, 41, 12, 46, 'e'); l.ell(5, 40, 9, 43, 'u')
    bg(c, basket, 'O')

    def loom(l):
        # upright loom on the right: two posts, top beam, warp threads, woven cloth bands below
        l.rect(36, 8, 38, 58, 'o'); l.rect(60, 8, 62, 58, 'o'); l.rect(36, 8, 62, 10, 'o')
        l.rect(39, 11, 59, 44, 'q')
        for x in range(42, 59, 5):
            l.vl(x, 11, 44, 'Q')
        for i, k in enumerate('eugmu'):
            l.rect(39, 28 + i * 3, 59, 30 + i * 3, k)
        l.rect(36, 44, 62, 46, 'O')
    bg(c, loom, 'O')

    DK = {'1': '2', 's': 'S', 'h': 'H', 'x': 'x', 'o': 'O'}
    cx = 21

    def stool(f):
        f.rect(13, 48, 29, 50, 'o'); f.rect(14, 51, 16, 58, 'O'); f.rect(26, 51, 28, 58, 'O')

    def lap(f):
        # seated: thighs forward, shins down
        f.rect(15, 42, 30, 47, 'x'); f.rect(26, 47, 30, 55, 'x'); f.rect(18, 47, 22, 55, 'x')
        f.rect(17, 56, 22, 57, 'z'); f.rect(26, 56, 32, 57, 'z')

    def shuttle(f):
        f.poly([(36, 25), (44, 24), (46, 26), (44, 28), (36, 27)], 'o'); f.hl(38, 43, 26, 'm')

    person(c, DK, hx=14, hy=13, skin='s', shade='S', mouth='smile', brows='soft', brow='h',
           hs='afro', hk='H', hd='h', cloth='1', cdark='2', cx=cx, sw=7, ww=6, th=14,
           arms=[([(26, 31), (30, 34), (35, 30)], 3), ([(16, 32), (14, 37), (17, 41)], 3)],
           hands=[(34, 26, 'grip', False), (16, 40, 'flat', False)],
           back=lambda f: (stool(f), lap(f)), top=shuttle)
    return c.rows(), pal


PORTRAIT = ('yellow.weaver', art)
