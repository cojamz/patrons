# Yellow: the every-color sphere. Traders, travellers, makers who deal in all the table's colors (x y z n).
from lib2 import *

HEART = ['qR RR', 'RRRRR', ' RRR ', '  R  ']

def admirer():  # love-struck: heart eyes, a big blush, a bow in wavy hair, a heart locket, hearts floating up
    g = doorway()
    for y in range(8, 25):
        for x in range(6, 26): g.c[y][x] = 'j' if x < 8 else ('H' if x > 23 else 'h')
    body(g); neck(g); collar_shadow(g)
    g.put(12, 22, ['G      G', ' G    G', '  G  G']); g.put(13, 25, HEART)
    head(g, eyes='none', brows='raised', mouth='smile', cheeks=False)
    g.put(9, 11, HEART); g.put(17, 11, HEART)
    g.put(8, 15, ['aaa', ' a']); g.put(20, 15, ['aaa', ' a'])
    g.put(8, 3, ['    hhhhhhhh    ', '  hjjhhhhhhhhH  ', ' hjhhhhhhhhhhhH ', 'hjhhhhhhhhhhhhhH', 'hhhhhhhh hhhhhhH', 'hhh hhh   hh hhH', 'h              H'])
    g.put(6, 9, ['hh', 'jh', 'hh', 'jh', 'hh', 'jh', 'hh', ' h', 'hh', 'jh']); g.put(24, 9, ['hH', 'HH', 'hH', 'HH', 'hH', 'HH', 'hH', 'H', 'hH', 'HH'])
    g.put(18, 1, ['RR RR', 'RrRrR', 'RR RR'][:0] or ['RR  RR', 'RRrrRR', 'RR  RR'])
    g.put(3, 6, HEART[:3]); g.put(26, 8, ['R R', 'RRR', ' R ']); g.put(4, 14, ['q q', ' q '])
    shade_under(g, 'hHj')
    return g

def toque(g, x, y, lean=0):
    g.put(x, y, ['  WWWWWV  ', ' WWWWWWWVV', 'WWWWWWWWVV', 'WWWWWWWWVV', ' WWWWWWWV ', ' WWWWWWVV ', ' VVVVVVVV '])

def chefs():  # worth 2: two chefs in tall toques and red neckerchiefs; one laughs under a mustache, one tastes from a spoon
    g = doorway()
    for cx in (9, 23):
        body(g, cx=cx, top=20, half0=6, slope=3, maxhalf=8)
        for y in (23, 26, 29): g.c[y][cx - 3] = 'W'; g.c[y][cx + 2] = 'W'
        g.put(cx - 3, 20, ['RRRRRR', ' RrrR ', '  rr  '])
    mini(g, 4, 9, eyes='happy', mouth='open'); mini(g, 18, 9, eyes='dot', mouth='smile')
    toque(g, 4, 2); toque(g, 18, 2)
    g.put(4, 9, ['hh      hH']); g.put(18, 9, ['hh      hH'])
    g.put(5, 16, ['HHHH HHHH'[:0] or ' HHH HHH', 'HH  H  HH'][:1])
    g.put(5, 16, ['HHHHHHHHH'[:0] or 'HHHH HHHH'])
    shade_under(g, 'WVhH', y1=20)
    return g

def dyer():  # the dyer: a turban wound from bright cloth, an apron spattered in every color, dyed skeins over the shoulder
    g = doorway()
    body(g); neck(g); collar_shadow(g)
    g.put(9, 23, ['WWWWWWWWWWWWWV', 'WWxWWWWWWWzWWV', 'WWWWWyWWWWWWWV', 'WzWWWWWWnWWWVV', 'WWWWWWWWWWWxVV', 'WWWnWWWyWWWWVV', 'WWWWWWWWWWWWVV', 'WWWWWzWWWWWVVV', 'WWyWWWWWWWWVVV'])
    g.put(10, 22, ['W', 'W']); g.put(21, 22, ['V', 'V'])
    g.put(24, 18, ['xyzn', 'xyzn', 'xyzn', 'xyzn', 'xyzn', 'xyzn', 'xyzn', 'xyzn', 'xyzn', 'xy n', 'x  n'][:0] or
          [' xy', 'xyzn', 'xyzn', 'xyzn', 'xyzn', 'xyzn', 'xyzn', 'xyzn', 'xyzn', 'xyzn', 'x zn', '   n'])
    head(g, eyes='dot', brows='flat', mouth='smile')
    rows = []
    cols = 'xnzyxnzyxnzyxnzyxnzy'
    for j in range(8):
        w = [4, 6, 7, 8, 8, 8, 8, 8][j]
        r = ''.join(cols[(i + j) // 2 % 4] for i in range(2 * w))
        rows.append(' ' * (8 - w) + r)
    g.put(8, 1, rows)
    g.put(23, 2, [' n', 'nn', 'n'])
    shade_under(g, 'xyzn')
    return g

def explorer():  # pith helmet, a squint at the horizon, walrus mustache, neckerchief, binoculars on the chest
    g = doorway()
    body(g); neck(g); collar_shadow(g)
    for x0 in (4, 20): g.put(x0, 26, ['222222', '2    2', '222222'][:0] or ['2222222', '1    1'])
    g.put(13, 21, ['RRRRRR', ' RRrR', '  Rr', '  R r'])
    g.put(11, 22, ['O', ' O', '  O']); g.put(19, 22, ['O', 'O', 'O'])
    g.put(11, 25, ['NNN NNN', 'DDD DDD', 'DwD DwD', 'DDDNDDD', 'DDD DDD', 'NNN NNN'][:0] or ['LMN LMN', 'DDD DDD', 'DwDNDwD', 'DDD DDD', 'NNN NNN'])
    head(g, eyes='narrow', brows='dark', mouth='flat')
    g.put(10, 16, ['HHHHH  HHHHH', 'HhhhHHHHhhhH', ' Hh      hH'])
    g.put(5, 0, ['      WWWWWWWV       ', '    WWWWWWWWWWVV     ', '   WWWWWWWWWWWWVV    ', '  WWWWWWWWWWWWWVVV   ',
                 '  WWWWWWWWWWWWWVVV   ', '  OOOOOOOOOOOOOOOo   ', ' WWWWWWWWWWWWWWWWVV  ', 'WWWWWWWWWWWWWWWWWVVVV', ' VVVVVVVVVVVVVVVVVVV '])
    g.put(8, 9, ['hh', 'h']); g.put(22, 9, ['hH', ' H'])
    shade_under(g, 'WVO')
    return g

def gobetween():  # the courier: a blue postal cap with a letter tucked in the band, a satchel strap, a wink
    g = doorway()
    body(g); neck(g); collar_shadow(g)
    for i in range(10): g.put(9 + 2 * i, 22 + i, ['oO'])
    g.put(3, 26, ['oOOOOOo', 'OWWWWWo', 'OWxWWyO', 'OOOOOOo', 'oooooo'][:0] or ['  WWW', ' WWxWy', 'OOOOOOo', 'OoooooO', 'OoooooO', 'ooooooo'])
    g.put(14, 22, ['G'])
    head(g, eyes='wink', brows='raised', mouth='grin')
    g.put(7, 2, ['     UUUUUUUU      ', '   UUUUUUUUUUuu    ', '  UUUUUUUUUUUUuu   ', '  UUUUUUGGUUUUuu   ', '  UUUUUUgGUUUUuu   ',
                 '  uuuuuuuuuuuuuu   ', '  KKKKKKKKKKKKKKK  ', '     KKKKKKKKKKKKK '])
    g.put(8, 9, ['hh', 'h']); g.put(22, 9, ['hH', ' H'])
    g.put(20, 0, ['  WWWWW', ' WWWWWV', 'WWWxWV', 'WWWWV'][:0] or ['    WW', '  WWWV', 'WWWxV', 'WWWV'])
    shade_under(g, 'K')
    return g

def latebloomer():  # worth 2: two white-haired elders in bloom; one in a flower crown, one with a sunflower and round glasses
    g = doorway()
    for cx in (9, 23):
        body(g, cx=cx, top=20, half0=6, slope=3, maxhalf=8)
        g.put(cx - 2, 20, ['WWWV', ' WV '])
        for y in (23, 26, 29): g.c[y][cx] = 'G'
    g.put(14, 1, ['  M', ' MLM'][:0] or [])
    mini(g, 4, 9, eyes='happy', mouth='smile'); mini(g, 18, 9, eyes='dot', mouth='smile')
    g.put(3, 6, ['  LLLLLL  ', ' LLLLLLLLM ', 'LLLLLLLLLMM', 'LLL LLLL MM', 'LL       MM', 'LM       MM', 'LM       MM', ' M       M'])
    g.put(2, 4, [' x  z  n ', 'xwxzwznwn', ' x  z  n '])
    g.put(19, 2, ['  LLLL', ' LLLLM', '  MMM'])
    g.put(17, 6, ['  LLLLLL  ', ' LLLLLLLLM ', 'LLLLLLLLLMM', 'LL      LMM', 'L        MM', 'L        M'])
    g.put(19, 13, ['MMM  MMM', 'M wM M w', 'MMM  MMM'][:0] or [])
    g.put(18, 12, ['NNNN NNNN', 'N  NNN  N', 'NNNN NNNN'])
    g.put(26, 4, [' YYY ', 'YYoYY', 'YoooY', 'YYoYY', ' YYY ', '  E', '  e'])
    g.put(5, 12, ['t'][:0] or [])
    shade_under(g, 'LMxyzn', y1=20)
    return g

def peddler():  # the travelling seller: a pack frame stacked with wares in every color, a pan hung off it, flat cap, walrus mustache
    g = doorway()
    g.put(3, 5, ['OOOO', 'OxxO', 'OxxO', 'OOOO', 'ynny', 'ynny', 'OOOO', 'O  O', 'O  O', 'O  O', 'O  O', 'O  O', 'O  O', 'O  O', 'O  O'])
    g.put(25, 4, ['OOOO', 'OzzO', 'OzzO', 'OOOO', 'yyyy', 'xxxx', 'OOOO', 'o  o', 'o  o', 'o  o', 'o  o', 'o  o', 'o  o', 'o  o'])
    g.put(0, 14, [' NNN', 'NMMMN', 'NMLMN', 'NMMMN', ' NNN', '  N', '  N'][:0] or [])
    body(g); neck(g); collar_shadow(g)
    g.put(9, 22, ['oO', ' oO', ' oO', '  oO', '  oO', '  oO', '   oO', '   oO', '   oO', '   oO'])
    g.put(21, 22, ['Oo', 'Oo', 'Oo', 'Oo', 'Oo', 'Oo', 'Oo', 'Oo', 'Oo', 'Oo'])
    g.put(2, 18, ['NNNN', 'NMMMN', 'NMLMN', 'NMMMN', ' NNN'])
    head(g, eyes='dot', brows='dark', mouth='grin')
    g.put(9, 16, [' HHHHH  HHHHH ', 'HHhhhhHHhhhhHH', 'Hh  HHhhH   hH', 'H            H'])
    g.put(13, 18, ['KGwK'][:0] or [])
    g.put(7, 2, ['     33333333     ', '   4433333333322  ', '  443333333333322 ', '  4333333333333221 ', '  1111111111111111 ', '1222222222222111   '])
    g.put(8, 8, ['hh', 'h']); g.put(22, 8, ['hH', ' H'])
    shade_under(g, '1234')
    return g

def pilgrim():  # the pilgrim: a wide-brimmed pilgrim's hat pinned with a scallop shell, a cape, a staff hung with a gourd
    g = doorway()
    g.put(26, 4, [' oo', 'oOOo', 'oOOo', ' oo', ' OO'] + [' Oo'] * 23)
    body(g, half0=8); neck(g)
    for y in range(22, 32): g.c[y][15] = '1'; g.c[y][16] = '2'
    g.put(14, 22, ['GGGG', ' gg'])
    head(g, eyes='right', brows='raised', mouth='grin', crown=True)
    g.put(7, 8, ['hh', 'hh', 'h', 'h']); g.put(23, 8, ['hH', 'HH', ' H', ' H'])
    g.put(9, 0, ['    44333333    ', '  4433333333322 ', ' 43333333333332 ', ' 43333333333322 '])
    g.put(3, 4, ['44443333333333333332211', ' 444333333333333332211'])
    g.put(13, 1, [' WWWV', 'WVWVW', 'WVWVW'])
    return g

def rainmaker():  # the rainmaker: a sou'wester, collar buttoned up, a little cloud at her shoulder raining every color
    g = doorway()
    body(g); neck(g)
    g.put(8, 20, ['44', '433']); g.put(21, 21, ['221'])
    for y in (24, 27, 30): g.put(15, y, ['WV'])
    head(g, eyes='dot', brows='raised', mouth='smile', crown=False)
    g.put(8, 9, ['hhhhhhhhhhhhhhhH', 'hh            hH', 'h              H'])
    g.put(5, 4, ['    44333332   ', '  44333333332  ', ' 4333333333322 ', ' 4333333333322 '])
    g.put(2, 8, ['4443333333333333322', '  122222222222222211'])
    def cloud(f):
        f.put(17, 0, ['    WWW  WW   ', '  WWwWWWWWWWW ', ' WWWWWWWWWWWWL', 'WWWWWWWWWWWWLL', 'LLLLLLLLLLLLLM', ' MMMMMMMMMMMM '])
    layer(g, cloud)
    for (x, y, k) in [(19, 7, 'y'), (22, 7, 'x'), (25, 7, 'z'), (28, 7, 'n'), (26, 11, 'y'), (28, 12, 'x'), (25, 15, 'z'), (27, 16, 'n')]:
        g.put(x, y, [k, k, k] if y > 8 else [k, k])
    shade_under(g, '12h')
    return g

def weaver():  # the weaver: a kerchief with a shuttle tucked in it, two plaited braids tied with yarn, a woven shawl
    g = doorway()
    body(g); neck(g)
    for j, y in enumerate(range(22, 32)):
        for x in range(32):
            if g.c[y][x] in '1234':
                if j % 3 == 1: g.c[y][x] = 'xnzy'[(x // 2 + j) % 4]
                elif j % 3 == 2: g.c[y][x] = 'W' if g.c[y][x] in '34' else 'V'
    g.put(4, 30, ['V V V V V V V V V V V V'])
    head(g, eyes='dot', brows='flat', mouth='smile')
    g.put(8, 3, ['    33333333    ', '  4433333333332 ', ' 4333333333333321', '43333333333333321', '4333W33333W3332211', '1111111111111111'])
    g.put(8, 9, ['hhh', 'hh', 'h']); g.put(21, 9, ['hhH', ' hH', '  H'])
    for x0 in (5, 25):
        g.put(x0, 9, ['hH', 'Hh', 'jH', 'Hh', 'hH', 'Hj', 'hH', 'Hh', 'jH', 'Hh', 'hH', 'Hh', 'zz', 'nn', 'hH', 'hh', ' H'])
    g.put(16, 1, ['   oOOOOOo   ', 'OOOOxxxxOOOOo', '   oooooo    '])
    shade_under(g, '1234')
    return g

ENTRIES = {'yellow.admirer': admirer, 'yellow.chefs': chefs, 'yellow.dyer': dyer, 'yellow.explorer': explorer,
           'yellow.gobetween': gobetween, 'yellow.latebloomer': latebloomer, 'yellow.peddler': peddler,
           'yellow.pilgrim': pilgrim, 'yellow.rainmaker': rainmaker, 'yellow.weaver': weaver}
