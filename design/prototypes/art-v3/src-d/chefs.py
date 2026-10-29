import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Chefs (yellow, counts as 2): a kitchen pair in tall white toques and yellow double-breasted jackets. Front: the head
# chef raising a wooden tasting spoon, eyes shut, savouring it. Behind (3px lower, a value darker): her sous-chef with a
# ginger moustache, eyebrows up, waiting for the verdict. Template: 2 people, front left.
c = Canvas()
# ---- behind (person 1), right
bodyB = c.poly([(22, 48), (24, 34), (28, 30.5), (38, 30), (44, 32), (47, 36), (47, 48)])
c.fill(bodyB, '2'); c.outside(bodyB, '1', 34, 36, 11, 8)
for x, y in ((33, 35), (37, 35), (33, 40), (37, 40)): c.put(x, y, ['1'])
c.fill(c.rect(30, 25, 36, 30), 'I')
face(c, 27, 39, 14, 25, 20, 32, [(29, 'i3l'), (34, 'i3l')], (30, ['AAAA']), jaw='round', keys='IJKL', hair='N',
     brows=[(29, -3, ['NNN']), (34, -3, ['NNN'])], cheek=False, chin_lit=False, mouth_y=24)
c.put(28, 22, ['NNNNNNNN', 'N......N'], keep='.')                                                     # moustache
c.put(40, 18, ['J', 'JI', 'I'])
hatB = c.poly([(27.5, 15.5), (27, 9), (26, 4), (30, 2.5), (34, 3.6), (38, 2.5), (41.5, 4.6), (40.5, 9), (40, 15.5)])
c.fill(hatB, 'j'); c.fill(hatB & c.ellipse(31, 5, 3, 2), 'k'); c.fill(c.rect(27, 13, 40, 15) & hatB, 'i')
c.shift(c.mask_of('IJKL'), -1); c.fill(c.mask_of('K'), 'J')
# ---- in front (person 0), left
body = torso(c, -1, 34, 35)
c.fill(c.poly([(10, 35), (23, 35), (24, 37), (9, 37)]), '4')
for x, y in ((12, 39), (19, 39), (12, 44), (19, 44)): c.put(x, y, ['22', '21'])
c.fill(c.line(16, 37, 16, 47), '2')
neck(c, 13, 19, 29, 35)
c.fill(c.poly([(10.5, 33), (22, 33), (21, 36), (12, 36)]), 'v')    # neckerchief
face(c, 9, 24, 14, 28, 20, 18, [(11, 'shut4'), (19, 'shut3')], (14, ['.AA.', 'A..A']), jaw='soft', hair='E',
     brows=[(11, -3, ['EEEE']), (19, -3, ['EEE'])], mouth_y=25)
c.put(8, 16, ['EE', 'EE', 'EE', 'E'])
hat = c.poly([(8, 16), (7.5, 9), (6, 3), (10, 0.5), (15, 2), (19, 0.2), (24.5, 2), (26, 7), (25, 16)])
c.fill(hat, 'k'); c.outside(hat, 'j', 15, 6, 10, 9); 
c.fill(c.line(15, 3, 15, 10), 'j'); c.fill(c.line(20, 2, 20, 10), 'j')
band = c.rect(8, 12, 25, 15) & hat
c.fill(band, 'k'); c.fill(band & c.rect(22, 12, 25, 15), 'j')
c.edge(hat, 'i')
# the wooden tasting spoon, raised beside her face
sp = c.line(6, 35, 3, 25); c.fill(sp, 's')
bowl = c.rect(1, 21, 3, 24) - {(1, 21), (3, 21), (1, 24), (3, 24)}; c.fill(bowl, 's'); 
c.edge(sp | bowl, 'q')
c.put(4, 34, ['CCD.', 'CCCC', 'BCCB', '.BB.'])
PORTRAIT = {'id': 'yellow.chefs', 'name': 'Chefs', 'kind': 'member', 'sphere': 'yellow',
            'people': [{'skin': 'warmtan', 'hair': 'black'}, {'skin': 'freckled', 'hair': 'ginger'}], 'accent': 'red',
            'px': c.rows()}
