import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Retinue (silver, counts as 3): a noble's attendants in silver livery. In front: a dignified young page with
# close-cropped hair carrying a red velvet cushion with a small gold crown on it, proud. Behind left and right, lower and
# darker: two attendants, attentive, one with a braid, one with a bob. Template: 3 people.
c = Canvas()
behind3(c, 1, 'L', look=1, brows='level', mouth='smile', jaw='round',
        hair_pts=[(3.5, 17), (4, 12.6), (7, 10.4), (10, 10.6), (13, 10.4), (15.6, 12.6), (16, 17), (14.6, 14), (10, 13.2), (5, 14)])
behind3(c, 2, 'R', look=-1, brows='raised', mouth='flat', hair_pts=[(31, 23), (31.5, 13), (34, 10.4), (40, 10), (43.5, 12), (44.5, 23), (43, 23), (42.6, 15), (33, 15), (32.6, 23)],
        hair_lo='U', hair_hi='V')
c.put(2, 16, ['.N', 'NM', 'MN', 'NM', 'MN', '.M'])                                     # the braid
# ---- in front (person 0)
body = c.poly([(9, 48), (10, 40), (14, 37), (20, 35.5), (28, 35.5), (34, 37), (38, 40), (39, 48)])
c.fill(body, '3'); c.outside(body, '2', 22, 41, 14, 9); c.rim(body, '4', 0, -1, 1, only='3')
c.fill(c.line(13, 37, 35, 37), 'c'); c.fill(c.line(24, 37, 24, 40), 'c')            # gold livery trim
neck(c, 21, 27, 29, 35)
c.put(19, 34, ['yy.......yy', '.yyy...yyy.'])
f = face(c, (17, 13, 31, 29), 21, view='front', jaw='narrow', eyes='round', look=0, mouth='smile', brows='level', ear=True)
lift(c, f['m'] - c.mask_of('zy!') - c.rect(0, 28, 47, 29))
c.put(19, 16, ['DDD', 'DD'])
crop = c.poly([(16.5, 19), (16.5, 14), (18.5, 10.6), (24, 9.6), (29.5, 10.6), (31.5, 14), (31.5, 19), (30.5, 15.4), (18, 15.4), (17.5, 19)])
c.fill(crop, 'F'); c.outside(crop, 'E', 23, 12, 8, 3.4); c.rim(crop, 'G', -1, -1, 1, only='F')
# the cushion held out in both hands, the crown on it
cush = c.poly([(13, 44), (15, 40.5), (33, 40.5), (35, 44), (33, 47.5), (15, 47.5)])
c.fill(cush, 'v'); c.outside(cush, 'u', 22, 42.6, 11, 3.6); c.rim(cush, 'w', 0, -1, 1, only='v'); c.edge(cush, 'u')
c.put(13, 43, ['c', 'b']); c.put(35, 43, ['c', 'b'])                                  # tassels
c.put(19, 34, ['...........'][0:0])
c.put(19, 36, ['.c..c..c..c'][0:0])
c.put(19, 35, ['c...c...c', 'cc.ccc.cc', 'ccccccccc', 'bbbbbbbbb'])                    # crown (three points, not a cross)
c.put(23, 36, ['v'])
c.put(10, 43, ['DC.', 'CCB', 'BB.']); c.put(35, 43, ['.DC', 'CCB', '.BB'])
merge(c, {'M': 'N', 'U': 'V', 'G': 'F', '4': '3', '!': 'y', 'k': 'y', 'b': 'c', 'w': 'v', 'u': '1'})
PORTRAIT = {'id': 'silver.retinue', 'name': 'Retinue', 'kind': 'member', 'sphere': 'silver',
            'people': [{'skin': 'deep', 'hair': 'black'}, {'skin': 'warmtan', 'hair': 'brown'}, {'skin': 'porcelain', 'hair': 'blonde'}],
            'accent': 'red', 'px': c.rows()}
