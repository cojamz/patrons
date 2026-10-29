import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket, portrait

# Fence (magenta), round 1. A fence with a deal for you: a flat cap, a lean face, eyes slid sideways to check
# nobody's looking, a small closed smile. Magenta overcoat. Prop: he holds one side of the coat open on a dark
# lining hung with a gold watch, a ring and a pearl necklace. True 3/4 to our right. Template: 1 person.
c = Canvas()
body = jacket(c, top=34, l=1, r=46)
c.fill(c.poly([(19.5, 33.4), (28.5, 33.4), (24, 39)]), 'k')
lapR = c.poly([(28.5, 33.4), (33.5, 34), (35, 36), (31.5, 38.5), (26.5, 44), (24.2, 40)])
c.fill(lapR, '2'); c.rim(lapR, '3', -1, 0, 1); c.edge(lapR, '1')
# the near side of the coat held open by his hand at the lapel: a dark magenta lining hung with three goods
lining = c.poly([(19.5, 33.4), (24.2, 40), (24, 48), (3, 48), (3.4, 41), (7, 36.4), (14.5, 34)])
c.fill(lining, '1'); c.fill(lining & c.poly([(3, 48), (3.4, 41), (7, 36.4), (9, 36), (7, 48)]), 'm')
flap = c.poly([(0, 48), (0, 41), (2, 37.4), (7, 36), (3.6, 41), (3, 48)])
c.fill(flap, '4'); c.edge(flap, '2')
c.put(10, 36, ['.ccc.', 'clzlc', 'clzzc', 'clllc', '.bbb.'])        # one gold watch (mid value)
c.put(11, 35, ['b'])
c.put(17, 42, ['.vv.', 'cvvc', 'c..c', '.cb.'])                  # a ring with a red stone (dark value)
pearls = [(7, 42), (8, 43), (9, 44), (10, 45), (11, 46), (12, 47), (15, 42), (14, 43), (13, 44), (13, 45), (12, 46)]
for (x, y) in pearls: c.set(x, y, 'k')                              # a pearl necklace hung in a narrow V (light value)
for (x, y) in pearls[1::3]: c.set(x, y, 'l')
c.put(7, 41, ['kk']); c.put(15, 41, ['k'])
c.put(2, 34, ['...DDC.',
              '..DDCCCB',
              '.DDCCCBA',
              'DCCCCBA.',
              'CBCCBA..',
              '.BBBA...',
              '..222...'])                                          # his hand on the lapel, thumb in front, a cuff
# neck
c.fill(c.rect(21, 27, 25, 33), 'B'); c.fill(c.rect(21, 27, 25, 28), 'A'); c.fill(c.rect(25, 29, 25, 33), 'A')
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
    25: "....BCCCCCCzzzBCBA..",
    26: ".....BCCCCCCCCCBA...",
    27: "......BBCCDCCBA.....",
    28: "........ABBBA.......",
})
c.put(15, 18, ['CD', 'BCC', 'ABC', 'BA'])                            # the near ear
c.put(16, 15, ['E', 'EE', 'E']); c.put(32, 15, ['E', 'E'])           # hair under the cap
# ---- the flat cap, peak pulled low
cap = c.poly([(15.4, 15), (16, 10), (19, 7), (25, 6), (31, 6.8), (34.5, 9.4), (35, 13), (33.6, 15)])
c.fill(cap, 'o'); c.outside(cap, 'n', 23, 9, 10, 4.4)
c.fill(c.line(18, 12, 30, 9) & cap, 'n')
peak = c.poly([(14.4, 14), (31, 13.4), (33, 14.6), (31, 16), (16, 16)])
c.fill(peak, 'm'); c.fill(peak & c.rect(0, 13, 47, 14), 'n')
PORTRAIT = portrait('thieves.fence', 'Fence', 'magenta', c, [{'skin': 'fair', 'hair': 'brown'}], 'red')
