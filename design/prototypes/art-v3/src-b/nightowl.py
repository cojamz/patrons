import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Night Owl (purple, counts as 2), from the round-3 sample, finished. In front: a night person still up and alert,
# a soft cloud of short curls with a lit crown, a purple hoodie, both hands round a hot mug with steam. Calm, level
# eyes, brows up a touch (no bug-eyed stare: see audit.md). Behind, slumped onto the front one's shoulder (template pose
# rule: +3px): a freckled redhead asleep in a floppy nightcap, mid-yawn. A star in the dark. Template: 2 people.
c = new()
# ---- behind (person 1), right, asleep
bodyB = c.poly([(22, 48), (25, 36), (29, 32.5), (38, 31.5), (44, 34), (47, 39), (47, 48)])
c.fill(bodyB, '2'); c.outside(bodyB, '1', 34, 37, 12, 9); c.rim(bodyB, '3', 0, -1, 1, only='2')
neck(c, 30, 35, 27, 32, n=1)
face(c, 'b13', 27, 20, n=1, eyes='closed', brows='level', mouth='yawn')
c.fill(c.rect(26, 13, 41, 15), 'N')
cap = c.poly([(25.5, 15.5), (26.5, 10.5), (30, 7.5), (36, 7), (41, 9.5), (43.5, 15), (44.5, 22), (42.5, 23), (41, 17), (39.5, 15.5)])
c.fill(cap, '2'); c.outside(cap, '1', 33, 9.5, 9, 5.5); c.fill(cap & c.ellipse(31, 9.6, 3.5, 1.5), '3')
c.fill(c.rect(25, 14, 40, 15) & cap, '1')
c.put(26, 16, ['NN'.translate(TR[0])]); c.put(39, 16, ['MN'])
pom = c.ellipse(44, 25, 2.2, 2.2)
c.fill(pom, 'k'); c.fill(pom & c.ellipse(43.3, 24.3, 1.4, 1.4), 'l'); c.edge(pom, 'j')
behind(c, 1)
# ---- in front (person 0), left
bodyA = c.poly([(0, 48), (0, 41), (3, 37), (9, 35), (24, 35), (30, 37), (33, 41), (34, 48)])
c.fill(bodyA, '3'); c.outside(bodyA, '2', 14, 40, 17, 11); c.outside(bodyA, '1', 12, 39, 21, 14)
c.rim(bodyA, '4', 0, -1, 1, only='3'); c.edge(bodyA, '1')
hood = c.poly([(6, 35.5), (9.5, 32), (24, 32), (28, 35.5), (24, 37), (10, 37)])
c.fill(hood, '2'); c.rim(hood, '3', 0, -1, 1); c.edge(hood, '1')
neck(c, 13, 20, 28, 34)
face(c, 'f16', 9, 20, eyes='dark', brows='raised', mouth='smile', glow=True)

ear(c, 7, 19, 'L')
hair_m = hair(c, [(8, 20), (7.5, 14), (7, 9), (10, 5), (14.5, 3.4), (20, 3), (24.5, 5), (27, 9), (26.5, 15), (25.6, 20), (24.6, 20),
                  (24, 15.4), (19, 14.2), (14, 14.4), (9.6, 15.4), (9, 20)], 0, 16, 9, 11, 6.5)
for x, y in ((11, 6), (15, 4), (20, 4), (23, 7), (9, 10), (13, 9), (18, 8), (22, 11)):   # curls: lit tops, dark undersides
    c.put(x, y, ['GH', 'FG', '.F'] if x < 18 else ['FG', 'EF', '.E'])
c.edge(hair_m | (c.mask_of('ABCDyz!') & c.rect(0, 0, 26, 47)), None)
# the mug in both hands, steam
mug = c.rect(12, 39, 19, 47)
c.fill(mug, 'k'); c.fill(c.rect(17, 40, 19, 47), 'j'); c.fill(c.rect(12, 39, 19, 39), 'l'); c.put(13, 40, ['zzzzz'])
c.put(20, 41, ['jj', '.j', '.j', 'jj'])
c.put(9, 41, ['.CD', 'CCC', 'BCC', 'BB.'])
c.put(20, 44, ['CCB', 'BB.'])
c.put(14, 34, ['.k', 'k.', 'k.', '.k']); c.put(17, 35, ['k', '.', 'k'])
c.edge(mug, 'j')
c.put(40, 2, ['.kk.', 'kl..', 'kl..', 'kl..', '.kk.'])                          # a crescent moon
PORTRAIT = portrait('purple.nightowl', 'Night Owl', 'purple', [{'skin': 'brown', 'hair': 'black'}, {'skin': 'palepink', 'hair': 'ginger'}], c)
