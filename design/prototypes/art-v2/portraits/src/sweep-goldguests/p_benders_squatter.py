# Party Crasher: uninvited, in a plain hoodie, a party hat knocked askew, party blower in his mouth, sly side-eye, confetti.
from lib import *
def draw():
    g = new()
    torso(g)
    # hood bunched behind the neck, drawstrings
    neck(g)
    P(g, 9, 21, ['4433       2221', '44333     22211'])
    P(g, 13, 23, ['W', 'W', 'W', 'V']); P(g, 18, 23, ['V', 'V', 'W', 'V'])
    P(g, 11, 28, ['2222222222', '1111111111'])  # pouch pocket
    face(g, 8, 5, 16, 17, ear_row=7)
    # messy hair
    P(g, 7, 3, """
  HhH hHH hhH
 HhjhhhjhhhhhhH
HhjjhhhhhhhhhhhH
HhhhhhhhhhhhhhhH
Hhh h hh  h hhHH
Hh            hH
H              H
""")
    # party hat knocked to one side, pompom on the tip
    cone(g, 17, 5, 27, 0, 5)
    P(g, 26, 0, ['Y', ''][:1])
    at(g, 27, 0, 'Y'); at(g, 26, 0, 'w'); at(g, 27, 1, 'g')
    eyes(g, 10, 12, 8, 'side', brow=('t', 'raised'))
    P(g, 15, 14, ['s', 'tt'])
    P(g, 9, 16, ['aa']); P(g, 20, 16, ['aa'])
    # party blower, unrolled out the side of a grin
    P(g, 12, 18, ['KSSSKK', ' KKK'])
    P(g, 17, 18, ['RRqRYRqRY', 'rrrrrrrYY'])
    # confetti
    for (x, y, c) in [(3, 6, 'x'), (5, 10, 'y'), (2, 14, 'z'), (26, 11, 'n'), (28, 14, 'x'), (4, 18, 'n'), (27, 21, 'y'), (6, 3, 'z')]:
        at(g, x, y, c)
    return g
