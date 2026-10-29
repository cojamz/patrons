# Blue (market) members for the bluesilver sweep. Each d_<id tail>() returns a G.
from lib import *


def d_connoisseur():
    # Connoisseur: a silver-haired gent who knows the good stuff. Swept-back gray hair, one brow raised, a gold monocle
    # on a chain, a waxed gray mustache, a velvet jacket with sharp lapels over a red ascot, a pocket square.
    g = new()
    body(g)
    at(g, 11, 22, ['1WWqRRrWW1'])
    at(g, 10, 23, ['1 WWqRrWW 1']); at(g, 10, 24, ['1   qRr   1']); at(g, 9, 25, ['1    Rr    1'])
    at(g, 9, 26, ['1     r     1'][:1]); at(g, 8, 26, ['1']); at(g, 23, 26, ['1']); at(g, 8, 27, ['1']); at(g, 23, 27, ['1'])
    at(g, 15, 27, ['G', '', 'G', '', 'G'])
    at(g, 4, 27, ['qRq', 'RrR'])  # pocket square
    face(g, 8, 8, h=14)
    at(g, 7, 3, ['     LLLMMMMMM     ', '   LLLMMMMMMMMMN   ', '  LLMMMLMMMMMMMMNN ', ' LMMMLMMMMMMMMMMMNN',
                 ' LMMLMMMMMMMMMMMNNN', 'LMMSSSSSSSSSSSSSsNN', 'LMS              NN', 'LM               NN',
                 'MM               NN', 'M                 N'])
    at(g, 9, 10, ['MMMM']); at(g, 9, 11, ['M']); at(g, 18, 11, ['MMMN'])
    at(g, 10, 12, ['wK', 'KK'])
    at(g, 18, 12, ['wK', 'KK'])
    at(g, 17, 11, [' GGg']); at(g, 17, 12, ['G']); at(g, 20, 12, ['G', 'G']); at(g, 17, 13, ['G']); at(g, 18, 14, ['GG'])
    dot(g, [(21, 15), (21, 17), (22, 19), (22, 21)], 'g')
    dot(g, [(21, 16), (22, 18), (22, 20)], 'G')
    at(g, 15, 14, ['t', 'st'])
    at(g, 9, 16, ['aa']); at(g, 20, 16, ['a'])
    at(g, 10, 17, ['M          N', ' MLMMMMMMNN', '   NN  NN'])
    at(g, 13, 19, ['tKKKt'])
    return g


def _buddy_and_bags(g):
    pass


def d_shopaholic():
    # Shopaholic (counts 2): can't stop buying, and brought a shopping buddy. Right, in front: big curly hair,
    # sunglasses pushed up, a huge grin, gold hoops, bags on the shoulder. Left, beside: the buddy, auburn ponytail,
    # a delighted open smile, a little bag of her own.
    g = new()
    dot(g, [(25, 3), (6, 4), (16, 2)], 'w')
    # buddy (left, a touch lower)
    body(g, top=21, cx=7, start=4, grow=2, maxhalf=7)
    face(g, 2, 9, w=10, h=11, ear_row=3)
    at(g, 2, 5, ['   OOOOo  ', ' OOqOOOOOo', 'OOqOOOOOOoo', 'OOOOOOOOOoo', 'OOSSSSSSOoo', 'OO      oo'])
    at(g, 0, 8, ['  ', 'O', 'Oo'])
    at(g, 11, 4, ['qO', 'OOo', ' Oo', ' oo', '  o'])  # high ponytail
    at(g, 3, 11, ['tt  tt'])
    at(g, 3, 12, ['wK  wK', 'KK  KK'])
    at(g, 6, 14, ['t'])
    at(g, 2, 15, ['a      a', ' KKKKK', ' KWWWK', '  KrK'][:1]); at(g, 4, 15, ['KKKK', 'KrrK', ' KK'])
    at(g, 3, 20, ['WWWW'])
    at(g, 1, 24, ['  K K', ' xxxxx', ' qxxxxx', ' xxxxxx', ' xxxxxr', ' xxxxrr', ' rrrrrr'][:0])
    at(g, 1, 23, [' NNN', ' N N', 'EEEEE', 'EEEEe', 'EWWEe', 'EEEEe', 'eeeee'])
    # shopaholic (right, in front)
    body(g, top=22, cx=21, start=6, grow=3, maxhalf=10)
    face(g, 15, 9, w=13, h=13, ear_row=4)
    at(g, 13, 3, ['   h hh hh h  ', '  hhjhhjhhhhH ', ' hhjjhhhhhhhhH', 'hhjhhhhhhhhhhHH', 'hjhhhhhhhhhhhhHH',
                  'hhhjhhhhhhhhhhHH', 'hhh          HHH', 'hhh           HH', ' hh           HH', 'hhh           HH',
                  ' hh           HH', 'hhh           HH', ' h            H'])
    at(g, 16, 9, ['hhh    hhh'])
    at(g, 15, 5, ['DDDDLDDDD', 'DwDD DwDD'])
    at(g, 17, 10, ['tt   tt'])
    at(g, 17, 11, ['wK   wK', 'KK   KK'])
    at(g, 21, 13, ['t'])
    at(g, 16, 14, ['aa      a'])
    at(g, 17, 15, ['KKKKKKK', 'KWWWWWK', ' KrrrK', '  KKK'])
    at(g, 13, 15, ['G', 'GG', 'GG'])
    at(g, 24, 21, [' K  K', ' K  K', 'RRRRRR', 'qRRRRr', 'qRWWRr', 'RRRRRr', 'RRRRrr', 'RRRRrr', 'RRRRrr', 'rrrrrr'])
    at(g, 27, 23, ['  K', 'nnnn', 'Gnnn', 'nnnn', 'nnng', 'nnng', 'nngg'])
    at(g, 18, 22, ['WWWWW', ' WWW'])
    return g


def _copycat(g, x, y, flip):
    """A trendsetter's copycat: 8-wide head, the same pink swoop, shades pushed up on the hair a beat late."""
    face(g, x, y, w=8, h=10, ear_row=3)
    hair = ['  qqqqq  ', ' qWqqqqqr', 'qWqqqqqqr', 'qqqqqqqrr', 'qq     r ', 'q        ']
    if flip: hair = [r[::-1] for r in hair]
    at(g, x - (1 if not flip else 0), y - 3, hair)
    at(g, x + 1, y - 2, ['DDwDDD' if not flip else 'DwDDDD'])
    at(g, x + 1, y + 2, ['wK', 'KK']); at(g, x + 5, y + 2, ['wK', 'KK'])
    at(g, x + 1, y + 1, ['tt  tt'])
    at(g, x + 4, y + 4, ['t'])
    at(g, x + 2, y + 6, ['K  K', ' KK '])
    at(g, x, y + 5, ['a      a'[:8]])
    at(g, (x - 1) if not flip else (x + 8), y + 4, ['G', 'G'])


def d_trendsetter():
    # Trendsetter (counts 3): pink swoop, round black shades, a big gold hoop, chunky chain. Two copycats flank them,
    # same pink hair and hoops, shades pushed up on their heads.
    g = new()
    for x, y in [(5, 4), (26, 4)]: at(g, x - 1, y - 1, [' w ', 'www', ' w '])
    body(g, top=20, cx=6, start=3, grow=2, maxhalf=6)
    body(g, top=20, cx=26, start=3, grow=2, maxhalf=6)
    _copycat(g, 2, 10, False); _copycat(g, 22, 10, True)
    # the trendsetter, in the middle and a head taller
    body(g, top=20, cx=16, start=4, grow=3, maxhalf=8)
    face(g, 11, 7, w=10, h=13, ear_row=4)
    at(g, 9, 1, ['   qqqqqqq   ', '  qqWWqqqqqH ', ' qqWqqqqqqqHH', 'qqWqqqqqqqqrHH', 'qqqqqqqqqqrr H', 'qqqqqqqqrr  HH',
                 'qqqqqqrr     H', 'qqqqrr', 'qqqr', 'qqr', 'qr'])
    at(g, 20, 6, ['HH', 'H'])
    at(g, 11, 10, ['DDDDGDDDD', 'DwDDSDwDD', ' DD   DD '])
    at(g, 15, 13, ['t', 'tt'])
    at(g, 13, 16, ['SKKKK', ' SKK'])
    at(g, 21, 12, ['t', 'G', 'GG', 'G G', 'GG'])
    at(g, 11, 20, ['44', '43']); at(g, 19, 20, ['21', '21'])
    at(g, 12, 22, ['GgGgGgGg', ' gGgGgGg'])
    at(g, 15, 24, ['GG', 'gg'])
    return g


def _mannequin(g, x, y, hat):
    """A plain shop-window dummy: a smooth cream oval, two painted dot eyes, a neck post."""
    at(g, x, y, [' ' + hat * 4 + ' ', hat * 5 + hat.lower() if hat != 'U' else 'UUUUUu', 'WWWWVV', 'WKWWKV', 'qWWWqV', 'WWRRVV', ' WVVV ', '  WV', '  WV'])


def d_windowdresser():
    # Window Dresser (counts 3): dresses the shop window. Leading, front and center and big: a sharp bob with a blunt
    # fringe, pins between the lips, one eye squinting to judge the display, a tape measure round the neck, scissors in
    # the pocket. Set back at the edges: two plain mannequins on dress forms.
    g = new()
    for cx, keys in ((5, 'qRrr'), (27, 'yUuu')):
        body(g, top=19, cx=cx, start=2, grow=1, maxhalf=4, keys=keys)
    _mannequin(g, 2, 10, 'R'); _mannequin(g, 24, 10, 'U')
    # the dresser
    body(g, top=21, cx=16, start=6, grow=3, maxhalf=11)
    face(g, 9, 8, w=14, h=13, ear_row=4, ears=False)
    at(g, 8, 3, ['   HhhhhhhhhH   ', '  HhjjhhhhhhhH  ', ' Hhjjhhhhhhhhhh ', 'Hhjhhhhhhhhhhhhh', 'hjhhhhhhhhhhhhhH', 'hhhhhhhhhhhhhhhH',
                 'hh            HH', 'hh            HH', 'hh            HH', 'hh            HH', 'hh            HH', 'hhH          HHH',
                 'hHH          HHH'])
    at(g, 11, 11, ['tt   tttt'])
    at(g, 11, 12, ['wK'], ); at(g, 11, 13, ['KK'])
    at(g, 18, 13, ['KK'])
    at(g, 15, 14, ['t', 'st'])
    at(g, 10, 15, ['aa']); at(g, 20, 15, ['aa'])
    at(g, 13, 17, ['tKKt']); at(g, 17, 16, ['  LK']); at(g, 17, 17, ['LLLK'])
    at(g, 11, 21, ['Y', 'YK', 'Y', 'YK', 'Y', 'YK', 'Y', 'Y', 'Y', 'Y'])
    at(g, 20, 21, ['Y', 'KY', 'Y', 'KY', 'Y', 'KY', 'Y'])
    at(g, 12, 21, ['nn']); at(g, 18, 21, ['nn'])
    at(g, 22, 27, ['L L', ' L ', 'N N', 'N N'])
    at(g, 21, 29, ['22222'])
    return g


def d_critic():
    # Critic: never impressed. A floppy beret slumped to one side with a stem on top, heavy black square glasses, one
    # brow cocked above them, a sour downturned mouth, a goatee, a pencil behind the ear, a notebook in the pocket.
    g = new()
    body(g)
    at(g, 11, 21, ['4333333321', '4433333221'])
    at(g, 20, 25, ['WWWW', 'WKKV', 'WWWV', 'WKKV', 'WWWV'])
    face(g, 8, 9, h=12)
    at(g, 8, 9, ['HhhhhhhhhhhhhhhH', 'Hh            HH', 'H              H'])
    at(g, 6, 1, ['        2       ', '        1       ', '    2233333322   ', '  2343333333333221', ' 23433333333333333221',
                 '2333333333333333333221', '2333333333333333333332', ' 122222222222222222211', '                  211'])
    at(g, 9, 10, ['KKK']); at(g, 18, 9, ['  K', ' KK', 'K'][:0])
    at(g, 9, 11, ['KKKKKK', 'KwwSSK', 'KSKKSK', 'KKKKKK']); at(g, 17, 11, ['KKKKKK', 'KwwSSK', 'KSKKSK', 'KKKKKK'])
    at(g, 15, 12, ['KK'])
    at(g, 18, 9, ['tttt'][:0])
    at(g, 15, 15, ['t', 'st'])
    at(g, 13, 18, [' KKKKK', 'K     K'])
    at(g, 14, 20, ['HHHH', ' HH'])
    at(g, 24, 10, ['  Y', ' Yg', 'Yg ', 'K  '])
    return g


def d_doorman():
    # Doorman: a peaked cap with gold braid and badge, bushy mustache, warm grin, gold epaulettes and two rows of
    # brass buttons up a high collar.
    g = new()
    body(g)
    at(g, 1, 22, [' GGGGG', 'GgGgGgG', 'g g g g'][:0])
    at(g, 3, 23, ['GGGGG', 'GgGgg', 'g g g']); at(g, 24, 23, ['GGGGG', 'GgGgg', 'g g g'])
    at(g, 11, 21, ['GGGGGGGGGG', '4333333332', '  G    G', '', '  G    G', '', '  G    G', '', '  G    G'])
    at(g, 15, 22, ['11', '11', '11', '11', '11', '11', '11', '11', '11', '11'])
    face(g, 8, 9, h=12)
    at(g, 8, 3, ['   22222222221   ', ' 2333333333333221', '234333333G33333221', '233333333gG3333221',
                 '23333333GGG333221 ', 'GGGGGGGGGGGGGGGGgg', 'ggggggggggggggggg', ' DDDDDDDDDDDDDDDD', '  DDDDDDDDDDDDDD'][:9])
    at(g, 7, 3, ['   22222222221   ', '  2333333333332211', ' 234333333G3333221', ' 233333333gG333321',
                 ' 2333333GGGG333321', 'GGGGGGGGGGGGGGGGGGg', 'gggggggggggggggggg', ' DDDDDDDDDDDDDDDD', '  DwDDDDDDDDDDDD'])
    at(g, 7, 12, ['H'] * 0)
    at(g, 10, 11, ['HHH', '', ' wK', ' KK']); at(g, 18, 11, ['HHH', '', 'wK', 'KK'])
    at(g, 10, 12, ['    ']); at(g, 18, 12, ['   '])
    at(g, 15, 14, ['t', 'st'])
    at(g, 9, 16, ['aa'])
    at(g, 20, 16, ['aa'])
    at(g, 11, 16, ['  HHHHHHHH', ' HhhhhHHhhH', ' Hh  KKK HH'][:2])
    at(g, 13, 18, ['KWWWWK', ' KKKK'])
    return g


def d_patroness():
    # Patroness: grand lady of the shop. A wide-brimmed hat with a curling ostrich plume and a red band, bright lashed
    # eyes, red lips, a beauty mark, pearl drops at the ears, a pearl choker, a fur-trimmed neckline.
    g = new()
    body(g)
    at(g, 4, 22, ['WWVV', 'WWWWV', 'WVWWWV', 'WWWVWWV'])
    at(g, 22, 22, ['VWWV', 'WWVWV', 'WWWVWV', 'VWWWVWV'])
    at(g, 6, 26, ['WVWWVV']); at(g, 21, 26, ['WWVWVV'])
    face(g, 8, 9, h=13)
    at(g, 6, 9, ['hhhhhSSSSSShhhhhhH', 'hjhhSSSSSSSSSShhHH', 'jhh            hHH', 'hjh            HhH', 'jh              H',
                 'h'])
    at(g, 10, 2, ['   223333322', ' 2343333333221', '234333333333321', 'RRqRRRRRRRRRRrr'])
    at(g, 3, 6, ['  2444444444444444444421', '444444444444444444444421', ' 11222222222222222222111'])
    at(g, 20, 0, ['     WW', '   WWWVW', '  WWV  W', ' WWV', 'WWV', 'WV'])
    at(g, 24, 4, ['VW'])
    at(g, 10, 11, ['HH      HH'])
    at(g, 10, 12, ['wK      wK', 'KK      KK'])
    at(g, 9, 12, ['K']); at(g, 20, 12, ['K'])
    at(g, 15, 14, ['t', 'st'])
    at(g, 9, 15, ['aa']); at(g, 21, 15, ['aa'])
    dot(g, [(20, 16)], 'K')
    at(g, 13, 18, ['qRRRRr', ' rRRr'])
    at(g, 7, 12, ['s', 's', 't', 'W', 'L']); at(g, 24, 12, ['t', 't', 't', 'W', 'L'])
    at(g, 12, 22, ['LWLWLWLW']); at(g, 15, 23, ['WL'])
    return g


def d_plusone():
    # Plus-One (counts 2): brought along to the party. On the left the date: a high bun, gold drop earrings, red lips,
    # a pendant at a sweetheart neckline. On the right the guy: neat side part, tux, bow tie. Confetti in the air.
    g = new()
    for x, y in [(5, 4), (26, 3), (3, 12), (28, 11), (16, 2), (9, 2), (22, 2)]: dot(g, [(x, y)], 'xyzn'[(x + y) % 4])
    # her (left, a touch higher)
    body(g, top=21, cx=8, start=4, grow=2, maxhalf=7, keys='qRrr')
    face(g, 3, 8, w=11, h=11, ear_row=3)
    at(g, 5, 1, [' HhhH', 'HhjjhH', 'HhjhhH', ' HHHH'])
    at(g, 2, 5, ['  HhhhhhhhH  ', ' HhjjhhhhhhH ', 'HhjhhhhhhhhHH', 'hjhSSSSSSShHH', 'hh SSSSSS  HH', 'h          H'])
    at(g, 4, 10, ['tt   tt'])
    at(g, 4, 11, ['wK   wK', 'KK   KK'])
    at(g, 7, 13, ['t'])
    at(g, 4, 14, ['a     a'])
    at(g, 6, 16, ['qRr'])
    at(g, 2, 13, ['G', 'G']); at(g, 14, 13, ['G', 'G'])
    at(g, 5, 19, ['SSSSSS', ' SSSS', '  GG'])
    # him (right)
    body(g, top=22, cx=22, start=5, grow=3, maxhalf=9)
    face(g, 17, 9, w=11, h=11, ear_row=3)
    at(g, 16, 5, ['  HHhhhhhH  ', ' Hhjjjhhhhhh ', 'HhjjhhhhhhhHH', 'hhhhhhHhhhhHH', 'hhSSSSShhhhHH', 'Hh        HH'])
    at(g, 18, 11, ['tt   tt'])
    at(g, 18, 12, ['wK   wK', 'KK   KK'])
    at(g, 21, 14, ['t'])
    at(g, 18, 15, ['a       '[:1]]); at(g, 25, 15, ['a'])
    at(g, 19, 16, ['K   K', ' KKK'])
    at(g, 18, 22, [' WWWWWW', '1WKKKKW1', '11WWWW11', ' 11WW11', '  1WW1', '  1WK1', '  1WW1', '  1WK1', '  1WW1', '  1WW1'])
    at(g, 19, 23, ['KKwKKK'][:0])
    at(g, 16, 22, ['11', '111', '1111', '11111'])
    at(g, 26, 22, ['11', '111', '1111', '11111'][::1])
    return g


def d_regular():
    # Regular: here every day. A ribbed beanie with a pompom, a full beard, crinkled happy eyes, a plaid flannel with
    # the collar open, a pen clipped in the pocket.
    g = new()
    body(g, keys='qRrr')
    for y in range(22, 32):
        for x in range(1, 31):
            if g.c[y][x] in 'qRr' and (x % 4 == 0 or y % 4 == 1): g.c[y][x] = {'q': 'R', 'R': 'r', 'r': 'K'}[g.c[y][x]]
    at(g, 10, 22, ['qRRR', ' qRR', '  qR']); at(g, 18, 22, ['RRrr', 'Rrr', 'rr'])
    at(g, 19, 26, ['rrrr', 'RRRr', 'RRRr']); at(g, 20, 25, ['U', 'U'])
    face(g, 8, 9, h=12)
    at(g, 7, 3, ['     3333333       ', '   43333333333     ', '  4333333333333321 ', ' 433333333333333221',
                 ' 433333333333333221', '4444444444444444321', '4343434343434343221'])
    at(g, 14, 1, [' WW ', 'WWVV', ' VV '])
    at(g, 7, 10, ['H', 'H', 'h', 'h']); at(g, 24, 10, ['H', 'H', 'H', 'H'])
    at(g, 10, 11, ['tttt']); at(g, 18, 11, ['tttt'])
    at(g, 10, 12, ['wKK', 'tSS']); at(g, 18, 12, ['wKK', 'tSS'])
    at(g, 15, 14, ['t', 'st'])
    at(g, 9, 15, ['aa']); at(g, 21, 15, ['aa'])
    at(g, 8, 15, ['h', 'hh', 'hhhh      hhhhH', 'hhhhhhhhhhhhhhhH', ' hhhhhhhhhhhhhH', '  hhhhhhhhhhHH', '   hhhhhhhhHH', '    HhhhhHH'])
    at(g, 23, 15, ['H', 'HH'])
    at(g, 12, 17, ['jjhhhhjj'])
    at(g, 13, 18, ['KWWWWK', ' KKKK'])
    at(g, 12, 18, ['h']); at(g, 19, 18, ['h'])
    return g


def d_restocker():
    # Restocker: clears the shelves and refills them. A ball cap, pencil behind the ear, determined grin, a brown work
    # apron with a box cutter and a name tag, a small taped stack of boxes low in the doorway beside the shoulder.
    g = new()
    at(g, 2, 14, ['OOOo', 'OWWo', 'oooo', 'OOOo', 'OOOo', 'OWWo', 'oooo'])
    body(g)
    at(g, 9, 24, ['OOOOOOOOOOOOOO', 'OOOOOOOOOOOOOo', 'OOOOOOOOOOOOOo', 'OOOOOOOOOOOOOo', 'OOOOOOOOOOOOOo',
                  'OOOOOOOOOOOOoo', 'OOOOOOOOOOOOoo', 'OOOOOOOOOOOOoo'])
    at(g, 10, 22, ['o', 'o']); at(g, 21, 22, ['o', 'o'])
    at(g, 11, 26, ['WWWW', 'VVVV'])
    at(g, 18, 26, ['LLN', 'YYY', 'YYg'])
    face(g, 8, 9, h=13)
    at(g, 7, 2, ['    22222222      ', '  2343333333321   ', ' 234333333333321  ', ' 2333333W33333221 ',
                 ' 233333WWW3333221 ', '2333333333333332211', '1111111111111111111', '        1222222221111',
                 'hh              Hh'])
    at(g, 8, 9, ['hSSSSSSSSSSSSSH'])
    at(g, 10, 11, ['ttt', 'wK', 'KK']); at(g, 18, 11, ['ttt', 'wK', 'KK'])
    at(g, 15, 14, ['t', 'st'])
    at(g, 9, 15, ['aa']); at(g, 21, 15, ['aa'])
    at(g, 13, 17, ['KKKKKK', 'KWWWWK', ' KKKK'])
    at(g, 24, 9, ['  Y', ' Yg', 'Yg', 'K'])
    return g


def d_snob():
    # Snob: nose in the air. A tall chignon, chin up so you see under the nose, heavy half-shut lids, high arched brows,
    # a sneer pulled to one side, a gold lorgnette raised to one eye, an ermine stole (white with black tail tips).
    g = new()
    body(g)
    at(g, 2, 20, ['    WWV            VWWW   ', '  WWWWVWW        WWVWWWV ', ' WWVWKWWWV      WWWKWVWWWV', 'WVWWWVWWWWV  VWWWVWWWVKWWV',
                  ' WWKWWWWWVVWWWVWWWKWWWVVV', '   VWWVWWKWWWVWWWVWV', '      VVWWWVVWVV'])
    at(g, 14, 25, ['RqR', 'RWR', 'rRr'])
    face(g, 8, 10, h=11)
    at(g, 11, 0, [' HhhhH ', 'HhjjhhH', 'HhjhhhH', 'HhhhhHH', ' HHHHH '])
    at(g, 7, 5, ['   HHhhhhhhhhhH   ', '  Hhjjjhhhhhhhhh  ', ' Hhjjhhhhhhhhhhhh ', 'Hhjhhhhhhhhhhhhhhh', 'hhjSSSSSSSSSSShhHH',
                 'hhSSSSSSSSSSSSSShH', 'hh              HH', 'hh              HH', 'h                H'])
    at(g, 9, 10, [' KKK    KKK'])  # high arched brows
    at(g, 9, 9, ['  ', '']); 
    at(g, 10, 12, ['KKK', 'tK']); at(g, 18, 12, ['KKK', 'tK'])  # heavy lids, looking down the nose
    at(g, 14, 14, ['sSSs', 'tKKt'])  # upturned nose, nostrils showing
    at(g, 9, 16, ['aa']); at(g, 21, 16, ['aa'])
    at(g, 15, 18, ['rRRK'])
    at(g, 17, 11, [' gGGg', 'G    G', 'g    g', ' gGGg', '     g', '      g', '      g'][:0])
    at(g, 17, 11, ['GGGGG']); at(g, 17, 12, ['G']); at(g, 21, 12, ['G', 'G']); at(g, 17, 13, ['G']); at(g, 17, 14, ['GGGGg'])
    at(g, 22, 15, ['g', ' g', ' g', ' G', ' G'])  # lorgnette handle
    at(g, 7, 14, ['s', 's', 'L']); at(g, 24, 14, ['t', 't'])
    return g


def d_windowshopper():
    # Window Shopper: nose to the glass, looking at everything. A knit hat with a pompom, a long striped scarf, eyes
    # cut sideways toward the shop, an "ooh" mouth, cold-pink cheeks, a price tag pinned to the hat, glare on the glass.
    g = new()
    for k, (x, y) in enumerate([(4, 13), (5, 12), (6, 11), (7, 10), (3, 16), (4, 15), (5, 14), (25, 9), (26, 8), (27, 7),
                                (26, 12), (27, 11), (28, 10)]):
        if g.c[y][x] == 'b': g.c[y][x] = 'i'
    body(g)
    at(g, 8, 21, ['RRWWRRWWRRWWRRWr', 'qRWWRRWWRRWWRRWWr', ' RRWWRRWWRRWWRRWr'])
    at(g, 18, 24, ['RR', 'WW', 'RR', 'WW', 'RR', 'Wr', 'K Kr'])
    face(g, 8, 9, h=12)
    at(g, 7, 2, ['      W           ', '     WWV          ', '      33333       ', '   4333333333     ', '  433333333333321 ',
                 ' 43333333333333321', ' 4343434343434343221', '4343434343434343221'])
    at(g, 6, 2, ['        WW', '       WWVV', '        VV'])
    at(g, 20, 4, ['WWW', 'WKW', 'WWV', ' K'])
    at(g, 8, 10, ['hhh            hh', 'hh              H'])
    at(g, 10, 11, ['tt      tt'])
    at(g, 10, 12, ['SwK     SwK'[:3]]); at(g, 10, 12, ['wKK']); at(g, 18, 12, ['wKK'])
    at(g, 10, 13, ['SKK']); at(g, 18, 13, ['SKK'])
    at(g, 15, 15, ['t', 'st'])
    at(g, 9, 15, ['aaa']); at(g, 20, 15, ['aaa'])
    at(g, 15, 17, ['KK', 'KK'])
    # palms pressed flat on the glass, fingers up
    hand = ['S S S', 'SSSSs', 'SSSSs', 'SSSst', ' SSt', ' 34', ' 34']
    at(g, 2, 15, hand); at(g, 25, 15, [r[::-1].replace('4', '#').replace('3', '4').replace('#', '2') for r in hand])
    at(g, 25, 15, ['S S S', 'sSSSS', 'sSSSS', 'tsSSS', ' tSS ', '  21', '  21'])
    return g
