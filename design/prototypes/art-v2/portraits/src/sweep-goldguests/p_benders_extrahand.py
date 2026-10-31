# Extra Hand: a cheerful day laborer in a yellow hard hat and blue overalls, one work glove up waving "I'll help".
from lib import *
def draw():
    g = new()
    torso(g)
    neck(g)
    # overalls bib with straps and brass buttons
    P(g, 10, 22, ['U', 'U', 'U', 'GUUUUUUUUUUG', 'UUUUUUUUUUUu', 'UUUUuuuuUUUu', 'UUUUu  uUUuu', 'UUUUuuuuUUuu', 'UUUUUUUUUuuu', 'UUUUUUUUUuuu'])
    P(g, 21, 22, ['u', 'u', 'u'])
    P(g, 14, 27, ['NN'])               # a pencil stub in the bib pocket
    P(g, 14, 26, ['Y'])
    face(g, 8, 5, 16, 17, ear_row=6)
    P(g, 8, 9, ['hh', 'h']); P(g, 22, 9, ['hH', ' H'])
    # hard hat
    P(g, 7, 1, """
      YYYYYY
    YGGYYYYYYY
   YGYYYYgYYYYg
  YGYYYYYgYYYYYg
  YYYYYYYgYYYYYg
  YYYYYYYgYYYYgg
 YYYYYYYYYYYYYYYg
gggggggggggggggggg
""")
    eyes(g, 10, 11, 8, 'open', brow='up')
    P(g, 15, 13, ['s', 'tt'])
    P(g, 9, 15, ['aa']); P(g, 21, 15, ['aa'])
    P(g, 12, 16, ['KKKKKKKK', 'KrrrrrrK', ' KrqqrK', '  KKKK'])
    # waving work glove beside the head, a bit of sleeve
    P(g, 24, 8, """
 W W
 WVWVW
 WVWVWV
VWWWWWV
VWWWWWV
 VWWWV
  VVV
  uUu
  uUu
""")
    at(g, 23, 9, 'i'); at(g, 23, 11, 'i'); at(g, 30, 9, 'i')   # waving lines
    return g
