from pix import *
g = G(32)
# the pan: an ellipse seen from above at an angle, a light rim and a dark inside with a little water
cx, cy, rx, ry = 15.5, 17.5, 13.5, 7.5
for y in range(32):
    for x in range(32):
        d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
        di = ((x - cx) / (rx - 2)) ** 2 + ((y - cy + 0.6) / (ry - 2)) ** 2
        if d <= 1:
            if di <= 1: ch = 'B' if (y > cy + 1 and di > 0.45) else ('p' if x > cx + 3 else 'P')
            else: ch = 'L' if (y < cy and x < cx + 6) else ('N' if y > cy + 1 else 'M')
            g.c[y][x] = ch
for y in range(25, 28):  # the pan's underside
    for x in range(5, 27):
        if g.c[y][x] == '.' and 7 <= x <= 24 - (y - 25) * 2 + 2 and x >= 7 + (y - 25) * 2: g.c[y][x] = 'N'
g.put(9, 12, [' 4433 ','443332','433221','332211',' 2211 '])
g.put(16, 11, [' 43 ','4332','3221',' 21 '])
g.put(18, 16, [' 443','43321','32211',' 211'])
g.put(6, 16, ['43','321',' 1'])
g.put(13, 18, ['432','321'])
g.put(22, 3, ['  w  ',' wlw ','wlwlw',' wlw ','  w  '])
g.put(6, 7, [' w ','wlw',' w '])
g.put(26, 10, ['w'])
open('b_prospector.txt','w').write('\n'.join(g.rows()))
