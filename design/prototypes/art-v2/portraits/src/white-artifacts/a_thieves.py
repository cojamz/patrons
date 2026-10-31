# Fence: a magenta picket fence with a loot sack slung over it: gold coins and a pearl necklace spilling out.
from common import *
ID = 'artifact.thieves'
def draw():
    g = blank()
    for i, x0 in enumerate((3, 10, 17, 24)):
        top = 7 + (i % 2)
        for y in range(top, 29):
            for k in range(5):
                x = x0 + k
                if y < top + 2 and abs(k - 2) > (y - top): continue
                g.c[y][x] = '4' if k == 0 else ('1' if k == 4 else ('2' if k == 3 else '3'))
    for y in (13, 14, 22, 23):  # rails
        for x in range(1, 31):
            if g.c[y][x] == '.' or True:
                g.c[y][x] = ('4' if y in (13, 22) else '2') if x < 30 else '1'
    for x in range(1, 31): g.c[15][x] = g.c[15][x] if g.c[15][x] != '.' else '.'
    # loot sack over the fence top, right of center
    g.put(14, 1, ['    o  ', '   OOo ', '  OOOO ', ' OOOOOo', 'OOOWOOoo', 'OOOOOOoo', 'OOOOOooo', 'OOOOoooo', ' ooooo '][:0])
    g.put(15, 2, ['   oo', '  OoO', '   O', '  OOOO', ' OOOOOOo', 'OOOOOOOoo', 'OOOGGOOoo', 'OOGgGOooo', 'OOOOOoooo', ' Ooooooo'])
    g.put(13, 9, ['G'])
    g.put(11, 10, ['Gg', 'gg'])
    for (x, y) in [(23, 8), (24, 9), (25, 10), (25, 11), (25, 12), (26, 13), (25, 14), (26, 15)]: g.c[y][x] = 'w'
    g.put(4, 9, ['w'])
    return g.rows()
