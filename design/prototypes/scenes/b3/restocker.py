import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(p='#dfe3e0', P='#cfd4d1', s='#a9b0ae', S='#8e9593', f='#bfc4c1', F='#adb2af',
               j='#c3bbad', g='#b5ad9f', y='#e3cf8a', G='#5fa06a', R='#4f8a5a', o='#c9a066', O='#9e7840', u='#e8e2d6',
               a=PALE[0], A=PALE[1], h='#d8b060', H='#a8843e', n='#3e3a4a', N='#2e2b38', z='#3a2c26',
               **{'1': BLUE[0], '2': BLUE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 'n': 'N', 'o': 'O', 'u': 'u'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 54, 63, 63, 'f'); c.hl(0, 63, 54, 'F')

    def shelves(l):                         # aisle shelving with tins and boxes
        l.rect(0, 4, 63, 53, 's')
        for y in (16, 30, 44):
            l.rect(0, y, 63, y + 1, 'S')
        cols = ['j', 'g', 'y', 'g']
        for row, y in enumerate((8, 22, 36)):
            for i, x in enumerate(range(2, 62, 5)):
                if row == 1 and 40 <= x <= 52:
                    continue                  # the gap being filled
                k = cols[(i + row) % 4]
                l.rect(x, y, x + 3, y + 7, k)
        l.rect(0, 46, 63, 53, 'S')
    bg(c, shelves, 'S')

    def front(f):                           # store vest over a light shirt, name tag
        f.rect(29, 28, 34, 43, 'u'); f.rect(26, 34, 28, 35, 'y')
    person(c, DK, hx=24, hy=11, skin='a', shade='A', mouth='smile', brows='soft', brow='H',
           hs='bun', hk='h', hd='H', side='L', cx=31, sw=8, ww=7, th=15, cloth='1', front=front,
           lg=dict(gap=2, lw=4, lh=10, pants='n', pdark='N', shoe='z'),
           arms=[([(23, 30), (27, 37), (35, 36)], 4, '1'), ([(39, 30), (44, 35), (49, 35)], 4, '1')])
    bx = layer()                            # the carton, lifted in both hands toward the gap on the shelf
    bx.rect(35, 22, 53, 34, 'o'); bx.rect(35, 22, 53, 23, 'O'); bx.rect(50, 24, 53, 34, 'O')
    bx.hl(38, 47, 28, 'O')
    hand(bx, 34, 32, 'grip', 'a', 'A'); hand(bx, 48, 33, 'grip', 'a', 'A', flip=True)
    outline_once(bx); c.paste(bx)
    return c.rows(), pal


PORTRAIT = ('market.restocker', draw)
