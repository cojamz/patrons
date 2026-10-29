# HR: a Human Resources department of three office workers with lanyard badges.
# Left: bob haircut and cat-eye glasses. Middle (higher): neat side part, tie, the big friendly smile.
# Right: curly hair and a headset.
from lib import *
def badge(g, x, y):
    P(g, x, y, ['WWW', 'WyW', 'WVV'])
def draw():
    g = new()
    torso(g, cx=5, top=23, half0=4, step=2, maxhalf=7, x0=0, x1=11)
    torso(g, cx=26, top=23, half0=4, step=2, maxhalf=7, x0=21, x1=32)
    # middle one, in front
    torso(g, cx=16, top=21, half0=4, step=2, maxhalf=6, x0=10, x1=22)
    for y in range(23, N): at(g, 10, y, '1'); at(g, 21, y, '1')
    # collars, tie, lanyards and badges
    P(g, 14, 21, ['W  V'])
    P(g, 15, 22, ['UU', 'UU', 'uU', 'Uu', 'uu'])
    P(g, 13, 22, ['x', 'x', ' x', ' x'])
    badge(g, 13, 26)
    P(g, 3, 24, ['y', ' y', ' y']); badge(g, 4, 27)
    P(g, 27, 24, ['z', 'z']); badge(g, 26, 26)
    # left: bob and cat-eye glasses
    face(g, 2, 12, 9, 11, ear_row=4)
    P(g, 1, 9, """
   HHHHH
 HhjjhhhhH
HhjhhhhhhhH
Hjhhhhhhhh H
Hhh       hH
Hh        hH
Hh        hH
Hh        hH
 H        H
""")
    P(g, 2, 15, ['PPP  PPP', ' wK  wK', ' KK  KK'])
    P(g, 4, 19, ['K  K', ' KK'])
    # right: curls and a headset
    face(g, 22, 12, 9, 11, ear_row=4)
    P(g, 21, 8, """
  hjh hh
 hjhhjhhh
hjhhhhhhhH
hhh hh hhH
hh       hH
 h       hH
""")
    P(g, 21, 15, ['D', 'D', 'N', ' N', '  NN'])  # headset mic on the near side
    P(g, 24, 16, ['wK  wK', 'KK  KK'])
    P(g, 24, 15, ['tt  tt'])
    P(g, 24, 19, ['K  K', ' KK '])
    # middle: side part, tie, wide smile
    face(g, 11, 7, 10, 13, ear_row=5)
    P(g, 10, 4, """
   HHHHHH
  HhjjjhhhH
 HhjjhhHhhhH
 HhhhhSHhhhH
 HhhSSSSSShH
 Hh        H
""")
    P(g, 13, 13, ['wK  wK', 'KK  KK'])
    P(g, 13, 12, ['tt  tt'])
    P(g, 16, 15, ['t'])
    P(g, 12, 16, ['a'])
    P(g, 13, 16, ['KKKKKK', ' KwwK', '  KK'])
    return g
