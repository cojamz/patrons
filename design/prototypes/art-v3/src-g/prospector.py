import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket, portrait

# Prospector (gold), round 1. A prospector who just struck it: a battered felt hat pushed back, eyes creased shut in
# delight, a wide closed smile, short black hair at the temples, a red neckerchief, a gold work shirt.
# Prop: a steel gold pan held out in both hands with one fat nugget gleaming in it. True 3/4 to our right. Template: 1 person.
c = Canvas()
body = jacket(c, top=34, l=2, r=45)
c.fill(c.line(24, 37, 23, 47), '2')
c.put(22, 39, ['1']); c.put(22, 44, ['1'])                      # shirt buttons
# neck, chin shadow, the neckerchief knotted at the side
c.fill(c.rect(20, 27, 26, 33), 'B'); c.fill(c.rect(20, 27, 26, 28), 'A')
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
    19: "..BCCCzzzCCDCCzzCBA.",
    20: "..BCCzCCCzCDCzCCzBA.",
    21: "..BCDDDDCCCDBCCCCBA.",
    22: "..BCDDDDDCCDDBCCCBA.",
    23: "..BCCDDCCCAAAACCCBA.",
    24: "..BCCCCCCCCCCCCCBBA.",
    25: "...BCCCCAzzzzACCBA..",
    26: "...BCCCCCBBBBCCCBA..",
    27: "....BBCCCDDDCCCBA...",
    28: "......ABBBBBBBA.....",
})
c.put(15, 19, ['CD', 'BCC', 'ABC', 'BA'])                          # the near ear
c.put(15, 16, ['EE', 'EE', 'E']); c.put(32, 16, ['E', 'E', 'E'])  # short black hair at the temples
# ---- battered felt hat, pushed back: a dented crown and a soft brim, a gold-cord band
crown = c.poly([(17, 13), (17.6, 7), (20, 4.4), (24, 4.8), (25.5, 5.8), (27, 4.8), (30.5, 4.4), (32.4, 7), (33, 13)])
c.fill(crown, 's'); c.outside(crown, 'r', 22, 7, 9.5, 5.4)
c.fill(crown & c.rect(0, 10, 47, 11), '2'); c.fill(crown & c.rect(29, 10, 47, 11), '1')
brim = c.poly([(10, 14.6), (13, 12.2), (36, 12.2), (39.5, 13.2), (38, 15), (31, 14.6), (18, 14.6)])
c.fill(brim, 'r'); c.fill(brim & c.rect(0, 12, 47, 12), 's')
# ---- the gold pan held out in both hands: a shallow steel dish seen from above, wet sand, one fat nugget
pan = c.ellipse(24, 42.5, 12.4, 5.2)
c.fill(pan, 'g'); c.outside(pan, 'f', 23, 41.5, 11.8, 4.6)
inner = c.ellipse(24.3, 42.8, 10.2, 3.6)
c.fill(inner, 'e'); c.fill(inner & c.ellipse(24, 43.6, 9, 2.6), 'f')
c.edge(pan, 'e')
c.put(21, 39, ['..55..', '.5444.', '544434', '443433', '.2222.']); c.set(23, 39, '!')       # the nugget
c.put(9, 41, ['.DDC', 'DCDCB', 'CBCBA', '.BBA.'])                  # her hands on the rim
c.put(35, 41, ['.DDC', 'DCDCB', 'CBCBA', '.BBA.'])
PORTRAIT = portrait('gold.prospector', 'Prospector', 'gold', c, [{'skin': 'deep', 'hair': 'black'}], 'red')
