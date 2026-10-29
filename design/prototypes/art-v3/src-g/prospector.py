import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket, portrait

# Prospector (gold), round 1. A prospector who just struck it: a battered felt hat pushed back, eyes creased shut in
# delight, a small closed smile, short black hair at the temples, a red neckerchief, a gold work shirt.
# Prop: one fat gold nugget held up by her face between thumb and fingers, a glint on it. True 3/4 to our right. Template: 1 person.
c = Canvas()
body = jacket(c, top=34, l=2, r=45)
c.fill(c.line(24, 37, 23, 47), '2')
c.put(22, 39, ['1']); c.put(22, 44, ['1'])                      # shirt buttons
# neck, chin shadow, the neckerchief knotted at the side
c.fill(c.rect(21, 27, 25, 33), 'B'); c.fill(c.rect(21, 27, 25, 28), 'A')
kerch = c.poly([(17, 31.6), (24, 33.4), (31, 31.6), (31.6, 34.2), (26, 36.4), (24, 39.5), (22, 36.4), (16.5, 34.2)])
c.fill(kerch, 'v'); c.fill(kerch & c.rect(25, 31, 33, 40), 'u'); c.edge(kerch, 'u')
# ---- face, 3/4 to our right. Deep skin lit on D: forehead, cheekbone, nose bridge, chin; the row under the mouth stays dark.
rows(c, 14, {
    13: "...BCDDDDDDDCCCCBA..",
    14: "...BCDDDDDDDDCCCCBA.",
    15: "..BCDDDDDDDDCCCCCBA.",
    16: "..BCDEEEEECCCEEEEBA.",
    17: "..BCDBBBBBCDCBBBBBA.",
    18: "..BCCCCCCCCDCCCCCBA.",
    19: "..BDDDzzzDDDCCzzCBA.",
    20: "..BDDzDDDzDDCzCCzBA.",
    21: "..BCDDDDCCCDBCCCCBA.",
    22: "..BCDDDDDCCDDBCCCBA.",
    23: "..BCCDDCCCAAAACCCBA.",
    24: "..BCCCCCCCCACCCACBA.",
    25: "...BCCCCCCCzzzCCBA..",
    26: "...ABCCCCCCCCCCBA...",
    27: "....ABCCDDDCCCBA....",
    28: "......AABBBBBA......",
})
c.put(15, 19, ['CD', 'BCC', 'ABC', 'BA'])                          # the near ear
c.put(15, 16, ['EE', 'EE', 'E']); c.put(32, 16, ['E', 'E', 'E'])  # short black hair at the temples
# ---- battered felt hat, pushed back: a dented crown and a soft brim, a gold-cord band
crown = c.poly([(17, 13), (17.6, 7), (20, 4.4), (24, 4.8), (25.5, 5.8), (27, 4.8), (30.5, 4.4), (32.4, 7), (33, 13)])
c.fill(crown, 't'); c.outside(crown, 's', 22, 7, 9.5, 5.4)
c.fill(crown & c.rect(0, 10, 47, 11), '2'); c.fill(crown & c.rect(29, 10, 47, 11), '1')
brim = c.poly([(10, 14.6), (13, 12.2), (36, 12.2), (39.5, 13.2), (38, 15), (31, 14.6), (18, 14.6)])
c.fill(brim, 's'); c.fill(brim & c.rect(0, 12, 47, 12), 't'); c.fill(brim & c.rect(31, 14, 47, 15), 'r')
# ---- her arm comes up from below: the nugget held up by her face, pinched between thumb and fingers
arm = c.poly([(31, 48), (40, 48), (38.6, 38), (36.6, 33.4), (30.6, 33.4), (31.4, 38)])
c.fill(arm, '3'); c.fill(arm & c.poly([(35, 48), (40, 48), (38.6, 38), (36.6, 33.4), (34.6, 33.4)]), '2'); c.edge(arm, '1')
c.put(31, 33, ['44443', '.3332'])                                      # rolled cuff
c.put(29, 29, ['.DDDDC.',
               'DDCCCCB',
               'CCCCCBA',
               '.BCCBA.'])                                              # fingers curled under it, knuckles lit
c.put(29, 26, ['D', 'D', 'C'])                                          # her thumb up its near side
nug = ['..dd.',
       '.d!dc',
       'ddccb',
       'dccbb',
       '.cbb.']
c.put(30, 24, nug)
c.edge({(30 + i, 24 + j) for j, r in enumerate(nug) for i, ch in enumerate(r) if ch != '.'} - c.mask_of('D'), 'a')
PORTRAIT = portrait('gold.prospector', 'Prospector', 'gold', c, [{'skin': 'deep', 'hair': 'black'}], 'red')
