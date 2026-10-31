import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas

# Night Owl (purple, counts as 2), round 3, faces by hand. In front: a night person still up and alert, brows up,
# wild black hair in four tufts, both hands round a hot mug (no bug-eyed stare: see audit.md). Behind, slumped 4px lower (template pose rule):
# a freckled redhead asleep in a floppy nightcap, mid-yawn. A star in the dark. Template: 2 people, front left.
c = Canvas()

def seg(rows):
    for y, parts in rows.items():
        for x, s in parts: c.put(x, y, [s])

# ---- behind (person 1), right, slumped
bodyB = c.poly([(22, 48), (25, 37), (29, 33), (38, 32), (44, 34.5), (47, 39), (47, 48)])
c.fill(bodyB, '2'); c.outside(bodyB, '1', 34, 38, 12, 9)
c.fill(c.rect(31, 27, 36, 33), 'I')
seg({
    15: [(27, 'NNNONNNONNNMM')],
    16: [(27, 'KKKKKKKKKKKJM')],
    17: [(27, 'KKKKKKKKKKKJJ')],
    18: [(27, 'KJJJKKKJJJJKJ')],
    19: [(27, 'KMMMKKKMMMMKJ')],
    20: [(27, 'KKKKKKKKKKKKJ')],
    21: [(27, 'KKKKKKKKKKKKJ')],
    22: [(27, 'KKKJJKKKKKKJJ')],
    23: [(27, 'KKJzzJKKKKKJ')],
    24: [(27, '.KJIzJKKKKJJ')],
    25: [(28, 'KKJJKKKKJJ')],
    26: [(29, 'JJJJJJJI')],
})
cap = c.poly([(26, 15.5), (26.5, 11), (30, 8), (36, 7.5), (41, 10), (43.5, 15), (44.5, 22), (42.5, 23), (41, 17), (39.5, 15.5)])
c.fill(cap, '3'); c.outside(cap, '2', 34, 10, 9, 5.5); c.fill(cap & c.ellipse(31, 9.6, 3.5, 1.5), '4')
c.fill(c.rect(26, 14, 40, 15) & cap, '2'); c.edge(cap, '1')
pom = c.ellipse(44, 25, 2.2, 2.2)
c.fill(pom, 'k'); c.fill(pom & c.ellipse(43.3, 24.3, 1.4, 1.4), 'l'); c.edge(pom, 'j')
c.shift(c.mask_of('IJKL'), -1)                                         # behind: a value darker
c.g = [['.'] * 48 for _ in range(3)] + c.g[:45]                        # and 3px lower (template depth rule)
# ---- in front (person 0), left
bodyA = c.poly([(0, 48), (0, 41), (3, 37), (9, 35), (24, 35), (30, 37), (33, 41), (34, 48)])
c.fill(bodyA, '3'); c.outside(bodyA, '2', 14, 40, 17, 11); c.outside(bodyA, '1', 12, 39, 21, 14)
c.rim(bodyA, '4', 0, -1, 1, only='3')
hood = c.poly([(6, 35.5), (9.5, 32), (24, 32), (28, 35.5), (24, 37), (10, 37)])
c.fill(hood, '2'); c.rim(hood, '3', 0, -1, 1); c.edge(hood, '1')
c.fill(c.rect(13, 29, 20, 34), 'A'); c.fill(c.rect(13, 32, 14, 34), 'B')
seg({
    15: [(10, 'BEEEBBBBEEEBBA')],
    16: [(9, 'BCCCCCCCCCCCCCBA')],
    17: [(9, 'CCzzzCCCCzzzCBBA')],
    18: [(9, 'BCyzzCDCCyzzCBBA')],
    19: [(9, 'BCBBBCDCCBBBCBBA')],
    20: [(9, 'BCCCCCDCCCCCCBBA')],
    21: [(9, 'BDDDCCDCCCCCCBBA')],
    22: [(9, 'BCDDCCDDBCCCCBBA')],
    23: [(9, 'BCCCCCCAACCCCBBA')],
    24: [(9, 'BCCCCCCCCCCCCBBA')],
    25: [(9, 'BCCCCBAABCCCCBBA')],
    26: [(10, 'BCCCCDDCCCCBBA')],
    27: [(11, 'BBCCCCCCBBBA')],
    28: [(12, 'ABBBBBBBAA')],
})
c.put(7, 19, ['.C', 'CA', 'CA', '.B'])
hair = c.poly([(6, 20), (6, 13), (3.5, 8), (9, 9.5), (10, 3), (15.5, 7.5), (20, 1.5), (22.5, 7.5), (28, 5), (26.5, 11),
               (27.5, 15), (26, 19), (24, 16.5), (24, 14.5), (20, 15.4), (15, 14.4), (10, 15.6), (8, 16.5), (7.5, 20)])
c.fill(hair, 'F'); c.outside(hair, 'E', 15, 11, 12, 7.5); c.rim(hair, 'G', -1, -1, 1, only='F')   # 4 tufts, lit edges
c.edge(hair | (c.mask_of('ABCDyz!') & c.rect(0, 0, 26, 47)), None)
# the mug in both hands, steam
mug = c.rect(12, 39, 19, 47)
c.fill(mug, 'k'); c.fill(c.rect(17, 40, 19, 47), 'j'); c.fill(c.rect(12, 39, 19, 39), 'l'); c.put(13, 40, ['zzzzz'])
c.put(20, 41, ['jj', '.j', '.j', 'jj'])
c.put(9, 41, ['.CD', 'CCC', 'BCC', 'BB.'])
c.put(20, 44, ['CCB', 'BB.'])
c.put(14, 34, ['.k', 'k.', 'k.', '.k']); c.put(17, 35, ['k', '.', 'k'])
c.edge(mug, 'j')
c.put(40, 2, ['.k.', 'klk', '.k.'])                                  # a star
PORTRAIT = {'id': 'purple.nightowl', 'name': 'Night Owl', 'kind': 'member', 'sphere': 'purple',
            'people': [{'skin': 'brown', 'hair': 'black'}, {'skin': 'palepink', 'hair': 'ginger'}], 'accent': 'red',
            'px': c.rows()}
