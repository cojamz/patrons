# Con Men: two smooth talkers. Left: fedora with an ace in the band, pencil mustache, a wink and a gold tooth.
# Right: straw boater, slicked hair, a sly sideways look. Checked suits; cash peeking out of a pocket.
from lib import *
def check(g, x0, x1):
    for y in range(23, N):
        for x in range(x0, x1):
            if g.c[y][x] in '23' and (x + y) % 3 == 0: g.c[y][x] = '1'
def draw():
    g = new()
    torso(g, cx=8, top=21, half0=5, step=2, maxhalf=9, x0=0, x1=16)
    torso(g, cx=24, top=21, half0=5, step=2, maxhalf=9, x0=16, x1=32)
    check(g, 0, 16); check(g, 16, 32)
    for y in range(22, N): at(g, 16, y, 'K')
    # collars and ties
    P(g, 6, 21, ['WW WW', ' WxW', '  x', '  r', '  x'])
    P(g, 22, 21, ['WW WW', ' WyW', '  y', '  u', '  y'])
    P(g, 26, 26, ['EEz', 'EE'])            # cash out of the breast pocket
    # left: fedora man
    face(g, 3, 9, 11, 12, ear_row=4)
    P(g, 1, 4, """
    DDDDDD
   DNDDKDDD
  DNDDDDDDDK
  WxDKKKKKKK
NNNNNNNNNNNNNN
 DDDDDDDDDDDD
""")
    eyes(g, 5, 12, 4, 'wink', brow=('t', 'none'))
    P(g, 8, 14, ['t'])
    P(g, 5, 15, ['HH  HH'])
    P(g, 5, 16, ['K    K', ' KKGK'])
    # right: boater man
    face(g, 18, 9, 11, 12, ear_row=4)
    P(g, 17, 5, """
   WWWWWWW
   VWVWVWV
   RRRRRRR
 WWWWWWWWWWW
  hjjhhhhhhH
  Hh      hH
""")
    P(g, 20, 12, ['tt  tt'])
    P(g, 20, 13, ['wK  wK'])
    P(g, 23, 14, ['t'])
    P(g, 21, 16, ['   KK', 'KKK'])
    P(g, 26, 15, ['a'])
    return g
