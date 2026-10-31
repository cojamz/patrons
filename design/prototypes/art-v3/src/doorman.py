import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas

# Doorman (blue), round 3: the gatekeeper of a good club. Top hat, greatcoat, white gloves, arms folded, looking you
# over. Stern and level (both eyes the same), grey walrus moustache. 3/4 to our left. Template: 1 person.
c = Canvas()

def seg(rows):
    for y, parts in rows.items():
        for x, s in parts: c.put(x, y, [s])

# ---- greatcoat: sloped shoulders, the upper arms down the sides
body = c.poly([(2, 48), (3, 40), (8, 35.5), (17, 33.5), (30, 33.5), (39, 35.5), (44, 40), (45, 48)])
c.fill(body, '3'); c.outside(body, '2', 20, 37, 19, 11); c.outside(body, '1', 18, 37, 24, 15)
c.rim(body, '4', 0, -1, 1, only='3')
c.fill(c.line(8, 38, 9, 44), '2'); c.fill(c.line(39, 38, 38, 44), '1')               # where the arms meet the coat
# ---- folded arms: forearms crossing at a slant, each glove gripping the other arm near the elbow
c.fill(body & c.rect(8, 36, 39, 47), '1'); c.fill(body & c.rect(8, 36, 39, 37), '2')   # the chest, in the arms' shadow
c.fill(c.line(7, 36, 6, 47), '1'); c.fill(c.line(40, 36, 41, 47), '1')           # the upper arms' inner edges
low = c.poly([(9, 43), (35, 40.5), (38, 41.5), (37.5, 45), (10, 47)])
c.fill(low, '3'); c.rim(low, '4', 0, -1, 1); c.edge(low, '1')
up = c.poly([(9, 38.5), (13, 37), (36, 40.6), (35, 44), (11, 42.6)])
c.fill(up, '3'); c.rim(up, '4', 0, -1, 2); c.edge(up, '1')
c.put(34, 38, ['.llk.', 'lkkki', 'kkkki', '.kiii', '..ii.'])                        # his left glove on his right arm
c.put(5, 39, ['.llk', 'lkkk', 'kkki', 'kkii', '.ii.'])                             # his right glove on his left arm
# ---- neck and collar
c.fill(c.rect(19, 28, 27, 32), 'A'); c.fill(c.rect(19, 30, 20, 32), 'B')
collar = c.poly([(16, 30.5), (20, 30), (23.5, 31.5), (27, 30), (31, 30.5), (32, 35), (27, 36.5), (20, 36.5), (15, 35)])
c.fill(collar, '2'); c.rim(collar, '3', 0, -1, 1); c.edge(collar, '1')
c.put(22, 32, ['kkk', '.k.'])                                        # white stock at the throat
# ---- face (x 15..32), stern and level
seg({
    14: [(15, 'BBBBBBBBBBBBAAAAAA')],
    15: [(15, 'CCCCCCCCCCCCBGFBAA')],
    16: [(15, 'CDDCCCCCCCCCBGFBAA')],
    17: [(15, 'CFFFCCFFFFFCBGFBAA')],
    18: [(15, 'BzzBCBzzzBBCBFFBBA')],
    19: [(15, 'CzyBCCzyyBCBFBBBBA')],
    20: [(15, 'CCCCDCBCCCCCBBBBBA')],
    21: [(15, 'CDDDBCCCCCCCBBBBBA')],
    22: [(15, 'CDDBACCCCCCCBBBBBA')],
    23: [(15, 'FGGGGGGFFCCCBBBBBA')],
    24: [(14, 'FGGGGGGFFFCCBBBBA')],
    25: [(14, 'FF'), (16, 'ABBBAFFCCBBBBA')],
    26: [(15, 'BCCCDDCCCCCBBBA')],
    27: [(16, 'BBCCCCCCCBBBA')],
    28: [(17, 'ABBBBBBBBAA')],
})
c.put(31, 18, ['BA', 'BA', 'BA', 'A.'])                               # ear, on the shadow side
# ---- top hat: tall crown, blue band, curled brim
crown = c.poly([(17, 11), (16.5, 1), (32.5, 0.5), (32, 11)])
c.fill(crown, 'n'); c.fill(crown & c.rect(17, 0, 20, 11), 'o'); c.fill(crown & c.rect(29, 0, 33, 11), 'm')
c.fill(crown & c.rect(0, 8, 47, 10), '3'); c.fill(crown & c.rect(29, 8, 47, 10), '2'); c.fill(crown & c.rect(0, 8, 47, 8), '4')
brim = c.poly([(11.5, 11), (14, 12), (35, 12), (37.5, 11), (36.5, 13.6), (12.5, 13.6)])
c.fill(brim, 'n'); c.fill(brim & c.rect(0, 11, 47, 12), 'o'); c.fill(brim & c.rect(30, 12, 47, 13), 'm')
PORTRAIT = {'id': 'market.doorman', 'name': 'Doorman', 'kind': 'member', 'sphere': 'blue',
            'people': [{'skin': 'tan', 'hair': 'grey'}], 'accent': 'red', 'px': c.rows()}
