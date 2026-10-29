import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Grand Host (silver): the host of the season's party, delighted to see you. Slick black hair, a curled moustache,
# a silver tailcoat and a black bow tie, a lit gold candelabra raised in one hand. 3/4 to our right. Template: 1 person.
c = Canvas()
body = cloth(c, [(1, 48), (1, 40), (3, 36.5), (8, 34.5), (17, 33.5), (30, 33.5), (39, 34.5), (44, 36.5), (46, 40), (46, 48)])
shirt = c.poly([(19.5, 33), (28.5, 33), (27, 47), (21, 47)]); c.fill(shirt, 'y'); c.fill(shirt & c.rect(25, 33, 30, 47), 'k')
lapL = c.poly([(14.5, 33.5), (19.5, 33), (22, 47), (19.5, 47), (16, 38.5), (12.5, 35.8)])
lapR = c.poly([(28.5, 33), (33.5, 33.5), (35.5, 35.8), (32, 38.5), (28.5, 47), (26, 47)])
c.fill(lapL, '2'); c.rim(lapL, '4', -1, 0, 1); c.edge(lapL, '1'); c.fill(lapR, '1'); c.edge(lapR, '1')
c.put(24, 39, ['z']); c.put(24, 43, ['z'])                                       # shirt studs
neck(c, 20, 27, 28, 32)
c.put(20, 32, ['zz.zz', 'zzozz', 'zz.zz'][0:1]); c.put(20, 32, ['zzozz', '.zzz.', 'zz.zz'])   # bow tie
f = face(c, (15, 10, 32, 28), 19, view='r', jaw='square', eyes='laugh', mouth='grin', brows='raised')
# curled moustache over the grin
c.put(19, 23, ['E.....E', 'FFF.FFF', '.FFFFF.'][::-1][0:0])
c.put(19, 22, ['F.......F'][0:0])
c.put(20, 23, ['EFFF.FFFE'][0:0])
seg(c, {21: [(19, 'E'), (29, 'E')], 22: [(19, 'FF'), (28, 'FF')], 23: [(21, 'FFF'), (25, 'FFF')]})
c.put(22, 24, ['CCCC']); c.put(21, 25, ['AzzzzA']); c.put(22, 26, ['AAAA'])
# slick black hair with a side part and a shine
h = c.poly([(13.5, 20), (13.5, 13), (16, 9), (21, 7), (28, 7), (32, 9), (34, 13), (33.6, 18), (32.2, 15), (27, 12.6), (20, 12.4),
            (17, 14), (15.6, 20)])
c.fill(h, 'F'); c.outside(h, 'E', 21, 10, 11, 4.6); c.rim(h, 'G', -1, -1, 1, only='F')
c.fill(c.line(18, 9, 25, 8), 'H'); c.fill(c.line(26, 8, 27, 12), 'E')
# the candelabra raised in his hand (our right): three white candles with flames on curved gold arms
c.put(33, 1, ['.x....x....x.', 'xwx..xwx..xwx', '.w....w....w.', 'yk...yk...yk.', 'yk...yk...yk.', 'yk...yk...yk.',
              'yk...yk...yk.', 'cbc.cbc..cbc.', 'cb...c....bc.', '.cb..c...bc..', '..cbbcbbbc...', '....bcb......',
              '.....c.......', '.....c.......', '.....b.......', '....CCD......', '...CCCCC.....', '...BCCCB.....',
              '....BBB......'])
c.fill(c.rect(37, 20, 37, 33), 'c'); c.fill(c.rect(38, 20, 38, 33), 'b')
merge(c, {'o': 'z', 'j': 'k', 'd': 'c', 'H': 'G'})
PORTRAIT = {'id': 'silver.grandhost', 'name': 'Grand Host', 'kind': 'member', 'sphere': 'silver',
            'people': [{'skin': 'olive', 'hair': 'black'}], 'accent': 'orange', 'px': c.rows()}
