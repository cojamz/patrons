import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Extortionist (magenta): the collector. Bald, round wire glasses, a thin moustache, stern and patient, a pinstriped
# suit, holding up his black ledger, gold coins on the cover. Front. Template: 1 person.
c = Canvas()
body(c, [(1, 48), (2, 40), (7, 35.5), (16, 33.5), (31, 33.5), (40, 35.5), (45, 40), (46, 48)])
for x in range(5, 44, 4): c.fill(c.rect(x, 36, x, 48) & c.mask_of('34'), '2')          # pinstripes
c.fill(c.poly([(19.5, 33), (28.5, 33), (24, 42)]), 'k')
c.fill(c.poly([(23, 34.5), (25, 34.5), (25.6, 40), (24, 42), (22.4, 40)]), 'n')       # black tie
lapL = c.poly([(15, 34), (19.5, 33), (24, 43), (21.5, 43.5), (17, 38.5), (13.5, 36)])
lapR = c.poly([(28.5, 33), (33, 34), (34.5, 36), (31, 38.5), (26.5, 43.5), (24, 43)])
c.fill(lapL, '4'); c.edge(lapL, '1'); c.fill(lapR, '2'); c.edge(lapR, '1')
neck(c, 0, 20, 27, 29, 33)
crown = c.ellipse(24, 15.6, 9.4, 8)
c.fill(crown, 'C'); c.outside(crown, 'B', 22.6, 14.4, 8.8, 7.6); c.outside(crown, 'A', 21.6, 13.6, 10.4, 9.4)
c.fill(c.poly([(17, 11), (20, 8.4), (24, 7.8), (22, 9.6), (18.4, 12.4)]), 'D')
face(c, 0, 15, 19, 18, 6, 9, view='f', eyes='level', mouth='stern', jaw='oval')
c.fill(c.rect(14, 15, 15, 20), 'F'); c.fill(c.rect(32, 15, 33, 20), 'E')             # what's left of the hair
c.put(19, 22, ['FFFF.FFFF'][0:0]); c.put(20, 23, ['EFFFFFE'])                          # thin moustache
c.put(16, 16, ['.zzzz..zzzz.', 'z....zz....z', 'z....z.....z', '.zzzz..zzzz.'][0:0])
for y in range(15, 20):                                                     # clear the eye band, then draw it once by hand
    for x in range(16, 31):
        if c.get(x, y) not in '.EF': c.set(x, y, 'C' if x < 28 else 'B')
c.put(19, 15, ['EEE....EEE'])                                                 # level brows, both the same
c.put(16, 16, ['.AAA...AAA.', 'A.zz.A.A.zz.A'[0:0], 'A...A.A...A'][0:1])
c.put(18, 16, ['.AAAA.AAAA.', 'A!zzAAA!zzA', 'A.zzA.A.zzA', '.AAAA.AAAA.'])   # round wire glasses, one glint per lens, eyes alike
# the ledger, held up to show you
lg = c.poly([(31, 30), (41, 28.6), (43, 41), (33, 42.4)])
c.fill(lg, 'n'); c.outside(lg, 'm', 36, 34, 6, 7); c.rim(lg, 'o', -1, -1, 1, only='n')
c.fill(c.line(32, 41, 42, 40) | c.line(42, 40, 43, 41), 'k')               # page edges
c.put(35, 32, ['.cc.', 'cddc', 'bccb', '.bb.']); c.put(37, 36, ['.cc.', 'cddc', 'bccb', '.bb.'])   # gold coins on the cover
c.edge(lg, 'm')
hand(c, 30, 37, 0, 'grip')
PORTRAIT = portrait(c, 'thieves.extortionist', 'Extortionist', 'magenta', [{'skin': 'porcelain', 'hair': 'ash'}])
