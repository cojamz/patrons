# Shift Crew (counts as 2): two workers squeezed into the doorway in hard hats and hi-vis vests; the left one with a
# bushy mustache, the right one younger with a pencil behind the ear and a grin.
from lib import *
def hat(g, x, y, k='Y', d='n'):
    at(g, x - 1, y, [f'   {k*5}{d}   ', f'  {k}w{k*4}{d}{d}  ', f' {k}{k}w{k*4}{d}{d}{d} ', f' {k*8}{d}{d}{d} ', f'{"G"*12}{"g"*2}'])
def draw():
    g = new()
    body(g, top=21, cx=23, start=6, maxhalf=9)
    body(g, top=22, cx=9, start=6, maxhalf=9)
    for x in range(0, 32):
        for y in (27, 28):
            if g.c[y][x] in '1234': g.c[y][x] = 'Y' if y == 27 else 'n'
    for y in range(21, 32):
        if g.c[y][16] != '.': g.c[y][16] = '1'
    at(g, 6, 22, ['Y', 'Y', 'Y', 'Y', 'Y']); at(g, 12, 22, ['n', 'n', 'n', 'n', 'n'])
    at(g, 20, 21, ['Y', 'Y', 'Y', 'Y', 'Y', 'Y']); at(g, 26, 21, ['n', 'n', 'n', 'n', 'n', 'n'])
    hat(g, 3, 6); small(g, 3, 11, mouth='flat', rows={0: 'HhSSSSSSShhH', 4: 'SaaSSttSaast', 5: 'SHHHHHHHHHst', 6: ' SHHSSSHHst '})
    hat(g, 17, 5); small(g, 17, 10, eyes='right', mouth='grin')
    at(g, 29, 8, ['Y', 'K'])  # pencil behind the ear
    return g
