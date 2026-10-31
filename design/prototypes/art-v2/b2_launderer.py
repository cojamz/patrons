# Direction 2, round two (Cory, Oct 28): a bigger head-and-shoulders portrait filling its doorway; accessories worn, not held.
from pix import *
import math
N = 32
g = G(N)
for y in range(1, N):  # the doorway: a dome in the sphere's dark with a lighter rim
    hw = 14 if y >= 15 else int(round(math.sqrt(max(0, 14.4 ** 2 - (15 - y) ** 2))))
    if hw > 1: g.put(16 - hw, y, ['c' + 'b' * (2 * hw - 2) + 'c'])
cx = 16
for y in range(22, N):  # shoulders in the suit, an open white collar, a gold chain lying on the shirt
    half = min(15, 7 + (y - 22) * 3)
    row = {}
    for x in range(cx - half, cx + half):
        k = x - (cx - half); w = 2 * half
        row[x] = '4' if k < 2 else ('1' if k >= w - 1 else ('2' if k >= w - 4 else '3'))
    sv = 7.5 - (y - 22) * 0.7
    for x in range(cx - half, cx + half):
        dx = abs(x + 0.5 - cx)
        if dx < sv - 1: row[x] = 'W'
        elif dx < sv: row[x] = 'V'
        elif dx < sv + 1 and y > 22: row[x] = '2'  # the lapel's lit edge
    for x, ch in row.items(): g.c[y][x] = ch
g.put(8, 3, ['    HHHHHHHH    ','  HHhhhjjjjhHH  ',' HHhhjjjjjjhhhH ','HHhhjjjhhhhhhhhH','HhhjjhhhhhhhhhhH','HhhSSSSSSSSSShhH','HhSSSSSSSSSSSShH','HSSSSSSSSSSSSSsH','SSSSSSSSSSSSSSst','SKKKKKKKKKKKKKKt','SKwKKKKSSKwKKKKt','SSKKKKSSSSKKKKst','SSSSSSSSSSSSSsst','SSSSSSStSSSSsstt','SSSSSSttSSSSsstt',' SSSSSSSSSSSSst ',' SSSSSttttGSsst ','  SSSSSSSSSsst  ','   sSSSSSSsst   ','    tssssstt    '])
for (x, y) in [(12,23),(19,23),(13,24),(18,24),(14,25),(17,25)]: g.c[y][x] = 'G' if x < 16 else 'g'
g.put(15, 26, ['Gg','gg'])
g.put(7, 13, ['s', 's', 't']); g.put(24, 13, ['t', 't', 't'])
open('b2_launderer.txt', 'w').write('\n'.join(g.rows()))
