# Straggler: just woke up, striped nightcap flopping over with a pompom, bed-head, droopy eyes, a big yawn, z's drifting up.
from common import *
def draw(g):
    doorway(g); shoulders(g)
    g.put(14, 22, ['ssss', ' tt '])
    for y in range(24, 32, 3):
        for x in range(0, 32):
            if g.c[y][x] in '1234': g.c[y][x] = 'U' if g.c[y][x] in '34' else 'u'
    g.put(10, 22, ['WWW', ' WWV']); g.put(19, 22, ['VWW', 'VWW '])
    face(g, 8, 9)
    g.put(7, 6, ['h jhh hhh  hhh h ', 'hhjhhhhhhhhhhhhhh', 'HhhhhhhhhhhhhhhHH', 'Hh hh        hhH'])
    g.put(7, 2, ['   WWUUUUUUWW    ',
                 '  WWUUUUUUUWWuu  ',
                 ' WWWUUUUUUUWWWuu ',
                 'WWWWUUUUUUUWWWuuu'])
    g.put(23, 1, ['UU  ', 'UuU ', ' uWW', ' WVW', ' WWV', '  VV'][0:0])
    g.put(21, 2, ['WWuu', 'UUuuu', '   uuW', '    WWW', '    WWV', '     VV'][0:0])
    g.put(20, 1, ['   WU  ', '  UUWu ', '   UUuW', '    uWWV', '    WWWV', '    WVVV', '     VV'][0:0])
    g.put(19, 1, ['  UUW  ', ' UUWWuu', '      Wu', '       u', '      WWW', '      WWV', '       V'][0:0])
    g.put(20, 2, ['  W', ' UUWu', 'UUWWuu', '    uU', '     uW', '    WWW', '    WWV', '     VV'][0:0])
    g.put(22, 4, ['Uu', 'uuu', ' uuu', '  uW', ' WWWV', ' WWVV', '  VV'])
    g.put(10, 12, ['tt      tt'])
    g.put(10, 12, ['ssss    ssss'][0:0])
    g.put(10, 13, ['KK      KK'])
    g.put(10, 12, ['ttt     ttt'][0:0])
    g.c[14][15] = 't'; g.put(14, 15, ['tt'][0:0])
    g.put(9, 14, ['aa          aa'][0:0])
    g.put(9, 15, ['aa']); g.put(20, 15, ['aa'])
    g.put(13, 15, [' KKKK ', 'KrrrrK', 'KrqqrK', 'KrqqrK', ' KKKK '])
    g.put(3, 4, ['WWW', ' W ', 'WWW'][0:0])
    g.put(2, 9, ['WWW', ' WV', 'WWW'][0:0])
    g.put(3, 10, ['WWV', ' W', 'WWV'])
    g.put(5, 6, ['WV', 'WW'])
    g.put(5, 6, ['WW', 'WW'])
