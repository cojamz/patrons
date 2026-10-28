# Silver: sharing, parties, giving.
from common import *

def guest():  # arrived in their best: side-parted wave, HELLO name sticker, a wrapped gift at the door
    g = doorway(); shoulders(g); vneck(g, 'W', half=3, every=2); neck(g)
    g.put(15, 24, ['UU', 'Uu', 'UU', 'uU'])
    g.put(19, 25, ['xxxxx', 'WWWWW', 'WKKKW', 'WWWWW'])
    head(g)
    g.put(7, 2, ['     HHHHHHHH    ',
                 '   HhjjjhhhhhhH  ',
                 '  HhjjjjhhhhhhhH ',
                 ' HhjjhhhhhhhhhhhH',
                 ' HhjhhhhhhhHHhhhH',
                 ' HhhhhhHHHSSShhhH',
                 ' HhhHHHSSSSSSShhH',
                 ' HhH          shH',
                 ' HH            HH'])
    eyes(g, 'happy'); mouth(g, 'grin')
    g.put(2, 15, ['  G ', ' G G', 'UUGUU', 'UUGUu', 'GGGGG', 'UUGUu', 'uuGuu'])
    return g

def benefactor():  # kindly grandmother: cloud of white curls, pearl earrings, shawl, eyes crinkled shut
    g = doorway(); shoulders(g); neck(g)
    g.put(4, 22, ['    RRR        ', '  RRrRRR', 'RRRrRRRRr', 'RRrRRRRRRrR', 'qRRRrRRRRRrRR', 'qRRRRRrRRRRRRr'])
    g.put(16, 23, ['    rRRRRRRR', '  RRRRrRRRRRRr', 'RRRrRRRRRRrRRRR', 'rRRRRRRrRRRRRRr'])
    g.put(14, 27, ['GG', 'gg'])
    head(g)
    g.put(5, 1, ['        VWWVWV        ',
                 '      WWWWVWWWWV      ',
                 '    VWWWWWWVWWWWWV    ',
                 '   WWWWVWWWWWWVWWWV   ',
                 '  WWWWWWWWVWWWWWWWVV  ',
                 '  VWWVWWWWWWWVWWWWVV  ',
                 '  WWWWVSSSSSSWWVWWVV  ',
                 '  VWWWSSSSSSSSSWWWWV  ',
                 '  VWWV          WWVV  ',
                 '   VWV          VWV   ',
                 '    V            V    '])
    eyes(g, 'happy'); mouth(g, 'smile')
    g.put(7, 14, ['L', 'M']); g.put(24, 14, ['L', 'M'])
    g.put(25, 16, [' LL ', 'LwLM', 'LLMM', ' MN '])
    g.put(28, 13, ['w'])
    return g

def majordomo():  # the butler: slick hair, nose in the air, tails, white tie front, a silver cloche
    g = doorway(); shoulders(g); vneck(g, 'W', half=3, every=3, ledge='1', redge='1'); neck(g)
    g.put(13, 23, ['KK  KK', 'KKKKKK', 'KK  KK'])
    g.put(15, 27, ['K', '', 'K', '', 'K'])
    g.put(8, 25, ['W', 'WW'])
    head(g, cheeks=False)
    g.put(8, 2, ['    HHHHHHHH    ',
                 '  HHjjjjhhhhHH  ',
                 ' HjjjjjhhhhhhhH ',
                 'HjjhhhhhhhhhhhhH',
                 'HhhhhhhhhhhhhhhH',
                 'HhhSSSSSHhhhhhHH',
                 'HhSSSSSSSSSShhhH',
                 'HS            SH',
                 'H              H'])
    eyes(g, 'lidded'); mouth(g, 'flat')
    g.put(9, 9, ['tt  ']); g.put(18, 9, ['tt'])
    g.put(1, 14, ['   LL   ', '  LLLM  ', ' LLwLMM ', 'LLLLLMMN', 'NNNNNNNN', ' MMMMMM '])
    return g

def retinue():  # three attendants in matching pillbox caps and buttoned jackets
    g = doorway()
    for cx, top in ((7, 21), (25, 21)):
        body(g, cx, top, half0=3, slope=2, maxhalf=6)
    for cx in (7, 25):
        for y in (24, 27, 30): g.c[y][cx] = 'G'
    small(g, 2, 9, 'smile'); small(g, 20, 9, 'smile')
    g.put(3, 6, ['RRRRRRR', 'RqRRRRr', 'rrrrrrr']); g.put(21, 6, ['RRRRRRR', 'RqRRRRr', 'rrrrrrr'])
    g.put(2, 9, ['h        H']); g.put(20, 9, ['H        h'])
    body(g, 16, 20, half0=4, slope=2, maxhalf=8)
    for y in (23, 26, 29): g.c[y][16] = 'G'
    g.put(14, 20, ['ssss'])
    small(g, 11, 8, 'smile')
    g.put(12, 5, ['RRRRRRR', 'RqRRRRr', 'rrrrrrr'])
    g.put(11, 8, ['hh      Hh'])
    g.put(13, 2, ['  g'])
    return g

def cone(g, x, y, a, b):  # little striped party hat with a pom
    g.put(x, y, ['  w  ', '  a  ', ' ab  ', ' bab ', 'abab ', 'babab'])
    for r in range(y, y + 6):
        for c in range(x, x + 5):
            if g.c[r][c] == 'a': g.c[r][c] = a
            elif g.c[r][c] == 'b': g.c[r][c] = b

def revelers():  # three party-goers mid-laugh: party hats, streamers, confetti
    g = doorway()
    body(g, 7, 22, half0=3, slope=2, maxhalf=6); body(g, 25, 22, half0=3, slope=2, maxhalf=6)
    small(g, 2, 10, 'laugh'); small(g, 20, 10, 'o')
    g.put(2, 9, [' HhhhhhhH ']); g.put(20, 9, [' HHhhhhhH '])
    g.put(1, 10, ['H', 'H', 'H']); g.put(30, 10, ['H', 'H', 'H'])
    cone(g, 4, 3, 'x', 'Y'); cone(g, 23, 3, 'y', 'W')
    body(g, 16, 20, half0=4, slope=2, maxhalf=8)
    small(g, 11, 8, 'laugh')
    g.put(11, 7, [' HhjjhhH ', 'Hhjhhhhhh'])
    cone(g, 13, 1, 'z', 'G')
    g.put(14, 20, ['ssss'])
    g.put(5, 23, ['x', ' x', 'x ', ' x']); g.put(21, 22, ['  z', ' z', 'z', ' z', '  z'])
    for (x, y) in [(10, 3), (20, 2), (27, 9), (3, 18)]: g.c[y][x] = 'Y'
    for (x, y) in [(9, 6), (22, 6), (28, 15)]: g.c[y][x] = 'x'
    return g

def heir():  # spoiled young heir: golden curls, little coronet, sash, lace collar, bored eyes
    g = doorway(); shoulders(g); neck(g)
    g.put(11, 22, ['WVW    WVW', ' WVWVWVWV', '   WVWV'])
    for k in range(9):
        g.put(9 + k, 23 + k, ['UU'])
    g.put(18, 27, ['G', 'g'])
    head(g)
    g.put(6, 2, ['     YYYYYYYYYY     ',
                 '   YYgYYYYYYgYYY    ',
                 '  YgYYgYYYYgYYgYY   ',
                 '  YYYYYYYYYYYYYYgY  ',
                 '  gYYgYYSSYYgYYYYg  ',
                 '  YYgSSSSSSSSSSgYY  ',
                 '  YgY          YgY  ',
                 '  gYY          YYg  ',
                 '   YgY        YgY   ',
                 '   gY          Yg   '])
    g.put(11, 0, ['G  G  G', 'GGxGxGG', 'GgGgGgG'])
    for r in range(12, 17): g.c[r][6] = 'Y' if r % 2 else 'g'; g.c[r][25] = 'g' if r % 2 else 'Y'
    eyes(g, 'lidded'); mouth(g, 'tiny')
    return g

def upstart():  # born with a silver spoon: tall pompadour, popped collar, smug brows, spoon in the mouth
    g = doorway(); shoulders(g); vneck(g, 'q', half=3, every=3, ledge='R', redge='r'); neck(g)
    g.put(9, 21, ['RR', 'RRR', 'RRqR']); g.put(21, 21, [' rr', 'rRr', 'rRRr'])
    head(g)
    g.put(7, 0, ['      HHHHHHH     ',
                 '    HHjjjjhhhhH   ',
                 '   HjjjjhhhhhhhH  ',
                 '  HjjhhhhhhhhhhhH ',
                 '   HhhhhhhhhhhhhH ',
                 '  HhhhhhhhhhhhhhhH',
                 ' HhhhSSSSSShhhhhH ',
                 ' HhSSSSSSSSSSSShH ',
                 ' H              H '])
    eyes(g, 'lidded')
    g.put(9, 10, ['tt']); g.put(18, 10, ['tt'])
    g.put(13, 17, ['KKKK', 'tKKt'])
    g.put(16, 17, ['LLLLLLLL', 'MMMMMMLLL', '      LLM', '       M'])
    return g

def debutante():  # tiara, ringlets, pearl necklace, off-shoulder gown, lashes and rosy cheeks
    g = doorway(); shoulders(g, start=8)
    g.put(9, 22, ['SSSSSSSSSSSSSs', ' sSSSSSSSSSSss', '  sssssssssss'])
    g.put(12, 23, ['L L L L L', ' L L L L'])
    g.put(15, 25, ['Lw'])
    head(g)
    g.put(6, 2, ['      HHHHHHHH      ',
                 '    HHhhjjjhhhhH    ',
                 '   HhhjjhhhhhhhhH   ',
                 '  HhjjhhhhhhhhhhhH  ',
                 '  HhhhhhhhhhhhhhhH  ',
                 '  HhhhSSSShhhSShhH  ',
                 '  HhSSSSSSSSSSSShH  ',
                 '  Hhh          hhH  ',
                 '  hHh          hHh  '])
    g.put(11, 2, [' L  w  L ', 'LwLLxLLwL', ' MLMMMLM '])
    for (x, y) in ((5, 12), (24, 12)):
        g.put(x, y, ['hh ', 'Hjh', 'hH', 'Hjh', 'hH', 'Hjh', ' hH'])
    g.put(9, 11, ['KK      KK']); g.put(17, 11, [' KK'])
    mouth(g, 'smile')
    return g

def grandhost():  # big jolly host: slick bald top, handlebar mustache, carnation, a raised glass
    g = doorway(); shoulders(g, start=9, slope=4); vneck(g, 'W', half=3, every=2); neck(g)
    g.put(13, 23, ['KK  KK', 'KKKKKK', 'KK  KK'])
    g.put(8, 25, [' x', 'xqx', ' z'])
    g.put(7, 3, ['   SSSSSSSSSS   ', '  SSwwSSSSSSSs  '])
    head(g, x=7)
    g.put(7, 3, ['     SSSSSSS     ', '   SwwSSSSSSSs   '])
    g.put(5, 8, ['Hhh', 'Hhhh', 'Hhh', 'Hh']); g.put(22, 8, [' hhH', 'hhhH', ' hhH', '  hH'])
    g.put(5, 18, ['ss', ' s']); g.put(22, 18, ['ss', 's'])
    head(g, x=8, ears=False)
    g.put(8, 3, ['    SSSSSSSS    ', '  SwwSSSSSSSs   ', ' SwwSSSSSSSSss  '])
    g.put(7, 9, ['HH', 'Hh', 'Hh', 'Hh', 'H']); g.put(23, 9, ['HH', 'hH', 'hH', 'hH', ' H'])
    eyes(g, 'happy')
    g.put(9, 15, ['H           H', 'HhhhhhH Hhhhhh', ' H  hhhhhh  H'])
    mouth(g, 'laugh'); g.put(12, 16, ['hhhhhhhh'])
    g.put(25, 7, [' w', 'w  w', 'LwYL', 'LYYL', 'LYYL', ' LL', '  L', '  L', ' LLL'])
    g.put(23, 15, [' ss', 'sss', 'ss'])
    return g

def saint():  # patron saint: a gold halo, white veil, eyes closed in peace, gentle smile
    g = doorway(); shoulders(g)
    g.put(9, 18, ['WV            VW', 'WWV          VWW', 'WWWV        VWWV', 'WWWWVV    VVWWWV'])
    g.put(5, 22, ['WWWWWW', 'WWWWVV', 'WWVV', 'VV']); g.put(21, 22, ['VVWWWW', 'VVWWWV', '  VWWV', '    VV'])
    g.put(13, 22, ['W    W', ' W  W', '  WW'])
    g.put(14, 26, ['GG', 'GG', 'gg']); g.put(13, 27, ['G  g'])
    g.put(8, 0, ['    GGGGGGGG    ', ' GGGg      gGGG ', 'GGg          gGG', ' gGG        GGg ', '   gGGGGGGGGg   '])
    head(g)
    g.put(7, 4, ['    WWWWWWWW     ',
                 '  WWWWWWWWWWVV   ',
                 ' WWWWWWWWWWWVVV  ',
                 'WWWVSSSSSSSSVVVV ',
                 'WWVSSSSSSSSSSSVVV',
                 'WWV           VVV',
                 'WWV           SVV',
                 'WWV            VV',
                 'WWV            VV',
                 'WWV            VV',
                 'WWV            VV',
                 'WWWV          VVV',
                 'WWWV          VVV',
                 'WWWWV        VWWV'])

    eyes(g, 'shut'); mouth(g, 'smile')
    return g

ENTRIES = [('silver.guest', 'Guest', guest), ('silver.benefactor', 'Benefactor', benefactor),
           ('silver.majordomo', 'Majordomo', majordomo), ('silver.retinue', 'Retinue', retinue),
           ('silver.revelers', 'Revelers', revelers), ('silver.heir', 'Heir', heir),
           ('silver.spoon', 'Upstart', upstart), ('silver.gala', 'Debutante', debutante),
           ('silver.grandhost', 'Grand Host', grandhost), ('silver.saint', 'Patron Saint', saint)]
