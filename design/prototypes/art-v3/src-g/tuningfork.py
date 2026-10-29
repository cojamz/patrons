import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket, portrait

# Impressionist (green, id echo.tuningfork), round 1. A stage mimic mid-impression: a ginger bob, brows hoisted high
# in mock gravity, a big black handlebar moustache on a stick held up over her own mouth. Green stage jacket over a
# turtleneck. True 3/4 to our right. Template: 1 person.
c = Canvas()
body = jacket(c, top=34, l=2, r=45)
col = c.poly([(18, 31), (22, 32.4), (27, 32.4), (30.5, 31), (31.4, 35.4), (24, 36.6), (17, 35.4)])
c.fill(col, '4'); c.fill(col & c.rect(26, 31, 33, 37), '2'); c.edge(col, '1')
c.fill(c.line(24, 37, 23, 47), '2')
c.fill(c.rect(20, 27, 26, 31) - col, 'B'); c.fill(c.rect(20, 27, 26, 28), 'A')
# ---- face, 3/4 to our right: ear on the left, far cheek in shadow on the right
rows(c, 14, {
    12: "....CDDDDDCCCCCB....",
    13: "...CDDDDDDCCCCCBA...",
    14: "...CDDDDDDCCCCCCBA..",
    15: "..BCDDDDDCCCCCCCCBA.",
    16: "..BCDEEEECCCCEEECBA.",
    17: "..BCDBBBBCCCBBBBCBA.",
    18: "..BCCCCCCCDCCCCCCBA.",
    19: "..BCCBzzCCDCCBzzBBA.",
    20: "..BCCyz!yCDCCyz!BBA.",
    21: "..BCCByzBCDBCByzBBA.",
    22: "..BCDDDDCCDDBCCCCBA.",
    23: "..BCDBDDCCAAACCCCBA.",
    24: "..BCCCCCCCCCCCCCBBA.",
    25: "...BCCCCCCCCCCCCBA..",
    26: "...BCCCCCCCCCCCBA...",
    27: "....BBCCCDDCCCBA....",
    28: "......ABBBBBBAA.....",
})
c.put(15, 19, ['CD', 'BCC', 'ABC', 'BA'])                          # the near ear
# ---- a ginger bob: a short fringe, cut level at the jaw, tucked behind the near ear
bob = c.ellipse(24, 12.6, 11, 8) | c.rect(13, 12, 16, 26) | c.rect(32, 12, 35, 25)
bob -= c.poly([(16, 30), (16, 15.4), (19, 14.4), (31.5, 14.4), (32, 16), (32, 30)])
bob -= c.rect(15, 19, 17, 22)
c.fill(bob, 'G'); c.outside(bob, 'F', 22, 10.5, 11, 7.6); c.outside(bob, 'E', 22, 12, 13.5, 13)
c.fill(bob & c.ellipse(19, 7.6, 5, 2.2), 'H')
c.fill(c.line(21, 10, 21, 13) | c.line(26, 9, 27, 13), 'F')
c.fill(c.rect(13, 25, 16, 26) & bob, 'E'); c.fill(c.rect(32, 24, 35, 25) & bob, 'E')
c.edge(bob, 'E')
# ---- the moustache on a stick, held up over her mouth: a big black handlebar, ends curled up
c.fill(c.line(24, 27, 24, 33), 'g')
c.put(18, 23, ['n.........n',
               'n..nnnnn..n',
               '.nnnnoonnn.',
               '..nnnm.nnm.'])
c.put(22, 31, ['.DDC', 'DCDCB', 'CBCBA', '.BBA.'])                 # her fingers round the stick
PORTRAIT = portrait('echo.tuningfork', 'Impressionist', 'green', c, [{'skin': 'freckled', 'hair': 'ginger'}], 'red')
