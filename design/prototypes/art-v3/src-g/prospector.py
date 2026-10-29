import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket, portrait

# Prospector (gold), round 1. A prospector who just struck it: a battered felt hat pushed well back off a lit forehead,
# warm brown eyes wide with delight, a closed smile, short black hair at the temples, a red neckerchief, a gold work shirt.
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
    19: "..BDDzzzzDDDCzzzCBA.",
    20: "..BDDyszyDDDCyszCBA.",
    21: "..BCDDDDCCCDBCCCCBA.",
    22: "..BCDDDDDCCDDBCCCBA.",
    23: "..BCCDDCCCCAAACCCBA.",
    24: "..BCCCCCCCzCCCzCBBA.",
    25: "...BCCCCCCCzzzCCBA..",
    26: "...ABCCCCCCCCCCBA...",
    27: "....ABCCDDDCCCBA....",
    28: "......AABBBBBA......",
})
c.put(15, 19, ['CD', 'BCC', 'ABC', 'BA'])                          # the near ear
c.put(15, 16, ['EE', 'EE', 'E']); c.put(32, 16, ['E', 'E', 'E'])  # short black hair at the temples
# ---- battered felt hat, pushed back: a dented crown and a soft brim, a gold-cord band
crown = c.poly([(17, 11), (17.8, 5.4), (20.6, 3.2), (24, 3.4), (25.5, 4.4), (27, 3.4), (30, 3.2), (32.2, 5.4), (33, 11)])
c.fill(crown, 't'); c.outside(crown, 's', 22, 5, 9.5, 5.4)
c.fill(crown & c.rect(0, 8, 47, 9), '2'); c.fill(crown & c.rect(29, 8, 47, 9), '1')
brim = c.poly([(12, 12.4), (14, 10.2), (35, 10.2), (37.5, 11.2), (36, 12.8), (31, 12.6), (18, 12.6)])
c.fill(brim, 's'); c.fill(brim & c.rect(0, 10, 47, 10), 't')
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
# Lighting pass for 1x (deep skin): the bridge lit between the brows and down the nose, the temple lit, the near cheek
# and jaw lit down to the chin and the upper lip lit, so the lower face under the brim isn't a dark mass; a bounce
# (C) inside the shadow-side jaw (wood r would break the color cap).
lit = [(24, 16), (25, 16), (24, 17), (17, 18), (18, 18), (19, 18), (24, 18), (16, 23), (17, 23), (18, 23), (21, 23),
       (22, 23), (23, 23), (16, 24)] + [(x, 24) for x in range(17, 23)] + [(25, 24), (26, 24), (17, 25)] + \
      [(x, 25) for x in range(18, 23)] + [(18, 26), (19, 26), (20, 26), (21, 26)]
for (x, y) in lit:
    if c.get(x, y) in 'BC': c.set(x, y, 'D')
if c.get(19, 27) == 'B': c.set(19, 27, 'C')
for y in range(19, 24):
    if c.get(31, y) == 'B': c.set(31, y, 'C')
PORTRAIT = portrait('gold.prospector', 'Prospector', 'gold', c, [{'skin': 'deep', 'hair': 'black'}], 'red')
