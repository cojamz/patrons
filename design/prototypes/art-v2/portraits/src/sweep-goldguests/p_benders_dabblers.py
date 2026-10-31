# Dabblers: two people who dip into everything: one in a paint-flecked beret, one in a rainbow propeller beanie,
# both in patchwork tops of every table color.
from lib import *
def patch(g, cx, top, half0, maxhalf, x0, x1):
    torso(g, cx=cx, top=top, half0=half0, step=2, maxhalf=maxhalf, x0=x0, x1=x1)
    cols = ['x', 'y', 'z', 'n', 'P']
    for y in range(top + 2, N):
        for x in range(x0, x1):
            cx3, cy3 = x // 4, (y - top - 2) // 4
            if g.c[y][x] in '23' and x % 4 != 3 and (y - top - 2) % 4 != 3 and (cx3 + cy3) % 2 == 0:
                g.c[y][x] = cols[(cx3 * 2 + cy3 * 3) % len(cols)]
def draw():
    g = new()
    patch(g, 8, 21, 4, 9, 0, 16)
    patch(g, 24, 21, 4, 9, 16, 32)
    for y in range(22, N): at(g, 16, y, '1')
    # left: beret dabbler
    face(g, 3, 8, 11, 13, ear_row=5)
    neck(g, 7, 21, 3)
    P(g, 2, 4, """
   PPPPPP
 PPpPPPPPPP
PPPPPPPxPPPp
PPPPzPPPPPPpp
 pppppppppp p
""")
    at(g, 7, 3, 'p')
    P(g, 3, 9, ['hh', 'h'])
    eyes(g, 5, 13, 4, 'open', brow='t')
    P(g, 8, 15, ['t'])
    P(g, 4, 17, ['a'])
    P(g, 6, 17, ['KKKK', 'KrrK', ' KK'])
    # brush tucked behind the beret
    P(g, 12, 2, ['  yy', ' LM', 'oO', 'O'])
    # right: propeller-beanie dabbler
    face(g, 18, 8, 11, 13, ear_row=5)
    neck(g, 22, 21, 3)
    P(g, 17, 3, """
    NyN
  xxxN zz
 xxxxnnzzz
 xxxxnnnzzz
 yyyyyyyyyyy
 h        hH
""")
    P(g, 18, 2, ['LLLLNMMMM'])
    eyes(g, 20, 13, 4, 'happy')
    P(g, 23, 15, ['t'])
    P(g, 19, 16, ['a']); P(g, 27, 16, ['a'])
    P(g, 21, 17, ['KKKKK', 'KwwwK', ' KKK'])
    return g
