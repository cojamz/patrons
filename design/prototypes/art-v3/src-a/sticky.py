import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Sticky Fingers (magenta): everything she touches comes with her. Long wavy hair, laughing, one hand up by her cheek
# showing off gold rings on three fingers, laughing. 3/4 to our right. Template: 1 person.
c = Canvas()
hrb = c.poly([(11, 40), (11.6, 30), (12.6, 20), (14, 13), (18, 8.6), (24, 7.4), (30, 8.4), (34, 12.4), (36, 20), (37, 30),
              (37.4, 40), (34, 42), (32, 34), (16, 34), (14, 42)])
hair(c, hrb, 0, 22, 14, 11, 14)                                                   # the long hair behind her
for y0 in (24, 30, 36): c.fill(c.line(12, y0, 14, y0 + 2) | c.line(35, y0, 36, y0 + 2), 'E')   # waves
body(c, [(2, 48), (3, 40), (8, 35.5), (17, 34), (30, 34), (39, 35.5), (44, 40), (45, 48)])
c.fill(c.poly([(18, 33.5), (30, 33.5), (24, 40.5)]), 'B')
neck(c, 0, 21, 26, 29, 33)
c.put(19, 36, ['c.....c', '.c...c.', '..cbc..'][0:0])
face(c, 0, 15, 19, 18, 6, 9, view='r', eyes='laugh', mouth='o', jaw='oval')
fr = c.poly([(14, 19), (14.2, 13), (17, 9.6), (24, 8.4), (31, 9.6), (34, 13.4), (34, 19), (32.6, 17), (31.6, 14), (26, 13.2),
             (21, 12.6), (17, 14.6), (15.6, 19)])
hair(c, fr, 0, 21, 10, 9, 4.6)
c.fill(c.line(18, 10, 23, 9) | c.line(26, 9, 30, 10), 'G')
# the hand up by her cheek, a ring on every finger
c.put(35, 16, ['..D.C..', 'D.D.C.C', 'D.D.d.C', 'd.D.C.B', 'DDdCCCB', 'CDDCCCB', 'BCCCCB.', '.BCCB..', '.BCCB..'])   # the back of a relaxed, fanned hand; a gold ring pixel on three fingers, staggered
c.put(33, 21, ['CC', '.BC'])                                                   # thumb
arm = c.poly([(37, 48), (37, 36), (38, 29), (42.6, 29), (43, 36), (44, 48)])
c.fill(arm, '3'); c.rim(arm, '4', -1, 0, 1, only='3'); c.fill(c.rect(42, 30, 44, 48) & arm, '2'); c.edge(arm, '1')
c.put(37, 28, ['.dcc.', 'cddcc'][0:1])                                            # a bangle at the wrist
PORTRAIT = portrait(c, 'thieves.sticky', 'Sticky Fingers', 'magenta', [{'skin': 'golden', 'hair': 'darkbrown'}])
