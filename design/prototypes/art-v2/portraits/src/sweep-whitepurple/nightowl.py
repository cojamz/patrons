# Night Owl (counts as 2): two night owls up past midnight, hoods with owl-ear tufts. In front, the Night Owl in big
# round glasses, wide awake and grinning; behind him a heavy-lidded companion mid-yawn. A crescent moon and stars.
from lib import *
def hood(g, cx, cy, rx, ry, keys):
    ellipse(g, cx, cy, rx, ry, keys=keys)
    x0, x1, y0 = int(cx - rx) + 1, int(cx + rx) - 2, int(cy - ry)
    at(g, x0, y0 - 2, [keys[0], keys[0] + keys[1], keys[0] + keys[1] + keys[1]])  # ear tufts
    at(g, x1 - 1, y0 - 2, ['  ' + keys[2], ' ' + keys[2] + keys[3], keys[2] + keys[2] + keys[3]])
def draw():
    g = new()
    for x, y in ((4, 6), (13, 1), (2, 17), (9, 2)): g.c[y][x] = 'w'
    # behind: the sleepy companion, right
    body(g, top=19, cx=24, start=6, maxhalf=8, keys='3321')
    hood(g, 24, 10.5, 7, 8.5, '3321')
    small(g, 18, 6, mouth='open', rows={0: 'hhhhhhhhhhhh', 1: 'SKKKSSKKKsst', 2: 'SwwKSSwwKsst', 3: 'SwKKSSwKKsst', 4: 'SttSSttSttst'})
    before = [r[:] for r in g.c]
    # front: the Night Owl, left and lower
    body(g, top=21, cx=10, start=8, maxhalf=11)
    hood(g, 11, 13, 8.5, 9.5, '4321')
    head(g, 4, 8, [
        'HhhhhhhhhhhhhH',
        'SSSSSSSSSSSSst',
        'SLLLLSSLLLLSst',
        'LiwKiLLiwKiLst',
        'LiKKiLLiKKiLst',
        'SLLLLSSLLLLSst',
        'StttSttSStttst',
        'SaaSSSSSSSaast',
        ' SSSKwwwKSSst ',
        ' SSSSKKKSSsst ',
        '  SSSSSSSsst  ',
        '   tssssst    ',
    ])
    at(g, 9, 20, ['ssss', ' tt '])
    at(g, 8, 22, ['W  W', 'W  W', 'W  W']); g.c[25][8] = 'w'; g.c[25][11] = 'w'  # hood strings
    for y in range(N):  # a dark gap down the front owl's right side, so the two read apart
        xs = [x for x in range(N) if g.c[y][x] != before[y][x]]
        if xs and max(xs) + 1 < N and before[y][max(xs) + 1] not in 'bc.': g.c[y][max(xs) + 1] = '.'
    return g
