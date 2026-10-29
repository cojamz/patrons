import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Peddler (yellow): a travelling seller with a little of everything. A bowler hat, a waxed moustache, eyebrows up for
# the pitch, a closed salesman's smile. A pack on his back with a pan and a ladle sticking up over his shoulder.
# 3/4 to our left. Template: 1 person.
c = Canvas()
# the pack behind him first
pack = c.poly([(26, 48), (27, 22), (40, 19), (46, 22), (46, 48)])
c.fill(pack, 'r'); c.outside(pack, 'q', 34, 28, 10, 12); c.fill(pack & c.rect(26, 22, 46, 22), 's')
pan = c.ellipse(41, 13, 4.6, 4.4)
c.fill(pan, 'n'); c.fill(pan & c.ellipse(40, 12, 3, 2.8), 'm'); c.fill(pan & c.ellipse(39, 10.6, 1.6, 1), 'o')
c.fill(c.line(41, 18, 41, 21), 'n'); c.edge(pan, 'm')
c.fill(c.line(35, 5, 35, 21), 's'); c.fill(c.line(36, 5, 36, 21), 'q')
lad = c.ellipse(35.5, 4, 2.4, 2); c.fill(lad, 'r'); c.fill(lad & c.rect(0, 0, 35, 3), 's'); c.edge(lad, 'q')
body = torso(c, 2, 45, 33)
c.fill(c.poly([(18, 33), (29, 33), (23.5, 38)]), '5')
c.fill(c.poly([(25, 33), (29, 33.4), (26, 48), (22, 48)]), 'q')                                       # pack strap
c.put(20, 33, ['vv.vv', 'vvvvv', 'vv.vv'], keep='.')                                            # bow tie
neck(c, 20, 26, 28, 33)
face(c, 15, 32, 13, 28, 19, 19, [(15, 'i3l'), (21, 'i4l')], (17, ['A...A', '.AAA.']), jaw='round', hair='F',
     brows=[(15, -3, ['FF']), (21, -3, ['FFFF'])], plane=5, cheek=False, ear=(31, 'R'), mouth_y=25)
c.put(22, 20, ['DDD', '.DD'])
c.put(12, 22, ['F.........F', '.F.......F.', '.FFFFFFFFF.', '..FFF.FFF..'], keep='.')                                        # waxed moustache
c.put(29, 15, ['FF', 'FF', 'F'])
hat = c.poly([(15.5, 14), (15.5, 9), (18, 5.5), (24, 4.6), (30, 5.6), (32.5, 9), (32.5, 14)])
c.fill(hat, 'n'); c.outside(hat, 'm', 22, 8, 9.5, 5); c.fill(hat & c.ellipse(19, 7, 3, 1.6), 'o')
c.fill(c.rect(15, 12, 33, 13) & hat, '1')
brim = c.poly([(11.5, 15.6), (13, 13.6), (35, 13.6), (36.5, 15.6), (34, 16.4), (14, 16.4)])
c.fill(brim, 'n'); c.fill(brim & c.rect(0, 14, 47, 14), 'o'); c.edge(brim, 'm')
PORTRAIT = {'id': 'yellow.peddler', 'name': 'Peddler', 'kind': 'member', 'sphere': 'yellow',
            'people': [{'skin': 'fair', 'hair': 'darkbrown'}], 'accent': 'red', 'px': c.rows()}
