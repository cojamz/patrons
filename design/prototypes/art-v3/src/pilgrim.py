import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas

# Pilgrim (yellow), round 3: an elder at peace on the road. Hood up, eyes closed, a long white beard, a scallop shell
# pinned on the cloak, a gourd hung from the staff. 3/4 to our left into the light. Template: 1 person.
c = Canvas()

def seg(rows):
    for y, parts in rows.items():
        for x, s in parts: c.put(x, y, [s])

# ---- cloak: one long diagonal fold, dark under his left arm
cloak = c.poly([(3, 48), (4, 40), (9, 35.5), (17, 33.5), (30, 33.5), (37, 35.5), (42, 40), (44, 48)])
c.fill(cloak, '3'); c.outside(cloak, '2', 18, 38, 17, 11); c.outside(cloak, '1', 16, 37, 23, 15)
c.fill(cloak & c.ellipse(11, 37, 6, 2.6), '4')
c.fill(c.line(12, 37, 21, 47), '1'); c.fill(c.line(13, 37, 22, 47), '4')
c.fill(cloak & c.poly([(33, 40), (42, 40), (44, 48), (35, 48)]), '1')
c.fill(c.rect(19, 27, 28, 32), 'A')
# ---- hood: frames the face, its inner edge in shadow
hood = c.poly([(11.5, 33), (11.5, 18), (13.5, 10), (18.5, 5.5), (25, 4.5), (31.5, 6.5), (35.5, 12), (36.5, 20), (36, 33),
               (32, 34.5), (32, 14), (16, 13.5), (15, 31), (14, 34)])
c.fill(hood, '3'); c.fill(hood & c.ellipse(18, 9, 6, 3.4), '4'); c.outside(hood, '2', 21, 14, 14, 17)
c.inner_edge(hood & c.rect(14, 12, 33, 34), lambda k: '1', sides=((1, 0), (0, 1), (-1, 0)))
# ---- face (x 15..32), eyes closed
seg({
    14: [(16, 'BBBBBBBBBBBBBBBB')],
    15: [(15, 'CDDCCCCCCCCBBBBBB')],
    16: [(15, 'CGGGCCGGGGCBBBBBB')],
    17: [(15, 'CBBBCCBBBBCBBBBBA')],
    18: [(15, 'CzCzCCzCCzCBBBBBA')],
    19: [(15, 'CCzCCCCzzCCBBBBBA')],
    20: [(15, 'CDDCDCCCCCCBBBBBA')],
    21: [(15, 'CDDDBCCCCCCCBBBBA')],
    22: [(15, 'CDDBACCCCCCCBBBBA')],
})
beard = c.poly([(14, 23), (31, 23), (31.5, 27), (29.5, 31), (26, 35), (22.5, 37), (19.5, 34.5), (16, 29.5), (14, 26)])
c.fill(beard, 'G'); c.outside(beard, 'F', 21, 26, 8.5, 9); c.fill(beard & c.ellipse(18, 24, 3.5, 1.5), 'H')
for x0, y0, x1, y1 in ((19, 28, 20, 33), (23, 28, 24, 34), (27, 27, 27, 31)): c.fill(c.line(x0, y0, x1, y1), 'F')
c.put(19, 25, ['AAA']); c.put(15, 23, ['HGGGGGGGF'])
# ---- the scallop shell on the cloak: a fan, three ribs to the hinge
fan = c.ellipse(11, 43, 4, 4) & c.rect(0, 0, 47, 43)
c.fill(fan, 'k'); c.fill(fan & c.ellipse(9.5, 40.5, 2.2, 1.6), 'l')
for tx in (8, 11, 14): c.fill(c.line(tx, 40 if tx != 11 else 39, 11, 44), 'j')
c.put(10, 44, ['jkj', '.j.']); c.edge(fan | c.rect(10, 44, 12, 45), 'i')
# ---- staff with a gourd, his hand
c.fill(c.rect(38, 3, 39, 47), 'r'); c.fill(c.rect(38, 3, 38, 47), 's'); c.fill(c.rect(37, 2, 40, 3), 'r')
gourd = c.ellipse(41.5, 10, 2, 2) | c.ellipse(42, 14.5, 3, 3)
c.fill(gourd, 's'); c.fill(gourd & c.ellipse(41, 13.5, 1.5, 1.5), 'k'); c.outside(gourd, 'r', 41.5, 13.5, 2.8, 4.5)
c.fill(c.line(40, 5, 41, 8), 'q')
c.edge(c.rect(37, 2, 40, 47) | gourd, 'q')
c.put(36, 29, ['.CCD', 'CCCC', 'BCCB', '.BB.'])
PORTRAIT = {'id': 'yellow.pilgrim', 'name': 'Pilgrim', 'kind': 'member', 'sphere': 'yellow',
            'people': [{'skin': 'deep', 'hair': 'white'}], 'accent': 'red', 'px': c.rows()}
