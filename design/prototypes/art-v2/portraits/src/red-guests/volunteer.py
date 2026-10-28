# Volunteer: eager helper in a ball cap and a HELLO sticker, big open grin.
from common import *
def draw(g):
    doorway(g); shoulders(g)
    face(g, 8, 9)
    g.put(14, 22, ['ssss', ' tt '])
    g.put(7, 9, ['Hh', 'Hh', 'H']); g.put(23, 9, ['hH', 'hH', ' H'])
    g.put(8, 3, ['    44333322    ',
                 '  443333333322  ',
                 ' 4433333WW33322 ',
                 ' 433333WWWW3322 ',
                 '4333333333333221'])
    g.put(6, 8, ['44443333333333332211',
                 ' 211111111111111111 '])
    g.put(8, 10, ['ssssssssssssssst'])
    eyes(g, 10, 12)
    g.c[14][15] = 't'; g.put(14, 15, ['tt'])
    g.put(9, 15, ['aa']); g.put(20, 15, ['aa'])
    g.put(12, 17, ['KwwwwwwK', ' KqqqqK ', '  KKKK  '])
    g.put(17, 25, ['yyyyy', 'WWWWW', 'WKKWW', 'WWWWV'])
