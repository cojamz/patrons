import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas

# Launderers (colorless, counts as 2): in front, a washerwoman in a red headscarf with a striped towel on her
# shoulder and an apron, grinning; behind, an old bald washerman with a big moustache. Soap bubbles drift up.
c = Canvas()
# ---- behind (person 1): left
bodyB = c.poly([(0, 48), (0, 37), (3, 32.5), (9, 30), (17, 30), (22, 33), (23, 48)])
c.fill(bodyB, '3'); c.outside(bodyB, '2', 9, 35, 12, 8); c.rim(bodyB, '4', 0, -1, 1, only='3')
c.fill(c.rect(9, 26, 15, 30), 'I')
FACE_B = [
    '....LLKKKKJ....',  # 11
    '..KLLLKKKKKKJ..',  # 12
    '.KKLLKKKKKKKKJ.',  # 13
    '.KKKKKKKKKKKKJJ',  # 14
    'MKKKKKKKKKKKKJJ',  # 15
    'MNKNNNKKKNNNKJJ',  # 16
    'MNKzzzKKKzzzKKJ',  # 17
    'NKKy!zKKKz!JKKJ',  # 18
    'NKKJJJKKKJJJKKJ',  # 19
    'JKKKKKKLKKKKKJJ',  # 20
    'JKKKKKKKLLKKKJ.',  # 21
    '.KKKKKKJJIKKKJ.',  # 22
    '.KKOOOOOOOOKJJ.',  # 23
    '.JKNNIIIINNKJ..',  # 24
    '..JKKKLLKKKJJ..',  # 25
    '...JJKKKKJJI...',  # 26
    '.....IIIIII....',  # 27
]
assert all(len(r) == 15 for r in FACE_B)
c.put(5, 11, FACE_B)
c.put(3, 17, ['.K', 'KJ', 'JI'])                                    # ear
c.shift(c.mask_of('12345'), -1)
# ---- in front (person 0): right
body = c.poly([(12, 48), (14, 40), (18, 35), (24, 32.5), (32, 32.5), (39, 35), (43, 40), (45, 48)])
c.fill(body, '3'); c.outside(body, '2', 27, 39, 15, 11); c.outside(body, '1', 25, 38, 19, 14)
c.rim(body, '4', 0, -1, 1, only='3')
apron = c.poly([(22, 38), (34, 38), (35.5, 48), (20.5, 48)])
c.fill(apron, 'k'); c.outside(apron, 'j', 26, 41, 9, 9); c.rim(apron, 'l', -1, 0, 1)
c.fill(c.line(23, 38, 25, 33), 'k'); c.fill(c.line(33, 38, 32, 33), 'j')          # apron straps
c.fill(c.rect(24, 28, 32, 33), 'A')                                                # neck
towel = c.poly([(15.5, 35), (18, 33), (22.5, 32.6), (21.5, 46), (16.5, 46), (17.5, 37)])
c.fill(towel, 'k'); c.outside(towel, 'j', 18, 38, 5, 8); c.rim(towel, 'l', -1, 0, 1)
for y in (37, 38, 42, 43): c.fill(towel & c.rect(0, y, 47, y), 'v' if y in (38, 43) else 'w')
c.edge(towel, 'i')
FACE = [
    '...BCCCCCCCCCBBA.',  # 15
    '..BCDDCCCCCCCBBBA',  # 16
    '.BCDDCCCCCCCCCBBA',  # 17
    '.CFFCCCCFFFFCCBBA',  # 18
    '.CCCCCCCCCCCCCBBA',  # 19
    '.CEEECCCEEEECCBBA',  # 20
    '.C!zyCDCy!zyCCBBA',  # 20b
    'BCCCCDCCCCCCCCBBA',  # 22
    'DDCCDCCCCCCCCCBBA',  # 23
    'BAACCCCCCCCCCBBA.',  # 24
    '.CACCCCCACCCCBBA.',  # 25
    '.CCAzyyzACCCCBBA.',  # 26
    '..CCCDDCCCCCBBA..',  # 27
    '...BCCCCCCCBBA...',  # 28
    '....BBCDDCBBA....',  # 29
    '......AAAAAA.....',  # 30
]
assert all(len(r) == 17 for r in FACE)
c.put(19, 15, FACE)
c.put(35, 20, ['C.', 'BA', 'BA', 'A.'])                             # ear
c.put(32, 16, ['FF', 'EF', '.E', '.E'])                             # hair at the temple
# headscarf: wraps the crown, a fold over the brow, the knot and two ends up on top
scarf = c.poly([(18, 17), (18.5, 12), (21, 9), (26, 7.3), (31, 7.6), (35, 10), (37, 14), (36, 19), (33.5, 16.5), (27, 15.5), (21, 16)])
c.fill(scarf, 'w'); c.outside(scarf, 'v', 25, 11, 10.5, 6.6); c.outside(scarf, 'u', 24, 10, 13, 8.6)
c.fill(scarf & c.ellipse(24, 9.5, 4.5, 2), 'x')
c.fill(scarf & c.poly([(18, 15), (27, 14.2), (34, 15.5), (34, 17), (27, 16), (18, 17)]), 'v')
c.fill(scarf & c.poly([(18, 14), (27, 13.2), (34, 14.5), (34, 15.5), (27, 14.2), (18, 15)]), 'x')
c.put(31, 2, ['...xw..', '..xwwv.', '.xwwvu.', 'uvvwvu.', '.uvvxww', '..uvwwv', '...uuv.'])  # the knot, ends up
# soap bubbles: thin rings, a film you see the doorway through, a glint top-left
def bubble(cx, cy, r):
    disc = c.ellipse(cx, cy, r, r); ring = disc - c.ellipse(cx, cy, r - 1, r - 1)
    c.fill(disc, ':')
    for x, y in ring:
        a = (x + .5 - cx) + (y + .5 - cy)          # < 0 top-left, > 0 bottom-right
        if a < -r * 0.3: c.set(x, y, '"')
        elif a > r * 0.55: c.set(x, y, '^')
    if r > 2: c.set(int(cx - r * .4), int(cy - r * .4), '!')
bubble(40.2, 16.4, 3.4); bubble(42.2, 25.2, 2.1); bubble(39.6, 30.6, 1.6)
PORTRAIT = {'id': 'benders.launderer', 'name': 'Launderers', 'kind': 'member', 'sphere': 'colorless',
            'people': [{'skin': 'fair', 'hair': 'auburn'}, {'skin': 'deep', 'hair': 'grey'}], 'accent': 'red',
            'px': c.rows()}
