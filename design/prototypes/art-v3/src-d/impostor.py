import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Impostor (green): a fair-haired man in a joke-shop disguise: thick black glasses with a big nose and a bushy black
# moustache attached, which don't match his blond hair. A worried look and a bead of sweat. Trench coat, collar up.
# Facing us. Template: 1 person.
c = Canvas()
body = torso(c, 2, 45, 33)
for pts, k in (([(13, 27), (19.5, 33), (21, 41), (11, 37)], '4'), ([(34, 27), (28, 33), (26.5, 41), (36, 37)], '2')):
    col = c.poly(pts); c.fill(col, k); c.edge(col, '1')                                         # collar up
c.fill(c.poly([(19.5, 33), (28, 33), (24, 40)]), '1')
neck(c, 20, 27, 28, 33)
face(c, 15, 32, 13, 28, 19, 23, [(18, 'o4c'), (26, 'o4c')], (22, ['.AAA.', 'A...A']), jaw='round', hair='F',
     brows=[(18, -3, ['..FF', 'FF..']), (26, -3, ['FF..', '..FF'])], nose=False, ear=(13, 'L'), mouth_y=25)
c.put(31, 18, ['BA'], keep='.')
c.put(16, 17, ['zzzzzzzzzzzzzzzz', 'z....zzzzz....z.', 'z....z..z.....z.', '.zzzz....zzzzz..'], keep='.')   # glasses
c.put(23, 18, ['zz'], keep='.')
nose = c.poly([(21.5, 19), (25, 19), (26, 22.5), (25, 23.6), (21, 23.6), (20.5, 22)])
c.fill(nose, 'C'); c.fill(nose & c.rect(21, 19, 22, 21), 'D'); c.fill(nose & c.rect(25, 19, 26, 24), 'B'); c.edge(nose, 'A')
st = c.poly([(17.5, 23.5), (23, 23.4), (29.5, 23.5), (30.5, 25.5), (27, 25), (23, 25.6), (19, 25), (16.5, 25.5)])
c.fill(st, 'z'); c.fill(st & c.rect(17, 23, 22, 23), 'm')
hair = c.poly([(14, 17), (14, 12), (16, 8.6), (21, 7), (27, 7.2), (31.5, 9.4), (33.4, 13), (33, 17), (31.5, 14.2),
               (25, 13), (18, 13.6), (15.4, 16)])
c.fill(hair, 'G'); c.outside(hair, 'F', 22, 10, 10, 4); c.rim(hair, 'H', -1, -1, 1, only='G')
c.fill(c.line(19, 13, 24, 8), 'F')
c.edge(hair, 'F')
c.put(13, 11, ['k', 'kl', 'k'])                                                                 # bead of sweat
PORTRAIT = {'id': 'echo.impostor', 'name': 'Impostor', 'kind': 'member', 'sphere': 'green',
            'people': [{'skin': 'porcelain', 'hair': 'blonde'}], 'accent': 'red', 'px': c.rows()}
