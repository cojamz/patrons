# Panel: three judges behind a long desk holding up their scorecards, 10, 9, 10.
from common import *
def judge(g, x, y):
    face(g, x, y, w=8, h=9, ear_row=3)
    g.put(x + 1, y + 3, ['wK  wK', 'KK  KK'])
    g.c[y + 5][x + 4] = 't'
def draw(g):
    doorway(g)
    for cx in (7, 16, 25):
        shoulders(g, cx=cx, top=20, base=4, step=3, maxhalf=6)
    # left judge: hair in a high bun, pursed lips
    g.put(4, 4, ['  hhh ', ' jhhhH', '  hHH '])
    g.put(2, 7, ['  jhhhhhH ', ' jhhhhhhhH', 'jhhhhhhhhH', 'hh      hH', 'h        H'])
    judge(g, 3, 10)
    g.put(5, 16, ['KKK'])
    # middle judge: bald with gray tufts and half-moon glasses, raised brow
    g.put(12, 7, ['  SSSS  ', ' SwSSSs ', 'SSSSSSst'])
    g.put(11, 9, ['M        N'])
    judge(g, 12, 10)
    g.put(11, 10, ['M', 'M']); g.put(20, 10, ['N', 'N'])
    g.put(12, 12, [' KK  KK'])
    g.put(13, 12, ['tt'])
    g.put(12, 14, [' NNNNNN'])
    g.put(15, 16, ['KK'])
    # right judge: curly dark hair, wide eyes, little smile
    g.put(20, 6, [' HhHhH  ', 'HhjhhhH ', 'hjhhhhhhH', 'Hhhhhhhh H', 'Hh      HH', 'H        H'])
    judge(g, 21, 10)
    g.put(23, 16, ['K  K', ' KK '])
    # desk and scorecards
    for y in range(24, 32):
        for x in range(1, 31):
            if g.c[y][x] != '.': g.c[y][x] = '4' if y == 24 else ('2' if x > 26 else ('1' if y == 31 else '3'))
    card10 = ['WWWWWWV', 'WKWKKKV', 'WKWKWKV', 'WKWKKKV', 'VVVVVVV']
    card9 = ['WWWWWV', 'WKKKWV', 'WKKKWV', 'WWWKWV', 'VVVVVV']
    g.put(3, 22, card10); g.put(13, 22, card9); g.put(21, 22, card10)
    g.put(4, 27, ['SS']); g.put(14, 27, ['SS']); g.put(22, 27, ['SS'])
