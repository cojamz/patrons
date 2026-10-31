import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _libf import *
# Tiebreaker (colorless), scene version (Cory, Oct 29: "little scenes ... the lines coming off the coin in tiebreaker
# look weird"). The same referee (striped shirt, black collar, close grey hair, very deep skin lit from the top-left,
# brows up, a small sure smile) now stands on the pitch: mown grass behind him, a corner flag on the right with its
# chalk corner arc. The coin is one clean gold disc above his thumb, no spin lines, no sparkle. Template: 1 person.
c = Canvas()
# ---- the pitch: mown stripes behind him from the horizon down, a chalk corner arc, the corner flag
grass = c.rect(0, 31, 47, 47)
c.fill(grass, 'w')
for y0 in (34, 40, 46):
    c.fill(c.rect(0, y0, 47, min(47, y0 + 2)), 'x')
c.fill(c.rect(36, 38, 47, 38), 'y')                                                # chalk touchline
c.fill(c.rect(42, 12, 42, 38), 'y')                                                # corner-flag pole
c.put(43, 12, ['ccccc', 'ccccc', 'bbbbb', 'bbbbb'])                                # the flag, flying right
# ---- body: half-figure, narrower so the flag and pitch show
body = torso(c, [(2, 48), (3, 41), (7, 36.5), (15, 34), (32, 34), (37, 36.5), (40, 40), (41, 48)], 19, 40, mid='4', dark='3', deep='2', lite=None)
for x in range(5, 41, 4):                                                          # ref's stripes
    c.fill(body & c.rect(x, 34, x + 1, 47), '1')
col = c.poly([(17, 31.5), (21, 34), (24, 36), (27, 34), (31, 31.5), (32, 35), (24, 38.6), (16, 35)])
c.fill(col, 'n'); c.fill(col & c.rect(28, 0, 47, 47), 'z'); c.edge(col, 'z')
c.fill(c.rect(20, 28, 27, 32), 'A'); c.fill(c.rect(20, 30, 21, 32), 'B')
c.put(19, 31, ['z']); c.put(28, 31, ['z'])
for (x, y) in c.rect(19, 30, 28, 34):
    if c.get(x, y) in 'wx': c.set(x, y, 'z')                                          # the collar's opening, not grass
# ---- the raised hand, thumb up, and the coin above it
# (critic round 2) a near-vertical forearm, elbow ~(8,38), wrist ~(9,27), on the background clear of his jaw; the ref's
# stripe runs down it. A fist with the thumb flicked up, and the coin above it: a 6x6 disc with a darker rim and a 2px
# glint, no motion lines.
arm = c.poly([(4.5, 41), (5.5, 32), (6, 27), (12, 27), (11.6, 33), (11, 41)])
c.fill(arm, '4'); c.fill(arm & c.rect(8, 0, 9, 47), '1'); c.fill(arm & c.rect(11, 0, 12, 47), '3')
c.edge(arm, '1')
c.put(5, 19, ['.DC...',
              '.DC...',
              '.DCC..',
              'DDCCCB',
              'CBCBCB',
              'CCCCBA',
              '.BBBA.',
              '.4444.'])                                                          # fist, thumb flicked up, cuff
c.put(3, 11, ['.aaaa.',
              'ayycba',
              'acccba',
              'accbba',
              'abbbba',
              '.aaaa.'])                                                          # the coin
# ---- face, 3/4 to our left, eyes up to the coin. ruler x 14..33
blk(c, 14, 14, '''
|.CCCCCCCCCCCCCCBBFE.
|.CDDDDDDCCCCCCCBBFE.
|.GGDDDDGGGGCCBBBBFE.
|.CBBCDCBBBBCCBBBBFA.
|.BzzBDBzzzBCCBBBBBA.
|.CyrBDByrzBCCBBBBCA.
|.DDDCDBCCCCCCBBBBCA.
|.DDDDDBCDDDCCBBBBBA.
|.CDDDDACCDDCCBBBBBA.
|.CACCCCACCCCBBBBBBA.
|.CCAAAACCCCCBBBBBBA.
|.CCCrrCCCCCBBBBBBA..
|..BCDDDCCCCBBBBBA...
|...BCCCCCCBBBBBA....
|....ABBBBBBBBBA.....
''')
c.put(31, 18, ['C', 'D', 'C', 'B'])                                                 # ear
hair = c.poly([(14.6, 15), (14.6, 10.6), (17, 8), (22, 6.8), (28, 7), (31.6, 9), (33.4, 13), (33.2, 18), (31.2, 17), (30.6, 13.4),
               (22, 13.4), (16, 14.2)])
c.fill(hair, 'F'); c.outside(hair, 'E', 21, 9.5, 11, 5); c.rim(hair, 'G', -1, -1, 2, only='F')
c.fill(hair & c.rect(0, 0, 47, 9), 'G', only='F')
for x in range(15, 33):
    if c.get(x, 13) == '.': c.set(x, 13, 'F')                                      # close the gap above the brow                                   # a lighter crown (not a helmet)
for (x, y) in hair:                                                                  # a darker hairline where it meets skin
    if c.get(x, y + 1) in 'ABCD' or (c.get(x + 1, y) in 'ABCD' and y > 12): c.set(x, y, 'E')
for (x, y) in ((15, 15), (15, 17), (15, 22), (15, 23), (15, 24), (16, 24), (15, 25), (16, 25),
               (17, 23), (18, 23), (19, 23), (20, 23), (21, 22), (22, 22), (22, 23), (23, 23), (22, 24)):
    if c.get(x, y) in 'BC': c.set(x, y, 'D')
for y in range(16, 26):
    for x in (27, 28):
        if c.get(x, y) == 'B': c.set(x, y, 'C')
c.set(20, 26, 'C')
c.set(17, 21, 'C'); c.set(18, 21, 'C')
c.set(23, 18, 'B'); c.set(23, 19, 'B')                                            # both eyes: a 2px lid over white + iris
PORTRAIT = portrait('benders.tiebreaker', 'Tiebreaker', c, [{'skin': 'verydeep', 'hair': 'grey'}], 'green')
