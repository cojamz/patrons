# Yellow: harvest, food, growth.
from common import *

def peddler():  # travelling seller: knit cap, big pack on his back hung with a pan and a cup, bushy mustache
    g = doorway()
    g.put(3, 12, ['  OOOO', ' OOOOO', 'OOOOOO', 'OOOOOO', 'oOOOOO', 'oOOOOO', 'ooOOOO', 'ooooOO', 'ooooo'])
    g.put(23, 12, ['OOOO  ', 'OOOOO ', 'OOOOoo', 'OOOOoo', 'OOOOoo', 'OOOooo', 'OOoooo', 'Oooooo', ' oooo'])
    g.put(1, 16, ['  N', ' NNN', 'NMLMN', 'NMMMN', ' NNN'])
    g.put(27, 18, ['N', 'MN', 'LMN', 'MMN', 'NNN'])
    shoulders(g); neck(g)
    g.put(9, 22, ['oo', 'oo', ' oo', ' oo', ' oo', '  oo', '  oo', '  oo', '  oo', '  oo'])
    g.put(21, 22, ['oo', 'oo', 'oo', 'oo', 'oo', 'oo', 'oo', 'oo', 'oo', 'oo'])
    g.put(12, 22, ['RRqRRRRR', ' RRRRrR', '  RrR', '   R'])
    head(g)
    g.put(7, 1, ['      RqR         ',
                 '     RRRRR        ',
                 '   EEEEEEEEEE     ',
                 '  EEeEEeEEeEEE    ',
                 ' EEEeEEeEEeEEEe   ',
                 ' EEEeEEeEEeEEEeE  ',
                 ' eeeeeeeeeeeeeeee ',
                 ' eEeEeEeEeEeEeEee ',
                 ' Hh            hH '])
    g.put(10, 15, ['  HhhhH HhhhH ', ' Hhh hH Hh hhH'])
    mouth(g, 'grin'); g.put(9, 15, [' HhhhhhhhhhhhH', 'Hhh        hhH'])
    return g

def admirer():  # lovestruck: heart eyes, big blush, hair bow, little hearts floating up
    g = doorway(); shoulders(g); neck(g)
    g.put(11, 22, ['WW    WW', ' WWWWWW', '  WWWW'])
    head(g)
    g.put(6, 2, ['      HHHHHHHH      ',
                 '    HHhhjjjhhhHH    ',
                 '   HhhjjhhhhhhhhH   ',
                 '  HhjjhhhhhhhhhhhH  ',
                 '  HhjhhhhhhhhhhhhH  ',
                 '  HhhhhhhhHhhhhhhH  ',
                 '  HhhSSSSSSSShhhhH  ',
                 '  HhSSSSSSSSSSShhH  ',
                 '  Hh            hH  ',
                 '  Hh            hH  ',
                 '   H            H   '])
    g.put(20, 1, ['RR RR', 'RqRRR', 'RRRRr', ' RRr ', '  r  '])
    g.put(9, 11, ['    ', 'xx xx', 'xxxxx', ' xxx', '  x']); g.put(17, 11, ['    ', 'xx xx', 'xxxxx', ' xxx', '  x'])
    g.put(8, 15, ['aaa          aaa', ' aa          aa'])
    g.put(8, 15, ['aaa']); g.put(21, 15, ['aaa'])
    mouth(g, 'open')
    g.put(2, 9, [' x x', 'xxxxx', 'xxxxx', ' xxx', '  x']); g.put(26, 12, ['x x', 'xxx', ' x'])
    g.put(4, 4, ['x x', ' x'])
    return g

def gobetween():  # messenger: peaked cap with a badge, a letter in the band, a wink, satchel strap
    g = doorway(); shoulders(g); neck(g)
    g.put(12, 22, ['WW    WW', ' W    W'])
    for k in range(10): g.put(9 + k, 22 + k, ['oO'])
    g.put(13, 27, ['GG'])
    head(g)
    g.put(7, 2, ['    UUUUUUUUUU    ',
                 '  UyyUUUUUUUUUUu  ',
                 ' UyyUUUUUUUUUUUuu ',
                 ' UyUUUUUGGUUUUUuu ',
                 ' uuuuuuuGgguuuuuuu',
                 ' uuuuuuuuuuuuuuuuu',
                 '  DNNNNNNNNNNNNND ',
                 '    DDDDDDDDDDD   ',
                 ' Hh             hH'])
    g.put(20, 0, ['WWWWWW', 'WVWWVW', 'WWVVWW', 'WWWWWV'])
    g.put(17, 11, ['   ', 'SSS', 'KKK'])
    mouth(g, 'smirk')
    return g

def dyer():  # dyer: hair tied up in a cloth, dye-stained apron and a blue smudge on the cheek
    g = doorway(); shoulders(g); neck(g)
    g.put(10, 22, ['W', 'W', 'W']); g.put(21, 22, ['V', 'V', 'V'])
    g.put(10, 25, ['WWWWWWWWWWWV', 'WyyWWWWWxWWV', 'WyWWWzWWxxVV', 'WWWWzzzWWWVV', 'WxWWWzWWWyyV', 'xxxWWWWWWWyV', 'WxWWWWnnWWVV'])
    head(g)
    g.put(6, 1, ['        xx  yy      ',
                 '      xxxxyyyyy     ',
                 '     xqxxyyyyyyy    ',
                 '    xxxxyyyyyzzzz   ',
                 '   HxxxyyyyyzzzzzH  ',
                 '   HhhhhhhhhhhhhhH  ',
                 '  HhjjhhhhhhhhhhhhH ',
                 '  HhhhSSSSSSSSShhhH ',
                 '  Hh            hhH ',
                 '  Hh            hH  '])
    g.put(8, 1, ['nn']); g.put(6, 3, ['nn'])
    g.put(19, 15, ['yy', 'y'])
    mouth(g, 'smile')
    g.put(25, 14, [' y', 'y y', ' z', '  x'])
    return g

def latebloomer():  # an old couple, gray hair and glasses, flowers finally blooming around them
    g = doorway()
    body(g, 9, 21, half0=4, slope=2, maxhalf=7); body(g, 23, 21, half0=4, slope=2, maxhalf=7)
    g.put(7, 21, ['ss']); g.put(21, 21, ['ss'])
    g.put(7, 22, ['WW']); g.put(20, 22, ['G  G', ' GG'])
    small(g, 4, 9, 'smile'); small(g, 18, 9, 'smile')
    g.put(3, 6, ['   MMMMMM  ', ' MMLLLMMMMM', 'MLLMMMMMMMMN', 'MLM      MMN', 'ML        MN', 'M          N'])
    g.put(3, 12, ['M', 'M']); g.put(14, 12, ['N', 'N'])
    g.put(17, 6, ['  LLLLLLL  ', ' LLLLMLLLLM', 'LLLMMMMMMLMM', 'LM        ML', 'L          M', 'L          M', 'L          M', 'L          M', 'LL        MM', ' L        M'])
    g.put(4, 13, ['NNN NNN']); g.put(4, 14, ['N N NN N'])
    g.put(18, 4, [' x', 'xYx', ' x ']); g.put(22, 4, ['E'])
    g.put(1, 15, [' n', 'nYn', ' n ', ' E', ' E', 'EE']); g.put(28, 15, [' y', 'yYy', ' y ', ' E', ' E', ' EE'])
    g.put(13, 2, ['  x', ' xYx', '  x', '  E', ' E'])
    return g

def rainmaker():  # yellow sou'wester and slicker, face turned up to her own little rain cloud
    g = doorway(); shoulders(g); neck(g)
    for y in (25, 28): g.put(12, y, ['oNo']); g.put(18, y, ['oNo'])
    for y in range(23, 32): g.c[y][16] = '1'
    g.put(9, 21, ['44', '444', '4444']); g.put(20, 21, [' 22', '222', '2221'])
    head(g)
    g.put(8, 2, ['    33333333    ',
                 '  443333333332  ',
                 ' 44333333333322 ',
                 '4433333333333221',
                 '4333333333333221'])
    g.put(4, 7, ['4444443333333333332222',
                 '444 Hh         h2222211',
                 '     H           22211',
                 '                  2211',
                 '                  211',
                 '                   1'])
    eyes(g, 'up'); mouth(g, 'open')
    g.put(0, 1, ['   LLM   ', ' LLLLMLM ', 'LLLMMMMMN', ' NNNNNNN '])
    for (x, y) in [(2, 6), (5, 7), (3, 10), (6, 11), (4, 14)]:
        g.put(x, y, ['y', 'y'])
    return g

def pilgrim():  # pilgrim on the road: deep hood with a scallop shell, staff with a gourd, calm smile
    g = doorway()
    for y in range(3, 32): g.put(26, y, ['Oo'])
    g.put(25, 1, [' o', 'oOo']); g.put(24, 9, ['YYYY', 'YYYg', ' Yg'])
    g.put(25, 8, [' o'])
    shoulders(g)
    g.put(5, 2, ['      3333333333     ',
                 '    33344333333322   ',
                 '   3344333333333322  ',
                 '  33443333333333332  ',
                 '  3443            21 ',
                 '  343             21 ',
                 '  343             221',
                 '  343             221',
                 '  343             221',
                 '  343             221',
                 '  343             221',
                 '  343             221',
                 '  3443           2221',
                 '  33443         22221',
                 '  333443       222221',
                 '  3333344444442222221',
                 '  3333333333333222221'])
    head(g, x=8, y=4)
    g.put(8, 4, ['  444444444444  ', ' 44          44', '4              4'])
    eyes(g, 'normal', y=4); mouth(g, 'smile', y=4)
    g.put(14, 1, ['    '])
    g.put(5, 1, ['      ', ''])
    g.put(8, 19, ['                '])
    for y in range(22, 32):
        g.c[y][4] = '4'
    g.put(13, 23, [' WWWW ', 'WVWVWV', 'WVWVWV', ' WVWV ', '  VV  '])
    return g

def weaver():  # weaver: long braids tied with yarn, a woven headband, a ball of yarn with needles
    g = doorway(); shoulders(g); neck(g)
    g.put(9, 24, ['RxRxRxRxRxRxRx'])
    g.put(9, 25, ['xRxRxRxRxRxRxR'])
    head(g)
    g.put(6, 2, ['      HHHHHHHH      ',
                 '    HHhhjjjhhhHH    ',
                 '   HhhjjhhhhhhhhH   ',
                 '  HhjjhhhhhhhhhhhH  ',
                 '  HhjhhhhhhhhhhhhH  ',
                 '  xRzRyRxRzRyRxRzR  ',
                 '  RRRRRRRRRRRRRRRR  ',
                 '  HhSSSSSSSSSSSShH  ',
                 '  Hh            hH  '])
    for x0 in (6, 23):
        g.put(x0, 11, ['Hh', 'hH', 'Hh', 'hH', 'Hh', 'hH', 'Hh', 'hH', 'Hh', 'hH', 'Hh', 'hH', 'xx', 'Hh', 'h'])
    mouth(g, 'smile')
    g.put(1, 16, ['L    ', ' L   ', '  zzz', ' zzwzz', 'zzzzzz', 'zezzez', ' zzzz ', '  ee'])
    return g

def explorer():  # explorer: pith helmet, red neckerchief, sunburnt cheeks, grin, a compass on the strap
    g = doorway(); shoulders(g); vneck(g, '2', half=3, every=3, ledge='4', redge='1'); neck(g)
    g.put(12, 22, ['RRRRRRRR', ' RRqRRR', '  RrR', '   R'])
    g.put(21, 22, ['o', 'o', 'o', 'Mo', 'LNN', 'NyN', 'NNN'])
    head(g)
    g.put(5, 1, ['        WWWWWWWW      ',
                 '      WWWWWVVVVWV     ',
                 '     WWWWWWWWVVVVV    ',
                 '    WWWWWWWWWWVVVVV   ',
                 '    WWWWWWWWWWWVVVV   ',
                 '    OOOOOOOOOOOOOOO   ',
                 '  WWWWWWWWWWWWWWVVVVV ',
                 ' VVVVVVVVVVVVVVVVVVVVV',
                 '   Hh            hH   '])
    mouth(g, 'grin')
    g.put(9, 15, ['aaa']); g.put(20, 15, ['aaa'])
    return g

def toque(g, x, y):
    g.put(x, y, [' WWWWWWW ', 'WWWVWWWVV', 'WWWVWWWVV', ' WWVWWVV ', ' WWWWWWV ', ' VVVVVVV '])

def chefs():  # two chefs in tall toques and neckerchiefs, one with a big mustache
    g = doorway()
    body(g, 9, 21, half0=4, slope=2, maxhalf=7); body(g, 23, 21, half0=4, slope=2, maxhalf=7)
    for x0 in (9, 23):
        for y in (25, 28): g.c[y][x0 - 2] = 'W'; g.c[y][x0 + 1] = 'W'
        g.put(x0 - 3, 21, ['RRRRRR', ' RrrR', '  rr'])
    small(g, 4, 9, 'smile'); small(g, 18, 9, 'laugh')
    toque(g, 4, 3); toque(g, 19, 3)
    g.put(18, 16, ['HhhhhhhhhhH', 'Hh        hH'])
    g.put(18, 16, ['hHhh  hhHh'])
    return g

ENTRIES = [('yellow.peddler', 'Peddler', peddler), ('yellow.admirer', 'Admirer', admirer),
           ('yellow.gobetween', 'Go-Between', gobetween), ('yellow.dyer', 'Dyer', dyer),
           ('yellow.latebloomer', 'Late Bloomers', latebloomer), ('yellow.rainmaker', 'Rainmaker', rainmaker),
           ('yellow.pilgrim', 'Pilgrim', pilgrim), ('yellow.weaver', 'Weaver', weaver),
           ('yellow.explorer', 'Explorer', explorer), ('yellow.chefs', 'Chefs', chefs)]
