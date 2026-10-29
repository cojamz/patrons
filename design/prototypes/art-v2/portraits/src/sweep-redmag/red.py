# Red: the crowd. One function per member; F maps id -> function returning a G.
from lib import *

def base(neckx=14, top=22, **kw):
    g = doorway(); shirt(g, top=top, **kw); g.put(neckx, 22, ['ssss', ' tt ']); return g

def face16(g, y=3, h=19, ears=9, nose=True):
    skull(g, 8, y, 16, h, ears=ears)
    if nose: g.c[14][15] = 't'; g.put(14, 15, ['tt'])
    return g

def headhunter():  # corporate recruiter: slick side-parted hair with shine, thin specs, a cocked brow, smirk, suit, card in the pocket
    g = base()
    for j in range(10):
        y = 22 + j; hw = 1 + j // 2
        for x in range(16 - hw - 1, 16 + hw + 1): g.c[y][x] = 'W' if x < 16 + hw else 'V'
    g.put(15, 22, ['KK', 'DD', 'KD', 'DD', 'DK', 'DD', 'DD', 'KD', 'DD', 'DD'])
    for j in range(10):
        y = 22 + j; hw = 1 + j // 2
        g.c[y][16 - hw - 2] = '1'; g.c[y][16 + hw + 1] = '1'
        if j < 6: g.c[y][16 - hw - 3] = '4'
    g.put(21, 26, ['WWV', 'KKV', '222'])  # business card in the breast pocket
    face16(g)
    g.put(7, 1, ['    HHHHHHHHH     ', '  HHhhhhjjhhhhH   ', ' HhhhjjjhhhhhhhH  ', 'Hhhjjhhhhhhhhhhh  ',
                 'Hhjjhhhhhhhhhhhhh ', 'HhhhhhKhhhhhhhhhH ', 'HhhhSSSKhhhhhhhhH ', 'HhSSSSSSHhhhhhhhH ', 'HhSSSSSSSSHHhhhhH ',
                 'HHSSSSSSSSSSSHhhH '])
    g.put(8, 11, ['H', 'H']); g.put(23, 11, ['H', 'H'])
    g.put(10, 11, ['HHH']); g.put(18, 10, [' HHH', 'H'])
    g.put(9, 12, ['NNNNNN NNNNNN', 'N    NNN    N', 'N    N N    N', 'NNNNNN NNNNNN'])
    g.put(11, 13, ['wK', 'KK']); g.put(19, 13, ['wK', 'KK']); g.c[13][13] = 'w'; g.c[13][21] = 'w'
    g.c[16][15] = 't'; g.put(15, 17, ['tt'])
    g.put(13, 19, ['     K', ' KKKK'])
    g.put(9, 17, ['aa']); g.put(21, 17, ['aa'])
    def card(f):  # holding up his business card: the offer
        f.put(23, 7, ['WWWWWV', 'WxWKKV', 'WWWWWV', 'WKKKWV', 'VVVVVV', ' SSSs', 'SSSSs', 'SSSst', ' SSst', ' 432', ' 432', ' 432', '4321', '4321', '4321'])
    layer(g, card)
    return g

def host():  # the party's hostess: big curly hair, closed-eye beam, hoop earrings, pearls, sweetheart neckline, confetti
    g = doorway()
    for (x, y, k) in [(4, 9, 'x'), (27, 6, 'y'), (5, 16, 'z'), (26, 13, 'n'), (9, 2, 'G'), (21, 1, 'x'), (3, 21, 'y'),
                      (28, 20, 'z'), (13, 0, 'n'), (27, 26, 'G'), (2, 27, 'x'), (24, 3, 'z')]:
        g.put(x, y, [k + k] if k != 'G' else ['G']); g.put(x, y + 1, [k + k] if k != 'G' else [''])
    blob(g, [(9, 8, 4.5), (16, 5, 5.5), (23, 8, 4.5), (6.5, 13, 3.6), (25.5, 13, 3.6), (7, 18, 3), (25, 18, 3),
             (12, 5, 4), (20, 5, 4)])
    shirt(g, top=23, half0=6, slope=3)
    g.put(11, 22, ['SSSSSSSSss', ' SSSSSSst ', '  SSSSst  ', '   SSst   '])  # neckline
    for x in range(11, 21): g.c[23][x] = '4' if x < 13 else g.c[23][x]
    g.put(11, 23, ['4', '4']); g.put(20, 23, ['2', '2'])
    g.put(11, 22, ['W W W W W'][0:0])
    g.put(10, 21, ['W', ' W', '  W W W W W', '         W', '        W'][0:0])
    for (x, y) in [(11, 21), (12, 22), (13, 23), (15, 24), (17, 24), (19, 23), (20, 22), (21, 21)]: g.c[y][x] = 'W'
    g.c[24][16] = 'w'
    skull(g, 8, 4, 16, 18, ears=8)
    blob(g, [(11, 6, 3.2), (15, 5, 3.4), (19.5, 5.5, 3.2), (23, 7.5, 2.4), (8.5, 8, 2.2)])
    g.put(10, 10, ['tt      tt'])
    g.put(9, 12, [' KK     KK ', 'K  K   K  K'][0:2])
    g.put(9, 12, [' KK ', 'K  K']); g.put(18, 12, [' KK ', 'K  K'])
    g.c[14][15] = 't'; g.put(14, 15, ['tt'])
    g.put(9, 15, ['aaa']); g.put(20, 15, ['aaa'])
    g.put(12, 17, ['KKKKKKKK', 'KwwwwwwK', ' KrqqrK ', '  KKKK  '])
    g.put(6, 13, [' G', 'G g', 'G g', ' g']); g.put(23, 13, [' G', 'G g', 'G g', ' g'])
    return g

def guard(f, x, y, flip):
    skull(f, x, y, 11, 11, ears=4)
    blob(f, [(x + 5.5, y - 5, 6), (x + 5.5, y - 1, 6.2), (x + 3, y - 8, 4), (x + 8, y - 8, 4)], 'NDK', clip=lambda a, b: b <= y + 2)
    for b in range(y - 12, y + 3):
        for a in range(x - 2, x + 13):
            if 0 <= b and f.c[b][a] in 'NDK' and (a + b * 3) % 5 == 0 and f.c[b][a] == 'D': f.c[b][a] = 'N'
    f.put(x, y + 3, ['G' if not flip else 'G', 'G', 'G', ' G', '  G', '   G'])
    f.put(x + 10, y + 3, ['g', 'g', 'g', 'g', 'g ', 'g'][:4]); f.put(x + 8, y + 7, ['  g', ' g', 'g'])
    f.put(x + 4, y + 9, ['GGg'])
    f.put(x + 2, y + 3, ['tt   tt'])
    f.put(x + 2, y + 4, ['wK   wK', 'KK   KK'])
    f.c[y + 6][x + 5] = 't'; f.put(x + 4, y + 7, ['  ']); f.put(x + 4, y + 8, ['KKK'])
    cx = x + 5
    shirt(f, cx=cx + 1 if not flip else cx, top=y + 12, half0=5, slope=2, maxhalf=9, x0=max(0, cx - 9), x1=cx + 9)
    f.put(cx - 1, y + 11, ['sss', ' t '])
    f.put(cx - 2, y + 12, ['11111']); f.put(cx - 1, y + 13, ['1G1'])
    for j in range(N - (y + 13)):
        yy = y + 13 + j; xx = (cx - 5 + j) if not flip else (cx + 5 - j)
        if 0 <= xx < N: f.put(xx - (0 if not flip else 1), yy, ['WV'])
    for yy in range(y + 15, N, 3): f.c[yy][cx] = 'G'
    f.put(cx - 7 if not flip else cx + 5, y + 12, ['GG', 'gg'])
    return f

def loyalists():  # two palace guards shoulder to shoulder: bearskins, gold chin straps, white cross-belts, unblinking
    g = doorway()
    layer(g, lambda f: guard(f, 17, 10, True))
    layer(g, lambda f: guard(f, 4, 10, False))
    return g

def mentor():  # an old master (grey hair, round specs, moustache) with his hand on an eager young protege's shoulder
    g = doorway()
    def old(f):
        shirt(f, cx=22, top=21, half0=6, slope=3, maxhalf=11)
        f.put(20, 21, ['ssss', ' tt '])
        for j in range(4): f.put(19 - j, 22 + j, ['W']); f.put(24 + j, 22 + j, ['V'])
        skull(f, 14, 5, 14, 16, ears=7)
        f.put(13, 3, ['   LLLLLL      ', ' LLMMMMMMMMN   ', 'LMM SSSSS MMN  ', 'LM SS     SMMN ', 'LM         MNN ',
                      'M           NN ', 'M            N ', 'M            N '])
        f.put(16, 4, ['SSSSSSSSSS'][0:0])
        f.put(15, 8, ['ww']); f.put(16, 10, ['LLL  LLM'])
        f.put(15, 11, ['NNNN  NNNN', 'N  NNNN  N', 'N  N  N  N', 'NNNN  NNNN'])
        f.put(16, 12, ['wK']); f.put(16, 13, ['KK']); f.put(22, 12, ['wK']); f.put(22, 13, ['KK'])
        f.put(19, 15, ['t']); f.put(17, 16, ['LLMMMN', 'L    N'])
        f.put(18, 18, ['KKK'])
        f.put(14, 15, ['a']); f.put(26, 15, ['a'])
    def young(f):
        shirt(f, cx=9, top=24, half0=5, slope=2, maxhalf=9, x1=19)
        f.put(7, 23, ['sss', ' t'])
        skull(f, 3, 11, 11, 12, ears=5)
        f.put(2, 8, ['   YOOOOO   ', ' YOOOOOOOOo ', 'YOOYOOOOOOoo', 'OOOOOOOOOOOo', 'oO  OOO OOoo', 'o        oo'])
        f.put(12, 11, ['YY', ' Yg'][0:1]); f.put(13, 12, ['Y'])
        f.put(5, 15, ['wK   wK', 'KK   KK'])
        f.put(5, 14, ['tt   tt'])
        f.c[17][8] = 't'
        f.put(4, 18, ['a      a'][0:1]); f.put(6, 19, ['KKKK', 'KrrK', ' KK '])
    layer(g, old); layer(g, young)
    g.put(13, 23, ['  SSs', ' SSSSt', 'SSSSst', 'tsss'])  # the mentor's hand on the protege's shoulder
    for y in range(22, 27):
        for x in range(17, 20):
            if g.c[y][x] in '1234': g.c[y][x] = '2' if x < 19 else '1'
    return g

def mob():  # five angry townsfolk, each in a different bright hat: yellow hard hat, red bandana, green beanie, blue cap, white scarf
    g = doorway()
    def face(f, x, y, w, h):
        skull(f, x, y, w, h, ears=None)
        f.put(x + 1, y + 2, ['K' + ' ' * (w - 4) + 'K']); f.put(x + 2, y + 3, ['K' + ' ' * (w - 6) + 'K'])
        f.put(x + 1, y + 4, ['wK' + ' ' * (w - 6) + 'wK', 'KK' + ' ' * (w - 6) + 'KK'])
        m = x + w // 2 - 2
        f.put(m, y + h - 4, ['KKKK', 'KqqK', ' KK '][:3 if h > 9 else 2])
    def back(f):
        shirt(f, cx=16, top=13, half0=4, slope=1, maxhalf=4, keys='3221')
        face(f, 3, 4, 8, 10); f.put(2, 1, ['  YYYY  ', ' YGYYYY ', 'YYYYYYYg', 'gggggggggg'][0:4])
        face(f, 12, 3, 8, 10); f.put(11, 1, ['  RRRR ', ' RqRRRr', 'RRRRRRRr', 'r      rR'][0:3])
        face(f, 21, 4, 8, 10); f.put(21, 1, ['  EEEE ', ' EEEEEe', 'EeEeEeEe', 'eEeEeEeE'])
    def front(f):
        shirt(f, cx=9, top=24, half0=6, slope=3, maxhalf=9, x1=16)
        shirt(f, cx=23, top=24, half0=6, slope=3, maxhalf=9, x0=16)
        for cx in (9, 23): f.put(cx - 1, 23, ['ss'])
        face(f, 4, 14, 10, 10); f.put(3, 11, ['   UUUUU  ', ' UUUUUUUUu ', 'UUUUUUUUUUu', 'uuuuuuuuuuu', '        uuuu'][0:4])
        face(f, 18, 14, 10, 10); f.put(17, 11, ['   WWWWW  ', ' WWWWWWWWV ', 'WWWWWWWWWWV', 'WV        VV', 'W          V'])
    layer(g, back); layer(g, front)
    return g

def movement():  # the referee: flat-top, stern brows, a whistle in his teeth, striped shirt, a red card held up
    g = doorway(); shirt(g)
    for y in range(22, 32):
        for x in range(32):
            if g.c[y][x] in '34' and x % 4 in (0, 1): g.c[y][x] = 'K'
            elif g.c[y][x] in '2' and x % 4 in (0, 1): g.c[y][x] = 'K'
    g.put(13, 22, ['KKKKKK', ' KssK ', '  tt'][0:3]); g.put(14, 22, ['ssss'])
    face16(g)
    g.put(7, 2, ['  HHHHHHHHHHHH  ', ' HhhjjhhhhhhhhH ', ' HhjjhhhhhhhhhH ', ' Hhhhhhhhhhhhhh H', ' Hhhhhhhhhhhhhh ', ' HH SSSSSSSSS HH ', ' H            H'])
    g.put(9, 10, ['KKK      KKK', '  KK    KK'])
    g.put(10, 12, ['wK', 'KK']); g.put(19, 12, ['wK', 'KK'])
    g.put(9, 16, ['aa']); g.put(21, 16, ['aa'])
    g.put(13, 17, ['LLLLMN', 'MMMMNN', ' NNN']); g.put(18, 17, ['N']); g.put(19, 18, ['N', ' N', ' N', '  N', '  N'])
    def arm(f):  # his raised arm: striped sleeve, a fist, and the red card gripped in it
        f.put(24, 0, ['wqqqR', 'qRRRr', 'qRRRr', 'qRRRr', 'qRRRr', 'RRRRr', 'RRRrr'])
        f.put(23, 7, [' SSSSs', 'SStStst', 'SSSSSst', ' SSSsst', '  ssst'])
        for j, y in enumerate(range(12, 22)):
            f.put(23 + (j // 4), y, ['KKKKK' if (y // 2) % 2 else '43321'])
    layer(g, arm)
    return g

def panel():  # three judges at a table holding up score cards: bun and glasses, bald with a moustache, a tall pompadour
    g = doorway()
    def judge(f, x, y, cx):
        shirt(f, cx=cx, top=y + 11, half0=4, slope=2, maxhalf=6, keys='4321')
        f.put(cx - 1, y + 10, ['ss'])
        skull(f, x, y, 8, 10, ears=4)
        f.put(x + 1, y + 4, ['wK  wK', 'KK  KK'])
        f.c[y + 6][x + 4] = 't'
    def back(f):
        judge(f, 3, 8, 7); judge(f, 12, 5, 16); judge(f, 21, 8, 25)
        f.put(2, 4, ['   HH  ', '  HhjH ', '  HhhH ', ' hhjhhhH', 'hhjhhhhhH', 'hh SSSShH', 'h      hH'])
        f.put(3, 12, ['NNN NNN', 'N NNN N', 'NNN NNN']); f.put(4, 13, ['K']); f.put(8, 13, ['K'])
        f.put(5, 15, ['KKK'])
        f.put(12, 5, [' wS']); f.put(11, 9, ['H', 'H']); f.put(20, 9, ['H', 'H'])
        f.put(13, 12, ['HHHHHH', 'H    H']); f.put(15, 13, ['  '])
        f.put(14, 8, ['tt  tt'])
        f.put(20, 1, ['  jhhhH  ', ' jhhhhhhH', 'jhhhhhhhH', 'hhhhhhhhH', 'HhhhhhhHH', ' HH  hhHH', ' H    HH'][0:7])
        f.put(23, 13, ['K  K', ' KK '][0:2]); f.put(22, 11, ['  ', 'a    a'][1:])
        f.put(23, 13, ['KKKK'][0:0])
    layer(g, back)
    def cards(f):
        for (x, num) in [(2, '10'), (12, '9'), (22, '10')]:
            f.put(x, 21, ['WWWWWWWV', 'WWWWWWWV', 'WWWWWWWV', 'WWWWWWWV', 'WWWWWWWV', 'WWWWWWWV', 'VVVVVVVV'])
            if num == '10': f.put(x + 1, 22, ['KWKKK', 'KWKWK', 'KWKWK', 'KWKKK'])
            else: f.put(x + 2, 22, ['KKK', 'KWK', 'KKK', '  K'])
            f.put(x + 1, 28, ['SSs  SSs'[:7]]); f.put(x + 1, 29, ['tt   tt'])
        for y in range(29, 32):
            for x in range(1, 31): f.c[y][x] = 'O' if y == 29 else 'o'
        for x in range(1, 31): f.c[29][x] = 'O'
    layer(g, cards)
    return g

def patriarch():  # the family elder: bald crown, white side hair and bushy brows, a long white beard, gold chain and medallion
    g = base(half0=8)
    for j in range(10):
        y = 22 + j; d = 3 + j // 2
        if 16 - d - 1 >= 0: g.c[y][16 - d - 1] = 'G'
        if 16 + d < N: g.c[y][16 + d] = 'g'
    skull(g, 8, 3, 16, 19, ears=9)
    g.put(9, 4, ['  w ', ' ww'])
    g.put(6, 9, ['WWV', 'WWVV', 'WVV', 'VV']); g.put(23, 9, [' VV', 'VVVV', ' VVV', '  VV'])
    g.put(9, 10, ['WWWV    WWWV'])
    g.put(10, 11, ['WWV      WWV'][0:0])
    g.put(10, 12, ['wK', 'KK']); g.put(18, 12, ['wK', 'KK'])
    g.put(10, 11, ['tt      tt'])
    g.c[14][15] = 't'; g.put(14, 15, ['tt'])
    g.put(9, 15, ['aa']); g.put(21, 15, ['aa'])
    g.put(8, 16, ['W  WWWWWWV  V', 'WWWWWWWWWVVVVV', 'WWWWWKKWWWWVVV', 'WWWWWWWWWWWVVV', ' WWWWWWWWWWVVV', ' WWWWWWWVWWVV',
                  '  WWWWWWWWVVV', '  WWWVWWWWVV', '   WWWWWWVV', '   WWWVWWVV', '    WWWWVV', '    WWWWV', '     WWV', '      V'])
    g.put(10, 16, ['WWWWWVV'][0:0])
    g.put(11, 17, ['WWWW  WWWW'][0:0])
    g.put(7, 22, ['g', 'G', ' G', ' gG'][0:0])
    g.put(22, 23, ['G', 'g', 'G', 'g', 'G'])
    g.put(20, 28, [' GGg', 'GGwGg', 'GGxGg', ' Ggg'])
    return g

def proselytizer():  # a street preacher mid-sermon (flat wide-brim hat, clerical tab) and a starry-eyed new convert with a pamphlet
    g = doorway()
    def preacher(f):
        shirt(f, cx=11, top=21, half0=7, slope=3, maxhalf=12, x1=24)
        f.put(9, 20, ['ssss', ' tt '])
        f.put(9, 21, ['KKKK', 'KWWK', ' WW']); f.put(10, 21, ['WW'])
        skull(f, 4, 6, 14, 15, ears=6)
        f.put(5, 1, ['   DDDDDDD    ', '  DNNDDDDDDK  ', '  DNDDDDDDDK  ', '  DDDDDDDDDK  ', '  1111111111  ', 'DDDDDDDDDDDDDDK', 'DDDDDDDDDDDDDDDDK'])
        f.put(1, 7, ['NDD'][0:0]); f.put(1, 6, ['KDDN'][0:0])
        f.put(2, 6, ['DD']); f.put(2, 7, ['DD'])
        f.put(6, 8, ['tt'][0:0])
        f.put(5, 9, ['KK    KK'][0:1]); f.put(6, 10, ['wK    wK'][0:0])
        f.put(6, 10, ['wK', 'KK']); f.put(13, 10, ['wK', 'KK'])
        f.put(5, 9, [' t     tt'][0:0])
        f.c[12][10] = 't'; f.put(9, 13, ['tt'])
        f.put(5, 13, ['a']); f.put(16, 13, ['a'])
        f.put(8, 15, ['KKKK', 'KrrK', 'KqqK', ' KK '])
    def convert(f):
        shirt(f, cx=24, top=22, half0=4, slope=2, maxhalf=7, x0=17)
        f.put(23, 21, ['ss'])
        skull(f, 20, 12, 9, 10, ears=4)
        f.put(19, 10, ['  hjhhH  ', ' hjhhhhhH ', 'hhhhhhhhhH', 'h h  h  hH'][0:4])
        f.put(21, 15, ['wK  wK', 'KK  KK'][0:2]); f.put(21, 14, ['    ']); f.put(21, 16, ['KK  KK'])
        f.put(21, 15, ['wK  wK'])
        f.put(20, 18, ['a       a'][0:1]); f.put(23, 18, ['K K', ' K '][0:1]); f.put(23, 19, ['KKK'][0:0])
        f.put(22, 18, ['K  K', ' KK '])
        f.put(26, 6, [' Y ', 'YwY', ' Y ']); f.put(23, 5, ['G'])
        f.put(19, 24, ['WWWWV', 'WKKWV', 'WWWWV', 'WKKWV', 'VVVVV', 'SSSs'])
    layer(g, preacher); layer(g, convert)
    return g

def star(g, x, y, k):
    g.put(x - 1, y - 1, [f' {k} ', f'{k}w{k}', f' {k} '])

def recruitbonus():  # a recruiting officer (peaked cap, medal, moustache) and the fresh recruit he just signed, cheering, bonus sparkles
    g = doorway()
    def officer(f):
        shirt(f, cx=9, top=22, half0=6, slope=3, maxhalf=9, x1=17)
        f.put(7, 21, ['sss', ' t'])
        skull(f, 3, 8, 12, 14, ears=5)
        f.put(2, 3, ['   4433333   ', ' 443333333322', '44333333333221', '4333333GG33321', '2222222GG22211', ' DDDDDDDDDDK', 'DDDDDDDK'])
        f.put(5, 13, ['wK    wK'][0:0]); f.put(5, 12, ['tt   tt']); f.put(5, 13, ['wK', 'KK']); f.put(10, 13, ['wK', 'KK'])
        f.c[15][8] = 't'; f.put(7, 16, ['tt'])
        f.put(5, 17, ['HHHHHH', 'H    H'])
        f.put(6, 19, ['KKKK'])
        f.put(4, 16, ['a']); f.put(13, 16, ['a'])
        f.put(4, 23, ['  1G1', ' 1GGG1', '  1x1', '  xxx'][0:0]); f.put(4, 25, ['yyy', 'yGy', ' G '])
        f.put(12, 23, ['GG', 'gg'][0:0])
    def recruit(f):
        shirt(f, cx=23, top=24, half0=5, slope=2, maxhalf=9, x0=15)
        f.put(22, 23, ['sss'])
        skull(f, 18, 11, 11, 12, ears=4)
        f.put(18, 9, ['  HHHHHHH  ', ' HhhhhhhhhH', 'HhhhhhhhhhH', 'Hh h h h hH'])
        f.put(19, 14, [' KK   KK ', 'K  K K  K'][0:2])
        f.c[17][23] = 't'
        f.put(19, 17, ['aa     aa'][0:1]); f.put(20, 17, ['a']); f.put(26, 17, ['a'])
        f.put(21, 18, ['KKKKK', 'KwwwK', 'KrqrK', ' KKK '][0:4])
    layer(g, officer); layer(g, recruit)
    star(g, 19, 4, 'x'); star(g, 26, 6, 'y'); star(g, 16, 2, 'n'); star(g, 28, 13, 'z'); g.put(23, 2, ['G']); g.put(14, 6, ['G'])
    return g

def twins():  # twin girls, mirror images: straight bangs, pigtail buns with bows, matching striped tees, leaning in
    g = doorway()
    def girl(f, x, flip):
        cx = x + 5
        shirt(f, cx=cx + (0 if flip else 1), top=22, half0=5, slope=2, maxhalf=8, x0=cx - 8, x1=cx + 9)
        for y in range(23, N, 3):
            for xx in range(N):
                if f.c[y][xx] in '1234': f.c[y][xx] = 'W' if f.c[y][xx] in '34' else 'V'
        f.put(cx - 1, 21, ['sss', ' t'])
        skull(f, x, 9, 11, 12, ears=4)
        f.put(x - 1, 6, ['  hjjhhhH  ', ' hjhhhhhhhH ', 'hjhhhhhhhhhH', 'hhhhhhhhhhHH', 'hhhhhhhhhhHH', 'H          H', 'H          H', 'H          H'][0:5])
        bx = x - 3 if not flip else x + 10
        blob(f, [(bx + 1.5, 9.5, 2.4)])
        f.put(bx, 6, ['RR', 'qR', 'Rr'][0:0])
        f.put(bx + (2 if not flip else -1), 7, ['R'][0:0])
        f.put(bx + (1 if not flip else 0), 6, ['qRr'][:2]); f.put(bx + (1 if not flip else 0), 7, ['Rr'])
        f.put(x + 2, 13, ['wK   wK', 'KK   KK'])
        f.c[15][x + 5] = 't'
        f.put(x + 1, 16, ['aa', ]); f.put(x + 8, 16, ['aa'])
        f.put(x + 3, 17, ['K   K', ' KKK '])
    layer(g, lambda f: girl(f, 18, True))
    layer(g, lambda f: girl(f, 3, False))
    return g

def volunteer():  # the eager volunteer: cap, big smile, hand shot up high, a HELLO name sticker
    g = doorway(); shirt(g, cx=15, top=22, half0=7)
    g.put(13, 22, ['ssss', ' tt '])
    g.put(5, 25, ['WxxxxV', 'WKWKWV', 'WWWWWV', 'VVVVVV'])
    g.put(23, 2, [' S S', 'SSSSs', 'SSSSs', 'SSSSst', 'SSSSst', 'SSSSst', ' SSst', ' sst', ' 32', ' 32', ' 321', ' 321', '4321', '4321', '4321', '4321', '4321', '43221', '43221'][0:19])
    g.put(23, 1, ['S S S'][0:0]); g.put(23, 1, [' S S']); g.put(23, 2, ['SSSSS']); g.put(28, 3, [''])
    skull(g, 6, 4, 15, 18, ears=8)
    g.put(5, 1, ['    4333333     ', '  44333WW33332  ', ' 4333333333333221', '43333333333333321', '22222222222222111', '                 '])
    g.put(1, 5, ['11111222'][0:0])
    g.put(2, 6, ['     ', '']); g.put(1, 5, [''])
    g.put(5, 6, ['H  hh       hH'])
    g.put(8, 10, ['tt     tt'])
    g.put(8, 11, ['wK     wK', 'KK     KK'])
    g.c[13][13] = 't'; g.put(12, 14, ['tt'])
    g.put(7, 15, ['aa        aa'][0:0]); g.put(7, 14, ['aa']); g.put(17, 14, ['aa'])
    g.put(10, 16, ['KKKKKK', 'KwwwwK', ' KrrK ', '  KK'][0:4])
    return g

F = {'red.headhunter': headhunter, 'red.host': host, 'red.loyalists': loyalists, 'red.mentor': mentor, 'red.mob': mob,
     'red.movementpenalty': movement, 'red.panel': panel, 'red.patriarch': patriarch, 'red.proselytizer': proselytizer,
     'red.recruitbonus': recruitbonus, 'red.twins': twins, 'red.volunteer': volunteer}
