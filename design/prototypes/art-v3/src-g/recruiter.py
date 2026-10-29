import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket, portrait

# Recruiter (red), round 1. A keen young recruiter mid-pitch: brows up, bright open eyes, a warm closed smile, dark
# hair in a high ponytail swinging behind. Red blazer over a white top. Prop: a clipboard held out toward you,
# a sign-up sheet with a red star at the top and lines to fill. Frontal. Template: 1 person.
c = Canvas()
body = jacket(c, top=33.6, l=2, r=45)
top = c.poly([(19.5, 33.2), (28.5, 33.2), (24, 40)])
c.fill(top, 'k')
lapL = c.poly([(14.5, 34), (19.5, 33.4), (23.8, 41), (21.5, 42.5), (16, 38), (12.8, 36)])
lapR = c.poly([(28.5, 33.4), (33.5, 34), (35, 36), (31.5, 38.5), (26.5, 42.5), (24.2, 41)])
c.fill(lapL, '4'); c.edge(lapL, '1')
c.fill(lapR, '2'); c.rim(lapR, '3', -1, 0, 1); c.edge(lapR, '1')
# neck
c.fill(c.rect(21, 28, 26, 33) - top, 'B'); c.fill(c.rect(21, 28, 26, 29), 'A'); c.fill(c.rect(25, 30, 26, 32), 'A')
# ---- face x15..32, a softer jaw
rows(c, 15, {
    12: "....CDDDDCCCCCB...",
    13: "..CDDDDDDCCCCCCBA.",
    14: ".BCDDDDDCCCCCCCCBA",
    15: ".BCEEECCCCCCEEECBA",
    16: ".BCBBBCCCCCCBBBCBA",
    17: ".BCCCCCCCDCCCCCBBA",
    18: ".BCzzzzCCDCzzzzBBA",
    19: ".BCyzzyCCDCyzzyBBA",
    20: ".BCyz!yCDDCyz!yBBA",
    21: ".BCCBBCCDDBCBBCBBA",
    22: ".BDDDCCCDDBCCCCBBA",
    23: ".BDDDCCCCCBCCCCBBA",
    24: ".BCDCCCCAABCCCCBA.",
    25: "..BCCCCCCCCCCCBBA.",
    26: "..BCCCACCCCACCBA..",
    27: "...BCCCAAAACCBA...",
    28: "....BBCCDDCCBA....",
    29: "......ABBBBA......",
})
c.put(14, 18, ['C', 'D', 'C', 'B'])                                     # the near ear
# ---- dark hair: a smooth cap swept from a side part, a high ponytail swinging out behind her right
cap = c.ellipse(24, 13, 10.2, 7.6) | c.rect(14, 13, 15, 21) | c.rect(32, 13, 33, 21)
cap -= c.poly([(16, 22), (16, 16), (19, 13.2), (24, 14.6), (28, 13.4), (31.5, 15), (32, 22)])
c.fill(cap, 'G'); c.outside(cap, 'F', 22, 10, 10, 6); c.outside(cap, 'E', 22, 10, 12.5, 9)
c.fill(cap & c.poly([(17, 9), (21, 6.6), (26, 6.4), (22, 8.4), (18.5, 11)]), 'G')
c.fill(c.line(19, 12, 25, 8) & cap, 'F')
tail = c.poly([(30, 6), (34, 4), (38, 5.6), (40, 10), (39.5, 17), (37.5, 23), (36.5, 17), (35, 12), (32, 9)])
c.fill(tail, 'F'); c.fill(tail & c.poly([(32, 6), (35, 5), (37.5, 7.5), (37, 12), (35, 8)]), 'G'); c.edge(cap, 'E')
c.put(30, 5, ['vv', 'vv'])                                              # the hair tie
# ---- the clipboard held out: brown board, steel clip, the sheet with a red star and lines
board = c.poly([(28, 36), (41, 34.6), (42.4, 47.6), (29, 48)])
c.fill(board, 'r'); c.fill(board & c.rect(28, 47, 43, 47), 'r')
sheet = c.poly([(29.4, 37.6), (40.4, 36.4), (41.4, 47.6), (30.2, 48)])
c.fill(sheet, 'k')
c.put(32, 38, ['..v..', 'vvvvv', '.vvv.', '.v.v.'])
for y in (43, 45): c.fill(c.line(31, y, 39, y - 1), 'f')
c.put(33, 33, ['.fff.', 'fffff'])
c.put(25, 39, ['..DDC', '.DCCCB', 'DCDCDC', 'CBCBCB', 'CCCCBA', '.BBBA.']); c.put(31, 40, ['D', 'C'])     # her hand on the board's edge
PORTRAIT = portrait('red.recruiter', 'Recruiter', 'red', c, [{'skin': 'palepink', 'hair': 'darkbrown'}], 'navy')
