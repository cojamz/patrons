# Gold: money, riches.
from common import *

def coins(g, x, y, n=3):  # a little stack of coins, top coin glinting
    rows = [' GG ', 'GwGG']
    for k in range(n - 1): rows += ['gggg', 'GGGG']
    rows += ['gggg']
    g.put(x, y, rows)

def banker():  # slick center part, mutton chops, round spectacles, red bow tie, pocket watch chain
    g = doorway(); shoulders(g); vneck(g, 'W', half=3); neck(g)
    g.put(13, 23, ['RR  RR', 'RqrrqR', 'RR  RR'])
    g.put(8, 27, ['g', ' GgG', '    g'])
    g.put(20, 26, ['WW'])
    head(g)
    g.put(8, 2, ['    HHHHHHHH    ',
                 '  HHhhjjHhhhHH  ',
                 ' HhjjjhhHHhhhhH ',
                 'HhjjhhhhHHhhhhhH',
                 'HhjhhhhSSHhhhhHH',
                 'HhhhSSSSSSSShhhH',
                 'HhSSSSSSSSSSSShH',
                 'HS            sH'])
    for r in range(10, 14): g.c[r][8] = 'H'; g.c[r][23] = 'H'
    g.put(8, 14, ['Hh', 'Hhh', 'Hhh', 'Hh']); g.put(21, 14, [' hH', 'hhH', 'hhH', ' hH'])
    g.put(9, 10, [' tt     tt ']); g.put(17, 10, [' tt'])
    g.put(9, 11, [' NN ', 'N  N', 'N  N', ' NN ']); g.put(17, 11, [' NN ', 'N  N', 'N  N', ' NN '])
    g.put(13, 12, ['NNNN'])
    mouth(g, 'smile')
    coins(g, 3, 15)
    return g

def taxman():  # bowler hat, pencil mustache, squint, frown, pencil behind the ear, dark tie
    g = doorway(); shoulders(g); vneck(g, 'W', half=3, every=2); neck(g)
    g.put(15, 23, ['DD', 'DD', 'DD', 'NDD', 'DDD', 'DDD', 'DDD', 'DDD', 'DD'])
    head(g, cheeks=False)
    g.put(7, 1, ['      DDDDDD      ',
                 '    DNNDDDDDDD    ',
                 '   DNNDDDDDDDDD   ',
                 '   DNDDDDDDDDDD   ',
                 '   DDDDDDDDDDDD   ',
                 '   KKKKKKKKKKKK   ',
                 'DNNDDDDDDDDDDDDDDD',
                 ' HHH          HHH '])
    eyes(g, 'squint')
    g.put(12, 16, ['HHHHHHHH'])
    mouth(g, 'frown'); g.put(13, 16, ['HHHHHH'])
    g.put(25, 8, ['qq', 'YY', 'YY', 'YY', 'YY', 'Oo', ' K'])
    return g

def merchant():  # cream turban with a ruby, full beard, big smile, gold earring, red robe
    g = doorway(); shoulders(g); vneck(g, 'R', half=4, ledge='G', redge='g'); neck(g)
    head(g)
    g.put(6, 1, ['       WWWWWW       ',
                 '     WWWWWVVWWWW    ',
                 '   WWWWVVWWWWWVVWV  ',
                 '  WWWVVWWWWGGWWWVVV ',
                 '  WWVWWWWWGxxGWVVWVV',
                 ' WWWWWWWVVWGGWWWVVVV',
                 ' VWWWWVVWWWWWWWVVWVV',
                 '  VVVVVVVVVVVVVVVVV '])
    g.put(8, 15, ['Hh            hH',
                  'Hhh jjhhhhhh hhH',
                  'HhhhhKwwwwKhhhhH',
                  ' HhhhhKKKKhhhhH ',
                  '  HjhhhhhhhhhH  ',
                  '   Hjhhhhhhhh   ',
                  '    Hhhhhhhh    ',
                  '     HhhhhH     ',
                  '      HhhH      '])
    g.put(7, 14, ['G', 'g'])
    return g

def thrift():  # bald old miser, white tufts, bushy brows, biting a coin to test it, patched coat
    g = doorway(); shoulders(g); neck(g)
    g.put(12, 22, ['V', 'V']); g.put(19, 22, ['V', 'V'])
    g.put(22, 26, ['OOOO', 'OKOO', 'OOKO', 'oooo'])
    head(g, cheeks=False)
    g.put(12, 4, ['  w ', ' ww '])
    g.put(10, 7, ['  ssss  ss  '])
    g.put(6, 8, ['WW', 'WWV', 'WWWV', 'VWWV', ' VV']); g.put(23, 8, [' VW', 'VWW', 'VWWW', 'VWWV', 'VV '])
    eyes(g, 'squint'); g.put(9, 10, ['WWWV', '    ']); g.put(17, 10, ['WWWV'])
    g.put(13, 16, ['  GG  ', ' GwGG ', 'KGGGgK', ' gGgg ', '  gg  '])
    g.put(9, 16, ['t']); g.put(22, 16, ['t'])
    return g

def underdog():  # scrappy kid: newsboy cap, plaster on the cheek, gap-tooth grin, suspenders
    g = doorway(); shoulders(g); neck(g)
    g.put(13, 22, ['W', 'WW']); g.put(18, 22, [' W', 'WW'])
    for y in range(23, 32): g.c[y][11] = 'o'; g.c[y][20] = 'o'
    g.put(23, 27, ['EEE', 'EKE', 'EEE'])
    head(g)
    g.put(6, 2, ['      MMMMMMMMM     ',
                 '    MLLMMNMMMMMMMN  ',
                 '   MLLMMMMMNMMMMMNN ',
                 '  MLMMNMMMMMMMNMMNNN',
                 '  NNNNNNNNNNNNNNNNN ',
                 'NNNNNNNNNN  hhH hHH ',
                 '      hHhh     h    '])
    g.put(14, 2, ['NN'])
    eyes(g, 'wide')
    mouth(g, 'gap')
    g.put(18, 15, ['VWWV', 'VWWV'])
    g.put(9, 15, [' t t', 't t'])
    return g

def tinker():  # alchemist: wild singed hair, brass goggles up on the forehead, soot smudge, a little flask
    g = doorway(); shoulders(g); vneck(g, 'P', half=3, ledge='G', redge='g'); neck(g)
    g.put(15, 26, ['GG', 'gg'])
    head(g)
    g.put(4, 1, ['        H j  H  j       ',
                 '     j HhHhHHhHhH  H    ',
                 '   H HhhjhhhhhhhhhHH j  ',
                 '    HhjjhhhhhhhhhhhhHH  ',
                 '  jHhjhhhhhhhhhhhhhhhH  ',
                 '   Hhhhhhhhhhhhhhhhhhh H',
                 '  HHGGGGGooooooGGGGGHH  ',
                 '   HGDwDGooooooGDwDGhH  ',
                 '    GDDyGh    hGDDyGH   ',
                 '     GGG H     HGGG     '])
    for r in range(12, 16): g.c[r][8] = 'h'; g.c[r][23] = 'H'
    mouth(g, 'open'); eyes(g, 'wide')
    g.put(19, 15, ['N N', ' N'])
    g.put(25, 13, ['wz ', '  y', ' LL', ' LL', 'LzzL', 'zzzz', 'zwzz', 'LzzL'])
    return g

def speculator():  # green eyeshade, slicked hair, raised brow and smirk, ticker tape round the neck, chart going up
    g = doorway(); shoulders(g); vneck(g, 'y', half=3); neck(g)
    g.put(15, 24, ['RR', 'rR', 'RR', 'Rr', 'RR'])
    g.put(10, 21, ['WW', 'WW', 'NW', 'WW', 'WN', 'WW', 'NW', 'WW', 'WN', 'WW', 'WW'])
    g.put(20, 21, ['WV', 'NV', 'WV', 'WN', 'WV', 'NV', 'WV', 'WN', 'WV', 'WV', 'WV'])
    head(g)
    g.put(8, 2, ['   HHHHHHHHHH   ',
                 '  HhjjjhhhhhhH  ',
                 ' HhjjhhhhhhhhhH ',
                 'HhhhhhhhhhhhhhhH',
                 'EEEEEEEEEEEEEEEE',
                 'eEEEEEEEEEEEEEee',
                 ' eeeeeeeeeeeeee ',
                 'H              H'])
    g.put(5, 6, ['oo']); g.put(24, 6, ['oo'])
    g.put(10, 9, ['  tt']); g.put(18, 10, ['tt'])
    mouth(g, 'smirk')
    g.put(2, 12, ['    z', '   zz', 'z zz ', 'zzz  ', 'zz   '])
    return g

def tycoon():  # top hat with a gold band, monocle, walrus mustache, gold tooth, fur collar
    g = doorway(); shoulders(g, start=8); vneck(g, 'W', half=2, every=4); neck(g)
    g.put(15, 24, ['RR', 'RR', 'Rr', 'RR'])
    g.put(5, 21, ['   WVWWVW', ' WWVWWWVWWW', 'WWVWWWV']); g.put(18, 21, ['WVWWVW   ', 'WWWVWWVWWW ', '     VWWVWW'])
    head(g)
    g.put(10, 0, ['  DDDDDDDD  ',
                  '  DNNDDDDD  ',
                  '  DNDDDDDD  ',
                  '  DNDDDDDD  ',
                  '  GGGGGGGg  ',
                  '  DDDDDDDD  '])
    g.put(7, 6, ['DNNNDDDDDDDDDDDDDD', ' DDDDDDDDDDDDDDDD ', ' MM            MM'])
    g.put(8, 10, ['M', 'M', 'M', 'M']); g.put(23, 10, ['M', 'M', 'M', 'M'])
    g.put(17, 11, [' GG ', 'G  G', 'G  G', ' GG ']); g.put(20, 15, ['g', 'g', ' g', ' g', ' g', ' g'])
    g.put(9, 15, ['   WWWWWWWWVV', ' WWWWVWWWVWVVV', 'WWV   VVV   VV'])
    mouth(g, 'goldgrin'); g.put(13, 17, ['KKKKKK', 'KwwGwK', ' KKKK '])
    g.put(9, 15, ['   WWWWWWWWVV', ' WWWWVWWWVWVVV', 'WWV        VV'])
    return g

def treasurer():  # neat bob, half-moon glasses on a chain, white ruffled collar, gold brooch, ring of keys
    g = doorway(); shoulders(g); neck(g)
    g.put(11, 22, ['WVW    WVW', ' WWVWWVWW', '  WVWWVW', '   WGGW', '    gg'])
    g.put(19, 25, ['  NNN', ' N   N', ' N   N', '  NNN', ' LL LL', ' LM LM', ' L  L', ' M  M'])
    head(g)
    g.put(6, 2, ['      HHHHHHHH      ',
                 '    HhhjjjhhhhhH    ',
                 '   HhjjjhhhhhhhhH   ',
                 '  HhjjhhhhhhhhhhhH  ',
                 '  HhjhhhhhhhhhhhhH  ',
                 '  HhhhhhhhhhhhhhhH  ',
                 '  HhhHhhhhhhhhHhhH  ',
                 '  HhhSHhhhhHhhShhH  ',
                 '  HhhSSSSSSSSSShhH  '])
    for r in range(11, 20): g.put(6, r, ['Hhh']); g.put(23, r, ['hhH'])
    g.put(6, 20, [' Hh']); g.put(23, 20, ['hH '])
    g.put(9, 13, ['GGGG', ' GG ']); g.put(17, 13, ['GGGG', ' GG ']); g.put(13, 13, ['gggg'])
    g.put(9, 15, ['g'], ); g.put(22, 15, ['g'])
    mouth(g, 'smile')
    return g

ENTRIES = [('gold.banker', 'Banker', banker), ('gold.taxman', 'Tax Collector', taxman),
           ('gold.merchant', 'Merchant', merchant), ('gold.thrift', 'Penny Pincher', thrift),
           ('gold.underdog', 'Underdog', underdog), ('gold.tinker', 'Alchemist', tinker),
           ('gold.speculator', 'Speculator', speculator), ('gold.tycoon', 'Tycoon', tycoon),
           ('gold.seed', 'Treasurer', treasurer)]
