# Broker (counts as 2): a slick broker in front, phone to his ear, sly grin, pinstripes and a red tie; behind him his
# partner on the trading floor in glasses and a headset, mid-shout. Ticker tape curls across the top.
from lib import *
def draw():
    g = new()
    at(g, 4, 2, ['WV     ', 'KWV    ', ' VWK   ', '  KWV  ', '   VWWV'])  # ticker tape
    at(g, 11, 6, ['WV', 'KW', 'VK'])
    # behind, right: the partner
    body(g, top=19, cx=24, start=6, maxhalf=8, keys='3221')
    at(g, 22, 19, ['UUUU', ' UU ']); at(g, 23, 19, ['y'])
    head(g, 18, 3, [
        '    hhhh    ',
        '  hhjjhhhh  ',
        ' hjjhhhhhhH ',
        'hhhhhhhhhhhH',
    ])
    small(g, 18, 7, mouth='open', rows={0: 'hSSSSSSSShhH', 1: 'SStSSSSStSst', 2: 'SNNNNSNNNNst', 3: 'NNwKNNNwKNNt', 4: 'SNKKNSNKKNst', 6: ' SSKrrKSSst '})
    before = snap(g)
    # front, left: the Broker
    body(g, top=21, cx=10, start=8, maxhalf=11)
    for y in range(22, 32):
        for x in range(0, 21):
            if g.c[y][x] == '3' and x % 3 == 1: g.c[y][x] = '2'
    at(g, 6, 21, ['1WWWWWW1', '21WWWW12', '421WW124', '3421R243', '33421243', '334RR433'])
    at(g, 9, 21, ['RR', 'Rr', 'Rr', 'rr', 'rr', 'Rr', 'rr'])
    head(g, 3, 4, [
        '   HHHHHHHH   ',
        '  HhjjjjhhhHH ',
        ' HhjjjhHhhhhhH',
        'HhjjhhHhhhhhhH',
        'HhhhhHhhhhhhhH',
        'HSSSSSSSSSSssH',
        'SSSSSSSSSSSsst',
        'SHHHSSSSHHHsst',
        'SSwKSSSSSwKsst',
        'SSKKSSSSSKKsst',
        'SSSSSStSSSSsst',
        'SaaSSttSSSaast',
        'SSSSSSSSSSKsst',
        ' SSKwwwwwKsst ',
        ' SSSKKKKKSsst ',
        '  SSSSSSSsst  ',
        '   tssssst    ',
    ])
    at(g, 8, 21, ['ssss'])
    sticker(g, 0, 10, [' KK', 'KKK', 'KK ', 'KN ', 'KN ', 'KK ', 'KKK', ' KK'])  # phone handset at his ear
    at(g, 17, 11, ['t', 't'])
    gap_right(g, before)
    return g
