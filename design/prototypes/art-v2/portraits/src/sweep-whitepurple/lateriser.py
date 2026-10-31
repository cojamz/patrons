# Late Riser: just rolled out of bed. Striped nightcap with a pompom flopping over, bed-head tufts poking out, one eye
# still shut, a big yawn, striped pajama collar; Zs floating up out of the doorway.
from lib import *
def draw():
    g = new()
    at(g, 2, 8, ['KKK', ' K ', 'KKK']); at(g, 4, 3, ['ww', ' w', 'ww'][:3]); at(g, 3, 13, ['ii', 'i ', 'ii'][:3])
    body(g, top=22, start=8)
    for y in range(23, 32):
        for x in range(N):
            if g.c[y][x] == '3' and x % 4 == 0: g.c[y][x] = 'W'
    at(g, 11, 22, ['4WWW    WWW2', ' 4WWW  WWW2 ', '  44W  W22  ', '    3333    '])  # pajama collar
    at(g, 15, 25, ['W', ' ']); at(g, 15, 27, ['W'])
    head(g, 8, 2, [
        '   W33W33W3     ',
        '  33W33W33W3    ',
        ' 3W33W33W33W32  ',
        'W33W33W33W33W322',
        'WWWWWWWWWWWWWWVV',
        'hj HhhjhhhHjh hH',
        'HhhhhhhhhhhhhhhH',
    ])
    at(g, 22, 1, ['W33', '  3W', '   3WW', '   2WVw', '   WWVV', '    VV'])  # the cap's tail and pompom
    at(g, 6, 7, ['j', 'hj']); at(g, 24, 8, ['h', ' j'])  # bed-head tufts
    face(g, y=9, eyes='wink', mouth='open', rows={0: 'HSSSSSSSSSSSSssH',
        2: 'SSttSSSSSSSSSsst', 3: 'SSwKSSSSSSSSSsst', 4: 'SSKKSSSSSKKKKsst', 5: 'SStSSSStSSSSSsst',
        8: ' SSSSSKKKKSSsst ', 9: ' SSSSKrrrrKSsst ', 10: '  SSSSKKKKSSst  '})
    return g
