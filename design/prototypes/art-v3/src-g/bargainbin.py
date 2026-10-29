import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket, portrait

# Bargain Bin (blue), round 1. A young thrift digger who just found the treasure at the bottom of the pile: a slouchy
# knit beanie, eyes creased shut with delight, a small open smile, a scruffy blue cardigan. Prop: a old vinyl
# record held up high, a white price sticker still on it. Frontal. Template: 1 person.
c = Canvas()
body = jacket(c, top=33.6, l=2, r=45)
for x in (12, 16): c.fill(c.line(x, 38, x + 1, 47) & body, '2')
c.fill(c.poly([(19.5, 33.2), (28.5, 33.2), (24, 39)]), '1')
c.put(19, 33, ['44', '.4']); c.put(27, 33, ['22', '2.'])
# raised arm (his left, our right) going up to the teapot
arm = c.poly([(33, 48), (35, 38), (37.5, 31), (42.5, 31), (42, 38), (41, 48)])
c.fill(arm, '2'); c.fill(arm & c.poly([(33, 48), (35, 38), (37.5, 31), (39.5, 31), (37.5, 48)]), '3'); c.edge(arm, '1')
c.fill(c.rect(37, 30, 42, 31), '4')
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
# ---- the find, held up high: an old vinyl record, orange label, a white price sticker
rec = c.ellipse(38.5, 23, 7.2, 7.2)
c.fill(rec, 'n'); c.outside(rec, 'm', 37.5, 22, 6.6, 6.6)
c.fill(rec & (c.ellipse(36, 20, 4.6, 4.6) - c.ellipse(36.6, 20.6, 3.8, 3.8)), 'o')      # a groove catching the light
c.fill(rec & (c.ellipse(39, 23.5, 6.2, 6.2) - c.ellipse(39, 23.5, 5.4, 5.4)) & c.rect(38, 24, 47, 47), 'p')
lab = c.ellipse(38.5, 23, 2.6, 2.6)
c.fill(lab, 'w'); c.fill(lab & c.rect(39, 23, 41, 26), 'v'); c.set(38, 22, 'n')
c.put(31, 16, ['kkk', 'kvk', 'kkk'])                                        # the price sticker
c.put(34, 28, ['.DDCC', 'DCDCDB', 'CBCBCA', '.BBBA.'])                     # his fingers on the rim
PORTRAIT = portrait('market.bargainbin', 'Bargain Bin', 'blue', c, [{'skin': 'olive', 'hair': 'black'}], 'orange')
