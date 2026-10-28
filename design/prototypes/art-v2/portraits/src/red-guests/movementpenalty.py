# Movement Penalty: a stern referee in a striped shirt, whistle in his teeth, holding up a penalty card.
from common import *
def draw(g):
    doorway(g)
    for y in range(22, 32):
        half = min(15, 7 + (y - 22) * 3)
        for x in range(16 - half, 16 + half):
            k = x - (16 - half); w = 2 * half
            base = '4' if k < 2 else ('2' if k >= w - 4 else '3')
            g.c[y][x] = 'K' if (x // 2) % 2 == 0 and k >= 2 else base
    g.put(12, 22, ['KKKKKKKK', ' KKKKKK ', '  KKKK  '])
    g.put(14, 22, ['ssss', ' tt '])
    # raised arm and card
    g.put(23, 2, [' RRRRq', ' RRRRR', ' RRRRR', ' RRRRr', ' RRRrr', ' RRRrr', ' rrrrr'])
    g.put(23, 2, [' qRRRR'])
    g.put(23, 9, [' SSSs', 'SSSSst', 'sSSSst', ' 4332', ' 4331', ' 4331', ' 4321', ' 4321', ' 4321', ' 4321', ' 4321', ' 3321', ' 3221'])
    face(g, 8, 9)
    g.put(8, 3, ['    HHhhhhHH    ', '  HhhhhhhhhhhH  ', ' HhhjhhhhhhhhhH ', ' hhjhhhhhhhhhhH ', 'HhhhhhhhhhhhhhhH', 'Hhhhhhhhhhhhhhhh', 'Hh            hH'])
    g.put(10, 11, ['KKK    KKK'][0:0])
    g.put(9, 11, ['KKt    tKK'])
    g.put(11, 11, ['t']); g.put(18, 11, ['t'])
    eyes(g, 10, 12, brow=False)
    g.c[14][15] = 't'
    g.put(8, 15, ['aaa          aa'])
    g.put(13, 17, ['KK'])
    g.put(15, 16, ['LLLL', 'LMMMN', ' NNN'])
    g.put(16, 16, ['w'])
