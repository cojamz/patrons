import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Window Shopper (blue): seen from inside the shop, through the glass. A young person in a blue beanie and puffer,
# eyes up and to the side at something they love, brows lifted, a delighted closed smile, one palm flat on the pane.
# Two clean glare lines on the glass, top left. Front view. Template: 1 person.
c = Canvas()
body = cloth(c, [(1, 48), (2, 40), (6, 36), (16, 33.5), (31, 33.5), (41, 36), (45, 40), (46, 48)])
for y in (39, 44): c.fill(c.poly([(2, y - .5), (46, y - .5), (46, y + .6), (2, y + .6)]) & body, '2')   # puffer baffles
c.fill(c.line(24, 34, 24, 47), '1')
collar = c.poly([(15.5, 30), (32.5, 30), (33, 35), (15, 35)])
c.fill(collar, '3'); c.rim(collar, '4', 0, -1, 1); c.fill(collar & c.rect(28, 30, 34, 35), '2'); c.edge(collar, '1')
neck(c, 20, 27, 28, 30)
f = face(c, (15, 10, 32, 28), 19, view='front', jaw='narrow', eyes='round', look=1, mouth='smile', brows='raised')
# short black hair under the beanie, at the temples
c.put(14, 15, ['FF', 'FF', 'EF', 'E.']); c.put(32, 15, ['FE', 'EE', 'E'])
# beanie: ribbed cuff and a soft crown, a pompom
crown = c.poly([(14, 15), (14.5, 9), (18, 5), (24, 3.6), (30, 5), (33.5, 9), (34, 15)])
c.fill(crown, '3'); c.outside(crown, '2', 21, 7, 11, 6.5); c.rim(crown, '4', -1, -1, 1, only='3')
cuff = c.rect(13, 12, 34, 15); c.fill(cuff, '2'); c.fill(c.rect(13, 12, 34, 12), '4')
for x in range(15, 34, 3): c.fill(c.rect(x, 13, x, 15), '1')
c.put(22, 0, ['.44.', '4433', '3322', '.22.'])
# her palm pressed on the glass (lower right), fingers up
c.put(35, 30, ['.D.D.D', 'DCDCDC', 'DCCCCC', 'CCCCCB', 'CCCCCB', 'BCCCBB', '.BBBB.', '..44..', '.4433.'])
# the glass: two long glare streaks, high left to low right
c.fill(c.line(2, 4, 11, 13), '"'); c.fill(c.line(2, 8, 7, 13), '"')
c.put(21, 23, ['A...A']); c.put(22, 24, ['AAA'])                             # a delighted closed smile, corners up
PORTRAIT = {'id': 'market.windowshopper', 'name': 'Window Shopper', 'kind': 'member', 'sphere': 'blue',
            'people': [{'skin': 'coolbrown', 'hair': 'black'}], 'accent': 'red', 'px': c.rows()}
