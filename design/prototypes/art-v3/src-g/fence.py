import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket, portrait

# Fence (magenta), round 1. A fence with a deal for you: a flat cap, a lean face, eyes slid sideways to check
# nobody's looking, a small closed smile. Magenta overcoat. Prop: he holds one side of the coat open on a dark
# lining hung with gold watches and a chain of rings. True 3/4 to our right. Template: 1 person.
c = Canvas()
body = jacket(c, top=34, l=1, r=46)
c.fill(c.poly([(19.5, 33.4), (28.5, 33.4), (24, 39)]), 'k')
lapR = c.poly([(28.5, 33.4), (33.5, 34), (35, 36), (31.5, 38.5), (26.5, 44), (24.2, 40)])
c.fill(lapR, '2'); c.rim(lapR, '3', -1, 0, 1); c.edge(lapR, '1')
# the near side of the coat held open by his hand at the lapel: a dark lining hung with goods
lining = c.poly([(19.5, 33.4), (24.2, 40), (24, 48), (3, 48), (3.4, 41), (7, 36.4), (14.5, 34)])
c.fill(lining, 'n'); c.fill(lining & c.poly([(3, 48), (3.4, 41), (7, 36.4), (9, 36), (7, 48)]), 'm')
flap = c.poly([(0, 48), (0, 41), (2, 37.4), (7, 36), (3.6, 41), (3, 48)])
c.fill(flap, '4'); c.edge(flap, '1')
for (x, y) in ((9, 36), (14, 42)):                                  # two gold watches, hands at ten past
    c.put(x, y, ['.ccc.', 'clzlc', 'clzzc', 'clllc', '.bbb.'])
c.put(10, 35, ['b']); c.put(15, 41, ['b'])
c.put(19, 35, ['c', 'b', 'c', 'b', 'c', 'b', 'c', 'b', '.c', '.b'])  # a gold chain hung straight down
c.put(5, 43, ['.c.', 'c.c', '.b.'])                                  # a ring
c.put(4, 34, ['..DDC', '.DCCCB', 'DCDCDB', 'CBCBCA', '.BBBA.'])       # his hand on the lapel, holding it out
# neck
c.fill(c.rect(20, 27, 26, 33), 'B'); c.fill(c.rect(20, 27, 26, 28), 'A'); c.fill(c.rect(25, 29, 26, 33), 'A')
# ---- face, 3/4 to our right, a lean face; eyes slid to our right
rows(c, 14, {
    13: "...BCDDDDDCCCCCCBA..",
    14: "...BCDDDDDCCCCCCBA..",
    15: "..BCDDDDDCCCCCCCCBA.",
    16: "..BCDEEEEECCCEEEEBA.",
    17: "..BCDBBBBBCDCBBBBBA.",
    18: "..BCCCCCCCCDCCCCCBA.",
    19: "..BCCCzzzCCDCCCzzBA.",
    20: "..BCCyyzzCCDCCyzzBA.",
    21: "..BCCCCCCCCDBCCCCBA.",
    22: "..BCDDDDCCCDDBCCCBA.",
    23: "..ABDDDCCCAAAACCBBA.",
    24: "...BCCCCCCCCCCCCBA..",
    25: "...BCCCCAzzzzBCCBA..",
    26: "....BCCCCCDDCCCBA...",
    27: ".....BBCCCCCCCBA....",
    28: ".......ABBBBBBA.....",
})
c.put(15, 18, ['CD', 'BCC', 'ABC', 'BA'])                            # the near ear
c.put(16, 15, ['F', 'EF', 'E']); c.put(32, 15, ['F', 'E'])           # hair under the cap
# ---- the flat cap, peak pulled low
cap = c.poly([(15.4, 15), (16, 10), (19, 7), (25, 6), (31, 6.8), (34.5, 9.4), (35, 13), (33.6, 15)])
c.fill(cap, 'o'); c.outside(cap, 'n', 23, 9, 10, 4.4); c.fill(cap & c.ellipse(21, 8.4, 4.6, 1.8), 'p')
c.fill(c.line(18, 12, 30, 9) & cap, 'n')
peak = c.poly([(14.4, 14), (31, 13.4), (33, 14.6), (31, 16), (16, 16)])
c.fill(peak, 'm'); c.fill(peak & c.rect(0, 13, 47, 14), 'n')
PORTRAIT = portrait('thieves.fence', 'Fence', 'magenta', c, [{'skin': 'fair', 'hair': 'brown'}], 'red')
