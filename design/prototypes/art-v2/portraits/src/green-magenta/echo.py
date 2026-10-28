# Green (echo): copycats, echoes, mimics.
from lib import *

def busker():  # street singer: newsboy cap, open singing mouth, guitar headstock over the shoulder, notes
    g = doorway()
    g.put(25, 9, [' OO ', 'LOOL', 'LOOL', 'LOOL', ' Oo ', ' Oo ', ' Oo ', ' Oo ', ' Oo ', ' Oo ', ' Oo ', ' Oo ', ' Oo '])
    body(g); neck(g)
    g.put(12, 22, ['WW', 'W']); g.put(18, 22, ['VV', ' V'])
    for i in range(10):  # guitar strap across the chest
        y = 22 + i; x = 24 - 2 * i
        g.put(x, y, ['oO'])
    head(g, eyes='happy', brows='raised', mouth='open')
    g.put(7, 2, ['     44433332    ', '   4433333333221 ', '  43333333333222 ', ' 433333333332221 ',
                 ' 3333333333322211', ' 2222222222222111', '                 '])
    g.put(13, 1, ['  4  '])
    g.put(5, 8, ['1222222221111   '])
    g.put(8, 9, ['hh', 'h']); g.put(22, 9, ['hH', ' H'])
    g.put(8, 9, ['  tttttttttt'])
    g.put(1, 10, ['  GGG', '  Gg', '  G', '  G', 'GGg', 'Ggg'])
    g.put(25, 1, ['GGGGG', 'Gg  G', 'G   G', 'G   G', 'G GGg', 'GGggg'][0:0] or [' GGGG', ' G  G', ' G  G', 'GG GG', 'Gg Gg'])
    return g

def muse():  # long flowing hair, gold laurel wreath, dreamy closed eyes, cream toga, sparkles
    g = doorway()
    for y in range(2, 27):
        hw = {2: 4, 3: 6, 4: 8, 5: 9, 6: 9}.get(y, 10)
        for x in range(16 - hw, 16 + hw):
            k = x - (16 - hw)
            g.c[y][x] = 'j' if k < 2 else ('H' if k >= 2 * hw - 2 else 'h')
    body(g, half0=6); neck(g)
    g.put(9, 24, ['WWWW', ' WWWWW', '  WWWWWW', '   WWWWWWV', '    WWWWWWV', '     WWWWWWVV', '      WWWWWWVV', '       WWWWWWVV'])
    g.put(5, 22, ['jhh', 'jhh', 'jhH', ' hH']); g.put(23, 22, ['hhH', 'hhH', 'hH', 'H'])
    head(g, eyes='closed', brows='raised', mouth='smile', crown=False)
    g.put(8, 5, ['  hhhhhhhhhhhh  ', ' hhhhhhhhjhhhhH ', 'hhhhhjjhhhhhhhhH', 'hhhjhSSSSShhhhhH', 'hhhSSSSSSSShhhHH', 'hhSSSSSSSSSShhH '])
    g.put(7, 5, ['G', 'gG', 'Gg', ' G']); g.put(23, 5, [' G', 'gG', 'Gg', 'G'])
    g.put(9, 4, ['GgG GgG  GgG GgG'][0:1])
    g.put(9, 4, [' G g G g G g G '])
    g.put(3, 4, [' w ', 'wGw', ' w ']); g.put(26, 10, [' w ', 'wGw', ' w ']); g.put(4, 15, ['w'])
    return g

def ensemble():  # a choir of three side by side: ruffled collars, open singing mouths, a note above
    g = doorway()
    def side(x, hair):
        def d(f):
            body(f, cx=x + 5, top=20, half0=5, slope=3, maxhalf=7)
            mini(f, x, 9, mouth='open', eyes='happy' if hair == 'Y' else 'dot')
            f.put(x, 19, [' WWWWWWWV ', 'WVWWVWWVWV', ' V  V  V '])
            if hair == 'h': f.put(x, 7, ['  hhhhhh  ', ' hjhhhhhH ', 'hjhhhhhhhH', 'hhh    hhH', 'hh      hH', 'h        H', 'h        H', 'h        H'])
            else: f.put(x, 8, ['  MMMMMM  ', ' MLMMMMMN ', 'MLM    MNN', 'M        N'])
        return d
    side(3, 'h')(g); side(19, 'M')(g)
    def mid(f):
        body(f, cx=16, top=19, half0=6, slope=3, maxhalf=9)
        mini(f, 11, 7, eyes='happy', mouth='open')
        f.put(11, 4, ['  YYYYYY  ', ' YYYYYYYg ', 'YYYYYYYYYg', 'YYY YYYYgg', 'YY      gg', 'Y        g'])
        f.put(10, 17, [' WWWWWWWWWV ', 'WVWWVWWVWWVV', ' V  V  V  V '])
    layer(g, mid)
    g.put(24, 1, ['   GG', '  GGg', '  G', '  G', 'GGG', 'Ggg'])
    return g

def stunt_double():  # crash helmet with the visor flipped up, a plaster on the cheek, racing suit
    g = doorway()
    body(g); neck(g)
    g.put(7, 22, ['W  ', 'WW ', ' WW', '  WW', '   W']); g.put(22, 22, ['  V', ' VV', 'VV ', 'V  '])
    head(g, eyes='dot', brows='flat', mouth='grin', crown=False)
    g.put(6, 1, ['     44443333     ', '   4433333333332  ', '  433333WW3333322 ', ' 43333333WW333222 ',
                 ' 4DDDDDDDDDDDDDD21', '43DwwDDDDDDDDDDD21', '43DDDDDDDDDDDDDD21', '433NNNNNNNNNNNN221',
                 '433S        SSS221', '43             221', '43             221', '43             221',
                 '43             221', '33             211', '32             211', ' 2             11 ',
                 ' 2             1  '])
    g.put(9, 9, ['SSSSSSSSSSSSSs', 'SSSSSSSSSSSSSs'])
    g.put(9, 10, ['ttS'])
    g.put(8, 18, ['N', ' N', '  NN']); g.put(23, 18, ['N', 'N', 'N', 'N'][0:1])
    g.put(19, 15, ['WWW', 'WVW', 'WWW'])
    head(g, eyes='dot', brows='flat', mouth='grin', cheeks=False, ears=False, crown=False) if False else None
    g.put(9, 15, ['aa'])
    g.put(14, 1, ['WW', 'WW', 'WW', 'WW'])
    g.put(8, 19, ['N', 'NN', ' NNN']); g.put(21, 19, ['  N', ' NN', 'NN'])
    return g

def tribute_band():  # an Elvis act: towering pompadour, sideburns, gold shades, high studded collar
    g = doorway()
    body(g); neck(g)
    g.put(5, 17, ['W         ', 'WW        ', 'WWW       ', 'WWWW      ', ' WWWW     ', '  WWWW    ', '   VWW    '])
    g.put(21, 17, ['        V', '       VV', '      VVV', '     VVVV', '    VVVV ', '    VVV  ', '    VV   '])
    head(g, eyes='dot', brows='dark', mouth='smirk')
    g.put(4, 0, ['        jjjjhhhh  ', '     jjjhhhhhhhhhH', '   jjhhhhhhhhhhhhH', '  jhhhhhhhhHHhhhhH', ' jhhhhhhhHHhhhhhHH',
                 ' hhhhhhHHhhhhhhhH ', '    hhhhhhhhhhhhH ', '    hhhhhhhhhhhhhH', '    hhhSSShhhhhhhH', '    hhSSSSSSSSShhH'])
    g.put(7, 10, ['hh', 'hh', 'hh', 'hh', 'Hh', 'Hh', 'H']); g.put(23, 10, ['hH', 'hH', 'hH', 'hH', 'HH', 'H'])
    g.put(8, 11, ['GGGGGGGGGGGGGGGG', ' GDDDGggGGDDDG  ', ' GDwDG  GDwDG  ', ' GDDDG  GDDDG ', '  GGG    GGG  '])
    g.put(4, 1, ['         HH      ', '       HH   HH   ', '     HH    H     ', '    H    HH      ', '        H     H  '])
    g.put(8, 8, ['  hh', '   hH', '    H'])
    g.put(13, 26, ['G'], ); g.put(18, 26, ['G']); g.put(13, 29, ['G']); g.put(18, 29, ['G']); g.put(15, 24, ['GG'])
    return g

def doppelganger():  # someone eyeing their green double in a gold mirror; the double smirks back
    g = doorway()
    oval(g, 23.5, 11.5, 6.5, 9.5)
    g.put(19, 5, ['   1111   ', '  111111  ', ' 11111111 ', ' 1144441  ', ' 14444431 ', ' 4Kw44Kw3 ', ' 4KK44KK3 ',
                  ' 44443443 ', ' 44K4K443 '[:0] or ' 444KKK3  ', '  44433   ', '   333    ', '  2222222 ', ' 222222222'])
    g.put(19, 16, ['  W1 1W  '])
    body(g, cx=12, top=22, half0=7, slope=3, maxhalf=13); neck(g, x=10)
    g.put(8, 22, ['WW    WW', ' WWKKWW', '   KK', '   KK', '  KKK', '  KKK'])
    head(g, x=4, eyes='right', brows='raised', mouth='o')
    g.put(4, 2, ['    HHHHHHHH    ', '  HhhhhhhhhhhH  ', ' HhhjjjjhhhhhhH ', 'Hhjjjhhhh hhhhhH', 'hhhhhh    hhhhhH', 'hh  S      SshhH', 'h               H'])
    g.put(4, 6, ['hhhhhhh'])
    return g

def impostor():  # nose-and-glasses disguise: bushy brows, round specs, big fake nose, moustache, collar up
    g = doorway()
    body(g); neck(g)
    g.put(3, 19, ['44  ', '443 ', '4433', ' 433', '  43', '   4']); g.put(25, 19, ['  21', ' 221', '2221', '221 ', '21  ', '1   '])
    g.put(12, 22, ['W    W', 'WW  WW', ' WKKW', '  KK', '  KK'])
    head(g, eyes='right', brows='flat', mouth='grin')
    g.put(7, 1, ['    hHhhhjhh     ', '  hjhhHhhjhhhH    ', ' hhjhhhjhhhhhhH  ', 'hhjhhjhhhhhjhhhH ', 'hhjhhhhhhjhhhhhH ',
                 'hhhhjhhhhhhhhhhhH', 'hh  hhh  hhh   hH', 'h               H'])
    g.put(9, 10, ['KKKK    KKKK'])
    g.put(9, 11, ['LLLLL  LLLLLL', 'LwK L  LwK L', 'LKK LLLLKK L', 'LLLLL  LLLLL '])
    g.put(14, 13, ['SSS', 'SSSs', 'SSSs', 'tSst'])
    g.put(11, 17, ['KKKKKKKKK', ' KK KKK K'])
    g.put(13, 18, ['K  wwK'][0:0] or ['    '])
    return g

def connector():  # networker: high ponytail, headset with a mic, lanyard badge, linked dots
    g = doorway()
    g.put(4, 4, ['x  ', ' i ', '  i', '   i'][0:1]); 
    # little network of colored dots linked by pale lines
    for (x, y) in [(5, 5), (6, 6), (7, 7)]: g.c[y][x] = 'i'
    for (x, y) in [(25, 6), (24, 7)]: g.c[y][x] = 'i'
    for (x, y) in [(4, 13), (4, 14), (4, 15), (4, 16)]: g.c[y][x] = 'i'
    g.put(3, 3, ['xx', 'xx']); g.put(26, 4, ['yy', 'yy']); g.put(3, 17, ['nn', 'nn']); g.put(26, 15, ['zz', 'zz'])
    for (x, y) in [(26, 7), (26, 8), (27, 9), (27, 10), (27, 11), (27, 12), (27, 13), (27, 14)]: g.c[y][x] = 'i'
    body(g); neck(g)
    g.put(12, 22, ['44    22', ' 44  22', '  W  W', '  W  W', '  WWWW', '  WLLW', '  WWWW', '  WxxW', '  VVVV'])
    head(g, eyes='dot', brows='raised', mouth='grin')
    g.put(8, 1, ['        hhhh    ', '       hjjhhH   ', '    hhhjhhhhhh  ', '  hhjjhhhhhhhhH ', ' hhjhhhhhhhhhhhH', 'hhjhhhhhhhhhhhhH',
                 'hjhhhSSSSShhhhhH', 'hhSSSSSSSSSShhhH', 'hSSSSSSSSSSSShhH'])
    g.put(18, 1, ['  R', ' Rr']); g.put(20, 3, ['hhH', 'hhH', ' hH', ' hH', '  H'])
    g.put(7, 3, ['   NNNNNNNNN    ', ' NN         NN '])
    g.put(6, 5, ['N', 'N', 'N', 'N', 'N', 'NN', 'MN', 'MN', 'MN', 'MN', 'NN', ' N', ' N', ' NN', '  NNNN', '     MM'])
    return g

def agents():  # two suited agents in dark shades with earpieces
    g = doorway()
    body(g, cx=9, top=19, half0=6, slope=3, maxhalf=8)
    body(g, cx=23, top=18, half0=6, slope=3, maxhalf=8)
    for (cx, top) in [(9, 19), (23, 18)]:
        g.put(cx - 2, top, ['WWWW', 'WKKW', ' KK ', ' KK ', ' KK ', ' KKK', ' KKK'][:7])
        g.put(cx - 3, top, ['1    1', ' 1  1', '  11'])
    mini(g, 4, 8, mouth='flat', cheeks=False); mini(g, 18, 7, mouth='flat', cheeks=False)
    for (x, y) in [(4, 8), (18, 7)]:
        g.put(x, y - 1, ['  HHHHHH  ', ' HHhhhhhH ', 'HHhjjhhhHH', 'Hh      HH', 'H         '])
        g.put(x, y + 3, ['KKKKKKKKKK', ' DDD DDD  ', ' DwD DDD  ', '  D   D   '])
        g.put(x + 3, y + 4, ['K'])
    g.put(13, 12, ['N', 'N', ' N', ' N', 'N', 'N', ' N'][:6])
    g.put(27, 11, ['N', ' N', 'N', ' N', 'N', ' N', 'N'])
    return g

def bait():  # angler: bucket hat stuck with lures, a worm on a hook hanging from the brim, fishing vest
    g = doorway()
    body(g); neck(g)
    g.put(9, 22, ['WWW      VVV', ' WWW    VVV ', '  WWWWWWVV  ', '   WWWWVV   '])
    g.put(4, 25, ['  3222', '  2  2', '  2  2', '  2222']); g.put(22, 25, ['2222', '2  2', '2  2', '2221'])
    head(g, eyes='narrow', brows='flat', mouth='grin')
    g.put(17, 18, ['G']) 
    g.put(8, 18, ['  hhh      hhh ', '   hhhhhhhhhh  ', '     hhhhhh     '])
    g.put(13, 17, [' KKKKKK', '  KwGK '])
    g.put(5, 1, ['       444333      ', '     44333333332   ', '    4333333333322  ', '    4333333333322  ',
                 '   43333333333332  ', '   2222222222222211 ', ' 444333333333333221 ', '  1111111111111111  '])
    g.put(10, 3, ['x', 'xw', ' x']); g.put(18, 2, ['n', 'nw', 'n']); g.put(14, 4, ['yy'])
    for y in range(9, 15): g.c[y][5] = 'L'
    g.put(4, 15, [' M', 'M M', 'MMM'][0:3]); g.put(3, 17, ['qq', ' qq'])
    return g

def chronicler():  # old historian: bald dome, white fringe and beard, round spectacles, quill behind the ear
    g = doorway()
    body(g); neck(g)
    g.put(10, 22, ['VVVVVVVVVVVV', 'W VVVVVVVVVV', 'WW VVVVVVVVV'][0:0] or [])
    head(g, eyes='dot', brows='flat', mouth='smile')
    g.put(8, 3, ['    SSSwSSSS    ', '  SSSwwSSSSSSs  '])
    g.put(7, 7, ['WW            WV', 'WWW          WVV', 'WVW          WVV', 'WV            VV', 'W              V'])
    g.put(8, 11, [' tttt    tttt'])
    g.put(9, 12, ['LLLLL  LLLLL', 'L K LLLL K L', 'LLLLL  LLLLL'])
    g.put(9, 16, ['W            V', 'WW          VV', 'WWW KKKKKK VVV', 'WWWW      VVVV', ' WWWWWWWWVVVV ', '  WWWWWWWVVV  ',
                  '   WWWWWVVV   ', '    WWWVVV    ', '     WWVV     '])
    g.put(24, 2, ['   W', '  WW', '  WV', ' WWV', ' WV', 'WWV', 'WV', 'O', 'o'])
    g.put(6, 26, [])
    return g

ALL = [('echo.evergreen', 'Busker', busker), ('echo.muse', 'Muse', muse), ('echo.ensemble', 'Ensemble', ensemble),
       ('echo.hourglass', 'Stunt Double', stunt_double), ('echo.dejavu', 'Tribute Band', tribute_band),
       ('echo.doppel', 'Doppelganger', doppelganger), ('echo.impostor', 'Impostor', impostor),
       ('echo.connector', 'Connector', connector), ('echo.agents', 'Agents', agents), ('echo.bait', 'Bait', bait),
       ('echo.chronicler', 'Chronicler', chronicler)]
