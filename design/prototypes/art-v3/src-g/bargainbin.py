import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket, portrait

# Bargain Bin (blue), round 1. A young thrift digger who just found the treasure at the bottom of the pile: a slouchy
# knit beanie, eyes creased shut with delight, a small open smile, a scruffy blue cardigan. Prop: an old vinyl
# record half out of its orange sleeve at his chest, a white price sticker on the sleeve. Frontal. Template: 1 person.
c = Canvas()
body = jacket(c, top=33.6, l=2, r=45)
for x in (12, 16): c.fill(c.line(x, 38, x + 1, 47) & body, '2')
c.fill(c.poly([(19.5, 33.2), (28.5, 33.2), (24, 39)]), '1')
c.put(19, 33, ['44', '.4']); c.put(27, 33, ['22', '2.'])
# his arm (our right) coming up from below to hold the record sleeve at his chest
arm = c.poly([(36, 48), (38, 43), (41, 41), (46, 41), (46, 48)])
c.fill(arm, '2'); c.fill(arm & c.rect(36, 41, 40, 48), '3'); c.edge(arm, '1')
# neck
c.fill(c.rect(21, 28, 26, 33), 'B'); c.fill(c.rect(21, 28, 26, 29), 'A'); c.fill(c.rect(25, 30, 26, 32), 'A')
# ---- face x15..32
rows(c, 15, {
    13: "..CDDDDCCCCCCCCBA.",
    14: ".BCDDDDCCCCCCCCCBA",
    15: ".BCDDDCCCCCCCCCCBA",
    16: ".BCEEECCCCCCEEECBA",
    17: ".BCBBBBCCCCBBBBBBA",
    18: ".BCCCCCCDDCCCCCBBA",
    19: ".BCCzzCCDDCCzzCBBA",
    20: ".BCzCCzCDDCzCCzBBA",
    21: ".BCCCCCCDDBCCCCBBA",
    22: ".BDDDCCCDDBCDDCBBA",
    23: ".BDDDCCCCCBCCCCBBA",
    24: ".BCDCCCCAABCCCCBA.",
    25: "..BCCCCCCCCCCCBBA.",
    26: "..BCCCAzzzzACCBA..",
    27: "...BCCCBzzBCCBA...",
    28: "....BBCCDDCCBA....",
    29: "......ABBBBA......",
})
c.put(14, 18, ['C', 'D', 'C', 'B'])
c.put(14, 15, ['EF', 'EF']); c.put(32, 15, ['FE', 'E.'])               # hair escaping at the temples
# ---- slouchy knit beanie, ribbed cuff
hat = c.poly([(14, 14.6), (14.4, 9), (17, 5.4), (22, 3.6), (28, 3.8), (32, 5.6), (34.6, 9), (35, 12), (34, 14.6)])
c.fill(hat, '2'); c.outside(hat, '1', 22, 8, 12, 6); c.fill(hat & c.ellipse(20, 7, 5, 2.4), '3')
cuff = c.rect(14, 12, 34, 14) & hat
c.fill(cuff, '3'); c.fill(cuff & c.rect(28, 12, 34, 14), '2')
for x in range(15, 34, 2): c.set(x, 13, '2' if x < 28 else '1')
c.rim(hat, '4', -1, -1, 1, only='3')
# ---- the find, at his chest: an old vinyl record sliding out of its orange sleeve, a white price sticker
sl = c.rect(36, 28, 46, 39)
c.fill(sl, 'v'); c.fill(c.rect(36, 28, 46, 28) | c.rect(36, 28, 36, 39), 'w'); c.fill(c.rect(37, 39, 46, 39) | c.rect(46, 29, 46, 39), 'u')
c.fill(c.ellipse(42.5, 34, 2.4, 2.4) - c.ellipse(42.5, 34, 1.4, 1.4), 'w')        # the sleeve's printed ring
rec = c.ellipse(32.5, 34, 6.4, 6.4)
c.fill(rec, 'n'); c.outside(rec, 'm', 31.5, 33, 5.8, 5.8)
c.fill(rec & (c.ellipse(30.5, 31.5, 4, 4) - c.ellipse(31.1, 32.1, 3.2, 3.2)), 'o')      # a groove catching the light
lab = c.ellipse(32.5, 34, 2.2, 2.2)
c.fill(lab, 'w'); c.fill(lab & c.rect(33, 34, 35, 36), 'v'); c.set(32, 33, 'n')
c.edge(rec, 'm')
c.put(42, 29, ['kkk', 'kvk', 'kkk'])                                        # the price sticker
c.put(40, 38, ['..DDC.',
               '.DDCCCB',
               'DCCCCBA',
               'CCCCBA.',
               '.BBBA..'])                                                  # his hand under the sleeve, knuckles lit
c.put(39, 37, ['D', 'C'])                                                   # thumb on the front
PORTRAIT = portrait('market.bargainbin', 'Bargain Bin', 'blue', c, [{'skin': 'olive', 'hair': 'black'}], 'orange')
