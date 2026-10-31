# Mob: three angry faces crowded in the doorway, a torch and a pitchfork raised behind them.
from common import *
def angry(g, x, y, w, h, gap):
    face(g, x, y, w=w, h=h)
    ex = x + (w - gap - 2) // 2
    g.put(ex - 1, y + 2, ['KK', '  K']); g.put(ex + gap + 1, y + 2, [' KK', 'K'])
    g.put(ex, y + 3, ['wK']); g.put(ex + gap, y + 3, ['wK']); g.put(ex, y + 4, ['KK']); g.put(ex + gap, y + 4, ['KK'])
    g.c[y + 5][x + w // 2] = 't'
def draw(g):
    doorway(g)
    # torch (left) and pitchfork (right) behind the crowd
    g.put(3, 1, ['  Y ', ' YGY', 'YGwGx', 'xYGYx', ' xYx ', '  OO', '  Oo', '  Oo', '  Oo', '  Oo', '  Oo'])
    g.put(23, 1, ['L L L', 'M M M', 'M M M', 'MMMMN', '  M', '  o', '  O', '  O', '  o', '  O'])
    shoulders(g, cx=8, top=21, base=6, step=3, maxhalf=8)
    shoulders(g, cx=25, top=20, base=6, step=3, maxhalf=8)
    # back left
    g.put(2, 6, ['  hhhhhhH  ', ' jhhhhhhhhH', 'jhhhhhhhhhH', 'hh       hH', 'h         H'])
    angry(g, 3, 9, 10, 11, 4)
    g.put(5, 17, ['KKKK'])
    # back right
    g.put(19, 5, ['  NNNNNN  ', ' MNNNNNNNN', 'MNN      N', 'N        N'])
    angry(g, 20, 8, 10, 11, 4)
    g.put(22, 16, [' KK ', 'K  K'])
    # front centre, bigger, shouting
    shoulders(g, cx=16, top=24, base=7, step=3, maxhalf=11)
    g.put(9, 8, ['    HHHHHH    ', '  HHhhhhhhHH  ', ' HhjhhhhhhhhH ', 'HhhhhhhhhhhhhH', 'Hh          hH'])
    angry(g, 10, 11, 12, 13, 6)
    g.put(9, 14, ['s']); g.put(22, 14, ['t'])
    g.put(13, 18, ['KKKKKK', 'KrqqrK', ' KKKK '])
