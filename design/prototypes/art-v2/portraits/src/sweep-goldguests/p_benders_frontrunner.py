# Front-runner: a racer out in front: swept-back hair, red sweatband, gritted grin, race bib "1", a sweat drop, speed lines.
from lib import *
def draw():
    g = new()
    torso(g)
    neck(g)
    # running singlet: arm holes show skin at the shoulders
    P(g, 1, 25, ['SSSS', 'SSSSs', 'SSSSs', 'SSSs', 'SSSs', 'SSSs', 'SSSs'])
    P(g, 26, 25, [' ssst', 'ssst', 'ssst', 'sstt', 'sst', 'sst', 'sst'])
    P(g, 10, 25, ['GWWWWWWWWWWG', 'WWWWWKKWWWWV', 'WWWWKKKWWWWV', 'WWWWWKKWWWWV', 'WWWWWKKWWWWV', 'WWWWKKKKWWVV', 'WVVVVVVVVVVV'])
    face(g, 8, 4, 16, 18, ear_row=8)
    # hair swept back, spiky at the crown
    P(g, 8, 1, """
    H  H H
  HhH hHhHH
 HhjhhjhhhhHH
HhjjhhjhhhhhhH
HhjhhhhhhhhhhhH
""")
    P(g, 22, 3, ['HH', 'hhH', 'hhhH'])
    # sweatband
    P(g, 7, 6, ['RqqqRRRRRRRRRRRRr', 'RRRRRRRRRRRRRRRrr'])
    P(g, 24, 7, ['rR', ' r'])
    P(g, 8, 8, ['h']); P(g, 22, 8, ['H'])
    eyes(g, 10, 11, 8, 'open', brow=('angry_l', 'angry_r'))
    P(g, 15, 13, ['s', 'tt'])
    P(g, 9, 15, ['aa']); P(g, 21, 15, ['aa'])
    P(g, 11, 16, ['KKKKKKKKK', 'KwwwwwwwK', ' KKKKKKK'])
    P(g, 25, 10, [' y', 'yw', 'yy'])     # sweat drop
    # speed lines streaming behind on the left
    P(g, 2, 9, ['iiiii', '', ' iiii', '', 'iiiii', '', '  iii'])
    return g
