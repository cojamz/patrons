import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Rainmaker (yellow): he calls the weather. A grey-bearded showman in a yellow coat with a raised palm, and a small
# grey cloud above it raining on his hand. Delighted, brows up, a small closed smile. 3/4 to our left (toward the light). Template: 1 person.
c = Canvas()
body = torso(c, 2, 45, 33)
for pts, k in (([(15, 33), (19, 33), (23.5, 44), (20, 46)], '4'), ([(28, 33), (32, 33), (27, 46), (23.5, 44)], '2')):
    lap = c.poly(pts); c.fill(lap, k); c.edge(lap, '1')
c.fill(c.poly([(19, 33), (28, 33), (23.5, 43)]), '5')
neck(c, 20, 26, 28, 33)
face(c, 15, 32, 13, 28, 19, 19, [(15, 'i3c'), (21, 'i4c')], (19, ['A..A', '.AA.']), jaw='long', hair='G',
     brows=[(15, -3, ['GG']), (21, -3, ['GGGG'])], plane=5, cheek=False, ear=(31, 'R'), mouth_y=25, lit=2)
c.put(22, 20, ['DDD', '.DD'])
c.put(16, 22, ['GGGGGGG'], keep='.')
goatee = c.poly([(19.5, 27), (23.5, 27), (23, 30), (21.5, 31.2), (20, 30)])
c.fill(goatee, 'G'); c.fill(goatee & c.rect(19, 27, 20, 31), 'H')
hair = c.poly([(14.4, 16), (14.4, 12.5), (16.5, 10), (23, 9), (29, 9.6), (32.4, 12), (33, 15), (32.8, 19), (31.2, 17),
               (30, 13.4), (22, 12.4), (16.4, 13.4), (15.4, 16)])
c.fill(hair, 'G'); c.outside(hair, 'F', 22, 9.5, 10, 4); c.rim(hair, 'H', -1, -1, 1, only='G'); c.edge(hair, 'F')
# his raised palm on our right, the cloud raining onto it
c.put(36, 26, ['D.D.D.', 'DCDCDC', 'DCDCDC', 'CCCCCB', 'BCCCCB', '.BCCB.'])
arm = c.poly([(36, 33), (41, 33), (43, 45), (36, 45)])
c.fill(arm, '3'); c.rim(arm, '4', -1, 0, 1); c.fill(arm & c.rect(40, 33, 43, 48), '2')
cl = c.ellipse(34, 9, 4, 3) | c.ellipse(39.5, 6.5, 4.6, 4) | c.ellipse(44, 9.5, 3.5, 3) | c.rect(32, 9, 46, 12)
c.fill(cl, 'g'); c.outside(cl, 'f', 39, 6.5, 6, 4); c.fill(cl & c.rect(0, 12, 47, 12), 'e')
c.edge(cl, 'e')
for x, y in ((35, 15), (40, 17), (44, 15), (37, 21), (42, 23)): c.put(x, y, ['v', 'v'])
PORTRAIT = {'id': 'yellow.rainmaker', 'name': 'Rainmaker', 'kind': 'member', 'sphere': 'yellow',
            'people': [{'skin': 'olive', 'hair': 'grey'}], 'accent': 'teal', 'px': c.rows()}
