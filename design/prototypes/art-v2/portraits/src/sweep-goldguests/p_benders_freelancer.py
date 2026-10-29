# Alchemist (guest): an old sage in a hood with a long white beard, round spectacles,
# a red flask on one side and a blue one on the other, a spark arcing from red to blue.
from lib import *
def draw():
    g = new()
    torso(g, half0=8)
    neck(g)
    face(g, 9, 6, 14, 15, ear_row=5)
    # hood
    P(g, 6, 2, """
      3333333
    433333333332
   43333333333322
  4333333333333222
  433322222222221
  4332        1221
  432          121
  432          121
  432          121
  432          121
  432          121
  4332        1221
  43332      12221
""")
    # bushy white brows, round specs
    P(g, 10, 10, ['WWWW  VWWV'])
    P(g, 10, 11, ['NNNN  NNNN', 'NwKNNNNwKN', 'NKKN  NKKN', 'NNNN  NNNN'])
    P(g, 15, 15, ['tt'])
    # long white beard and mustache over the robe
    P(g, 9, 16, """
 WWWWW  WWWWV
WWWWVWKKWWVVV
WWWWWWWWWVWVV
 WWVWWWWWWVVV
 WWWWWVWWWVVV
  WWWVWWWWVV
  WWWWWVWVVV
   WWWVWWVV
   WWWWWVVV
    WWVWVV
    WWWWVV
     WWV
      V
""")
    # rope belt
    # red flask (left) and blue flask (right), a spark arcing from one to the other
    P(g, 2, 12, """
 MM
 LM
 xx
xqxx
xxxr
 rr
""")
    P(g, 26, 12, """
 MM
 LM
 yy
yiyy
yyyu
 uu
""")
    for (x, y, c) in [(3, 10, 'x'), (4, 8, 'x'), (6, 6, 'P'), (25, 6, 'P'), (27, 8, 'y'), (28, 10, 'y')]:
        at(g, x, y, c)
    at(g, 15, 0, 'w'); at(g, 14, 1, 'P'); at(g, 17, 1, 'P')
    return g
