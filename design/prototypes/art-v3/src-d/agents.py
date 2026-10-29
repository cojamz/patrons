import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Agents (green, counts as 2): two plainclothes agents nobody can copy. Dark glasses, earpiece wires, flat stern mouths,
# matching suits. Front: a woman with slicked black hair and a side part. Behind (3px lower, a value darker): a blond
# man with a crew cut, earpiece wire at his ear. Template: 2 people, front left.
c = Canvas()
# ---- behind (person 1), right
bodyB = c.poly([(22, 48), (24, 34), (28, 30.5), (38, 30), (44, 32), (47, 36), (47, 48)])
c.fill(bodyB, '2'); c.outside(bodyB, '1', 34, 36, 11, 8)
c.fill(c.poly([(31, 30.2), (36, 30.2), (33.5, 36)]), '3'); c.fill(c.line(33, 31, 34, 37), '1')       # shirt, tie
c.fill(c.rect(30, 25, 36, 30), 'I')
face(c, 27, 39, 14, 25, 20, 33, [(28, 'o3c'), (34, 'o3c')], (31, ['AAAA']), jaw='square', keys='IJKL', hair='N',
     cheek=False, chin_lit=False, plane=3)
c.put(27, 19, ['zzzzzzzzzzzzz'[:12], 'z!zzz.z!zzz.', '.zzz...zzz..'])                # dark glasses
hairB = c.poly([(26.5, 16), (26.5, 12.5), (29, 10.6), (34, 10.2), (38.5, 11), (40, 13), (40, 17), (38.5, 15), (28, 15.2)])
c.fill(hairB, 'O'); c.outside(hairB, 'N', 32, 12, 7, 2.6)
c.put(40, 17, ['J', 'JI', 'JI'])                                                     # ear, earpiece
c.put(41, 19, ['z', 'z', 'z', '.z', '.z'])
c.shift(c.mask_of('IJKL'), -1); c.fill(c.mask_of('K'), 'J')
# ---- in front (person 0), left
body = torso(c, -1, 34, 35)
shirt = c.poly([(12.5, 35), (20.5, 35), (16.5, 43)])
c.fill(shirt, '5'); c.fill(c.poly([(15.5, 35.5), (17.5, 35.5), (18, 41), (16.5, 43), (15, 41)]), 'z')
lapL = c.poly([(8.5, 35.6), (12.5, 35), (16.4, 44.6), (14, 44.6), (10, 39)])
lapR = c.poly([(20.5, 35), (24.5, 35.6), (23, 39), (19, 44.6), (16.6, 44.6)])
c.fill(lapL, '4'); c.edge(lapL, '1'); c.fill(lapR, '2'); c.edge(lapR, '1')
neck(c, 13, 19, 28, 35)
face(c, 9, 24, 14, 28, 20, 17, [(11, 'o4c'), (18, 'o4c')], (14, ['.AAA.', '.wDw.'][:1] + ['..D..']), jaw='pointed', hair='E',
     cheek=False, mouth_y=25, lit=3)
c.put(10, 18, ['zzzzzzzzzzzzz', 'z!zzzz.z!zzzz', '.zzzz...zzzz.'])                  # dark glasses
c.put(11, 21, ['DDD'])
hair = c.poly([(7.5, 27), (7.4, 15), (9, 11.5), (13, 9.6), (18, 9.4), (22.5, 10.5), (25, 13.5), (25.6, 27), (23.8, 27.6),
               (23.5, 15.4), (19, 15), (14, 14.4), (10, 15.4), (9.6, 27.6)])
c.fill(hair, 'F'); c.outside(hair, 'E', 15, 12.5, 9, 4.5); c.rim(hair, 'G', -1, -1, 1, only='F')
c.fill(c.line(13, 10, 11, 14), 'E'); c.fill(c.line(14, 10, 12, 14), 'G')                # side part, combed back
c.put(24, 28, ['z', 'z', 'z', 'z', 'z'])                                         # earpiece wire
c.edge(hair | (c.mask_of('ABCDz!') & c.rect(8, 14, 25, 29)), None)
PORTRAIT = {'id': 'echo.agents', 'name': 'Agents', 'kind': 'member', 'sphere': 'green',
            'people': [{'skin': 'coolbrown', 'hair': 'black'}, {'skin': 'palepink', 'hair': 'blonde'}], 'accent': 'red',
            'px': c.rows()}
