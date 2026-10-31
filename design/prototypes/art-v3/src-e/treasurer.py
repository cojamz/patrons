import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket

# Treasurer (gold.seed), round 1. The keeper of the coffers: an older woman, round-faced, ash hair pulled up into a
# bun, a proud closed smile, a high collar. Prop: the strongbox key on a cord at her chest (iron, so it reads against
# the gold). Frontal. Template: 1 person.
c = Canvas()
body = jacket(c, top=34)
# high ruffled collar
col = c.poly([(17, 30.5), (21, 31.5), (24, 31), (27, 31.5), (31, 30.5), (32.5, 34.6), (28, 36), (20, 36), (15.5, 34.6)])
c.fill(col, '4'); c.fill(col & c.rect(26, 30, 33, 36), '3'); c.fill(col & c.rect(15, 30, 33, 30), '5')
for x in (19, 23, 27): c.fill(col & c.rect(x, 33, x, 35), '2' if x > 24 else '3')
c.edge(col, '1')
# neck
c.fill(c.rect(20, 28, 27, 31) - col, 'B'); c.fill(c.rect(20, 28, 27, 29), 'A')
# ---- face x15..32, round
rows(c, 15, {
    11: "....CCDDDCCCBB....",
    12: "...CDDDDDCCCCBB...",
    13: "..CDDDDDCCCCCBBB..",
    14: "..CDDDDCCCCCCBBBA.",
    15: ".BCDDDCCCCCCCBBBA.",
    16: ".BCEEEECCCCEEEEBBA",
    17: ".BBCBBBBCCBBBBCBBA",
    18: "BCCBzzBCCCBBzzBBBA",
    19: "BCCz!zzCDCBz!zBBBA",
    20: "BCCBDDBCDBCBDBBBBA",
    21: "BDDDDCCCDBCCCBBBBA",
    22: "BDDDDCCCDBBCCBBBBA",
    23: "BCDDDCCDDDBACCBBBA",
    24: "BCCCCCCAABACCBBBBA",
    25: ".BCCCACCCCCCABBBA.",
    26: ".BCCCCAAAAAACBBBA.",
    27: "..BCCCCCDDCCBBBA..",
    28: "...BBCCCCCBBBBA...",
    29: ".....ABBBBBAA.....",
})
# ---- ash hair pulled back tight, a big bun on top
hair = c.poly([(15, 19.5), (14.4, 12), (16.5, 8.6), (20, 6.4), (24, 5.8), (28, 6.4), (31.5, 8.6), (33.6, 12), (33, 19.5),
               (32, 16.5), (31, 14.6), (27.5, 12.6), (24, 13.2), (20.5, 12.6), (17, 14.6), (16, 16.5)])
c.fill(hair, 'G'); c.outside(hair, 'F', 22, 9.5, 10, 6); c.outside(hair, 'E', 22, 9, 13, 8)
c.fill(hair & (c.line(19, 9, 23, 7) | c.line(18, 10, 22, 8)), 'H')
c.fill(c.line(24, 7, 24, 11) & hair, 'F')                                    # centre parting
bun = c.ellipse(24, 3.6, 4.6, 3.2)
c.fill(bun, 'G'); c.outside(bun, 'F', 23, 3, 4, 2.6); c.fill(bun & c.ellipse(22.4, 2.6, 2, 1.2), 'H')
c.fill(c.line(21, 5, 27, 3) & bun, 'F'); c.edge(bun, 'E')
# ---- the strongbox key on a cord, hanging aslant across her chest: a round bow with a hole, shaft, teeth on one side
c.fill(c.line(17, 35, 19, 37), 'e')
ring = c.ellipse(21.5, 40.5, 3.2, 3.2) - c.ellipse(21.5, 40.5, 1.2, 1.2)
c.fill(ring, 'g'); c.fill(ring & c.rect(22, 41, 25, 44), 'f'); c.fill(ring & c.rect(18, 37, 20, 39), 'h')
shaft = c.line(24, 42, 31, 46) | c.line(24, 43, 31, 47)
c.fill(shaft, 'g'); c.fill(c.line(24, 43, 31, 47), 'f')
c.put(28, 46, ['f.f', 'fff'][0:1]); c.put(29, 47, ['f'])
c.fill(c.rect(29, 42, 30, 44), 'f'); c.fill(c.rect(31, 43, 31, 45), 'f')   # the teeth, on the top side
c.edge(ring | shaft | c.rect(29, 42, 31, 45) & c.mask_of('f'), 'e')
PORTRAIT = {'id': 'gold.seed', 'name': 'Treasurer', 'kind': 'member', 'sphere': 'gold',
            'people': [{'skin': 'palepink', 'hair': 'ash'}], 'accent': 'red', 'px': c.rows()}
