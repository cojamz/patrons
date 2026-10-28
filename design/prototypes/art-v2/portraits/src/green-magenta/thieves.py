# Magenta (thieves): stealing.
from lib import *

def cutpurse():  # hood up, sly smirk, a coin purse cut loose and a couple of gold coins
    g = doorway()
    body(g); neck(g)
    g.put(5, 3, ['     444333333       ', '   4433333333332     ', '  443333333333322    ', ' 4433333333333332    ',
                 ' 433333333333333321  ', '43333111111111133221 ', '4333111111111111321  ', '433311          1321 ',
                 '43331            1321', '43331            1321', '43331            1321', '43331            1321',
                 '43331            1321', '43333            3321', '433333          33321', '4333333        333321',
                 '43333333      3333221', '433333333    33332221', ' 4333333333333332221 '])
    head(g, eyes='narrow', brows='flat', mouth='smirk', crown=False, ears=False)
    g.put(9, 9, ['1111111111111111'[:14], '11HHHHHHHHHH11'])
    g.put(10, 9, ['HhhhhhhhhhhH'])
    g.put(14, 22, ['GG', 'gg'])
    g.put(1, 13, [' GG ', 'GwGg', 'GGgg', ' gg ']); g.put(26, 20, [' GG', 'GwGg', 'Ggg', ' g'])
    g.put(3, 9, ['  o ', ' O  ', 'OOOo', 'OGOo', 'OOoo', ' oo '][0:0] or [])
    return g

def grifter():  # con man: bowler hat with a playing card in the band, wink, pencil moustache, checked vest, bow tie
    g = doorway()
    body(g); neck(g)
    for y in range(24, 32):
        for x in range(11, 21):
            g.c[y][x] = '3' if (x // 2 + y // 2) % 2 else '4'
    g.put(10, 23, ['22      22', ' 22    22 ', '  2    2  '])
    g.put(13, 22, ['33  33', '332233', '33  33'])
    head(g, eyes='wink', brows='raised', mouth='smirk')
    g.put(12, 16, ['HHHH  HHHH'][0:0] or [' HHH  HHH'])
    g.put(8, 0, ['                ', '      DDDD      ', '    DDNNDDDD    ', '   DNNDDDDDDD   ', '  DNDDDDDDDDDD  ',
                 '  D3333333333D  ', 'D 2222222222221 D', 'DDDDDDDDDDDDDDDD', ' DDDDDDDDDDDDDD '])
    g.put(19, 2, ['WWW', 'WxW', 'WWW', 'VVV'])
    g.put(8, 9, ['  HH        HH  '])
    return g

def sticky_fingers():  # cat burglar: knit beanie, black eye mask, striped shirt, pearls stuffed in a pocket
    g = doorway()
    body(g); neck(g)
    for y in range(23, 32, 2):
        for x in range(1, 31):
            if g.c[y][x] in '1234': g.c[y][x] = 'W' if x < 25 else 'V'
    head(g, eyes='dot', brows='raised', mouth='grin')
    g.put(7, 1, ['     444333       ', '   44333333332    ', '  4433333333332   ', '  4333333333333 2 ', ' 43333333333333221',
                 ' 4333333333333322 ', ' 2323232323232321 ', ' 3232323232323212 '])
    g.put(13, 0, ['4422'])
    g.put(7, 10, [' KKKKKKKKKKKKKK  ', 'KKK  KKKKKK  KKK ', 'KK    KKKK    KKK', 'KKK  KKKKKK  KKK ', ' KKKKKK  KKKKKK  '])
    g.put(10, 11, ['  ', 'wK      wK', 'KK      KK'][0:0] or [])
    g.put(10, 12, ['wK', 'KK']); g.put(19, 12, ['wK', 'KK'])
    g.put(5, 24, ['LwL', 'LLL', ' L L', 'L L L'][0:2])
    g.put(3, 22, ['  LL', ' LwL', 'L  L', 'LL L'][0:0] or [])
    g.put(21, 25, ['L L L', ' L L ', '  L  '][0:0] or [])
    return g

def desperado():  # outlaw: wide cowboy hat, bandana over the nose, squint, bullet belt
    g = doorway()
    body(g); neck(g)
    for i in range(10):
        y = 22 + i; x = 6 + 2 * i
        g.put(x, y, ['oo']);
        if i % 2 == 0: g.put(x + 1, y - 1, ['G'])
    head(g, eyes='narrow', brows='angry', mouth='flat', cheeks=False)
    g.put(7, 15, ['3333333333333333 ', ' 33333333333332  ', ' 4333333333332   ', '  43W3333W322    ', '   3333333322    ',
                  '    433W332     ', '     4332      ', '      32       '])
    g.put(8, 15, ['44'])
    g.put(1, 1, ['         OOOOOO          ', '        OOOOOOOO         ', '       OOOOOOOOOO        ', '       OOOOOOOOOOo       ',
                 '       OOOOOOOOOOo       ', '       oooooooooooo      ', 'OO    OOOOOOOOOOOo    oo', 'OOOOOOOOOOOOOOOOOOOOOOoo',
                 ' OOOOOOOOOOOOOOOOOOOOoo ', '  ooooooooooooooooooo   '])
    g.put(12, 2, ['O  O', ' OO'])
    g.put(8, 1, ['O']) 
    g.put(10, 4, ['OO'])
    return g

def robin_hood():  # feathered pointy cap, goatee, quiver of arrows over the shoulder, strap
    g = doorway()
    g.put(22, 4, ['x  W ', 'xx WW', 'xx WW', ' M  M', ' M  M', ' M  M', 'OOOOOO', 'OOOOoo', 'OGGGgo', 'OOOOoo', 'OOOOoo', 'OOOOo', 'OOOOo', 'OOOo', 'OOo'])
    body(g); neck(g)
    for i in range(10):
        y = 22 + i; x = 22 - 2 * i
        g.put(x, y, ['oO'])
    g.put(9, 22, ['4  4  ', ' 44 4 ', '  4   '][0:0] or [])
    head(g, eyes='dot', brows='raised', mouth='grin')
    g.put(9, 16, ['    HH  HH    ', '    HHHHHH    ', '              ', '     HHHH     ', '      HH      '])
    g.put(14, 17, ['    '])
    g.put(1, 1, ['            4433        ', '          44333332      ', '        443333333322    ', '      44333333333332    ',
                 '    443333333333333322  ', '  4433333333333333332   ', '  2222222222222222211   ', '       hhhhhhhhhhhh     ',
                 '      hH          hH    '])
    g.put(4, 0, [' R', 'RRq', 'Rqq', ' Rq', '  R', '   r'])
    g.put(6, 6, [' R', 'R'])
    return g

def extortionist():  # loan shark: slicked hair, shades, toothpick, gold chain, open collar
    g = doorway()
    body(g); neck(g)
    g.put(9, 22, ['WWW      VVV', ' WWWW  VVVV', '  WW s VV ', '   W sss V'][0:0] or [])
    g.put(10, 22, ['WW    VV', ' WW  VV ', '  WsSs  ', '   ss   '])
    g.put(10, 22, ['WW', ' WW', '  W']); g.put(20, 22, ['VV', 'VV', 'V'])
    g.put(12, 23, ['G      G', ' G    G', '  GggG', '   GG'])
    head(g, eyes='dot', brows='angry', mouth='frown')
    g.put(8, 2, ['    HHHHHHHH    ', '  HhjjjjhhhhHH  ', ' HhjjhhhhhhhhhH ', 'HhjhhhhhhhhhhhhH', 'HhhhhhhhhhhhhhhH', 'hhhSSSSSSSSSShhH', 'hSSSSSSSSSSSSShH'])
    g.put(8, 11, ['KKKKKKKKKKKKKKKK', ' DDDDDKKDDDDD   ', ' DwDDD  DwDDD   ', '  DDD    DDD    '])
    g.put(18, 17, ['KK', '  VV', '    V'])
    g.put(10, 16, ['  t     t ', 't  t  t  t'][0:0] or [])
    g.put(9, 18, [' t      t', '  t t t ']) 
    return g

def bodyguard():  # bald heavy, flat-top neck, earpiece coil, scowl, arms crossed over a tight tee
    g = doorway()
    body(g, half0=10, slope=3)
    g.put(12, 21, ['ssssssss', ' tttttt '])
    def arms(f):  # arms folded: a sleeve and forearm from each side, fists tucked
        f.put(1, 24, ['4433           ', '433333         ', '43333SSSSSSSSs ', '4333SSSSSSSSSSt', ' 333sSSSSSSSSStt', '  2  ssssssssst'])
    layer(g, arms)
    def arm2(f):
        f.put(13, 26, ['         2211', '  SSSSSSSs221', 'SSSSSSSSSSs21', 'SStSStSSSst21', 'sssssssssst2 '])
    layer(g, arm2)
    g.put(7, 9, ['s', 's'])
    head(g, x=7, y=8, eyes='narrow', brows='angry', mouth='flat', cheeks=False)
    g.put(7, 9, ['SSSSSSSSSSSSSSsst'][0:0] or [])
    g.put(7, 2, ['     SwwSSSSS    ', '   SSwSSSSSSSss  ', '  SSSSSSSSSSSSss ', ' SSSSSSSSSSSSSsst'])
    g.put(7, 17, [' tSSSSSSSSSSsst ', ' SSSSSSSSSSSSst  ', '  SSSSSSSSSSst   ', '   tsssssssst    '])
    g.put(11, 17, ['  KKKKKK'][0:0] or [])
    g.put(12, 16, ['KKKKKK'])
    g.put(24, 10, ['N', 'NN', ' N', 'N', ' N', 'N', ' N', 'N'])
    g.put(16, 14, ['t'])
    return g

def crew():  # a heist crew of three: flat cap, beanie, and a red bandana on the one in front
    g = doorway()
    def left(f):
        body(f, cx=8, top=20, half0=5, slope=3, maxhalf=7)
        mini(f, 3, 9, eyes='narrow', mouth='smirk')
        f.put(2, 6, ['   444333  ', ' 4433333322', '43333333332', '22222222221', ' h       h'][:5])
        f.put(1, 9, ['2221'])
    def right(f):
        body(f, cx=24, top=20, half0=5, slope=3, maxhalf=7)
        mini(f, 19, 9, eyes='dot', mouth='flat', cheeks=False)
        f.put(19, 6, ['   NNNN   ', ' MMNNNNNN ', 'MMNNNNNNNN', 'LMMMMMMMMN', 'MNMNMNMNMN'])
        f.put(20, 17, ['t t t t'])
    left(g); right(g)
    def mid(f):
        body(f, cx=16, top=19, half0=6, slope=3, maxhalf=9)
        f.put(13, 19, ['  GG', ' GgGg', ' GGgg', '  gg'][0:0] or [])
        mini(f, 11, 7, eyes='dot', mouth='smile')
        f.put(11, 4, ['  RRRRRR  ', ' RqqRRRRr ', 'RqRRRRRRrr', 'RRqRRRRRrr', 'rRR    Rrr'])
        f.put(20, 5, [' Rr', 'R r', ' r'])
    layer(g, mid)
    return g

def double_agent():  # one face, two sides: half the face hidden behind a pale mask, a pin for each side
    g = doorway()
    body(g); neck(g)
    g.put(3, 18, ['44  ', '443 ', '4433', ' 433', '  43']); g.put(25, 18, ['  21', ' 221', '2221', '221 ', '21  '])
    g.put(12, 22, ['W    W', 'WW  WW', ' WKKW', '  KK', '  KK', '  KK'])
    g.put(7, 26, ['xx', 'xx']); g.put(23, 26, ['yy', 'yy'])
    head(g, eyes='dot', brows='flat', mouth='smile')
    g.put(8, 2, ['    HHHHHHHH    ', '  HhhjjjhhhhHH  ', ' HhjjhhhhhhhhhH ', 'Hhjhhhhhh hhhhhH', 'hhhhhh  SSSShhhH', 'hhSSSSSSSSSSShhH', 'hSSSSSSSSSSSSShH'])
    g.put(16, 7, ['WWWWWWW', 'WWWWWWWV', 'WWWWWWWV', 'WWWWWWWV', 'WWKKWWWV', 'WWKKWWVV', 'WWWWWWVV', 'WWWWWWV', 'WWWWWWV',
                  'KKKKWVV', 'WWWWVV', 'WWWVV', 'WVV '])
    g.put(16, 10, ['KKK'])
    g.put(16, 16, ['K'])
    g.put(16, 18, [' '])
    return g

def fixer():  # sleek black bob, cat-eye glasses, red lips, pencil behind the ear, padded blazer, pearl earrings
    g = doorway()
    g.put(4, 8, ['  KKKKKK', ' KKDDDDKK', 'KKDDDDDDKK'][0:0] or [])
    for y in range(3, 21):
        hw = {3: 6, 4: 8, 5: 9}.get(y, 10)
        for x in range(16 - hw, 16 + hw):
            k = x - (16 - hw)
            g.c[y][x] = 'D' if k < 2 else ('K' if k >= 2 * hw - 3 else 'K')
    body(g, half0=9); neck(g)
    g.put(1, 22, ['4     ', '44    ', '444  ', '4444', ' 444'])
    g.put(11, 22, ['WWW  WWW', ' WWWWWW ', '  WWWW', '   G'])
    head(g, eyes='dot', brows='flat', mouth='smile', crown=False)
    g.put(6, 2, ['    DDDDDDDDDD      ', '   DDDKKKKKKKKKK    ', '  DDKKKKKKKKKKKKK   ', ' DDKKKKKKKKKKKKKKK  ', ' DKKKKKKKKKKKKKKKKK ',
                 ' DKKKKKKKKKKKKKKKKK ', 'DKKSSSSSSSSSSSSSSKK ', 'DKKSSSSSSSSSSSSSSKK ', 'DKKSSSSSSSSSSSSSSSKK'][0:9])
    g.put(8, 8, ['KSSSSSSSSSSSSSSK'])
    g.put(8, 9, ['KS', 'KS', 'KS', 'KS', 'KS', 'KS', 'KS', 'KS', 'KK']); g.put(22, 9, ['SK', 'sK', 'sK', 'sK', 'sK', 'sK', 'sK', 'sK', 'KK'])
    g.put(8, 10, ['K              K', 'KKKKKK  KKKKKKK', ' KSwKK  KSwKK', '  KKK    KKK'])
    g.put(10, 12, ['KK']); g.put(18, 12, ['KK'])
    g.put(10, 11, ['SwK']); g.put(18, 11, ['SwK'])
    g.put(13, 17, [' RRRR', 'RRqRRR', ' rrrr'][0:0] or [])
    g.put(13, 17, ['R    R', ' RRRR '])
    g.put(6, 16, ['W', 'w'][0:1]); g.put(25, 16, ['W'])
    g.put(24, 5, ['  Y', ' Yg', 'Yg ', 'Y'][0:3])
    return g

def kingpin():  # crime boss: fedora with a band, cigar with smoke, heavy jowls, pinstripes, a rose
    g = doorway()
    body(g, half0=9); neck(g)
    for y in range(23, 32):
        for x in range(1, 31, 3):
            if g.c[y][x] in '23': g.c[y][x] = '4'
    g.put(11, 22, ['WW    WW', ' WW  WW ', '  WKKW', '   KK', '   KK', '   KK', '   KK'])
    g.put(6, 24, [' R', 'RqR', ' Re', '  e'])
    head(g, x=7, eyes='narrow', brows='dark', mouth='smirk')
    g.put(7, 17, [' SSSSSSSSSSSSssts', ' SSSSSSSSSSSSSsst', '  SSSSSSSSSSSsst ', '   tssssssssst   '][0:0] or [])
    g.put(6, 0, ['                    ', '     NNDDDDDDNN      ', '    NDDDDDDDDDDD     ', '   NDDDDDDDDDDDDD    ', '   NDDDDDDDDDDDDD    ',
                 '   2333333333333331  ', ' NNDDDDDDDDDDDDDDDDD ', 'NNDDDDDDDDDDDDDDDDDDD', '  KKKKKKKKKKKKKKKK   '])
    g.put(9, 3, ['DDD  DDD'][0:0] or [])
    g.put(11, 2, ['KK    KK'][0:0] or [])
    g.put(16, 16, ['ooooooo', 'oooooox'][0:0] or [])
    g.put(17, 17, ['OOOOOOx', 'ooooooo'])
    g.put(24, 11, ['  M', ' M', 'M', ' M', '  M', ' M'])
    return g

def snitch():  # nervous informer: comb-over, shifty eyes, sweat drops, a whistle in his mouth
    g = doorway()
    body(g); neck(g)
    g.put(11, 22, ['WWW  VVV', ' WW  VV', '  W  V'])
    head(g, eyes='right', brows='worried', mouth='o')
    g.put(8, 2, ['     HhhhhH     ', '   HhhjjjhhhhH  ', '  hjjhhhhhhhhh  ', ' hhh  SSSSSSShh ', ' h SSSSSSSSSSSh ', 'h  SSSSSSSSSSShH', 'hSSSSSSSSSSSSSsH'])
    g.put(6, 11, ['tt', 'ts', 'ts', 'tt'][0:0] or [])
    g.put(6, 11, ['ss', 'Ss', 'ss', ' t']); g.put(24, 11, ['tt', 'st', 'tt', 't'])
    g.put(14, 17, ['MLLLLLLL', 'NMMMMMMM', '    NN  '][0:3])
    g.put(16, 16, ['  LLLLL', 'LLLLLLLM', 'MMLMMMMN', '  NMMN', '   NN'])
    g.put(21, 21, ['y', 'y', ' y', ' y'][0:0] or [])
    g.put(15, 17, ['K']) 
    g.put(4, 6, [' y', 'yiy', 'yiy', ' y']); g.put(25, 4, [' y', 'yiy', ' y'])
    return g

def shoplifter():  # backwards cap, bubble gum bubble, puffy jacket with a baguette and price tag poking out
    g = doorway()
    g.put(23, 13, ['  GGG', ' GGGg', ' GgGg', ' GGgg', ' GgGg', 'GGGg', 'GgGg', 'GGg', 'Ggg'])
    body(g); neck(g)
    for y in (25, 28, 31):
        for x in range(1, 31):
            if g.c[y][x] in '34': g.c[y][x] = '2'
    g.put(12, 22, ['WW  VV', ' 3  2'][0:1])
    g.put(5, 22, ['   W', '  W', ' WWW', ' WVW', ' WWW'])
    head(g, eyes='left', brows='raised', mouth='smile')
    g.put(7, 2, ['     444333       ', '   44333333332    ', '  4433333333332   ', '  4333333333332   ', ' 2222222222222221 ', 'hh            2221'])
    g.put(19, 4, ['  ', ' K K'][0:0] or [])
    g.put(21, 5, ['K  ', ' W  '][0:0] or [])
    g.put(22, 6, ['11111', '111'][0:2])
    g.put(8, 8, ['hh', 'h']); g.put(22, 8, ['H', 'H'])
    g.put(11, 16, ['   4444', '  443333', ' 43333332', ' 4w333332', ' 43333332', '  433322', '   2222'])
    return g

ALL = [('thieves.cutpurse', 'Cutpurse', cutpurse), ('thieves.grifter', 'Grifter', grifter),
       ('thieves.sticky', 'Sticky Fingers', sticky_fingers), ('thieves.desperado', 'Desperado', desperado),
       ('thieves.robinhood', 'Robin Hood', robin_hood), ('thieves.extortionist', 'Extortionist', extortionist),
       ('thieves.watchdog', 'Bodyguard', bodyguard), ('thieves.crew', 'Crew', crew),
       ('thieves.doubleagent', 'Double Agent', double_agent), ('thieves.fixer', 'Fixer', fixer),
       ('thieves.kingpin', 'Kingpin', kingpin), ('thieves.snitch', 'Snitch', snitch), ('thieves.shoplifter', 'Shoplifter', shoplifter)]
