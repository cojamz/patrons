# Magenta (thieves): stealing. One function per member; F maps id -> function returning a G.
from lib import *

def base(neckx=14, top=22, **kw):
    g = doorway(); shirt(g, top=top, **kw); g.put(neckx, 22, ['ssss', ' tt ']); return g

def accomplice():  # the lookout: newsboy cap, neckerchief, eyes slid sideways, finger to the lips, a loot sack with three tokens over the shoulder
    g = base()
    g.put(21, 14, ['     ooo', '   oOOOOo', '  oOOyOxOo', '  OOzOOOOo', ' OOOOOOOOOo', ' OOOOOoOOOOo', 'OOOOOOOOOOoo', 'OOOoOOOOOooo',
                   'OOOOOOOOOooo', 'OOOOOOOOoOo', 'OOOOOOOOooo', ' OOOOOOOoo', '  oOOOOoo', '   ooooo'])
    for j in range(9): g.put(20 - j, 23 + j, ['oo'][:1])
    skull(g, 8, 4, 16, 18, ears=9)
    g.put(9, 6, ['hh', 'h']); g.put(22, 6, ['hH', ' H', ' H'])
    g.put(5, 0, ['        G        ', '     4433333       ', '   44333333333322  ', '  4333333333333332  ', ' 433333333333333221 ',
                 ' 4333333333333332221', ' 2222222222222222211', 'DDDDD11111111111111 ', 'DDDD               '])
    g.put(10, 10, ['tt      tt'])
    g.put(10, 11, ['wK', 'KK']); g.put(17, 12, ['tKKKt'])
    g.c[13][15] = 't'; g.put(14, 14, ['tt'])
    g.put(9, 15, ['aa']); g.put(21, 15, ['aa'])
    g.put(11, 16, ['K      K', 'KKKKKKKK', ' KwKwwK', '  KKKK'])
    g.put(10, 22, ['RRqRRRRRRRRr', ' RRRRRRRRRr', '  rRRRRRRr', '    rRRr', '     rr'])
    return g

def crew():  # a two-person heist crew: flat cap and toothpick grin, and the tech with goggles up and a headset, matching jackets
    g = doorway()
    def tech(f):
        shirt(f, cx=23, top=22, half0=5, slope=2, maxhalf=9, x0=15)
        f.put(22, 21, ['sss'])
        skull(f, 17, 6, 12, 15, ears=6)
        f.put(16, 3, ['   jhhhhhH  ', ' jhhhhhhhhhH ', 'jhhhhhhhhhhHH', 'hhh MMNNMMNhH', 'hHLDDLLLDDLHH', 'H MDDMNNDDMN ', 'H  MMNN MMN'][0:7])
        f.put(16, 6, ['N', 'N', 'N', 'N', 'N']); f.put(29, 6, ['N', 'N', 'N', 'NN', ' NN', '  N', '  N'][0:4])
        f.put(29, 9, ['N', 'NN', 'DN', 'DN']); f.put(26, 16, ['  NN', ' N', 'NK'][0:0])
        f.put(19, 12, ['wK   wK', 'KK   KK'])
        f.c[14][22] = 't'; f.put(21, 15, ['t'])
        f.put(18, 15, ['a']); f.put(27, 15, ['a'])
        f.put(20, 16, ['K   K', ' KKK '])
        f.put(16, 23, ['    G'][0:0])
    def flat(f):
        shirt(f, cx=8, top=23, half0=6, slope=2, maxhalf=9, x1=17)
        f.put(7, 22, ['sss'])
        skull(f, 2, 9, 12, 14, ears=6)
        f.put(1, 6, ['   4433333 ', ' 44333333332 ', '4433333333322 ', '22222222222111', '  2222221111111'][0:5])
        f.put(2, 11, ['H', 'H']); f.put(13, 11, ['H'])
        f.put(4, 12, ['KK   KK'][0:0]); f.put(4, 12, ['ttt  tt'][0:1])
        f.put(4, 13, ['wK   wK', 'KK   KK'])
        f.c[15][7] = 't'; f.put(6, 16, ['tt'])
        f.put(5, 18, ['    K', 'KKKK', ]); f.put(9, 18, ['KWWW'][0:0])
        f.put(9, 18, ['KLLL'])
    layer(g, tech); layer(g, flat)
    for (x, y) in [(5, 27), (21, 26)]: g.put(x, y, ['WW', 'xW'][0:2])
    return g

def cutpurse():  # hood up, sly side smirk, a little knife, a slit coin purse spilling coins
    g = base()
    g.put(4, 1, ['        443333       ', '     443333333332   ', '   4433333333333322 ', '  443333333333333221', ' 44333333333333333221',
                 ' 4333311111111113221', '43331            13221', '4331              1321', '4331              1321', '4331              1321',
                 '4331              1321', '4331              1321', '43331             1321', '433331           13321', '4333331         133321',
                 '43333331       1333321', '433333333     13333221', '4333333333   333332221', '4333333333333333332221', ' 4333333333333333332221'][0:21])
    skull(g, 8, 7, 16, 15, ears=None)
    g.put(9, 7, ['11111111111111', '1Hhhhhhhhhhhh1', ' HHhHHHhhHHHH'])
    g.put(10, 11, ['tt      tt'])
    g.put(10, 12, ['wK      wK', 'KK      KK'])
    g.c[14][15] = 't'; g.put(14, 15, ['tt'])
    g.put(9, 16, ['aa']); g.put(21, 16, ['aa'])
    g.put(12, 17, ['      K', 'KKKKKK', ' KwwwK'][0:0]); g.put(12, 17, ['K     K', 'KKKKKKK', ' KwwwK '])
    g.put(1, 20, ['  LLw', ' LLN', 'LLN', 'oo', 'oo'][0:0])
    g.put(21, 19, ['  oo', ' oOOo', '  oo', ' oOOOOo', 'oOOOOOOo', 'OOOOOOOo', 'OOOOOOoo', 'oOOOOOoo', ' oKKKKo', '  GwG', ' GGg Gw', 'Gwg GGg'])
    g.put(5, 25, [' L', 'LN', 'LN', 'LN', 'oo', 'Oo', 'oo'])
    return g

def desperado():  # the outlaw: wide cowboy hat, bandana over nose and mouth, a hard squint, a bullet bandolier
    g = base()
    for i in range(11):
        y = 21 + i; x = 5 + 2 * i
        g.put(x, y, ['ooo']); g.put(x + 1, y - 1, ['G' if i % 2 == 0 else 'g'][0:1])
    skull(g, 8, 4, 16, 18, ears=9)
    g.put(1, 1, ['         OOOOOOOO           ', '       OOOOOOOOOOOo         ', '      OOOOOOOOOOOOOo        ', '      oOOOOOOOOOOOOo        ',
                 '     oooooooooooooooo       ', '  OO OOOOOOOOOOOOOOOoo  oo  ', ' OOOOOOOOOOOOOOOOOOOOOOOOOo ', '  ooooooooooooooooooooooo   '][0:8])
    g.put(7, 4, [' ', ' 3333333333333', '  2222222222221'][0:0])
    g.put(8, 5, ['3333333333333321'][0:0])
    g.put(7, 5, [' 222222222222221'])
    g.put(9, 9, ['H', 'H']); g.put(22, 9, ['H', 'H'])
    g.put(10, 10, ['KKK      KKK'])
    g.put(10, 11, ['wKK'[:2] + '      ' + 'wK'])
    g.put(10, 12, ['tt      tt'])
    g.put(8, 14, ['4333333333333332', '4333333333333322', ' 433333W33332221', ' 43333333W33221', '  433333333221', '   43333W3221', '    433322', '     4322', '      21'])
    g.put(23, 14, ['21', '21', ' 2', ' 22'][0:0])
    return g

def doubleagent():  # the double agent: fedora, collar up, a pale half-mask over one side of the face, one pin for each side
    g = base()
    for j in range(8):
        g.put(10 - j // 2, 22 + j, ['44']); g.put(20 + j // 2, 22 + j, ['21'])
    g.put(13, 22, ['W  V'][0:0])
    g.put(8, 25, ['x']); g.put(23, 25, ['y'])
    g.put(5, 18, [' 44', '443', '433', '433'][0:0])
    skull(g, 8, 4, 16, 18, ears=9)
    for y in range(8, 22):
        for x in range(16, 26):
            if g.c[y][x] in 'Sst': g.c[y][x] = 'W' if x < 22 else ('V' if g.c[y][x] != 't' else 'V')
    for y in range(8, 22): 
        if g.c[y][16] in 'WV': g.c[y][16] = 'K'
    g.put(7, 1, ['      DDDDDDD     ', '    DDNNDDDDDDK   ', '   DNNDDDDDDDDDK  ', '   D3333333333DK  ', '   D2222222222DK  ',
                 ' DDDDDDDDDDDDDDDDK ', 'DDDDDDDDDDDDDDDDDDK', '  hH          Hh'])
    g.put(10, 10, ['tt'])
    g.put(10, 11, ['wK', 'KK'])
    g.put(18, 10, [' KKK', 'KKwK', 'KKKK', ' KK'])
    g.c[14][15] = 't'; g.put(14, 15, ['tt'])
    g.put(9, 15, ['aa'])
    g.put(12, 17, ['KKKK']); g.put(17, 17, ['VVVV'])
    return g

def extortionist():  # the loan shark: slicked-back hair, dark shades, toothpick, stubble, open collar, heavy gold chain
    g = base()
    g.put(11, 22, ['WWW    VVV', ' WWW  VVV', '  WW  VV', '   WSSV', '    sS'][0:3])
    g.put(13, 22, ['SSSSSS', ' SSSs', '  St'])
    for (x, y) in [(12, 23), (13, 24), (14, 25), (15, 25), (16, 25), (17, 25), (18, 24), (19, 23)]: g.c[y][x] = 'G' if x < 16 else 'g'
    g.c[26][15] = 'G'; g.c[26][16] = 'g'
    skull(g, 8, 3, 16, 19, ears=9)
    g.put(7, 1, ['   HHHHHHHHHH    ', ' HHhjjjjjhhhhHH  ', 'Hhhjjhhhhhhhhhhh ', 'Hhhhhhhhhhhhhhhh ', 'HhhhjjjjjhhhhhhH ', 'HhhhhhhhhhhhhhH  ', 'HH SSSSSSSSS HH  ', 'H             H'])
    g.put(9, 11, ['KKKKKKKKKKKKKK'][0:0])
    g.put(9, 11, ['KKKKKKKKKKKKKK', 'KDDDDKKKKDDDDK', 'KDwDDK  KDwDDK', ' KDDK    KDDK'])
    g.put(8, 11, ['K']); g.put(23, 11, ['K'])
    g.c[15][15] = 't'; g.put(14, 16, ['tt'])
    g.put(10, 17, ['s s s s s s s'[:13]]); g.put(10, 19, [' s s s s s'])
    g.put(12, 18, ['KKKKKKoOOO'])
    return g

def fixer():  # the fixer: sleek black bob, cat-eye glasses, red lips, a pencil behind the ear and an earpiece, padded blazer
    g = base(half0=9)
    g.put(11, 22, ['WWW  VVV', ' WWWWVV', '  WWWV'])
    for j in range(9): g.put(9 - j // 3, 23 + j, ['2']); g.put(22 + j // 3, 23 + j, ['1'])
    g.put(5, 0, ['', '     KKKKKKKK      ', '   KKDDDDDDDDKK    ', '  KDDNNDDDDDDDDK   ', ' KDDNDDDDDDDDDDDK  ', ' KDNDDDDDDDDDDDDK  ',
                 'KDDDDDDDDDDDDDDDDK ', 'KDDD          DDDK', 'KDD            DDK', 'KDD            DDK', 'KDD            DDK',
                 'KDD            DDK', 'KDD            DDK', 'KDD            DDK', 'KDDD          DDDK', 'KDDD          DDDK', 'KDDD          DDDK', ' KDD          DDK ', ' KKK          KKK'])
    skull(g, 8, 6, 16, 16, top=[0], ears=None)
    g.put(8, 6, ['DDDDDDDDDDDDDDDD', 'DDDDDDDDDDDDDDDD', 'DDDNDDDDDDDDDDDD', '  DDDDDDDDDDDDD '][0:3])
    g.put(8, 10, ['KKKKK     KKKKK ', 'K wK K   K wK K', ' KKKKK    KKKKK'][0:0])
    g.put(8, 10, ['KK    ', ' KKKKK'][0:0])
    g.put(8, 10, ['K     ', 'KKKKKK', ' KwKK ', ' KKKK '][0:4]); g.put(17, 10, ['     K', 'KKKKKK', ' KwKK', ' KKKK'])
    g.put(8, 10, ['KK']); g.put(22, 10, ['KK'])
    g.put(10, 11, ['KKKK']); g.put(18, 11, ['KKKK'])
    g.put(10, 12, ['KwKK']); g.put(18, 12, ['KwKK'])
    g.c[14][15] = 't'; g.put(14, 15, ['tt'])
    g.put(9, 15, ['aa']); g.put(21, 15, ['aa'])
    g.put(13, 17, [' RqRR', 'RRRRrr', ' rrrr'][0:3])
    g.put(24, 8, ['Y', 'Y', 'Y', 'K'][0:0])
    g.put(23, 13, ['N', 'L', 'N'][0:0])
    g.put(23, 6, ['Y', 'YG'][0:0]); g.put(22, 4, ['  G', ' Y', 'Y', ][0:0])
    g.put(23, 6, ['   g', '  Y', ' Y', 'Y'][0:0])
    g.put(21, 3, ['     YK', '    Y', '   Y', '  Y', ' r'][0:0])
    g.put(24, 15, ['L', 'L'])
    g.put(3, 15, ['    ', '   ']); g.put(25, 4, ['    o', '   Y', '  Y', ' Y', 'g'])
    return g

def grifter():  # the con man: bowler hat with a playing card in the band, a wink, pencil moustache, checked vest, bow tie
    g = base()
    for y in range(24, 32):
        for x in range(11, 21):
            g.c[y][x] = '3' if (x // 2 + y // 2) % 2 else '4'
            if x == 20: g.c[y][x] = '2'
    for j in range(8): g.c[24 + j][10] = 'K'; g.c[24 + j][21] = 'K'
    g.put(12, 22, ['WWWWWWV'[:7], ' 1x11x1'[:0]]); g.put(12, 22, ['11WW11', '1qx1x1', '11WW11'][0:0])
    g.put(12, 22, ['xx  xx', 'xqrrqx', 'xx  rx'][0:0])
    g.put(12, 22, ['RR  RR', 'RqRRRr', 'RR  rr'])
    g.put(15, 26, ['G']); g.put(15, 29, ['G'])
    skull(g, 8, 4, 16, 18, ears=9)
    g.put(7, 0, ['                ', '     DDDDDD       ', '   DDNNDDDDDD     ', '  DNNDDDDDDDDDK   ', '  DNDDDDDDDDWWWK  ', '  DDDDDDDDDWxWDK  ',
                 '  1111111111WWW1  ', 'DDDDDDDDDDDDDDDDDK', ' DDDDDDDDDDDDDDDK ', '  hH          Hh'])
    g.put(10, 11, ['tt     ttt'])
    g.put(10, 12, ['wK', 'KK'])
    g.put(17, 13, ['tKKKt'])
    g.c[14][15] = 't'; g.put(14, 15, ['tt'])
    g.put(12, 17, ['HHHHHHHH', ' t'][0:1])
    g.put(13, 18, ['K    K', ' KKKK '][0:0]); g.put(13, 18, ['     K', 'KKKKK'])
    g.put(20, 15, ['aa'])
    return g

def kingpin():  # the crime boss: wide-brim fedora with a gold band, heavy jowls, gold-tooth grin, a fat lit cigar, pinstripes, a rose
    g = base(half0=9, maxhalf=15)
    for y in range(22, 32):
        for x in range(32):
            if g.c[y][x] in '1234' and x % 3 == 0: g.c[y][x] = 'W' if g.c[y][x] in '34' else 'V'
    for j in range(10): g.put(12 - j // 2, 22 + j, ['K']); g.put(19 + j // 2, 22 + j, ['K'])
    g.put(13, 22, ['WWWWWV', ' WRRV', ' WRrV', '  Rr', '  Rr', '  rr', '  Rr'])
    g.put(7, 25, [' R', 'RqR', ' r', ' e'])
    skull(g, 7, 6, 18, 16, top=[3, 1], chin=[0, 1, 1, 2, 4], ears=6)
    g.put(3, 0, ['        DDDDDDDD        ', '      DDNNDDKDDDDK      ', '     DNNDDDDKDDDDDK     ', '     DNDDDDDDDDDDDK     ',
                 '     GGGGGGGGGGGGGg     ', '     gggggggggggggg     ', ' DDDDDDDDDDDDDDDDDDDDDK ', 'DDDDDDDDDDDDDDDDDDDDDDDK', ' KKKKKKKKKKKKKKKKKKKKKK '])
    g.put(7, 9, ['ssssssssssssssssst'][0:1])
    g.put(9, 10, ['HHHH    HHHH'])
    g.put(10, 11, ['tttt  tttt'][0:0]); g.put(10, 11, ['ttwK    twK'][0:0])
    g.put(10, 11, ['twK', 'KKK']); g.put(19, 11, ['twK', 'KKK'][0:0]); g.put(18, 11, ['twK', 'KKK'])
    g.c[13][15] = 't'; g.put(14, 14, ['ttt'])
    g.put(9, 14, ['aa']); g.put(21, 14, ['aa'])
    g.put(7, 15, ['s', 's', 'ss', ' ss']); g.put(23, 15, ['t', 't', 'tt'][0:0]); g.put(23, 15, ['t', 't', 't'])
    g.put(11, 16, ['K      K', ' KKGKKK ', '  KKKK'])
    g.put(18, 16, ['OOOOOOOO', 'ooooooox'][0:0])
    g.put(17, 17, ['OOOOOOOOq', 'oooooooox'])
    g.put(26, 15, ['M', ' L']); g.put(27, 12, [' M', 'L', ' L']); g.put(28, 9, ['L', ' M'])
    return g

def robinhood():  # the outlaw archer: feathered pointed cap, goatee, grin, a quiver of arrows and a bow strap across the chest
    g = base()
    for i in range(10): g.put(6 + 2 * i, 31 - i, ['oo'])
    g.put(23, 9, ['W   x', 'WV qx', ' W  q', ' N  N', ' N N', 'oOOOo', 'OOOOo', 'OOOoo', 'OOOoo', 'OOOoo', 'OOOoo'])
    g.put(26, 8, ['W', 'WV'])
    skull(g, 8, 5, 16, 17, ears=8)
    g.put(5, 0, ['                     ', '          W         ', '         WW         ', '   444333WV22      ', '  44333333332211    ',
                 ' 4433333333333221   ', '44333333333333322111', '2222222222222222111 ', '  hH          Hh'][0:9])
    g.put(14, 1, ['  W', ' WV', 'WV'])
    g.put(10, 10, ['tt      tt'])
    g.put(10, 11, ['wK      wK', 'KK      KK'])
    g.c[13][15] = 't'; g.put(14, 14, ['tt'])
    g.put(9, 15, ['aa']); g.put(21, 15, ['aa'])
    g.put(12, 16, ['HH    HH', ' KKKKKK', ' KwwwwK', '  KKKK', '   HH', '   H'][0:6])
    return g

def shoplifter():  # the shoplifter: backwards cap, a bubble-gum bubble, puffy jacket with a baguette and its price tag poking out
    g = base(half0=9)
    for y in (24, 27, 30):
        for x in range(32):
            if g.c[y][x] in '34': g.c[y][x] = '2'
    g.put(13, 22, ['3333', '3333'])
    g.put(2, 13, ['      GG', '     GGgg', '    GgGgg', '   GGgGg', '  GgGgg', ' GGgGg', 'GgGgg', 'GGgg', 'ggg'][0:9])
    g.put(1, 8, ['WWWV', 'WxxV', 'WWWV', 'VVVV']); g.put(5, 12, ['N', ' N'])
    skull(g, 8, 4, 16, 18, ears=9)
    g.put(7, 1, ['    433333       ', '  4433333332     ', ' 443333333332    ', ' 4333333333333221 ', ' 433333333333332211', ' 222222222222222111', '            1111222', '             22111'][0:8])
    g.put(14, 5, ['1111'][0:0])
    g.put(5, 5, ['111'][0:0]); g.put(4, 6, ['1111'][0:0])
    g.put(8, 7, ['H', 'H'])
    g.put(10, 10, ['tt      tt'])
    g.put(10, 11, ['wK      wK', 'KK      KK'])
    g.c[13][15] = 't'; g.put(14, 14, ['tt'])
    g.put(9, 15, ['aa'])
    blob(g, [(19.5, 17.5, 3.6)], '432')
    g.c[16][18] = 'w'
    g.put(15, 17, ['KK'])
    return g

def snitch():  # the snitch: comb-over, sweat drop, eyes and a pointing finger aimed at whoever did it, mouth open to tell
    g = base()
    g.put(12, 22, ['WWW  VVV', ' WWWWVV', '  WWVV'])
    skull(g, 6, 3, 16, 19, ears=9)
    g.put(7, 2, ['  HHHHHHH     ', ' HhhhjjhhhH   ', 'Hhjhhhhhhhhh  ', ' hhhhhh  hhh  ', '       hhh hh ', '            hH'])
    g.put(6, 8, ['H', 'H', 'H']); g.put(21, 7, ['H', 'H', 'H', 'H'])
    g.put(7, 10, ['   t    t', ' tt    tt'][0:0]); g.put(8, 10, ['tt  ', '    '][0:1]); g.put(16, 9, ['  tt', 'tt'][0:0])
    g.put(8, 10, ['ttt     ttt'])
    g.put(8, 12, ['KKw    KKw'][0:0]); g.put(9, 12, ['Kw     Kw'][0:0])
    g.put(9, 12, ['wwK    wwK', 'wKK    wKK'][0:0])
    g.put(8, 12, ['WWKK   WWKK', 'VVKK   VVKK'][0:0])
    g.put(9, 12, ['WKK    WKK', 'VKK    VKK'])
    g.c[14][14] = 't'; g.put(13, 15, ['tt'])
    g.put(12, 17, [' KKK', 'KrqrK', ' KKK'])
    g.put(7, 16, ['aa']); g.put(19, 16, ['aa'])
    g.put(3, 6, [' U', 'UiU', 'UUu', ' u'])
    def arm(f):  # pointing: a fist at his shoulder and one long finger aimed out of the doorway
        f.put(21, 15, ['     SSSSSS', '  SSSSSSSSst', ' SSSSssttt', ' SSSSst', ' SStSst', ' SSSSst', '  ssst', '  4321', ' 43321', ' 43321', '433321', '433321', '433321', '43321', '43321', '4321', '4321'][0:17])
    layer(g, arm)
    return g

def sticky():  # the cat burglar: knit beanie, black domino mask, striped shirt, a string of stolen pearls stuck to one gloved hand
    g = base()
    for y in range(23, 32, 2):
        for x in range(1, 31):
            if g.c[y][x] in '1234': g.c[y][x] = 'W' if g.c[y][x] in '34' else 'V'
    skull(g, 8, 4, 16, 18, ears=9)
    g.put(7, 0, ['     444333       ', '   44333333332    ', '  4433333333332   ', ' 443333333333332  ', ' 43333333333333221', ' 4333333333333322 ',
                 ' 2323232323232321 ', ' 3232323232323212 '][0:8])
    g.put(14, 0, ['44', '']); 
    g.put(7, 10, ['NNNNNNNNNNNNNNNNNN', 'DDDWWWWDDDDWWWWDDD', 'DDWWWKKWDDWWWKKWDD', ' DDWWKKWDDWWWKKWD ', '   DDDD    DDDD'][0:4])
    g.put(7, 9, ['K', ' ', ' '][0:0])
    g.put(10, 11, ['  '][0:0])
    g.c[15][15] = 't'
    g.put(12, 17, ['KKKKKK', ' KwwK '][0:2]); g.put(13, 17, ['KwwK'][0:0])
    g.put(11, 17, ['K      K', 'KKKKKKKK', ' KwwwwK '])
    def hand(f):
        f.put(22, 19, [' N N N', ' DND D', 'DDDDDD', 'DNDDDD', 'DDDDDN', ' DDDN', '  12', ' 321', '4321', '4321', '4321', '4321', '4321'])
        f.put(23, 18, ['GG']); f.put(23, 17, ['Gw'])
    layer(g, hand)
    g.put(19, 22, ['L', 'w', ' L', ' L', '  L', '  w'][0:0])
    for (x, y) in [(21, 21), (20, 23), (20, 25), (21, 27), (22, 29)]: g.put(x, y, ['L', 'M'][:1]); g.c[y + 1][x] = 'M' if y < 30 else g.c[y + 1][x]
    for (x, y) in [(21, 21), (20, 23), (20, 25), (21, 27), (22, 29)]: g.c[y][x] = 'L'; g.c[min(31, y + 1)][x] = 'L' if y % 4 == 1 else 'M'
    return g

def bodyguard():  # a big bald bodyguard (shades, earpiece, arms folded) and the blonde client in a tiara standing right behind him
    g = doorway()
    def vip(f):
        shirt(f, cx=24, top=16, half0=4, slope=2, maxhalf=7, keys='WWVV')
        f.put(23, 15, ['ss'])
        blob(f, [(24, 8, 5.2), (20.5, 12, 2.6), (27.5, 12, 2.6)], 'YYg')
        skull(f, 20, 6, 9, 10, ears=None)
        f.put(20, 5, ['YYYYYYYYY', 'YYYYYYYgg', 'Y       g'][0:2])
        f.put(21, 3, [' G G G ', 'GGGGGGG'][0:2]); f.c[2][24] = 'G'; f.c[3][24] = 'x'
        f.put(21, 9, ['wK  wK', 'KK  KK'])
        f.c[11][24] = 't'; f.put(20, 12, ['a       a'][0:1]); f.put(23, 13, ['RR'])
        f.put(21, 16, ['L L L'][0:0]); f.put(22, 17, ['LwLLL'])
    def guard(f):
        shirt(f, cx=12, top=21, half0=9, slope=3, maxhalf=15)
        f.put(10, 20, ['sssss', ' ttt '])
        skull(f, 4, 3, 16, 18, ears=9)
        f.put(6, 3, [' w', 'ww'])
        f.put(5, 10, ['KKKKKKKKKKKKK', 'KDDDDKKKDDDDK', 'KDwDDK KDwDDK', ' KDDK   KDDK'])
        f.put(4, 10, ['K']); f.put(17, 10, ['KK'])
        f.c[14][11] = 't'; f.put(10, 15, ['tt'])
        f.put(8, 17, ['KKKKKK']); f.put(8, 16, ['t    t'])
        f.put(20, 12, ['NN', ' N', ' N', 'N', 'N'])
        f.put(0, 24, ['   4433333333333333332', '  4333333333333333332221', ' 43333333333333333322221', ' 22222222222222222221111'])
        f.put(21, 25, ['SSSst', 'SSSst']); f.put(1, 26, ['SSSs', 'SSst'])
    layer(g, vip); layer(g, guard)
    return g

F = {'thieves.accomplice': accomplice, 'thieves.crew': crew, 'thieves.cutpurse': cutpurse, 'thieves.desperado': desperado,
     'thieves.doubleagent': doubleagent, 'thieves.extortionist': extortionist, 'thieves.fixer': fixer, 'thieves.grifter': grifter,
     'thieves.kingpin': kingpin, 'thieves.robinhood': robinhood, 'thieves.shoplifter': shoplifter, 'thieves.snitch': snitch,
     'thieves.sticky': sticky, 'thieves.watchdog': bodyguard}
