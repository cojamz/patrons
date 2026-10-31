import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket, portrait

# Caterer (silver), round 1. The owner-chef of a catering house, proud of the spread he's sending your way: a tall
# pleated toque, level confident eyes, a pleased closed smile, a double-breasted silver chef's jacket.
# Prop: a silver tray of canapes balanced high on his flat palm. Frontal. Template: 1 person.
c = Canvas()
body = jacket(c, top=33.6, l=2, r=45)
# double-breasted front: an overlap edge and two rows of buttons
c.fill(c.line(27, 35, 27, 47), '2')
for y in (37, 41, 45): c.put(22, y, ['1']); c.put(31, y, ['1'])
col = c.poly([(18, 31), (24, 32.4), (30, 31), (30.6, 34.6), (24, 35.6), (17.4, 34.6)])
c.fill(col, '4'); c.fill(col & c.rect(25, 31, 33, 36), '2'); c.edge(col, '1')
# raised arm (our right) up to the tray
arm = c.poly([(34, 48), (35, 39), (37, 30), (43, 30), (43, 39), (42, 48)])
c.fill(arm, '2'); c.fill(arm & c.poly([(34, 48), (35, 39), (37, 30), (39.5, 30), (37.5, 48)]), '3'); c.edge(arm, '1')
# neck
c.fill(c.rect(21, 28, 26, 31), 'B'); c.fill(c.rect(21, 28, 26, 29), 'A')
# ---- face x15..32: a broad face, strong brows
rows(c, 15, {
    13: "..BCDDDDCCCCCCCBA.",
    14: ".BCDDDDDCCCCCCCCBA",
    15: ".BCEEEEDCCCCEEEEBA",
    16: ".BCBBBBCCCCCBBBBBA",
    17: ".BCCCCCCCDCCCCCCBA",
    18: ".BCCzzzCCDCCzzzBBA",
    19: ".BCyzz!CCDCyzz!BBA",
    20: ".BCCCCCCDDBCCCCBBA",
    21: ".BDDDCCCDDBCCCCBBA",
    22: ".BDDDCCCDDDBCCCBBA",
    23: ".BCDCCCAAAABCCCBBA",
    24: ".BCCCCACCCCACCCBBA",
    25: "..BCCCCzzzzCCCCBA.",
    26: "..BCCCCCDDCCCCBBA.",
    27: "...BCCCCCCCCCBBA..",
    28: "....BBCCCCCBBBA...",
    29: "......ABBBBA......",
})
c.put(14, 18, ['C', 'D', 'C', 'B']); c.put(33, 18, ['B', 'A', 'A'])
c.put(15, 13, ['EE', 'EE', 'E']); c.put(31, 13, ['EE', 'EE', '.E'])     # cropped hair at the temples
# ---- the toque: a band, a tall pleated puff
puff = c.ellipse(24, 6, 10.4, 6.2) | c.rect(16, 6, 32, 10)
c.fill(puff, 'k'); c.outside(puff, 'j', 22, 5, 9.6, 5.4); c.fill(puff & c.ellipse(20, 3.6, 4.4, 2.2), 'l')
for x in (20, 24, 28): c.fill(c.line(x, 3, x, 10) & puff, 'j')
band = c.rect(15, 10, 33, 13)
c.fill(band, 'k'); c.fill(band & c.rect(15, 10, 33, 10), 'l'); c.fill(band & c.rect(29, 10, 33, 13), 'j')
c.edge(band, 'j')
# ---- the tray of canapes on his flat palm: a pale silver tray, four separate bites with gaps between
tray = c.poly([(30, 26), (46, 26), (45, 28), (31, 28)])
c.fill(tray, 'g'); c.fill(tray & c.rect(0, 26, 47, 26), 'h'); c.fill(tray & c.rect(0, 28, 47, 28), 'f')
for x, top in ((31, 'v'), (35, 'k'), (39, 'v'), (43, 'k')):
    c.put(x, 23, [top + top, top + ('v' if top == 'k' else top), 'ss'])
c.edge(tray, 'e')
c.put(35, 29, ['DCCB', 'BCBA'])                                         # his fingertips under the rim
c.put(34, 29, ['C'])
PORTRAIT = portrait('silver.caterer', 'Caterer', 'silver', c, [{'skin': 'coolbrown', 'hair': 'black'}], 'red')
