# Extra Shift: a factory hand pulling one more shift into the night. Flat cap with a lit headlamp, tired eyes with bags but a determined set mouth,
# a time card sticking out of the shirt pocket, a cup of coffee steam rising beside him, work shirt with a name patch.
from lib import *
def draw():
    g = new()
    at(g, 3, 10, [' i  ', '  i ', ' i  ', '  i ', ' i  '])  # steam from his coffee
    at(g, 2, 15, ['WWWWV', 'W333V', 'WWWWVV', 'WWWWV', ' VVV '])  # paper cup with a purple sleeve
    at(g, 7, 16, ['V', 'V'])
    body(g, top=22, start=8)
    at(g, 12, 22, ['21      12', ' 21    12 ', '  211112  '])  # open collar
    at(g, 18, 25, ['WKWKW', 'WWWWW', '22222', '22222', '11111'])  # time card in the pocket
    at(g, 8, 26, ['WWWW', 'WKKW'])  # name patch
    head(g, 8, 2, [
        '                ',
        '    1222222     ',
        '  12333333322   ',
        ' 1233344333221  ',
        '122333333332211 ',
        '1111111111111111',
        'HhhhhhhhhhhhhhhH',
    ])
    face(g, y=9, mouth='flat', rows={0: 'hSSSSSSSSSSSSssH', 5: 'SttSSSStSSttSsst', 7: 'SsSsSSSSSsSsSsst'})
    at(g, 7, 7, ['KKKKKKKKKKKKKKKKKK'])  # headlamp strap
    sticker(g, 13, 5, ['NMMMN', 'MGwGN', 'NGGgN', ' NNN '])  # the lamp
    for k in range(5):  # its beam reaching up and right into the dark
        at(g, 18 + k * 2, 5 - k, ['ii'[:2]]); at(g, 18 + k * 2, 6 - k, ['i'])
    return g
