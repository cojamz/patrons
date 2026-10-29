import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket, portrait

# Pocket Watch (purple), round 1. An older gentleman checking the time: close-cropped grey hair, eyes on the
# watch, a calm closed mouth. Purple jacket, white shirt, a slim angled tie.
# Prop: an open gold pocket watch in his raised hand, its chain looping back to the waistcoat. Frontal. Template: 1 person.
c = Canvas()
body = jacket(c, top=33.4, l=1, r=46)
shirt = c.poly([(19.5, 33), (28.5, 33), (24, 43)])
c.fill(shirt, 'k'); c.fill(shirt & c.rect(25, 33, 30, 47), 'k')
c.fill(c.poly([(23, 34.5), (25, 34.5), (25.6, 41), (24, 43.4), (22.6, 41)]), '1')
lapL = c.poly([(14.5, 33.8), (19.5, 33.2), (24.3, 44.5), (21.5, 45), (16, 38), (12.8, 36)])
lapR = c.poly([(28.5, 33.2), (33.5, 33.8), (35, 36), (31.5, 38.5), (26.5, 45), (24.5, 44.5)])
c.fill(lapL, '4'); c.edge(lapL, '1')
c.fill(lapR, '2'); c.rim(lapR, '3', -1, 0, 1); c.edge(lapR, '1')
# neck, chin shadow
c.fill(c.rect(20, 28, 27, 33) - shirt, 'B'); c.fill(c.rect(20, 28, 27, 29), 'A'); c.fill(c.rect(26, 30, 27, 32), 'A')
c.put(20, 33, ['kk', 'k.']); c.put(26, 33, ['kk', '.k'])
# ---- face x14..33. Very deep skin lit by the light, not by the tone: forehead, cheekbone, nose bridge on D; no light row near the mouth.
rows(c, 14, {
    11: "....BDDDDDDCCCCB....",
    12: "...BDDDDDDDDCCCCB...",
    13: "..BDDDDDDDDCCCCCCB..",
    14: ".BCDDDDDDDDDCCCCCBA.",
    15: ".BCDDDDDDDDCCCCCCBA.",
    16: ".BCCEEEECCCCEEEECBA.",
    17: ".BCBBBBBCDCBBBBBCBA.",
    18: ".BCBzzzzCDBzzzzBCBA.",
    19: "CBCByzyyCDByzyyBBBAB",
    20: "DBCDDCCCCDBCCCCCBBAB",
    21: "CBCDDDDDCDBCDDCCBBAA",
    22: ".BCDDDDDCDDBCDCCBBA.",
    23: ".BCCDDDCAAABCCCCBBA.",
    24: "..BCCCCCCCCCCCCCBBA.",
    25: "..BCCCCBzzzzBCCCBA..",
    26: "...BCCCCCCCCCCCBA...",
    27: "....BBCCDDDCCBBA....",
    28: "......ABBBBBBA......",
})
# close-cropped grey hair, lit top-left, short at the temples
rows(c, 14, {
    8:  ".......FGGGGGF......",
    9:  ".....FGHHGGGGGGF....",
    10: "...FGHHHGGGGGGGGF...",
    11: "..FGHHGGGGGGGGGGFE..",
    12: "..FGHGGFFGGGGGGGFE..",
    13: ".FGG.........FGGFE..",
    14: ".FG..............E..",
    15: ".F...............E..",
    16: ".F...............E..",
})
c.put(18, 13, ['DDDD'])
# ---- the watch, raised in his right hand: gold case, white face, two hands, a bow on top
case = c.ellipse(12.5, 40.5, 4.6, 4.6)
c.fill(case, 'c'); c.outside(case, 'b', 11.8, 39.8, 4.1, 4.1); c.rim(case, 'd', -1, -1, 1, only='c')
dial = c.ellipse(12.5, 40.5, 3.2, 3.2)
c.fill(dial, 'l'); c.outside(dial, 'k', 12, 40, 3, 3)
c.put(12, 38, ['z', 'z', 'zz']); c.set(10, 39, '!')
c.edge(case, 'a')
c.put(11, 34, ['.bb.', 'b..b', '.cc.'])                         # the bow
c.put(16, 43, ['b', '.c', '..b', '...cbcb'])         # chain to the waistcoat
c.put(7, 43, ['..DDC', '.DDDCB', 'DCDCDB', 'CBCBCA', '.BBBA.'])                # his fingers under the case
c.put(17, 39, ['D', 'D', 'C'])                                   # thumb on the rim
PORTRAIT = portrait('purple.pocketwatch', 'Pocket Watch', 'purple', c, [{'skin': 'verydeep', 'hair': 'grey'}], 'violet')
