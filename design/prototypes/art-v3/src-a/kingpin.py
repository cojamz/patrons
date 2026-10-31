import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas

# Kingpin (magenta), round 2, face by hand. An old boss in a fedora: the brim throws a noir band over his eyes (two
# glints), jowls, a C-shaped ear, grey hair slicked back, a cigar in the right corner of a flat, unimpressed mouth.
# Padded shoulders, peaked lapels as clean diagonals, white collar points, gold tie (batch a polish: the knot no
# longer reads as a crossbar; the tie tapers and leans). Template: 1 person.
c = Canvas()

def seg(rows):
    for y, parts in rows.items():
        for x, s in parts: c.put(x, y, [s])

# ---- body
body = c.poly([(1, 48), (1, 40), (3, 36.5), (7, 34.5), (14, 33.6), (19, 33), (28, 33), (33, 33.6), (40, 34.5), (44, 36.5),
               (46, 40), (46, 48)])
c.fill(body, '3'); c.outside(body, '2', 17, 39, 21, 13); c.outside(body, '1', 15, 38, 26, 17)
c.rim(body, '4', 0, -1, 1, only='3')
c.fill(c.line(8, 41, 10, 47), '2')                                   # one fold under the arm
shirt = c.poly([(19.5, 33), (28.5, 33), (24, 44.5)])
c.fill(shirt, '1')
tie = c.poly([(23, 34), (25.4, 34), (26.6, 41.6), (25, 44.6), (23, 42)])      # knot and blade one taper, angled: no crossbar
c.fill(tie, 'c'); c.fill(tie & c.rect(25, 35, 27, 44), 'b')
lapL = c.poly([(14.5, 33.5), (19.5, 33), (23.4, 44.6), (20.6, 44.6), (16, 38.5), (12.5, 35.8)])
lapR = c.poly([(28.5, 33), (33.5, 33.5), (35.5, 35.8), (32, 38.5), (27.4, 44.6), (24.6, 44.6)])
c.fill(lapL, '4'); c.edge(lapL, '1')
c.fill(lapR, '2'); c.rim(lapR, '3', -1, 0, 1); c.edge(lapR, '1')
c.put(20, 33, ['kkk', '.kk', '..k']); c.put(25, 33, ['kkk', 'kk.', 'k..'])      # collar points
# ---- neck, chin shadow on it
c.fill(c.rect(19, 29, 28, 33), 'A'); c.fill(c.rect(19, 32, 20, 33), 'B')
# ---- face (x 15..32), 3/4 to our right
seg({
    14: [(14, 'EF'), (16, 'FAAAAAAAAAAAAAAAA')],
    15: [(14, 'EFFAAAAAAAAAAAAAAAAA')],
    16: [(14, 'FFFAAAAAAAAAAAAAAAAA')],
    17: [(14, 'EFFAAEEEEEAAAAEEEAAA')],
    18: [(14, 'EFAAAAzzzzAAAAAzzzAA')],
    19: [(13, 'CC'), (15, 'BAAABz!AAABBA!zBAA')],
    20: [(13, 'CA'), (15, 'BCDDDCCCCCDCBBBBBA')],
    21: [(13, 'CA'), (15, 'BCDDCCCCCCCDCBBBBA')],
    22: [(13, 'CC'), (15, 'BCCCCCCCCCCCDCBBBA')],
    23: [(14, 'BCCCCCCCCCCCAAABBBBA')],
    24: [(14, 'BCCCCCCCCAAAAAAssss'), (33, 'ssk')],
    25: [(14, 'BCCCCCCCACDDDCBrrrr'), (33, 'rrk')],
    26: [(14, 'BBCCCCCCCCCCCBBBBBBA')],
    27: [(15, 'BBCCCCCDDCCCBBBBBA')],
    28: [(16, 'ABBBCCCCCCBBBBBA')],
    29: [(18, 'AAAAAAAAAAAA')],
})
c.put(35, 19, ['.k', 'kk']); c.put(37, 15, ['kk', 'k.'])          # smoke, two soft puffs
# ---- fedora
crown = c.poly([(16, 10.5), (16.5, 5), (19, 2.8), (23, 3.3), (24.5, 4.4), (26, 3.3), (30, 2.8), (32.5, 5), (33, 10.5)])
c.fill(crown, 'o'); c.outside(crown, 'n', 22, 6, 10.5, 6)
c.fill(crown & c.rect(0, 8, 47, 9), '3'); c.fill(crown & c.rect(29, 8, 47, 9), '2')
brim = c.poly([(7, 12), (10, 10), (39, 10), (42, 11.5), (40, 13.2), (31, 13.2), (29.5, 14.6), (18.5, 14.6), (17, 13.2), (9, 13.6)])
c.fill(brim, 'n'); c.fill(brim & c.rect(0, 10, 47, 10), 'o'); c.fill(brim & c.rect(0, 13, 47, 14), 'm')
PORTRAIT = {'id': 'thieves.kingpin', 'name': 'Kingpin', 'kind': 'member', 'sphere': 'magenta',
            'people': [{'skin': 'fair', 'hair': 'grey'}], 'accent': 'orange', 'px': c.rows()}
