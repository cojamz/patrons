# Exporter (counts as 2): a sea captain in dress whites with a peaked cap, gold anchor badge, short beard and pipe;
# beside him his deckhand in a sailor's cap and striped shirt.
from lib import *
def draw():
    g = new()
    # behind, right: the deckhand
    body(g, top=20, cx=24, start=6, maxhalf=8, keys='3221')
    for y in range(21, 32, 2):
        for x in range(17, 32):
            if g.c[y][x] in '23': g.c[y][x] = 'u'
    at(g, 22, 20, ['uuuu', ' uu ']); at(g, 23, 20, ['RR'])
    head(g, 18, 3, [
        '  44333322  ',
        ' 4433333221 ',
        '433333333221',
        'uuuuuuuuuuuu',
    ])
    small(g, 18, 7, eyes='right', mouth='grin')
    before = snap(g)
    # front, left: the captain
    body(g, top=21, cx=10, start=8, maxhalf=11)
    at(g, 0, 22, [' GgGGg', 'GGGGGGg', 'gGgGgGg', 'g g g ']); at(g, 15, 22, ['GgGGg', 'GGGGGG', 'gGgGgG', ' g g g'])  # epaulettes
    at(g, 7, 21, ['1W2  2W1', '1WW22WW1', '11WWWW11', ' 1 1 1 1']); at(g, 8, 26, ['G  G', '    ', 'G  G', '    ', 'G  G'])
    head(g, 2, 2, [
        '    44333332    ',
        '  443333333332  ',
        ' 44333gGGg33322 ',
        '4433333gGg333221',
        '4433333g g333221',
        ' 11111111111111 ',
        '  DDDDDDDDDDDD  ',
        ' hSSSSSSSSSSssh ',
        ' hHHHSSSSHHHssH ',
        ' SSwKSSSSSwKsst ',
        ' SSKKSSSSSKKsst ',
        ' SSSSSStSSSSsst ',
        ' haaSSttSSSaash ',
        ' hhhHHHHHHHhhhH ',
        ' hhhhhKKKhhhhhH ',
        '  hhhhhhhhhhhH  ',
        '   hhhhhhhhhH   ',
        '    HhhhhhhH    ',
    ])
    at(g, 7, 3, ['  ', ]); g.c[6][9] = 'g'
    at(g, 1, 11, ['s', 's', 't'])
    at(g, 12, 16, ['OOOo', '  oOo', '   ooo'])  # pipe
    at(g, 15, 13, [' i', 'i ', ' w'])
    gap_right(g, before)
    return g
