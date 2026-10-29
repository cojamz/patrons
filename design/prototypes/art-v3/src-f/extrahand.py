import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
# Extra Hand (colorless): once per game, +1 minion this round. An eager young farmhand-turned-volunteer, freckled,
# ginger tufts, brows up and a small open "me!" smile, one big leather work glove shot up in the air (the prop).
# Overalls over a work shirt with a rolled sleeve, an orange neckerchief. Frontal. Template: 1 person.
c = Canvas()
body = torso(c, [(2, 48), (3, 41), (7, 36.5), (16, 34), (31, 34), (38, 36), (42, 40), (44, 48)], 19, 40)
bib = c.poly([(15, 40), (33, 40), (32.5, 48), (15.5, 48)])
c.fill(bib, '2'); c.rim(bib, '4', -1, -1, 1); c.fill(bib & c.rect(28, 40, 40, 48), '1')
c.put(17, 42, ['44']); c.put(29, 42, ['44'])                                          # buttons
c.fill(c.poly([(10, 36), (13, 35.2), (17.5, 40.5), (15, 41)]), '2'); c.fill(c.poly([(34.5, 35.2), (37, 36), (33, 41), (30.5, 40.5)]), '1')
c.fill(c.rect(20, 28, 27, 34), 'A'); c.fill(c.rect(20, 31, 21, 34), 'B')
c.put(18, 32, ['.wwwwwwwvv.', 'wwwwwwwwvvu', '.vwwwwwvvu.', '...vwwv....', '....vu.....'])   # neckerchief
# ---- the raised arm and the big glove
arm = c.poly([(34, 36.5), (39, 35), (40, 29), (39.6, 22.5), (36, 22.5), (35.6, 29)])
c.fill(arm, 'C'); c.rim(arm, 'D', -1, 0, 1); c.rim(arm, 'B', 1, 0, 1); c.edge(arm, 'A')
c.fill(c.poly([(34.4, 29.5), (40.6, 29.5), (41, 32), (34, 32)]), '4'); c.fill(c.rect(34, 31, 41, 32), '2')  # rolled sleeve
c.put(34, 6, ['..ts..ts......',
              '..tsr.tsr.ts..',
              '..tsr.tsr.tsr.',
              '..tsr.tsr.tsr.',
              '..tsrrtsrrtsr.',
              '..tsrrtsrrtsr.',
              '..tssssssssssr.ts',
              '..tsssssssssrtsr',
              '..tssssssssrtsr.',
              '..tsssssssssrr..',
              '..tssssssssssr..',
              '..rssssssssssr..',
              '...rsssssssssr..',
              '...rrrrrrrrrr...',
              '...qrrrrrrrrq...',
              '...qqqqqqqqqq...'])
# ---- face, frontal, brows up, freckles. ruler x 14..33
blk(c, 14, 14, '''
|...BCCCCCCCCCCCB....
|..BCDDDCCCCCCCCBA...
|..BCDEEECCCCEEECBA..
|..CCBBBBCCCCBBBBBA..
|..CCzzzCCCCCzzzCBBA.
|..CCy!zCCDCCy!zBBBA.
|..CDDDCCCDCCCCCCBBA.
|..CBBDCCCDBCBBCCBBA.
|..CDDCCCDDABCCCCBBA.
|..BCCBCCCCCCBCCCBBA.
|..BCCCAzzzzACCCCBBA.
|..BCCCCAAAACCCCCBA..
|...BCCCCDDCCCCCBA...
|....BCCCCCCCCBBA....
|.....ABBBBBBBBA.....
''')
c.put(15, 18, ['C', 'D', 'C', 'B']); c.put(33, 18, ['A', 'B', 'A'])
hair = c.poly([(15, 18), (14.5, 12), (13, 9), (16.5, 9), (17, 6), (21, 7), (23, 4), (26, 6.5), (30, 5), (30.5, 8.5),
               (34, 9), (33, 13), (33, 18), (31.5, 15), (24, 14), (19, 15.5), (16.5, 15)])
c.fill(hair, 'F'); c.outside(hair, 'E', 22, 10, 11, 6); c.rim(hair, 'G', -1, -1, 1, only='F')
c.fill(c.line(18, 10, 21, 9) | c.line(24, 7, 25, 10), 'G'); c.fill(c.line(29, 9, 31, 12), 'E')
PORTRAIT = portrait('benders.extrahand', 'Extra Hand', c, [{'skin': 'freckled', 'hair': 'ginger'}], 'orange')
