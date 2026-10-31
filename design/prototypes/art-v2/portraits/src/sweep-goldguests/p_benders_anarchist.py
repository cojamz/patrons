# Anarchist: a tall red mohawk, shaved sides, nose ring and safety-pin earring, a sneer,
# studded black jacket over a tee with a circled A.
from lib import *
def draw():
    g = new()
    torso(g)
    # black leather jacket, open over the tee
    for y in range(22, N):
        for x in range(N):
            if g.c[y][x] in '1234' and not (11 <= x <= 20):
                g.c[y][x] = {'4': 'N', '3': 'D', '2': 'D', '1': 'K'}[g.c[y][x]]
    for y in range(24, N): at(g, 10, y, 'N'); at(g, 21, y, 'K')
    neck(g)
    P(g, 14, 24, ['  xx', ' x  x', ' xxxx', ' x  x', ' x  x'])  # circled A
    for (x, y) in [(4, 25), (6, 24), (5, 27), (25, 25), (27, 27), (26, 23), (8, 29), (24, 29)]: at(g, x, y, 'L')
    face(g, 8, 6, 16, 16, ear_row=6)
    # shaved sides: stubble shade on the scalp
    # the mohawk: tall spikes of dyed red
    P(g, 12, 0, """
 q  R  r
 qR qRrRr
 RRqRRRrr
qRRRRRRrr
qRRRRRRrr
 RqRRRRrr
 RRRRRrr
 qRRRRrr
""")
    # stubble on the shaved sides
    for (x, y) in [(10, 7), (12, 8), (9, 9), (20, 7), (22, 8), (21, 9), (11, 10), (20, 10)]: at(g, x, y, 's')
    eyes(g, 10, 12, 8, 'narrow', brow=('angry_l', 'angry_r'))
    P(g, 15, 14, ['s', 'tt'])
    P(g, 16, 15, ['L'])                       # nose ring
    P(g, 24, 13, ['M', 'L', 'M'])             # safety pin
    P(g, 12, 18, ['     KK', 'KKKKK'])    # sneer
    return g
