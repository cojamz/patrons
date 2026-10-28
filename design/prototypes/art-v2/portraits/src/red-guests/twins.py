# Twins: two identical kids, bowl cuts, matching striped tees, leaning in.
from common import *
def kid(g, x, y, flip):
    face(g, x, y, w=10, h=10, ear_row=3)
    hair = ['   jjhhhh   ', ' jjhhhhhhhH ', 'jhhhhhhhhhHH', 'jhhhhhhhhhHH', 'jhhhhhhhhhHH', 'hhhHHhhhHHHH', 'h          H', 'H          H']
    if flip: hair = [r[::-1].replace('j', '#').replace('H', 'j').replace('#', 'H') for r in hair]
    g.put(x - 1, y - 4, hair)
    g.put(x + 2, y + 3, ['wK', 'KK']); g.put(x + 6, y + 3, ['wK', 'KK'])
    g.c[y + 5][x + 5] = 't'
    g.put(x + 1, y + 6, ['a']); g.put(x + 8, y + 6, ['a'])
    g.put(x + 3, y + 6, ['K  K', ' KK '])
def tee(g, cx, top):
    for y in range(top, 32):
        half = min(8, 3 + (y - top + 1) // 2 * 2)
        for x in range(cx - half, cx + half):
            if not (0 <= x < 32): continue
            k = x - (cx - half); w = 2 * half
            c = '4' if k < 2 else ('1' if k >= w - 1 else ('2' if k >= w - 4 else '3'))
            if (y - top) % 4 in (2, 3): c = {'4': 'W', '3': 'W', '2': 'V', '1': 'V'}[c]
            g.c[y][x] = c
def draw(g):
    doorway(g)
    tee(g, 9, 22); tee(g, 23, 22)
    kid(g, 4, 11, False); kid(g, 18, 11, True)
    g.put(7, 21, ['sst']); g.put(21, 21, ['sst'])
