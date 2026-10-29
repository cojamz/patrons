import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket

# Merchant (gold), round 1. A market trader who does well whenever anyone buys: delighted, eyes creased shut in a
# laugh, a trimmed dark beard, a rolled knit cap. True 3/4 to our right. Prop: a wooden abacus held at his chest.
# Template: 1 person.
c = Canvas()
body = jacket(c)
# open collar of the coat (darker inner), shirt in the sphere's shadow
c.fill(c.poly([(19, 33), (29, 33), (24, 40)]), '1')
c.fill(c.poly([(14.5, 33.8), (19.5, 33.2), (23.5, 40.5), (21, 41), (13, 36)]), '4')
c.fill(c.poly([(28.5, 33.2), (33.5, 33.8), (35, 36), (27, 41), (25, 40.5)]), '2')
# neck
c.fill(c.rect(19, 28, 26, 33), 'B'); c.fill(c.rect(24, 29, 26, 33), 'A')
# ---- head, 3/4 to our right: ear on the left, far cheek on the right
rows(c, 14, {
        11: "....CCDDDDCCCCCCCB..",
    12: "...CCDDDDDCCCCCCCBA.",
    13: "...CCDDDDDCCCCCCCBA.",
    14: "..EFFGCDEEEDCCCEECBA",
    15: "..EFGCEDDDCECCECCEBA",
    16: "..EFGCDDDCCCCCCCCCBA",
    17: "..EFCBBBBBBBBCBBBBA.",
    18: "..EFCCCzzzCCDCCzzBBA",
    19: "..FBCCzCCCzCDBCzCzBA",
    20: "..BCBCDDDDCCDBCCCCBA",
    21: "..BCACDDDCCCDBBCCCBA",
    22: "..BCACCCCCCCDDBBCCBA",
    23: "..FBBCCCCCCCCDDAABBA",
    24: "..EFFGCCCCFGGGGGFCBA",
    25: "..EFGGFCCCEGGGGEGGFA",
    26: "...EFGGFCCCEzzEGGFE.",
    27: "...EFGGGFFBCCBFGGFE.",
    28: "....EFGGGGFFFFGGFE..",
    29: ".....EEFGGGGGGFEE...",
    30: ".......EEEEEEEE.....",
})
# ---- thick dark hair swept back, a lit wave on the crown
hair = c.poly([(15, 19), (14.6, 13), (16, 9), (19, 6.5), (24, 5.4), (29, 6), (32, 8.5), (33.4, 12), (33, 14.2),
               (31.5, 11.8), (28, 11), (24, 11.3), (20.5, 12.6), (18.8, 14.6), (17.6, 19)])
c.fill(hair, 'G'); c.outside(hair, 'F', 22, 9.5, 10.5, 5.5); c.outside(hair, 'E', 22, 9, 13, 7.5)
c.fill(hair & c.poly([(17, 11), (20, 7.5), (25, 6.4), (23, 8.4), (19.5, 10.5)]), 'H')
c.fill(hair & c.poly([(25, 9.6), (29, 7.6), (31.5, 9.5), (28, 10.4)]), 'H')
c.fill(c.line(21, 10, 26, 8) & hair, 'F')
c.put(16, 18, ['CD', 'BCC', 'ABC', 'BA', ])                       # the near ear
# ---- the abacus held up at his chest (round 2): a clear wood frame outlined dark, three light rods, beads in
# separated pairs with gaps of rod between them
fr = c.rect(8, 35, 26, 47)
c.fill(fr, 's'); c.fill(c.rect(8, 35, 26, 35), 't'); c.fill(c.rect(26, 35, 26, 47) | c.rect(8, 47, 26, 47), 'r')
c.fill(c.rect(10, 37, 24, 45), '1')
for y in (38, 41, 44): c.fill(c.rect(10, y, 24, y), 't')
for y, xs in ((38, (10, 13, 21)), (41, (10, 17, 20)), (44, (10, 13, 16))):
    for x in xs: c.put(x, y - 1, ['ww', 'vv'])
c.edge(fr, 'q')
c.put(4, 37, ['..CD', '.CCCC', 'BCCDC', 'ABCCC', '.ABBC', '..AA'])      # his hand on the frame
PORTRAIT = {'id': 'gold.merchant', 'name': 'Merchant', 'kind': 'member', 'sphere': 'gold',
            'people': [{'skin': 'golden', 'hair': 'darkbrown'}], 'accent': 'red', 'px': c.rows()}
