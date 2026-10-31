import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket

# Speculator (gold), round 1. A young card-sharp betting it all: freckled, slicked ginger hair under a green
# eyeshade, a sly side-glance at the coin he just flipped (it hangs in the air at his shoulder). Gold waistcoat over a
# gold shirt. True 3/4 to our right. Template: 1 person.
c = Canvas()
body = jacket(c)
# waistcoat: darker gold panels, a V of shirt
c.fill(c.poly([(19, 33.2), (29, 33.2), (24, 41)]), '4')
c.fill(c.poly([(14, 34), (19.5, 33.4), (24, 41.5), (24, 48), (13, 48), (12, 38)]) - c.poly([(19, 33.2), (29, 33.2), (24, 41)]), '2')
c.fill(c.poly([(28.5, 33.4), (34, 34), (36, 38), (35, 48), (24, 48), (24, 41.5)]) - c.poly([(19, 33.2), (29, 33.2), (24, 41)]), '1')
c.fill(c.line(24, 41, 24, 47), '1')
for y in (43, 46): c.put(22, y, ['d'])
c.put(20, 33, ['55', '.5']); c.put(27, 33, ['55', '5.'])         # shirt collar points
# neck
c.fill(c.rect(20, 28, 26, 33), 'B'); c.fill(c.rect(24, 29, 26, 33), 'A'); c.fill(c.rect(20, 28, 26, 28), 'A')
# ---- head, 3/4 to our right
rows(c, 14, {
    12: "...EFFCCDDDCCCCCB...",
    13: "..EFFCDDDDDCCCCCBA..",
    14: "..EFFBBBBBBBBBBBBA..",
    15: "..EFGBBBBBBBBBBBBBA.",
    16: "..EFGCEEEEECCCCEEEBA",
    17: "..EFCBzzzzBCDBBzzzBA",
    18: "..EFCByyz!CCDCByz!BA",
    19: "..FBCCBBBCCCDBCBBBBA",
    20: "..BCBCDDDDCCDBCCCCBA",
    21: "..BCACDBDDBCDDBCCCBA",
    22: "..BCACDDDDCCCDCBCCBA",
    23: "..FBBCCCCCCCCCDBCCBA",
    24: "...BBCCCCCCCCAABCCBA",
    25: "...ABCCCCCCCCCCCABA.",
    26: "....BBCCCCAAAAACBBA.",
    27: ".....ABBCCCDDDCBBA..",
    28: ".......ABBBBBBBAA...",
})
c.put(16, 18, ['CD', 'BCC', 'ABC', 'BA'])                          # the near ear
# ---- slicked ginger hair at the back and sides
hair = c.poly([(15, 18.5), (14.4, 12), (16, 8.5), (20, 6.5), (26, 6.2), (31, 7.6), (33.2, 10.5), (33, 12.2), (18.6, 13),
               (17.6, 18.5)])
c.fill(hair, 'G'); c.outside(hair, 'F', 22, 9, 9, 4.5); c.outside(hair, 'E', 22, 9, 12, 6.5)
c.fill(hair & (c.line(17, 10, 22, 8) | c.line(19, 11, 24, 9)), 'G')
# ---- the green eyeshade: a band round the head and a long brim shading the eyes
band = c.poly([(15, 9.8), (33.4, 8.6), (33.6, 11.4), (15, 12.6)])
c.fill(band, 'v'); c.fill(band & c.rect(0, 0, 22, 9), 'w')
brim = c.poly([(17, 12.4), (33.6, 11), (37.6, 12.6), (36.4, 14.4), (19, 14.6)])
c.fill(brim, 'w'); c.fill(brim & c.rect(0, 14, 47, 14), 'v'); c.fill(brim & c.rect(32, 11, 47, 14), 'v')
c.edge(brim, 'u')
# ---- the coin in the air, edge-on and turning, with a flick of motion under it
coin = c.ellipse(40.5, 21, 2.6, 3.4)
c.fill(coin, 'c'); c.fill(coin & c.rect(42, 19, 44, 25), 'a'); c.fill(coin & c.rect(38, 18, 39, 21), 'd'); c.set(39, 19, '!')
PORTRAIT = {'id': 'gold.speculator', 'name': 'Speculator', 'kind': 'member', 'sphere': 'gold',
            'people': [{'skin': 'freckled', 'hair': 'ginger'}], 'accent': 'green', 'px': c.rows()}
