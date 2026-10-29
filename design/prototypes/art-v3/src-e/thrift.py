import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket

# Penny Pincher (gold.thrift), round 1. An old skinflint clutching his purse shut and eyeing you sideways, worried you
# want some: a thin face, white comb-over, bushy white brows, lips pursed. A buttoned gold cardigan. True 3/4 to our right. Template: 1 person.
c = Canvas()
body = jacket(c, top=34, l=2, r=45)
for x in (12, 16, 31, 35): c.fill(c.line(x, 38, x + (1 if x < 24 else -1), 47) & body, '2')   # cardigan ribs
# a buttoned cardigan collar standing round the neck
col = c.poly([(17, 31), (21, 32.5), (27, 32.5), (31, 31), (32.5, 35), (28, 36.5), (20, 36.5), (15.5, 35)])
c.fill(col, '2'); c.rim(col, '3', 0, -1, 1); c.fill(col & c.rect(15, 33, 23, 36), '3'); c.edge(col, '1')
c.fill(c.rect(20, 27, 26, 32) - col, 'B'); c.fill(c.rect(20, 27, 26, 28), 'A')
# ---- head, thin, 3/4 to our right
rows(c, 14, {
    10: ".......CDDDCCC......",
    11: ".....CCDDDDCCCCB....",
    12: ".....CDDDDDDCCCCB...",
    13: "....CDDDDDDCCCCCBA..",
    14: "...BCDDDDDCCCCCCBA..",
    15: "...BCDDDCCCCCCCCCBA.",
    16: "...BCDDDGGHCCCHGCCBA",
    17: "...BCGGGGBCCCCGGGCBA",
    18: "..BBCBzzzzBCCBzzzBBA",
    19: "..BCCByyz!BDCByz!BBA",
    20: "..BCCCBBBBCDCBBBBBBA",
    21: "..ABCCDDDCCDDBCCCCBA",
    22: "..ABBBDDCCCDDCBCCCBA",
    23: "...ABBBCCCCDDDCBCCBA",
    24: "...ABBBCCCCCAAABBCBA",
    25: "....ABBCCCBABCCBBBA.",
    26: "....ABBCCCAzABBBBA..",
    27: ".....ABBCCBDBBBBA...",
    28: ".......AABBBBBAA....",
})
# white hair: tufts over the ear, four strands combed across the bare crown
c.put(14, 12, ['.FG', 'FGHG', 'EFGG', 'EFG', '.E'])
c.put(31, 14, ['GF', 'GFE', 'FE'])
for k, (x0, y0, x1, y1) in enumerate(((17, 14, 30, 12), (18, 12, 29, 10), (20, 10, 27, 9))):
    ln = c.line(x0, y0, x1, y1) & c.mask_of('ABCD')
    c.fill(ln, 'G'); c.fill({p for p in ln if p[0] < x0 + 4}, 'H')
c.put(15, 17, ['.CD', 'BCDC', 'BACC', 'BBC', '.AB'])               # the near ear, below the tuft
# ---- his coin purse hugged to his chest: a fat leather bag, a red drawstring knotted tight, one coin peeking out
purse = c.poly([(10, 39), (12.5, 37.8), (17.5, 37.8), (20, 39), (22, 43), (21, 47.6), (9, 47.6), (8, 43)])
c.fill(purse, 's'); c.outside(purse, 'r', 14, 41.5, 6.6, 4.4)
c.fill(c.line(11, 43, 12, 46) | c.line(18, 43, 17, 46), 'r')
c.edge(purse, 'q')
c.put(12, 34, ['.sss.', 'srsrs', '.rsr.'])                             # the gathered neck
c.put(11, 37, ['vvvvvv']); c.put(17, 36, ['v.', '.v', 'v.'])          # the drawstring, knotted, ends loose
c.put(13, 31, ['.!c', 'ccc', 'cc.'])                                           # a coin peeking out of the top
c.put(21, 39, ['CD', 'CC', 'BC', 'AB'])                              # his fingers round the far side
PORTRAIT = {'id': 'gold.thrift', 'name': 'Penny Pincher', 'kind': 'member', 'sphere': 'gold',
            'people': [{'skin': 'tan', 'hair': 'white'}], 'accent': 'red', 'px': c.rows()}
