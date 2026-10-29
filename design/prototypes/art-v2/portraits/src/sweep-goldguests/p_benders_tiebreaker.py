# Tiebreaker: a referee: striped shirt, whistle in his teeth, buzz cut, stern brows, flipping a gold coin to settle the tie.
from lib import *
def draw():
    g = new()
    torso(g)
    # black and white stripes over the grey
    for y in range(22, N):
        for x in range(N):
            if g.c[y][x] in '1234' and x % 4 in (0, 1):
                g.c[y][x] = 'K' if g.c[y][x] in '12' else 'D'
    neck(g)
    P(g, 13, 22, ['DD  DD'])
    # lanyard down to the whistle
    face(g, 8, 4, 16, 18, ear_row=8)
    # buzz cut
    P(g, 8, 3, """
    HHHHHHHH
  HHhjhjhhhhHH
 HhjhjhhhhhhhhH
HhhhhhhhhhhhhhhH
HhhSSSSSSSSSShhH
Hh            hH
""")
    eyes(g, 10, 12, 8, 'narrow', brow=('angry_l', 'angry_r'))
    P(g, 10, 10, ['KKK']); P(g, 18, 10, ['KKK'])
    P(g, 15, 14, ['s', 'tt'])
    P(g, 9, 16, ['aa'])
    # whistle clamped in his lips, red cord down to the shirt
    P(g, 12, 18, [' KKKK', 'K'])
    P(g, 15, 17, """
 LLLLM
LwLLLMN
 NMMMN
""")
    P(g, 21, 19, ['x', 'x', ' x', ' x', ' x'])
    # the coin, mid-flip, and its arc
    P(g, 23, 1, """
  GGG
 GGwGg
 GwGGg
 GGGgg
  ggg
""")
    at(g, 24, 8, 'i'); at(g, 23, 10, 'i'); at(g, 23, 12, 'i')    # the flip's arc
    return g
