import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Ensemble (green, counts as 2): two players of a stage company singing the same note in ruff collars. Front: a woman
# with a big crown of dark curls, eyes squeezed shut with joy, mouth open on the note. Behind (3px lower, a value
# darker): a man with a ginger fringe, singing along. Template: 2 people, front left.
c = Canvas()
# ---- behind (person 1), right
bodyB = c.poly([(22, 48), (24, 34), (28, 30.5), (38, 30), (44, 32), (47, 36), (47, 48)])
c.fill(bodyB, '2'); c.outside(bodyB, '1', 34, 36, 11, 8)
c.fill(c.rect(30, 25, 36, 29), 'I')
ruffB = c.ellipse(33.5, 29.5, 7, 2.4)
c.fill(ruffB, 'j'); c.fill(ruffB & c.rect(0, 28, 47, 28), 'k')
for x in range(27, 41, 2): c.set(x, 30, 'i')
face(c, 27, 39, 14, 25, 20, 33, [(29, 'i3r'), (35, 'i3r')], (31, ['.AA.', 'AzzA', '.AA.']), jaw='soft', keys='IJKL',
     hair='N', brows=[(29, -3, ['NNN']), (35, -3, ['NNN'])], cheek=False, chin_lit=False, mouth_y=22, iris='N')
hairB = c.poly([(26.5, 18), (26.5, 12.5), (29, 10.4), (35, 10), (39, 11.5), (40.5, 15), (40, 19), (38.5, 16), (34, 15.4),
                (30, 16), (28, 15.2)])
c.fill(hairB, 'O'); c.outside(hairB, 'N', 32, 12, 7, 3)
c.shift(c.mask_of('IJKL'), -1); c.fill(c.mask_of('K'), 'J')
# ---- in front (person 0), left
body = torso(c, -1, 34, 35)
neck(c, 13, 19, 29, 33)
ruff = c.ellipse(16.5, 34, 11, 3.2)
c.fill(ruff, 'k'); c.outside(ruff, 'j', 15.5, 33.4, 10.4, 2.8)
for x in range(7, 27, 2): c.fill(c.rect(x, 34, x, 36) & ruff, 'i')
face(c, 9, 24, 14, 28, 20, 17, [(11, 'joy4'), (19, 'joy3')], (15, ['.AA.', 'AzzA', 'AzzA', '.AA.']), jaw='soft',
     hair='E', brows=[(11, -3, ['.EE.']), (19, -3, ['.EE'])], cheek=True, mouth_y=24, chin_lit=False, lit=3)
curls = c.ellipse(9.5, 16, 4.5, 6) | c.ellipse(24, 16, 3.6, 6) | c.ellipse(16.5, 10.5, 9.5, 5.2)
curls -= c.poly([(10.5, 21), (11, 15.5), (22, 15.2), (22.5, 21)])
c.fill(curls, 'F'); c.outside(curls, 'E', 13, 11, 11.5, 6.5)
for x, y in ((9, 8), (14, 7), (19, 7), (6, 12), (11, 11), (16, 10), (21, 10), (5, 17)): c.put(x, y, ['GG', 'G.'], keep='.')
c.edge(curls, 'E')
c.put(11, 17, ['DDDD'], keep='.'); c.put(10, 21, ['DDD', 'DDD', '.DD'])                             # lit forehead and cheek
PORTRAIT = {'id': 'echo.ensemble', 'name': 'Ensemble', 'kind': 'member', 'sphere': 'green',
            'people': [{'skin': 'brown', 'hair': 'darkbrown'}, {'skin': 'porcelain', 'hair': 'ginger'}], 'accent': 'red',
            'px': c.rows()}
