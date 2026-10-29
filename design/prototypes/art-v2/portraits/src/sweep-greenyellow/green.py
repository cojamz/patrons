# Green: the copying color. Performers, impersonators, doubles, fans.
from lib2 import *

def agents():  # worth 2: two suited agents, identical shades and earpieces, one buzz cut, one slick side part
    g = doorway()
    for cx, top in ((9, 19), (23, 18)):
        body(g, cx=cx, top=top, half0=6, slope=3, maxhalf=8)
        g.put(cx - 3, top, ['1WKKW1', ' WKKV ', ' 1KK1 ', '  KK  ', ' 1KK1 ', '1 KK 1', '  KK  '])
        g.put(cx - 4, top + 6, ['1', '1']); g.put(cx + 3, top + 6, ['1', '1'])
    for x, y, style in ((4, 8, 'buzz'), (18, 7, 'slick')):
        mini(g, x, y, eyes='dot', mouth='flat', cheeks=False)
        if style == 'buzz': g.put(x, y - 1, ['  HHHHHH  ', ' HHhHhHhH ', 'HHhHhHhHHH', 'H        H'])
        else: g.put(x - 1, y - 2, ['   jjhhhh  ', '  jjhhhhhhH', ' jhhhhhhhhH', ' hhhh    hH', ' h        H'])
        g.put(x, y + 4, ['KDDDKKDDDK', ' DwD  DwD ', '  D    D  '])
        g.put(x + 2, y + 6, ['    t'])
        g.put(x + 10, y + 4, ['L', ' N', 'N', ' N', 'N', ' N', 'N'])
    shade_under(g, 'hHjK')
    return g

def bait():  # angler: a bucket hat stuck with lures, a worm on a hook off the brim, a vest of pockets
    g = doorway()
    body(g); neck(g); collar_shadow(g)
    g.put(12, 22, ['WWWWWWWV', ' WWWWWV', '  WWWV', '   WV'])
    for x0 in (4, 21):
        g.put(x0, 25, ['222222', '2O33o2', '233332', '233332', '222221'])
    g.put(10, 22, ['1', '1', '1', '1', '1', '1', '1', '1', '1', '1']); g.put(21, 22, ['1'] * 10)
    head(g, eyes='narrow', brows='flat', mouth='grin')
    for (x, y) in [(10, 18), (12, 19), (19, 19), (21, 18), (14, 20), (17, 20)]: g.c[y][x] = 's'
    g.put(7, 1, ['     44433333     ', '    4433333333    ', '   443333333332   ', '   433333333332   ',
                 '   433333333322   ', '   111111111111   ', ' 44333333333333322', '4433333333333332221'])
    g.put(10, 4, ['x', 'x']); g.put(15, 3, ['nw', 'n ']); g.put(19, 4, ['y', 'yy'])  # lures in the hat
    for y in range(3, 25):  # the rod up past the shoulder, its line down to a bobber
        g.c[y][25 + (y < 12)] = 'O' if y % 2 else 'o'
    g.c[2][27] = 'o'
    for y in range(3, 11): g.c[y][28] = 'L'
    g.put(27, 11, ['RqR', 'WWW', ' V '])  # the hook and the worm
    shade_under(g, '1234')
    return g

def chronicler():  # the old scribe: bald dome, white tufts, a long beard down the chest, spectacles, a quill behind the ear
    g = doorway()
    body(g); neck(g)
    head(g, eyes='dot', brows='flat', mouth='smile', cheeks=True)
    g.put(5, 8, [' LLL', 'LLLLM', 'LLLMM', ' LMM', '  M']); g.put(22, 8, ['LLL ', 'LLLMM', 'LLMMM', ' MMM', '  M'])
    g.put(9, 11, ['MMMM    MMMM', 'M  MMMMMM  M', 'M  M    M  M', 'MMMM    MMMM'])
    g.put(7, 15, ['  L            M ', ' LLL LLLLLLL MMM ', 'LLLLLLLLLLLLLLMMM', 'LLLLL KKKKKK LLMMM', 'LLLLLLLLLLLLLLMMM',
                  'LLLLLLLLLLLLLLMMM', ' LLLLLMLLLLLLLMM ', ' LLLLLLLLLMLLLMM ', '  LLLLLLLLLLLMM  ', '  LLLMLLLLLLLMM  ',
                  '   LLLLLLLLLMM   ', '   LLLLLLMLLMM   ', '    LLLLLLLMM    ', '    LLLLLLLMM    ', '     LLLLLMM     ', '      LLLMM      '])
    g.put(12, 16, ['LLLLLLLL'])
    g.put(24, 1, ['   W', '  WV', '  WV', ' WWV', ' WV', ' WV', 'WV', 'Wo', 'o', 'o'])
    return g

def tributeband():  # the impersonator: towering black pompadour, sideburns, gold aviators, a high studded collar
    g = doorway()
    body(g); neck(g)
    g.put(13, 22, ['SSSSSS', ' SsSs', '  ss'])
    for i, (l, r) in enumerate([('W', 'V'), ('WW', 'WV'), ('WWW', 'WVV'), ('WWWW', 'WWVV'), ('WWWWW', 'WWVVV'), ('WWWWG', 'GWVVV'), (' WWW', 'WVV ')]):
        g.put(8 - len(l), 16 + i, [l]); g.put(24, 16 + i, [r])
    g.put(7, 19, ['G'])
    for (x, y) in [(8, 25), (10, 28), (22, 25), (20, 28)]: g.c[y][x] = 'G'
    head(g, eyes='dot', brows='dark', mouth='smirk', cheeks=False)
    g.put(7, 0, ['     KKKKKKKKK     ', '   KKDDNNNNDDDKK   ', '  KDNNDDDDDDDDDKK  ', ' KDNDDDDDDDDDDDDKK ',
                 ' KDDDDDDDDDDDKKDKK ', ' KDDDDDDSSSSKDDKKK ', ' KDDDSSSSSSSSSKDKK ', ' KDD SSSSSSSSSSKKK ', '  DK SSSSSSSSSSSDK '])
    g.put(11, 5, ['DDK', ' DK', '  K'])
    g.put(7, 9, ['DK', 'DK', 'DK', 'DK', 'DD', 'DK', 'D']); g.put(22, 9, ['DK', 'DK', 'KK', 'KK', 'KK', 'KK', ' K'])
    g.put(9, 11, ['GGGGGGGGGGGGGG', 'GDDDDGGGDDDDDG', 'GDwDDG GDwDDDG', ' GDDG   GDDDG '])
    g.put(28, 2, ['w'][:0] or [])
    shade_under(g, 'KDN', y1=12)
    return g

def doppel():  # someone and their reflection in a hand mirror; the copy smirks back
    g = doorway()
    body(g, cx=13); neck(g, x=11)
    g.put(9, 22, ['WWWWWWV', ' WWWWV', '  WWV', '   V'])
    head(g, x=5, y=9, eyes='right', brows='raised', mouth='o')
    g.put(5, 3, ['    hhhhhhhh    ', '  hjjhhhhhhhhH  ', ' hjhhhhhhhhhhhH ', 'hjhhhhhhhhhhhhHH', 'hhhhhhhhh hhhhHH', 'hhh        hhhHH', 'hh           hH'])
    oval(g, 24.5, 13, 6, 9, rim='G', rim2='g', fill='i')
    g.put(21, 6, ['  4444  ', ' 433333 ', '43333332', '3333 332', '33    32'])
    g.put(21, 9, ['  3333  ', ' 333332 ', '33333322', '3w13w132', '31131132', '33333322', '33332322', ' 332222 ', ' 3K1122 ', '  KKK2  ', '   22   '][1:][:9])
    g.put(21, 10, [' 333332 '])
    g.put(23, 22, ['g', 'O', 'o', 'O', 'o', 'O', 'o', 'O', 'o', 'o'])
    g.put(25, 4, ['w'])
    shade_under(g, 'hHj', x1=21)
    return g

def ensemble():  # worth 2: a barbershop duo in matching boaters and bow ties, singing the same note
    g = doorway()
    for cx in (9, 23):
        body(g, cx=cx, top=20, half0=6, slope=3, maxhalf=8)
        stripes_v(g, cx, 21, every=3)
        g.put(cx - 2, 20, ['WWWV', ' WV ', ' WV ', ' WV '])
        g.put(cx - 3, 20, ['RRrrRR', 'Rr  rR'])
    for x, y in ((4, 9), (18, 9)):
        mini(g, x, y, eyes='dot', mouth='open')
        g.put(x - 1, y - 4, ['  WWWWWWWW  ', '  WWWWWWWV  ', '  33333322  ', 'WWWWWWWWWWVV'])
        g.put(x, y, ['hh      hH', 'h        H'])
    g.put(19, 16, ['HHHH  HHHH'[:0] or ' HHH  HHH', 'HH HHHH HH'][:1])
    g.put(19, 16, ['HHHHH HHHHH'[:0] or 'HHHH  HHH'])
    g.put(13, 1, ['  GG', '  Gg', '  G ', 'GGG ', 'Ggg '])
    shade_under(g, 'hHVW', y1=20)
    return g

def busker():  # street singer: newsboy cap, open singing mouth, harmonica rack, guitar neck over the shoulder
    g = doorway()
    g.put(23, 4, [' OOO ', 'LOOOL', 'LOOOL', 'LOOOL', ' OOo ', '  WO ', '  OW ', '  WO ', '  OW ', '  WO ', '  OW ', '  WO ', '  OW ', '  WO ', '  OW ', '  WO '])
    body(g); neck(g); collar_shadow(g)
    g.put(12, 22, ['WW', 'W']); g.put(18, 22, ['VV', ' V'])
    for i in range(10): g.put(24 - 2 * i, 22 + i, ['oO'])
    head(g, eyes='happy', brows='raised', mouth='open')
    g.put(7, 2, ['    44433332     ', '  4433333333221  ', ' 43333333333222  ', ' 333333333332221 ',
                 ' 333333333333221 ', '12222222222221111 '])
    g.put(12, 2, ['   1  '])
    g.put(4, 8, ['111222222221111'])
    g.put(8, 9, ['hh', 'h']); g.put(22, 9, ['hH', ' H'])
    g.put(1, 10, ['  GGG', '  Gg', '  G', '  G', 'GGg', 'Ggg'])
    g.put(1, 1, [' GGGG', ' G  G', ' G  G', 'GG GG', 'Gg Gg'][:0] or [])
    shade_under(g, '1234hH')
    return g

def stuntdouble():  # the double: crash helmet with a racing stripe, goggles up, chin strap, a plaster on the cheek, cocky grin
    g = doorway()
    body(g); neck(g); collar_shadow(g)
    for y in range(23, 32): g.c[y][11] = 'W'; g.c[y][12] = 'W'; g.c[y][19] = 'V'; g.c[y][20] = 'V'
    g.put(14, 23, ['GG', 'gg'])
    head(g, eyes='dot', brows='angry', mouth='grin')
    g.put(6, 2, ['      44433333      ', '    443333333333    ', '   43333333333322   ', '  4333333333333222  ',
                 '  433333333333332211', '  433333333333332211', '  4333333333333322 1', '  4333333333333322 1',
                 '  4333          322 ', '  433            22 '])
    for y in range(2, 8): g.c[y][15] = 'W'; g.c[y][16] = 'V'
    g.put(8, 7, ['  NNNNNNNNNNNN', ' NDDDDNNNDDDDN', ' NDwDDNNNDwDDN', '  NNNN   NNNN'])
    g.put(7, 12, ['KK', 'K', 'K', 'K', 'K', ' K', ' K', '  K', '   KK']); g.put(23, 12, ['KK', ' K', ' K', ' K', ' K', 'K', 'K', 'K', 'KK'])
    g.put(19, 14, ['WVW', 'VWV', 'WVW'])
    shade_under(g, '1234N')
    return g

def impostor():  # the worst disguise: fedora pulled low, collar up, groucho glasses, fake nose, mustache, cigar
    g = doorway()
    body(g); neck(g)
    g.put(5, 17, ['44            21', '433          221', '4333        2221', '43333      22221', '433333    222221'])
    g.put(13, 22, ['1111', ' 11'])
    head(g, eyes='dot', brows='flat', mouth='flat', cheeks=False)
    g.put(8, 9, ['SSSSSSSSSSSSSsst', 'SKKKKSSSSKKKKsst', 'SKKKKKSSKKKKKsst', 'SKwKSKKKKwKSKsst', 'SKKKSKSSKKKSKsst',
                 'SKKKKKSSKKKKKsst', 'SSSSSqqqqRSSSsst', 'SSSSqqqqqRRSSsst', ' SKKKKRRRKKKKst ', ' KKKKKKKKKKKKst ',
                 '  SSSSSKKSSSst  ', '   sSSSSSSSst   ', '    tsssssst    '])
    g.put(19, 19, ['OOOOMx'[:0] or 'OOOOM', 'oooo'][:1]); g.put(19, 20, [' oooo'])
    g.put(25, 17, ['M', ' N', 'M'])
    g.put(5, 1, ['       222222       ', '     2333333332     ', '    233333333332    ', '    233333333322    ',
                 '    1111111111111   ', '  4333333333333332211', '22222222222222222211'])
    shade_under(g, '1234')
    return g

def fanclub():  # one superfan: high bunches in club scrunchies, star cheek paint, club scarf, pins, a pennant
    g = doorway()
    body(g); neck(g)
    for i, x in enumerate(range(9, 23)):
        k = '3' if (i // 2) % 2 == 0 else 'W'
        g.put(x, 21, [k, k])
    g.put(19, 23, ['W3', '3W', 'W3', '3W', '22', '2 2'])
    g.put(9, 26, [' xx ', 'xwxx', ' xx ']); g.put(13, 27, [' nn', 'nwn', ' nn'])
    head(g, eyes='dot', brows='raised', mouth='open')
    g.put(8, 3, ['    hhhhhhhh    ', '  hjjhhhhhhhhH  ', ' hjhhhhhhhhhhhH ', 'hjhhhhhhhhhhhhHH', 'hhh hhhh hhhhhHH', 'hh  hh    hh hHH', 'h              H'])
    g.put(3, 2, [' hjh ', 'hjhhh', 'hhhhH', ' hhH ', '  33 ']); g.put(24, 2, [' hhh', 'hhhhH', 'hhhHH', ' hHH', ' 33'])
    g.put(9, 14, [' W ', 'W3W', ' W '][1:2]); g.put(19, 14, [' W ', 'W3W', ' W '])
    g.put(1, 8, ['o', 'oWW', 'o333', 'o3W33', 'o332', 'o2', 'o', 'o', 'o', 'o'])
    shade_under(g, 'hHj')
    return g

def muse():  # long flowing hair, a gold laurel, dreamy closed eyes, a cream toga, sparkles of inspiration
    g = doorway()
    for y in range(3, 27):
        hw = {3: 5, 4: 7, 5: 8, 6: 9}.get(y, 10)
        for x in range(16 - hw, 16 + hw):
            k = x - (16 - hw)
            g.c[y][x] = 'j' if k < 2 else ('H' if k >= 2 * hw - 2 else 'h')
    for y in range(12, 27, 4): g.c[y][9] = 'j'; g.c[y + 1][21] = 'H'
    body(g, half0=6); neck(g)
    g.put(9, 24, ['WWWW', ' WWWWW', '  WWWWWW', '   WWWWWWV', '    WWWWWWV', '     WWWWWWVV', '      WWWWWWVV', '       WWWWWWVV'])
    g.put(12, 25, ['G'])
    head(g, eyes='closed', brows='raised', mouth='smile', crown=False)
    g.put(8, 5, ['  hhhhhhhhhhhh  ', ' hhhhhhhhjhhhhH ', 'hhhhhjjhhhhhhhhH', 'hhhjhSSSSShhhhhH', 'hhhSSSSSSSShhhHH', 'hhSSSSSSSSSShhH '])
    g.put(8, 4, [' gG gG gG gG gG '[:0] or 'GgG GgGGgG GgG'[:0] or ' GgGGgG  GgGGgG'])
    g.put(7, 5, ['G', 'gG', 'Gg', ' G']); g.put(23, 5, [' G', 'gG', 'Gg', 'G'])
    g.put(3, 4, [' w ', 'wGw', ' w ']); g.put(26, 10, [' w ', 'wGw', ' w ']); g.put(4, 15, ['w']); g.put(25, 3, ['w'])
    shade_under(g, 'hHjGg')
    return g

def roadie():  # stage crew: knit beanie, big beard, a headset mic, a backstage pass, cable coiled on the shoulder
    g = doorway()
    body(g); neck(g)
    g.put(12, 22, ['W       W', ' W     W', '  W   W', '   W W']); g.put(14, 26, ['WWWW', 'WKKW', 'WxxW', 'WWWV'])
    g.put(20, 22, ['  KKKKK  ', ' KK   KK ', 'KK KKK KK', 'K KK KK K', 'KK KKK KK', ' KK   KK ', '  KKKKK  ', '    K', '    K'])
    head(g, eyes='dot', brows='dark', mouth='smile', cheeks=False)
    g.put(8, 15, ['hh          hH', 'hhh  hhhhhh hHH', 'hhhhhKKKKKKhhHH', ' hhhhhKKKKhhhHH', '  hhhhhhhhhhhH ', '   hhhhhhhhH  ', '     hhhhH'])
    g.put(7, 1, ['     MMMMMMMM      ', '   MLMMMMMMMMMN    ', '  MLMMMMMMMMMMNN   ', ' MLMMMMMMMMMMMMNN  ', ' MMMMMMMMMMMMMMNN  ',
                 ' NLNLNLNLNLNLNLNN  ', ' NLNLNLNLNLNLNLNN  '])
    g.put(6, 8, ['DD', 'DD', 'DD', 'DD', ' N', ' N', '  N', '   N', '    NNK'])
    g.put(24, 8, ['DD', 'DD', 'DD', 'DD'])
    shade_under(g, 'MNLhH')
    return g

def understudy():  # the understudy: the star's crown a size too big, sliding off sideways; worried brows, a sweat drop
    g = doorway()
    body(g); neck(g); collar_shadow(g)
    g.put(9, 21, ['WWVWWVWWVWWVWV', ' VV VV VV VV V'])
    for y in (25, 28): g.c[y][15] = 'G'; g.c[y][16] = 'g'
    head(g, eyes='dot', brows='worried', mouth='flat')
    g.put(13, 17, [' K K', 'K K '])
    g.put(8, 4, ['  DDDDDDDDDDDD  ', ' DNDDDDDDDDDDDK ', 'DNDDDDDDDDDDDDKK', 'DDD DDDD DDDDDKK', 'DD          DDKK', 'D            DK'])
    for x in range(4, 26):
        by = 2 + (x - 4) // 4
        g.c[by][x] = 'G'; g.c[by + 1][x] = 'G' if x < 24 else 'g'; g.c[by + 2][x] = 'g'
    for x in (5, 10, 15, 20, 25):
        by = 2 + (x - 4) // 4
        g.c[by - 1][x] = 'G'; g.c[by - 2][x] = 'G' if x < 25 else 'g'
    g.put(13, 5, ['RR'])
    g.put(22, 11, [' w', 'wy', 'yy'])
    shade_under(g, 'KDNGg', y1=12)
    return g

def wallflower():  # shy, against flowered wallpaper: bangs over one eye, glancing aside, a cardigan, a flower clip
    g = doorway()
    for y in range(1, 22):
        for x in range(1, 31):
            if g.c[y][x] != 'b': continue
            if x % 4 == 0: g.c[y][x] = '2'
            if x % 4 == 2 and y % 4 == (x // 4) % 2 * 2: g.c[y][x] = 'n'
    for y in range(4, 27):
        for x in range(7, 25):
            g.c[y][x] = 'j' if x < 9 else ('H' if x > 22 else 'h')
    body(g, half0=6, slope=2); neck(g)
    g.put(12, 22, ['WWWWWWWV', ' WWWWWV', '  WWWV', '   WV'])
    for y in (24, 27, 30): g.c[y][11] = 'G'; g.c[y][20] = 'g'
    head(g, eyes='left', brows='raised', mouth='smile', crown=False)
    g.put(8, 3, ['    hhhhhhhh    ', '  hjjhhhhhhhhH  ', ' hjhhhhhhhhhhhH ', 'hjhhhhhhhhhhhhhH', 'hhhhhhhhhhhhhhhH',
                 'hhhhhhhhhhhhhhhH', 'hhhhhhhhhhhhhhhH', 'hhhhhhhhhhhhhhhH', ' hhhhhhhhhhhhhhH', '  hhhhhhhhhhhhhH',
                 '      hhhhhhhhhH', '        hhhhhhhH', '           hhhhH', '             hhH'])
    g.put(8, 9, ['hh', 'hh', 'hh', 'h', 'h'])
    g.put(9, 15, ['aaa'])
    g.put(6, 6, [' n ', 'nYn', ' n '])
    shade_under(g, 'hHj')
    return g

ENTRIES = {'echo.agents': agents, 'echo.bait': bait, 'echo.chronicler': chronicler, 'echo.dejavu': tributeband,
           'echo.doppel': doppel, 'echo.ensemble': ensemble, 'echo.evergreen': busker, 'echo.hourglass': stuntdouble,
           'echo.impostor': impostor, 'echo.mirror': fanclub, 'echo.muse': muse, 'echo.roadie': roadie,
           'echo.understudy': understudy, 'echo.wallflower': wallflower}
