import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Guest (silver): a party guest just handed a present, thrilled (brows up, a round "oh"), a freckled face under a
# mop of ginger curls, a silver party dress, the wrapped gift box with a teal ribbon and bow held up at her side.
# Front view. Template: 1 person.
c = Canvas()
body = cloth(c, [(2, 48), (3, 40), (8, 35.5), (17, 33.5), (30, 33.5), (39, 35.5), (44, 40), (45, 48)])
c.fill(c.poly([(19, 33.5), (29, 33.5), (24, 37.5)]), 'C'); c.fill(c.poly([(25, 33.5), (29, 33.5), (24, 37.5)]), 'B')
neck(c, 20, 27, 28, 33)
f = face(c, (15, 10, 32, 28), 19, view='front', jaw='round', eyes='wide', look=0, mouth='o', brows='raised')
# ginger curls: a big soft mop, curl clusters lit top-left
mop = c.ellipse(24, 13, 12, 8.5) - c.poly([(16, 17), (17, 14.6), (22, 15), (27, 14.4), (31, 15), (32.5, 18), (33, 29), (15, 29)])
c.fill(mop, 'F'); c.outside(mop, 'E', 22, 10.5, 10.5, 7.5); c.rim(mop, 'G', -1, -1, 1, only='F')
for (x, y) in ((14, 9), (19, 6), (25, 5), (30, 7), (34, 11), (16, 13), (22, 10), (28, 10)): c.put(x, y, ['GF', 'FE'])
c.put(13, 16, ['FF', 'EF', 'FE', '.E']); c.put(33, 16, ['FE', 'EE', 'FE', 'E.'])
# the gift box held up at her side (our left), a teal ribbon and a big bow on the lid
box = c.rect(3, 37, 17, 47)
c.fill(box, 'k'); c.fill(c.rect(3, 37, 17, 37), 'l'); c.fill(c.rect(15, 38, 17, 47), 'j'); c.edge(box, '1')
c.fill(c.rect(9, 37, 11, 47), 'v'); c.fill(c.rect(11, 38, 11, 47), 'u'); c.fill(c.rect(9, 37, 11, 37), 'w')
c.put(3, 32, ['.vvvv...vvvv.', 'vwwwvv.vvwwuv', 'vwvvvvvvvvvuv', '.vvuuvwvuuvv.', '...uu.v.uu...'])
c.put(17, 41, ['DCC.', 'CCCB', 'BCBB', '.BB.'])                                    # her hand on the box
PORTRAIT = {'id': 'silver.guest', 'name': 'Guest', 'kind': 'member', 'sphere': 'silver',
            'people': [{'skin': 'freckled', 'hair': 'ginger'}], 'accent': 'teal', 'px': c.rows()}
