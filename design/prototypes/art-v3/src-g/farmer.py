import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket, portrait

# Farmer (yellow), round 1. A farmer in her sixties, proud of the harvest: grey hair pulled back in a bun, warm round eyes, a broad closed smile, a yellow work jacket.
# Prop: a wicker basket heaped with red apples, held against her hip. Frontal. Template: 1 person.
c = Canvas()
body = jacket(c, top=33.6, l=2, r=45)
c.fill(c.poly([(19.5, 33.2), (28.5, 33.2), (24, 38)]), 'k')
c.put(19, 33, ['44', '.4']); c.put(27, 33, ['22', '2.'])
for y in (40, 44): c.put(24, y, ['1'])
# neck
c.fill(c.rect(21, 28, 26, 33), 'B'); c.fill(c.rect(21, 28, 26, 29), 'A'); c.fill(c.rect(25, 30, 26, 32), 'A')
# ---- face x15..32, a round face
rows(c, 15, {
    13: "..CDDDDCCCCCCCCBA.",
    14: ".BCDDDDCCCCCCCCCBA",
    15: ".BCDDDCCCCCCCCCCBA",
    16: ".BCEEECCCCCCEEECBA",
    17: ".BCBBBBCCDCBBBBBBA",
    18: ".BCCCCCCCDCCCCCBBA",
    19: ".BCBzzCCCDCBzzCBBA",
    20: ".BCyzzyCCDCyzzyBBA",
    21: ".BCByyBCDDBByyBBBA",
    22: ".BDDDCCCDDBCCDCBBA",
    23: ".BDDDCCCCCBCCCCBBA",
    24: ".BCDCCCCAAACCCCBBA",
    25: ".BCCCCACCCCACCCBBA",
    26: "..BCCCCAAAACCCBBA.",
    27: "..BCCCCCCCCCCCBA..",
    28: "...BBCCCCCCCBBA...",
    29: ".....ABBBBBBA.....",
})
c.put(14, 18, ['C', 'D', 'C', 'B'])
# ---- grey hair pulled back into a bun, lit top-left, a few combed strands
hair = c.ellipse(24, 12.6, 10.2, 7.4) | c.rect(14, 12, 16, 18) | c.rect(32, 12, 34, 17)
hair -= c.poly([(16.6, 30), (16.6, 15.4), (19, 13.4), (24, 12.8), (29, 13.4), (31.4, 15), (31.4, 30)])
hair -= c.rect(14, 18, 15, 22)
c.fill(hair, 'G'); c.outside(hair, 'F', 22, 10.6, 10, 6); c.outside(hair, 'E', 22, 11, 12.6, 9)
c.fill(hair & c.ellipse(19.6, 8, 4.4, 2), 'H')
for ln in (c.line(18, 13, 23, 9), c.line(26, 9, 31, 13)): c.fill(ln & hair, 'F')
bun = c.ellipse(24, 4.6, 4, 2.8)
c.fill(bun, 'G'); c.outside(bun, 'F', 23, 3.8, 3.4, 2.2); c.fill(bun & c.ellipse(22.6, 3.6, 1.6, 1), 'H')
c.edge(hair, 'E'); c.edge(bun, 'E')
# ---- the basket at her hip: woven wicker, heaped with red apples
bask = c.poly([(28, 39), (46, 39), (44, 48), (30, 48)])
c.fill(bask, 's'); c.fill(bask & c.rect(38, 39, 47, 48), 'r')
for d in range(-20, 30, 4): c.fill(c.line(28 + d, 48, 37 + d, 39) & bask, 'r')
c.fill(c.rect(28, 39, 46, 40) & bask, 's'); c.fill(c.rect(28, 40, 46, 40) & bask, 'q')
for (x, y) in ((28, 34), (33, 33), (38, 34), (42, 35)):
    c.put(x, y, ['.vw.', 'vvwv', 'uvvv', '.uu.'])
c.put(34, 32, ['q']); c.put(39, 33, ['q'])                          # stalks
c.edge(bask, 'q')
c.put(24, 38, ['..DDC.', '.DDCCCB', 'DCCCCBA', 'CCBCCBA', '.BBBBA.']); c.put(23, 39, ['D', 'C'])                   # her hand on the rim
PORTRAIT = portrait('yellow.farmer', 'Farmer', 'yellow', c, [{'skin': 'warmtan', 'hair': 'grey'}], 'red')
