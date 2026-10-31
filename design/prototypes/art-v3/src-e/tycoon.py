import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket

# Tycoon (gold), round 1. Old money, very pleased with himself: a big man with a bald, shining crown, grey
# muttonchops into a moustache, chin up, a proud closed smile. Gold frock coat, white wing collar. Prop: a gold
# monocle on a chain (the eye behind it magnified). Frontal. Template: 1 person.
c = Canvas()
body = jacket(c, top=33, l=0, r=47)
# white wing collar and a gold-shadow cravat
c.fill(c.poly([(18.5, 32.4), (29.5, 32.4), (28, 36), (24, 38.5), (20, 36)]), 'k')
c.fill(c.poly([(24, 33), (29.5, 32.4), (28, 36), (24, 38.5)]), 'j')
crav = c.poly([(21.5, 35), (26.5, 35), (27, 40), (24, 42.6), (21, 40)])
c.fill(crav, 'k'); c.fill(crav & c.rect(24, 35, 27, 43), 'j'); c.edge(crav, '1')
lapL = c.poly([(13, 33.6), (18.5, 32.6), (22.5, 43.5), (19.5, 44.5), (14.5, 38.5), (11, 36)])
lapR = c.poly([(29.5, 32.6), (35, 33.6), (37, 36), (33.5, 38.5), (28.5, 44.5), (25.5, 43.5)])
c.fill(lapL, '4'); c.edge(lapL, '1'); c.fill(lapR, '2'); c.rim(lapR, '3', -1, 0, 1); c.edge(lapR, '1')
# neck (short and thick)
c.fill(c.rect(18, 28, 29, 32), 'B'); c.fill(c.rect(18, 28, 29, 29), 'A'); c.fill(c.rect(27, 30, 29, 32), 'A')
c.put(18, 30, ['k..', 'kk.', 'kkk']); c.put(27, 30, ['..j', '.jj', 'jjj'])   # wing collar points
# ---- head x13..34: bald crown, broad jowly face
rows(c, 13, {
    7:  "........BCCCCCB.......",
    8:  "......BCDDDDCCCCB.....",
    9:  ".....BCD!!DDCCCCCB....",
    10: "....BCDD!DDDCCCCCCB...",
    11: "....BCDDDDDDCCCCCCBA..",
    12: "...BCDDDDDDCCCCCCCCBA.",
    13: "...BCDDDDDCCCCCCCCCBA.",
    14: "...FCDDDDCCCCCCCCCCBF.",
    15: "..EGCDDDCCCCCCCCCCCBGE",
    16: "..FGCCEEEECCCCEEEECBGF",
    17: "..FGBBBBBBBCCBzzzzBBGF",
    18: "..FHCBzzzzBCCByzz!BBGF",
    19: "..FHCByz!yCCDCyzzyBBGF",
    20: "..FHGCBBBBCCDBBBBBBGGF",
    21: "..FGHGDDDCCCDBCCCBGGGF",
    22: "..EFGHGDDCCCDBCCBGGGFE",
    23: "...FGHHGCCCDDBBCGGGFE.",
    24: "...EFGHHGCCAABCGGGFFE.",
    25: "...EFGHHHGGGGGGGGGFFE.",
    26: "....EFGHGACCCCCCAGFE..",
    27: ".....EFGBCAAAAAACBFE..",
    28: "......ABBCCDDDDCCBA...",
    29: "........ABBBBBBBA.....",
})
# ---- the gold monocle on his left eye (our right), its chain down to the lapel
ring = c.ellipse(29.5, 18.8, 3.4, 3.4) - c.ellipse(29.5, 18.8, 2.3, 2.3)
c.fill(ring, 'c'); c.fill(ring & c.rect(26, 15, 29, 17), 'd')
c.fill(c.line(32, 22, 33, 26) | c.line(33, 27, 33, 31) | c.line(32, 32, 31, 36), 'c')
PORTRAIT = {'id': 'gold.tycoon', 'name': 'Tycoon', 'kind': 'member', 'sphere': 'gold',
            'people': [{'skin': 'coolbrown', 'hair': 'grey'}], 'accent': 'red', 'px': c.rows()}
