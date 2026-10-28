# Money Changer: a white balance scale, gold coins weighing down one pan, the table's colored dots in the other.
from common import *
ID = 'artifact.trading'
def draw():
    g = blank()
    g.put(9, 26, ['   433332  ', ' 4433333221', '44333333322 1'[:12], '111111111111'][:3])
    g.put(8, 26, ['    44332   ', '  443333221 ', ' 4433333322 1'[:12], '111111111111'])
    for y in range(7, 27): g.put(15, y, ['432'])
    g.put(14, 4, [' 44 ', '4332', ' 32 '])  # finial
    # beam, tipped down to the left
    for x in range(3, 29):
        y = round(9 + (16 - x) * 0.12)
        g.c[y][x] = '4' if x < 16 else '3'; g.c[y + 1][x] = '2' if x < 27 else '1'
    def pan(cx, top, chain_top):
        for k in range(-5, 6):
            g.c[top][cx + k] = '4' if k < -3 else ('3' if k < 3 else '2')
        g.put(cx - 4, top + 1, ['233333322', ' 1222221'])
        for y in range(chain_top, top - 2): g.c[y][cx] = 'M'
        g.put(cx - 3, top - 2, [' MMMMM ', 'M     M'][:0])
        g.put(cx - 2, top - 2, [' MMM', 'M   M'])
    pan(5, 22, 12); pan(26, 17, 9)
    g.put(1, 18, ['  GGg ', ' GGGGg', '  ggg', ' GGGg ', ' gggg ']) ; g.put(5, 17, [' GG', 'GGGg', 'gggg', 'GGGg', 'ggg'])
    g.put(2, 18, ['', ])
    g.put(22, 14, ['  yy', 'xx yyzz', 'xxnnzz', '  nn'][:0])
    g.put(22, 14, [' x  z', 'xxyzz', 'xnnyy'])
    g.put(13, 7, ['w'])
    return g.rows()
