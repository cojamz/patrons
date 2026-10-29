# Silver members for the bluesilver sweep. Each d_<id tail>() returns a G.
from lib import *


def d_benefactor():
    # Benefactor: a kindly old dear who hands silver round. Soft white curls, smiling closed eyes, laugh lines, a pearl
    # strand and a gold brooch on a draped shawl, silver coins tumbling off to one side.
    g = new()
    for x, y in [(24, 11), (26, 15), (23, 17)]:
        at(g, x, y, [' MM ', 'MLLN', 'MLwN' if y != 15 else 'MwLN', ' NN '])
    body(g)
    # shawl: a darker drape crossing at the chest with a fringe
    for y in range(23, 32):
        for x in range(1, 31):
            d = abs(x - 16)
            if g.c[y][x] in '4321' and d >= 5 + (y - 23) // 3 and d <= 9 + (y - 23): g.c[y][x] = {'4': '3', '3': '2', '2': '1', '1': '1'}[g.c[y][x]]
    for x in range(4, 28, 2):
        if g.c[31][x] != '.': g.c[31][x] = '4'
    at(g, 11, 22, ['LWLWLWLWLW', ' WLWLWLWL'])
    at(g, 14, 25, ['GGg', 'GRg', 'ggg'])
    face(g, 8, 9, h=13)
    at(g, 6, 2, ['    WWWWWWWWW     ', '  WWWWVWWWWWWVV   ', ' WWVWWWWVWWWWWVV  ', 'WWWWWVWWWWVWWWWVV ', 'WVWWWWWWWVWWWWWVVV',
                 'WWWVWWWWWWWWVWWVVV', 'WWWWVWWWWWVWWWWWVV', 'WWW WSSSSSSSS WWVV', 'WVW            VVV',
                 'WWV            WVV', ' WV            VV', ' WW            VV', '  V            V'])
    at(g, 10, 11, ['ttt     ttt'])
    at(g, 9, 12, [' KKK    KKK', 'K   K  K   K'])
    at(g, 9, 14, ['t']); at(g, 22, 14, ['t'])
    at(g, 15, 14, ['t', 'st'])
    at(g, 9, 15, ['aaa']); at(g, 20, 15, ['aaa'])
    at(g, 12, 17, ['tK    Kt', ' tKKKKt'])
    at(g, 10, 18, ['t']); at(g, 21, 18, ['t'])
    return g


def d_gala():
    # Debutante: her first ball. Ringlets piled high and falling to the shoulders, a tall sparkling tiara with a red
    # jewel, long lashes, a bashful smile, flushed cheeks, drop earrings, a pearl necklace, an off-shoulder gown with
    # puffed white sleeves and a rose corsage. Sparkles in the air.
    g = new()
    for x, y in [(5, 7), (26, 5), (27, 13)]: at(g, x - 1, y - 1, [' w ', 'wLw', ' w '])
    body(g, top=23, start=10, grow=3)
    at(g, 1, 22, ['  WWW', ' WWWWV', 'WWWWVV', 'WWWVV', ' VVV'][:0])
    at(g, 2, 23, [' WWWV', 'WWWWVV', 'WWWVVV', ' VVVV']); at(g, 25, 23, ['WWWV', 'WWWVV', 'WWVVV', 'VVVV'])
    at(g, 8, 22, ['SSSSSSSSSSSSSSst', ' SSSSSSSSSSSSsst', '  4sSSSSSSSSst2', '  44 sSSSSst 22', '  443  sst  322'])
    at(g, 11, 22, ['LWLWLWLWLW', '    L']); at(g, 15, 24, ['LwL', ' L'])
    at(g, 21, 26, ['qR', 'RrE', ' e'])
    face(g, 8, 9, h=13)
    at(g, 6, 5, ['  hhjhhhhhhhhhhH  ', ' hjjhhhhhhhhhhhhHH', 'hjhhhSSSSSSSSShhhH', 'hhhSSSSSSSSSSSSShH', 'jh              hH',
                 'hh              HH', 'jh              hH', 'hH              Hh', 'jh              hH', 'hH              Hh',
                 'jh              hH', 'h                H', 'j                h', 'h                H'])
    at(g, 4, 11, ['jh', 'hH', 'jh', 'hH', 'jh', 'hH', ' h']); at(g, 25, 11, ['hH', 'Hh', 'hH', 'Hh', 'hH', 'Hh', 'H'])
    # tiara
    at(g, 10, 1, ['     w', '  L  L  L', ' LwL LxL LwL', 'LLLLLLLLLLLL', 'NMMNMMMMNMMN'][:0])
    at(g, 10, 1, ['     LL', '  L  xL  L', ' LwL LL LwL', 'LLLLLLLLLLLL', 'MMNMMNNMMNMM'])
    at(g, 15, 0, ['w'])
    at(g, 10, 11, ['tt      tt'])
    at(g, 9, 12, ['KwK']); at(g, 18, 12, ['wKK'])
    at(g, 10, 13, ['KK']); at(g, 18, 13, ['KK'])
    at(g, 15, 14, ['t', 'st'])
    at(g, 9, 15, ['aaa']); at(g, 20, 15, ['aaa'])
    at(g, 13, 17, ['K    K', ' qRRr'])
    at(g, 7, 15, ['L', 'w', 'L']); at(g, 24, 15, ['L', 'w', 'L'])
    return g


def d_grandhost():
    # Grand Host: throws the party. A big jolly bald man with gray side tufts, a curled handlebar mustache, rosy cheeks,
    # a laugh; tux with satin lapels, white tie, a red carnation. Two champagne flutes clink above his shoulders
    # (double the silver), bubbles rising.
    g = new()
    flute = ['LwLL', 'LGGL', 'LGwL', 'LGGL', ' LL', ' N', ' N', 'LLN']
    at(g, 3, 8, flute); at(g, 25, 8, flute)
    dot(g, [(5, 6), (4, 4), (26, 6), (27, 4), (16, 2)], 'w')
    at(g, 7, 6, ['w']); at(g, 24, 6, ['w'])
    body(g, start=9)
    at(g, 11, 22, ['4W', '44W', '443W', '4433W', ' 433W', '  43W'])
    at(g, 18, 22, ['W1', 'W22', 'W221', 'W2221', 'W221', 'W21'])
    at(g, 12, 22, ['  WWWW', '  WWW', '  WWW', '  WWW', '  WWW', '  WWW'])
    at(g, 12, 23, ['WWWWWWW', '  WKW', '  WWW', '  WKW', '  WWW', '  WKW'])
    at(g, 13, 22, ['WWWWW'])
    at(g, 7, 25, ['qR', 'Rr', ' e'])
    face(g, 8, 7, w=16, h=15, ear_row=6)
    at(g, 11, 5, ['SSSSSSSSss']); at(g, 9, 6, ['SSSSSSSSSSSSsst'])
    at(g, 12, 5, ['ww']); at(g, 10, 6, ['w'])
    at(g, 7, 10, ['M', 'LM', 'MM', 'M']); at(g, 23, 10, [' N', 'MN', 'NN', ' N'])
    at(g, 10, 12, [' KK    KK', 'K  K  K  K'])
    at(g, 15, 14, ['t', 'st'])
    at(g, 9, 14, ['aa']); at(g, 21, 14, ['aa'])
    at(g, 9, 15, ['H            H', 'HHhhhhhhhhhhHH', ' HHH      HHH'])
    at(g, 12, 18, ['KKKKKKKK', 'KWWWWWWK', ' KrrrrK', '  KKKK'])
    return g


def d_guest():
    # Guest: just arrived, delighted to be here. A neat side part with a cowlick, eyebrows up, a polite open smile, a
    # red "hello" name sticker on the lapel, a wrapped present with a bow tucked under one arm.
    g = new()
    body(g)
    at(g, 10, 22, ['4W', '44W', '443W', '4433W']); at(g, 19, 22, ['W2', 'W21', 'W221', 'W2221'])
    at(g, 12, 22, ['WWWWWWW', ' WWWWW', '  RRr', '  RRr', '  RRr', '   r'])
    at(g, 5, 25, ['RRRRR', 'WKKKW', 'WWWWW', 'VVVVV'])  # hello sticker
    at(g, 22, 23, ['   y y', '    y', 'UUUyUUu', 'UUUyUUu', 'yyyyyyy', 'UUUyUuu', 'UUUyUuu', 'uuuyuuu'])
    face(g, 8, 9, h=13)
    at(g, 7, 3, ['        H  ', '    HHHhhhHH      ', '  HhhjjjhhhhhhHH  ', ' HhjjjhhhhhhhhhhH ', ' hjhhhhhhhhhhhhhHH',
                 'Hhhhhhhhhhh hhhhhHH', 'hhhhhhhhhhSSShhhhHH', 'hhSSSSSSSSSSSSSShHH', 'hh              HH', 'H                H'])
    at(g, 10, 10, ['tttt    tttt'][:0]); at(g, 10, 10, ['ttt', '']); at(g, 19, 10, ['ttt'])
    at(g, 10, 12, ['wK', 'KK']); at(g, 18, 12, ['wK', 'KK'])
    at(g, 15, 14, ['t', 'st'])
    at(g, 9, 15, ['aa']); at(g, 21, 15, ['aa'])
    at(g, 12, 17, ['KKKKKKKK', ' KWWWWK', '  KrrK'])
    return g


def d_heir():
    # Heir: born to it. A floppy golden fringe, bored half-lidded eyes, a pout, a ruffled cravat, a red sash across the
    # chest with a gold medal, a signet-gold button row.
    g = new()
    body(g)
    for y in range(22, 32):
        x = 8 + (y - 22) * 2
        for dx in range(3):
            if 0 <= x + dx < 32 and g.c[y][x + dx] != '.': g.c[y][x + dx] = 'R' if dx < 2 else 'r'
    at(g, 13, 21, ['WWWWWW', 'WVWWVW', ' WVVW', '  WV'])
    at(g, 22, 24, ['GGG', 'GRG', 'ggg', ' R', ' r'])
    face(g, 8, 9, h=13)
    at(g, 6, 3, ['     YYYYYYYY      ', '   YYGGYYYYYYYg    ', '  YGGYYYYYYYYYYgg  ', ' YGYYYYYYYYYYYYYYgg ', 'YGYYYGYYYYYYYYYYYgg',
                 'YYYYGYYYYYYYYYYYYgg', 'YYGYYYYYYYYSSSYYYgg', 'YYYYYYSSSSSSSSSSYgg', 'YY YYS          Ygg', 'Yg  Y            gg',
                 'Yg               g', ' g'])
    at(g, 10, 11, ['tt'][:0])
    at(g, 10, 12, ['KKK     KKK', 'wKK     wKK'][:1]); at(g, 10, 13, ['tKK     tKK'])
    at(g, 10, 12, ['ttt']); at(g, 18, 12, ['ttt'])
    at(g, 10, 13, ['KK']); at(g, 18, 13, ['KK']); dot(g, [(10, 13), (18, 13)], 'w')
    at(g, 15, 14, ['t', 'st'])
    at(g, 9, 15, ['a']); at(g, 22, 15, ['a'])
    at(g, 13, 17, ['  ttt', ' qRRRq', '  rr'][1:])
    return g


def d_majordomo():
    # Majordomo: runs the house. Hair parted dead center, gray at the temples, long sideburns, one stern brow, a level
    # mouth; wing collar, black bow tie, a tailcoat, a ring of house keys at the lapel, a silver cloche held up beside.
    g = new()
    at(g, 1, 9, ['   LL  ', '  LwLL ', ' LwLLLM', 'LLLLLLMN', 'LMMMMMNN', 'NNNNNNNN'])
    at(g, 4, 8, ['M'])
    body(g)
    at(g, 9, 22, ['11', '111', '1111', '11111', '111111', '1111111', '1111111', '111111', '11111', '1111'])
    at(g, 19, 22, ['  11', ' 111', '1111', '1111', '1111', '1111', '1111', '1111', '1111', '1111'])
    at(g, 11, 22, ['WWWWWWWWWW', 'WVKKWWKKVW', ' WKKKKKKW', '  WWKKWW', '   WWWW', '   WWWW', '   WKWW', '   WWWW', '   WKWW', '   WWWW'])
    at(g, 11, 22, ['WWWWWWWWWW', 'WVKKKKKKVW', ' WKKwKKKW', '  WWWWWW'])
    at(g, 22, 25, [' LL', 'L  L', 'L  L', ' LL', ' M', ' MN'])
    face(g, 8, 9, h=13)
    at(g, 7, 3, ['    HHHHHHHHHH    ', '  HHhhhhhHhhhhHH  ', ' HhhjjhhhHhhhhhhH ', ' hjjhhhhhHHhhhhhHH', 'Hhjhhhhhh hhhhhhhH',
                 'MhhSSSSSSSSSSSShhM', 'MM              MM', 'MM              NN', 'hh              HH', 'hh              HH',
                 'hh              HH', 'H                H'])
    at(g, 10, 11, ['HHHH']); at(g, 18, 11, ['HHH'])
    at(g, 18, 10, ['  H'])
    at(g, 10, 12, ['wK', 'KK']); at(g, 18, 12, ['wK', 'KK'])
    at(g, 15, 14, ['t', 'st'])
    at(g, 13, 18, ['tKKKKt'])
    return g


def _page(g, x, y, w, mouth, extra=None):
    """A retinue page: pillbox cap with a gold button and chin strap, neat hair."""
    face(g, x, y, w=w, h=10, ear_row=3)
    at(g, x, y - 3, [' ' + 'R' * (w - 2), 'qR' + 'R' * (w - 4) + 'rr', 'R' * (w - 1) + 'r', 'g' * w][:4])
    g.c[y - 2][x + w // 2] = 'G'
    at(g, x, y, ['h' + 'h' * (w - 2) + 'H', 'h' + ' ' * (w - 2) + 'H'])
    for j in range(1, 8): pass
    ex = x + 1 + (w - 8) // 2
    at(g, ex, y + 2, ['wK', 'KK']); at(g, ex + 4, y + 2, ['wK', 'KK'])
    g.c[y + 4][x + w // 2 - (0 if w % 2 else 1)] = 't'
    at(g, x + w // 2 - 2, y + 6, mouth)
    if extra: extra(g)


def d_retinue():
    # Retinue (counts 3): an entourage of three pages in red pillbox caps and silver jackets with gold buttons; the
    # middle one stands a head taller.
    g = new()
    for cx in (6, 26):
        body(g, top=20, cx=cx, start=3, grow=2, maxhalf=6)
    _page(g, 2, 11, 8, ['K  K', ' KK '])
    _page(g, 22, 11, 8, ['KKKK'], lambda g: at(g, 23, 16, ['a', '', ]) or at(g, 28, 16, ['a']))
    body(g, top=19, cx=16, start=4, grow=3, maxhalf=8)
    _page(g, 11, 8, 10, ['HHHH', ' KK '])
    for x in (16, 15):
        for y in (22, 25, 28, 31): pass
    dot(g, [(14, 22), (14, 25), (14, 28), (17, 22), (17, 25), (17, 28)], 'G')
    dot(g, [(5, 24), (5, 27), (25, 24), (25, 27)], 'G')
    at(g, 11, 19, ['4433', '']); at(g, 18, 19, ['3221'])
    return g


def _reveler(g, x, y, w, hat, face_fn):
    face(g, x, y, w=w, h=10, ear_row=3)
    at(g, x, y, ['h' * w, 'h' + ' ' * (w - 2) + 'H'])
    at(g, x + (w - 5) // 2, y - 6, hat)
    face_fn(g, x)


def d_revelers():
    # Revelers (counts 3): three party-goers in striped cone hats, one blowing a party horn, one mid-laugh, one winking;
    # confetti and a streamer.
    g = new()
    for k, (x, y) in enumerate([(3, 6), (28, 6), (8, 2), (23, 2), (2, 10), (29, 12), (5, 4), (26, 9)]):
        if g.c[y][x] == 'b': g.c[y][x] = 'xyzn'[k % 4]
    for cx in (6, 26):
        body(g, top=20, cx=cx, start=3, grow=2, maxhalf=6)
    hatA = ['  Y  ', '  x  ', ' xxx ', ' YYY ', 'xxxxx', 'YYYYY']
    hatC = ['  w  ', '  z  ', ' zzz ', ' WWW ', 'zzzzz', 'WWWWW']
    hatB = ['  G  ', '  y  ', ' yyy ', ' WWW ', 'yyyyy', 'WWWWW']
    def fa(g, x):  # laughing
        at(g, x + 1, 13, ['tK  tK'[:6]]); at(g, x + 1, 13, ['KK  KK']); at(g, x + 1, 12, ['  '])
        at(g, x + 1, 12, ['K    K'][:0])
        at(g, x + 1, 12, ['tK  Kt'][:0])
        g.c[15][x + 4] = 't'
        at(g, x + 2, 16, ['KKKK', 'KrrK'])
    def fc(g, x):  # winking
        at(g, x + 1, 12, ['wK', 'KK']); at(g, x + 5, 13, ['KK'])
        g.c[15][x + 3] = 't'
        at(g, x + 2, 17, ['K  K', ' KK '][:1]); at(g, x + 2, 17, ['KKK'])
    _reveler(g, 2, 10, 8, hatA, fa)
    _reveler(g, 22, 10, 8, hatC, fc)
    body(g, top=21, cx=16, start=4, grow=3, maxhalf=8)
    def fb(g, x):  # blowing the horn
        at(g, x + 2, 14, ['wK', 'KK']); at(g, x + 6, 14, ['wK', 'KK'])
        g.c[16][x + 4] = 't'
        at(g, x + 1, 15, ['a'] ); at(g, x + 8, 15, ['a'])
        at(g, x + 4, 18, ['KK'])
    _reveler(g, 11, 12, 10, hatB, fb)
    at(g, 17, 18, ['qYYY', ' YYYYq', '  YYYYYq', '     qqq'][:3])
    at(g, 16, 18, ['KqYY', '  YYYq', '    YYYq'])
    # a streamer over the shoulders
    for x, y in [(3, 22), (4, 23), (6, 23), (7, 22), (9, 23), (10, 24), (12, 24), (13, 23), (19, 23), (20, 24), (22, 24), (23, 23), (25, 22), (26, 23), (28, 23)]:
        g.c[y][x] = 'z' if x < 16 else 'x'
    return g


def d_saint():
    # Patron Saint: blessed and serene. A gold halo, a white veil framing the face, eyes gently closed, a soft smile,
    # a silver medallion on the robe, small sparkles.
    g = new()
    for x, y in [(4, 8), (27, 6), (25, 15)]: at(g, x - 1, y - 1, [' w ', 'wLw', ' w '])
    body(g, start=8)
    at(g, 5, 22, ['WWV', 'WWVV', 'WWWV', 'WWWV', 'WWWVV', ' WWVV', ' WWVV', ' WWVV', ' WWVV', ' WWVV'])
    at(g, 23, 22, ['VVW', 'VVVW', 'VVVW', 'VVVW', 'VVVWW', 'VVVW', 'VVVW', 'VVVW', 'VVVW', 'VVVW'][:0])
    at(g, 22, 22, ['VWV', 'VVWV', 'VVVWV', 'VVVVWV', 'VVVVV', 'VVVVV', 'VVVVV', 'VVVVV', 'VVVVV', 'VVVVV'])
    at(g, 14, 23, [' MM', 'MLLN', 'MLwN', ' NN'][:0])
    at(g, 14, 22, ['  L  ', ' L L ', '  M ', ' MLM', 'MLwLN', ' MNN'][:0])
    at(g, 15, 22, ['L', 'M']); at(g, 14, 24, ['MLN', 'LwM', 'MNN'])
    face(g, 10, 10, w=12, h=12, ear_row=3, ears=False)
    at(g, 9, 1, ['   GGGGGGG   ', ' GGgg   ggGG ', 'Gg         gG', ' GGgg   ggGG ', '   GGGGGGG   '])
    at(g, 7, 5, ['    WWWWWWWW     ', '  WWWWWWWWWWVV   ', ' WWWWWWWWWWWWVV  ', 'WWWWWWWWWWWWWWVVV', 'WWWVVVVVVVVVVVWVV',
                 'WWV           VVV', 'WWV           VVV', 'WWV           VVV', 'WWV           VVV', 'WWV           VVV',
                 'WWWV         VVVV', 'WWWV         VVVV', 'WWWWV       VVVVV', 'WWWWWV     VVVVVV', ' WWWWWV   VVVVVV', '  WWWWWVVVVVVV'])
    at(g, 10, 10, ['hhhhhhhhhhhh'][:0])
    at(g, 10, 10, ['hhhhhhhhhhhh', 'h          h'][:1])
    at(g, 11, 12, ['tt    tt'][:0])
    at(g, 11, 12, ['tt    tt']); at(g, 11, 13, ['wK    wK']); at(g, 11, 14, ['KK    KK'])
    at(g, 11, 14, [' t    t'][:0])
    at(g, 15, 14, ['t', 'st'])
    at(g, 11, 15, ['a'][:1]); at(g, 20, 15, ['a'])
    at(g, 13, 17, ['K  K', ' KK'])
    return g


def d_spoon():
    # Upstart: born with a silver spoon and climbing fast. A tall glossy pompadour cresting forward over close-cropped
    # sides, a smug smirk with one lazy lid, a big shiny silver spoon in the mouth, a popped collar, a gold chain.
    g = new()
    body(g)
    at(g, 6, 20, ['WWW', 'WWWV', 'WWWWV', ' WWWV', '  WV']); at(g, 23, 20, [' VWW', 'VWWW', 'VVWWW', 'VWWW', 'VV'])
    at(g, 10, 24, ['1', '1', ' 1', ' 1']); at(g, 21, 24, ['1', '1', '1', '1'])
    at(g, 12, 22, ['WWWWWWWW', ' WWWWWW', '  GgGg', '   gG'])
    face(g, 8, 9, h=13)
    at(g, 7, 0, ['   hjjjjjh      ', ' hjjjhhhhhhhh   ', 'hjjhhhhhhhhhhhH ', 'jjhhhhhhhhhhhhhH', 'hhhhhhhhhhhhhhhHH',
                 ' hhhhhhhhhhhhhhHH', '  HhhhhhhhhhhhhHH', '  HHhhhhhhhhhhHHH', ' HHHSSSSSSSShhHHH', ' HHSSSSSSSSSSSSHH',
                 ' HH              HH'[:18], ' H                H'[:18]])
    at(g, 8, 9, ['HH']); at(g, 22, 9, ['HH'])
    at(g, 7, 11, ['H', 'H']); at(g, 24, 11, ['H', 'H'])
    at(g, 10, 11, ['tttt']); at(g, 18, 10, ['ttt'])
    at(g, 10, 12, ['tt', 'KK']); at(g, 18, 12, ['wK', 'KK'])  # one lazy, half-lidded eye
    at(g, 15, 14, ['t', 'st'])
    at(g, 9, 15, ['a']); at(g, 22, 15, ['a'])
    at(g, 12, 17, ['t    K', ' tKKK'])
    at(g, 16, 17, ['     LLL', 'LLLLLLwLLL', 'NNNNNNMLLLN', '       NNN'])
    return g
