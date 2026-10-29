import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Connoisseur (blue): an older gentleman, bald with a white fringe and a trim white goatee, eyes closed, savouring the
# nose of a glass of red he holds up by the stem. Velvet jacket with peaked lapels, red cravat. 3/4 to our right.
# Template: 1 person.
c = Canvas()
body = cloth(c, [(1, 48), (1, 40), (3, 36.5), (8, 34.5), (17, 33.5), (30, 33.5), (39, 34.5), (44, 36.5), (46, 40), (46, 48)])
cravat = c.poly([(19.5, 33), (28.5, 33), (27, 40), (24, 42), (21, 40)])
c.fill(cravat, 'v'); c.fill(cravat & c.rect(25, 33, 30, 42), 'u'); c.put(21, 34, ['ww', 'w'])
lapL = c.poly([(14.5, 33.5), (19.5, 33), (23, 44.6), (20.6, 44.6), (16, 38.5), (12.5, 35.8)])
lapR = c.poly([(28.5, 33), (33.5, 33.5), (35.5, 35.8), (32, 38.5), (27.4, 44.6), (25, 44.6)])
c.fill(lapL, '2'); c.rim(lapL, '4', -1, 0, 1); c.edge(lapL, '1'); c.fill(lapR, '2'); c.edge(lapR, '1')
neck(c, 20, 27, 28, 32)
f = face(c, (15, 9, 32, 28), 19, view='r', jaw='square', eyes='closed', mouth='flat', brows='none', top=(4, 2, 1))
lift(c, f['m'] - c.mask_of('zy!') - c.rect(0, 27, 47, 28))   # deep skin: light the face so it reads at 1x
# bald crown lit from the top-left
c.put(18, 10, ['DDDD', 'DDD']); c.put(17, 12, ['DD'])
# white fringe at the back and side, white brows, a full trim white beard
hair(c, [(13, 21), (13.5, 15), (16, 13.5), (17, 15), (15.5, 21)], 14, 15, 2, 3)
c.put(31, 15, ['GF', 'GFA', 'FF'])
seg(c, {16: [(18, 'GGG'), (26, 'GG')], 17: [(17, 'G'), (21, 'C')]})
c.put(18, 18, ['BBBB']); c.put(26, 18, ['BBB'])
c.put(18, 19, ['zzzz']); c.put(26, 19, ['zzz']); c.put(17, 19, ['z']); c.put(18, 20, ['DDD'])
seg(c, {
    21: [(15, 'FG')],
    22: [(15, 'FGG')],
    23: [(15, 'FG'), (17, 'GGGF'), (21, 'CCC'), (24, 'GGFE')],
    24: [(15, 'FGGGC'), (21, 'BAAAB'), (26, 'CFFE')],
    25: [(16, 'FGGGFFEEFFFFFFE')],
    26: [(17, 'FGGFFFFFFFFFE')],
    27: [(18, 'FGFFFFFFFFE')],
    28: [(19, 'EFFFFFFFE')],
    29: [(21, 'EEEEE')],
})
c.fill(c.rect(32, 21, 32, 25), 'A')
# the glass held up by the stem: a tulip bowl of film, red wine, the stem, his fingers
seg(c, {
    19: [(32, '"""""""')],
    20: [(32, '":::::^')],
    21: [(32, '"::::^^')],
    22: [(32, '"wwwwv^')],
    23: [(32, '"vvvvu^')],
    24: [(33, '^vvuu^')],
    25: [(34, '^^^^')],
})
c.fill(c.rect(35, 26, 35, 33), '"'); c.fill(c.rect(36, 26, 36, 33), '^')
c.put(33, 30, ['.D...', 'CDCDC', 'CCCCB', 'BCCBB', '.BBB.', '.222.'])   # fingers round the stem: thumb, knuckles, cuff
PORTRAIT = {'id': 'market.connoisseur', 'name': 'Connoisseur', 'kind': 'member', 'sphere': 'blue',
            'people': [{'skin': 'deep', 'hair': 'grey'}], 'accent': 'red', 'px': c.rows()}
