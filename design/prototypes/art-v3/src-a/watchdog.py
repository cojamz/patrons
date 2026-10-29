import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Bodyguard (magenta, counts as 2): nobody gets to your stuff. In front, a woman with close-cropped hair, dark glasses
# and a curly earpiece cord, calm and composed (a small closed smile); behind (lower, darker), her partner, a big bald
# man in the same glasses, stern. Dark suits in magenta. Template: 2 people, front left.
c = Canvas()
# ---- behind (person 1), right
body(c, [(23, 48), (24, 34), (28, 30.6), (36, 29.6), (44, 30.6), (47, 34), (47, 48)], front=False)
c.fill(c.poly([(32, 29.6), (39, 29.6), (35.5, 36)]), 'n')
neck(c, 1, 32, 38, 26, 30)
crown = c.ellipse(33.5, 18.6, 7.2, 6.4)
c.fill(crown, 'K'); c.outside(crown, 'J', 32.4, 17.4, 6.6, 6)
face(c, 1, 27, 20, 13, 4, 5, view='l', eyes='level', mouth='stern', jaw='square')
c.put(27, 18, ['zzzzz.zzzz', 'z!zzzzz!zz', '.zzz...zz.'])
behind(c, 1)
# ---- in front (person 0), left
s0 = snap(c)
body(c, [(0, 48), (0, 41), (3, 37.5), (9, 35.5), (23, 35.5), (29, 37), (32, 41), (33, 48)])
c.fill(c.poly([(12, 35.2), (21, 35.2), (16.5, 42)]), 'n')
lapL = c.poly([(9, 36), (12, 35.2), (16.5, 43), (14, 43.4)]); c.fill(lapL, '4'); c.edge(lapL, '2')
lapR = c.poly([(21, 35.2), (24, 36), (19, 43.4), (16.5, 43)]); c.fill(lapR, '2'); c.edge(lapR, '1')
neck(c, 0, 14, 19, 29, 35)
face(c, 0, 9, 20, 16, 6, 8, view='f', eyes='calm', mouth='smirk', jaw='oval', dk=True)
c.put(10, 18, ['zzzzz..zzzzz', 'z!zzzzzz!zzz', '.zzzz..zzzz.'])                    # dark glasses
hr = c.poly([(8, 20), (8.2, 15), (10, 12), (14, 10.4), (19, 10.4), (23, 12), (25, 15), (24.8, 20), (24, 19.4), (23.6, 16),
             (20, 14.6), (13, 14.6), (9.6, 16), (9, 20)])
hair(c, hr, 0, 16, 12, 8, 3.4)
c.put(25, 20, ['k', 'k', '.k', '.k', '.k', '.k', '.k', '..k', '..k'])        # the earpiece cord: one line off the face, down behind the collar
front = changed(c, s0)
c.edge(front, None)
c.fill(c.mask_of('K'), 'J')
PORTRAIT = portrait(c, 'thieves.watchdog', 'Bodyguard', 'magenta', [{'skin': 'deep', 'hair': 'black'}, {'skin': 'olive', 'hair': 'black'}])
