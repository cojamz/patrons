import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas

# Night Owl (purple, counts as 2): in front, a night person wide awake over a steaming mug, ringed eyes, wild hair;
# behind, a sleepy companion in a drooping nightcap, eyes shut, mid-yawn.
c = Canvas()
# ---- behind (person 1): the sleepy one, right
bodyB = c.poly([(24, 48), (26, 36), (31, 31), (39, 31), (44, 34), (46, 40), (47, 48)])
c.fill(bodyB, '3'); c.outside(bodyB, '2', 35, 37, 11, 9); c.rim(bodyB, '4', 0, -1, 1, only='3')
c.fill(c.rect(33, 25, 38, 31), 'I')
FACE_B = [
    '...NONNONNNNMM.',  # 15
    '..KKKKKKKKKJJMM',  # 16
    '..KKKKKKKKKKJJM',  # 17
    '.KKKKKKKKKKKJJM',  # 18
    '.KJJJKKKJJJJJJM',  # 19
    'LKKIIKKKKIIIJJM',  # 20
    'LKKKKKKKKKKKJJ.',  # 21
    'JJKKKKKKKKKJJJ.',  # 22
    '.KKKKIIKKKKJJ..',  # 23
    '.KKKIzzIKKJJI..',  # 24
    '..KKKIIKKJJI...',  # 25
    '...JJJJJJII....',  # 26
]
c.put(29, 14, FACE_B)
headB = c.mask_of('IJKLMNOP')
cap = c.poly([(x + 4, y - 1) for x, y in [(24, 16), (25, 11), (29, 8), (35, 7.5), (40, 10), (42.5, 15), (43, 21), (41, 22), (40, 16), (37, 13.5), (39.5, 16), (39, 16.5), (24.5, 16.5)]])
c.fill(cap, '4'); c.outside(cap, '3', 35, 9, 9, 5); c.fill(cap & c.rect(28, 14, 44, 15), '2'); c.fill(cap & c.rect(28, 13, 44, 13), '5')
c.edge(cap, '1')
pom = c.ellipse(44, 23, 2.3, 2.3)
c.fill(pom, 'k'); c.rim(pom, 'l', -1, -1, 1); c.outside(pom, 'j', 43.6, 22.6, 2.1, 2.1)
c.shift(c.mask_of('12345jkl'), -1)   # the one behind sits a step darker
# ---- in front (person 0): wide awake, left
bodyA = c.poly([(1, 48), (1, 41), (4, 36), (10, 33), (21, 33), (27, 36), (31, 41), (32, 48)])
c.fill(bodyA, '3'); c.outside(bodyA, '2', 12, 39, 17, 12); c.outside(bodyA, '1', 11, 38, 20, 15)
c.rim(bodyA, '4', 0, -1, 2, only='3')
hood = c.poly([(6, 35), (9, 31), (21, 31), (25, 35), (21, 36), (10, 36)])
c.fill(hood, '2'); c.rim(hood, '3', 0, -1, 1); c.fill(c.rect(11, 33, 20, 34), '1')
c.fill(c.rect(11, 28, 19, 32), 'A')
FACE_A = [
    '...BBBBBBBBBBBBAA..',  # 15
    '..BEEEECCCCEEEEBBA.',  # 16
    '..CCCCCCCCCCCCCCBBA',  # 17
    '..CBzzBCCCCBzzBCBBA',  # 18
    '.BCzyzyCDCCzyzyCBBA',  # 19
    '.CCByyBCDCCByyBCBBA',  # 20
    '.CCBAABCDCCBAABCBBA',  # 21
    '.CCCCCCCDCCCCCCCBBA',  # 22
    '.CDDCCCCCDCCCCCCCBA',  # 23
    '.CDCCCCCDDACCCCCCBA',  # 24
    '..CCCCCCBAACCCCCBBA',  # 25
    '..CCCCCCCCCCCCCCBA.',  # 26
    '..BCCCCBzzzBCCCCBA.',  # 27
    '...BCCCCCCCCCCCBA..',  # 28
    '....BBCCDDCCCBBA...',  # 29
    '......AAAAAAAA.....',  # 30
]
assert all(len(r) == 19 for r in FACE_A)
c.put(5, 15, FACE_A)
c.put(4, 21, ['.C', 'CA', 'BA', '.B'])                              # ear
# wild hair, spiking up
hairA = c.poly([(x - 3, y) for x, y in [(8, 20), (7, 15), (6, 11), (9, 12), (9, 7), (12, 9), (14, 4.5), (17, 8), (20, 4), (22, 8.5), (26, 5.5),
                (26, 10), (29.5, 9.5), (28, 14), (28.5, 19), (26.5, 16), (24, 14.5), (19, 15.5), (13, 15), (10, 16.5), (9, 21)]])
c.fill(hairA, 'F'); c.outside(hairA, 'E', 13, 9, 12, 6.5)
c.fill(hairA & c.ellipse(11, 10, 5, 2.5), 'G'); c.fill(hairA & c.ellipse(10, 9.4, 2.5, 1.2), 'H')
c.edge(hairA | c.mask_of('ABCDyz!'), None)
# the mug, held up in both hands, steam rising past the face
mug = c.rect(11, 37, 18, 45)
c.fill(mug, 'k'); c.fill(c.rect(11, 37, 12, 45), 'l'); c.fill(c.rect(17, 37, 18, 45), 'j'); c.fill(c.rect(11, 37, 18, 37), 'i')
c.put(12, 38, ['mmmmm'])
c.put(19, 39, ['jj', '.j', 'jj'])
c.put(9, 40, ['CD', 'CC', 'BC'])
c.put(18, 42, ['DCB', 'CCB'])
PORTRAIT = {'id': 'purple.nightowl', 'name': 'Night Owl', 'kind': 'member', 'sphere': 'purple',
            'people': [{'skin': 'porcelain', 'hair': 'blueblack'}, {'skin': 'tan', 'hair': 'auburn'}], 'accent': 'red',
            'px': c.rows()}
