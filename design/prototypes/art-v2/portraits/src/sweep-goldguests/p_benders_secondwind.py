# Second Wind: worn out a moment ago, now catching a fresh gust: hair streaming back, towel round the neck,
# a big refreshed grin, a gust with tumbling leaves blowing in from the left.
from lib import *
def draw():
    g = new()
    torso(g)
    neck(g)
    # towel slung round the neck
    P(g, 9, 21, """
WWWWW    WWWWV
 WVWWW  WWWVV
  WWVW  WVWV
  yyyy  yyyy
  WWWV  WWWV
  WWVV  WVVV
  yyyy  yyyy
  WWWV  WWVV
  WWVV  WWVV
""")
    face(g, 8, 5, 16, 17, ear_row=7)
    # hair blown back to the right, streaming off the head
    P(g, 7, 2, """
   HhhjjhhhhHH
  HhjjjjhhhhhhhhHH
 HhjjhhhhhhhhhhhhhhhhH
 Hhjhhhhhhhhhhhhhhhhhhhh
 Hhhhhhhhhhhhhhhhhh  hhhh
 Hh  h  h        hhhh
 H                hhhhh  h
                  hhH
                   hH
""")
    eyes(g, 10, 12, 8, 'open', brow='up')
    P(g, 15, 14, ['s', 'tt'])
    P(g, 9, 16, ['aa']); P(g, 20, 16, ['aa'])
    P(g, 12, 17, ['KKKKKKKK', 'KwwwwwwK', ' KrqqrK', '  KKKK'])
    # a gust from the left: bold streaks and two leaves tumbling in it
    P(g, 2, 7, ['WWWWWW'])
    P(g, 3, 8, ['VVVV'])
    P(g, 1, 12, ['WWWWWWW'])
    P(g, 2, 13, ['VVVVV'])
    P(g, 3, 18, ['WWWWW'])
    P(g, 4, 19, ['VVV'])
    P(g, 4, 3, [' E', 'Ee', 'e'])
    P(g, 2, 15, ['EE', ' Ee'])
    P(g, 26, 4, [' E', 'Ee'])
    at(g, 25, 14, 'y')    # a last bead of sweat flying off
    at(g, 26, 13, 'y')
    return g
