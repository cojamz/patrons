import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
# Scout (colorless): once per round, send shop members to the bottom of the pile, then refill. A young trail scout
# in a pinched campaign hat, alert eyes turned to our right, brows up, an orange neckerchief with a woggle, field
# shirt with pocket flaps. Prop: binoculars held ready at the chest. True 3/4 to our right. Template: 1 person.
c = Canvas()
body = torso(c, [(2, 48), (3, 41), (7, 36.5), (16, 34), (31, 34), (38, 36), (42, 40), (44, 48)], 18, 40)
for x0 in (8, 31): c.put(x0, 38, ['2222222', '1111111'])                             # pocket flaps
c.fill(c.rect(20, 28, 27, 34), 'A'); c.fill(c.rect(20, 31, 21, 34), 'B')
c.put(17, 32, ['wwwwwwwwwwwvv', '.vwwwwwwwwvvv', '..vwwwwwwvv..', '....vwwv.....', '....vwwv.....', '.....wv......', '.....wv......'])
c.put(21, 35, ['ss', 'rr'])                                                         # woggle
# ---- binoculars held up at the chest
for x0 in (14, 23):
    c.put(x0, 39, ['.mnnnnm.', 'mn44nnnm', 'mn4nnnmm', 'mnnnnnmm', 'mnnnnnmm', 'mmmmmmmm'])
c.put(21, 40, ['nn', 'mm'])
c.put(15, 45, ['zzzzz']); c.put(24, 45, ['zzzzz'])
for x0, x1 in ((10, 15), (30, 35)):
    hand = c.poly([(x0, 41), (x0 + 2, 39.6), (x1, 40), (x1 + 1, 44), (x1 - 1, 46.4), (x0, 46)])
    c.fill(hand, 'C'); c.rim(hand, 'D', 0, -1, 1, only='C'); c.edge(hand, 'A')
# ---- face, 3/4 to our right, alert. ruler x 14..33
blk(c, 14, 14, '''
|.FCCCCCCCCCCCCCCCBA.
|.FCDDDDDCCCCCCCBBBA.
|.CCDEEEEECCCCEEEBBA.
|.CCBBBBBBCCCBBBBBBA.
|.CBCBzzzBDCBBzzBBBA.
|.CACyFzzBDCByFzBBBA.
|.CACCCCCCCDBCCCBBBA.
|.CBDDDCCCCDBCCCBBBA.
|..BCDDCCCCDDABCBBBA.
|..BCCCCCCCCBBBCBBBA.
|..BCCCCCCAAABCCBBA..
|..BCCCCCCCBBCCBBBA..
|...BCCCCDDCCCBBBA...
|....BBCCCCCCBBBA....
|.....ABBBBBBBBA.....
''')
c.put(13, 19, ['C', 'D', 'C'])
# ---- campaign hat: flat wide brim, a pinched peak
crown = c.poly([(16, 11.5), (17, 6), (20, 3.2), (23.5, 1), (27.5, 3.2), (31, 6), (32, 11.5)])
c.fill(crown, 's'); c.outside(crown, 'r', 22, 5, 9, 6); c.rim(crown, 't', -1, -1, 1, only='s')
c.fill(c.line(23, 2, 21, 9) & crown, 'r'); c.fill(c.line(24, 2, 26, 9) & crown, 'r')     # the pinch
c.fill(crown & c.rect(0, 9, 47, 10), 'v'); c.fill(crown & c.rect(28, 9, 47, 10), 'r')     # band
brim = c.poly([(6.5, 13), (9, 11), (39, 11), (41.5, 13), (39, 14.4), (9, 14.4)])
c.fill(brim, 's'); c.fill(brim & c.rect(0, 11, 47, 11), 't'); c.fill(brim & c.rect(0, 13, 47, 14), 'q'); c.edge(brim, 'q')
PORTRAIT = portrait('benders.scout', 'Scout', c, [{'skin': 'tan', 'hair': 'darkbrown'}], 'orange')
