import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Late Bloomers (yellow, counts as 2): an old couple just getting started. Front: a grandmother with a short white
# crop and big round glasses, holding up one orange bloom, delighted. Behind (3px lower, a value darker): her bald
# husband with a grey moustache, laughing with his eyes shut. Template: 2 people, front left.
c = Canvas()
# ---- behind (person 1), right
bodyB = c.poly([(22, 48), (24, 34), (28, 30.5), (38, 30), (44, 32), (47, 36), (47, 48)])
c.fill(bodyB, '2'); c.outside(bodyB, '1', 34, 36, 11, 8)
c.fill(c.poly([(30, 30.3), (37, 30.3), (33.5, 34)]), '1')
c.fill(c.rect(30, 25, 36, 30), 'I')
face(c, 27, 39, 12, 25, 20, 33, [(29, 'joy3'), (35, 'joy3')], (31, ['A..A', '.AA.']), jaw='round', keys='IJKL',
     hair='N', brows=[(29, -3, ['OOO']), (35, -3, ['OOO'])], cheek=False, chin_lit=False, mouth_y=23)
c.put(29, 22, ['OOOOOOO'], keep='.')
c.put(27, 13, ['.JJJJJJJJJJJ', 'JKKKKJJJJJJJI'], keep='.')
c.put(26, 16, ['O', 'OO', 'O'], keep='.'); c.put(39, 16, ['OO', 'OO', 'O'], keep='.')
c.shift(c.mask_of('IJKL'), -1); c.fill(c.mask_of('K'), 'J')
# ---- in front (person 0), left
body = torso(c, -1, 34, 35)
c.fill(c.poly([(10, 35), (16.5, 39), (23, 35)]), '5'); c.fill(c.poly([(12, 35), (16.5, 37.5), (21, 35)]), '4')    # lace collar
neck(c, 13, 19, 29, 35)
face(c, 9, 24, 14, 28, 20, 17, [(11, 'i4r'), (19, 'i3r')], (14, ['A..A', '.AA.']), jaw='soft', hair='F',
     brows=[(11, -3, ['.FF.']), (19, -3, ['FF.'])], mouth_y=25, lit=2, iris='E')
c.put(10, 18, ['.eeee.', 'e....e', 'e....e', '.eeee.'], keep='.'); c.put(18, 18, ['.eee.', 'e...e', 'e...e', '.eee.'], keep='.')
c.put(16, 19, ['ee'])
crop = c.ellipse(16.5, 13.5, 9.5, 5.5) | c.ellipse(8.5, 17, 2.6, 3.6) | c.ellipse(24.5, 17, 2.6, 3.6)
crop -= c.poly([(10, 23), (10.5, 15.5), (13, 15), (22, 15.2), (23, 23)])
c.fill(crop, 'G'); c.outside(crop, 'F', 15, 12, 9, 4.6); c.rim(crop, 'H', -1, -1, 1, only='G')
for x, y in ((11, 10), (15, 9), (19, 10), (8, 13)): c.put(x, y, ['F'])
c.edge(crop, 'F')
# the bloom, held up
c.fill(c.line(4, 41, 6, 28), '1')
bl = c.ellipse(5.5, 25, 4, 3.8)
c.fill(bl, 'v'); c.outside(bl, 'u', 5, 24.5, 3.6, 3.4)
for x, y in ((5, 21), (1, 25), (9, 25), (5, 28)): c.set(x, y, '.')
c.put(4, 24, ['11', '11'])
c.put(3, 38, ['.CCD', 'CCCC', 'BCCB', '.BB.'])
PORTRAIT = {'id': 'yellow.latebloomer', 'name': 'Late Bloomers', 'kind': 'member', 'sphere': 'yellow',
            'people': [{'skin': 'brown', 'hair': 'white'}, {'skin': 'fair', 'hair': 'grey'}], 'accent': 'orange',
            'px': c.rows()}
