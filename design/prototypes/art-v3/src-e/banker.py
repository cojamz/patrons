import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas

# Banker (gold), round 1. A distinguished bank manager in her fifties: a sleek silver bob swept from a side part,
# level and quietly proud, a closed smile. Gold double-breasted jacket, white blouse collar. Prop: a neat stack of
# gold coins at her shoulder (the +3 every round). Frontal. Template: 1 person.
c = Canvas()

def seg(rows):
    for y, parts in rows.items():
        for x, s in parts: c.put(x, y, [s])

# ---- body: sloped shoulders, double-breasted jacket
body = c.poly([(1, 48), (2, 40), (6, 36), (14, 34), (19, 33.4), (28, 33.4), (33, 34), (41, 36), (45, 40), (46, 48)])
c.fill(body, '3'); c.outside(body, '2', 18, 38, 21, 13); c.outside(body, '1', 16, 37, 27, 17)
c.rim(body, '4', 0, -1, 1, only='3')
c.fill(c.line(7, 40, 8, 47), '2')
blouse = c.poly([(19.5, 33), (28.5, 33), (24, 41.5)])
c.fill(blouse, 'k')
c.fill(blouse & c.rect(25, 33, 30, 47), 'k')
lapL = c.poly([(14.5, 33.8), (19.5, 33.2), (24.3, 42.5), (21.5, 43.5), (16, 38), (12.8, 36)])
lapR = c.poly([(28.5, 33.2), (33.5, 33.8), (35, 36), (31.5, 38.5), (26, 43.5), (24.5, 42.5)])
c.fill(lapL, '4'); c.rim(lapL, '5', 1, 0, 1); c.edge(lapL, '1')
c.fill(lapR, '2'); c.rim(lapR, '3', -1, 0, 1); c.edge(lapR, '1')
for (x, y) in ((21, 45), (27, 45)): c.put(x, y, ['dc', 'ca'])          # two buttons
# ---- neck, chin shadow on it
c.fill(c.rect(21, 28, 27, 33), 'B'); c.fill(c.rect(21, 28, 27, 29), 'A'); c.fill(c.rect(26, 30, 27, 33), 'A')
c.put(21, 33, ['k', '.']); c.put(26, 33, ['kk', 'k.'])
# ---- head: hair sides x14..16 and x31..33, face x17..30. Side part over her right eye, the fringe sweeps across.
L = {8: ".......FGGGGGGF.....", 9: ".....FGHHHGGGGGGF...", 10: "....FGHHHGGGGGGGGF..", 11: "...FGHHGGGFGGGGGGFF.",
     12: "..FGHHGGGFFGGGGGGGFF"}
for y, r in L.items(): c.put(14, y, [r])
F = {
    13: ("FGH", "GGGFCCFHHHGGGG", "FFE"),
    14: ("FGH", "GGFCDDCFFHHGGF", "GFE"),
    15: ("FHG", "GFCDDDDCBFFHGF", "GFE"),
    16: ("FHG", "FCDDDCCCCCBFFF", "GFE"),
    17: ("FHF", "CEEEECCCCEEEBF", "GFE"),
    18: ("FGF", "BzzzzBCDBzzzBB", "FGE"),
    19: ("FGF", "Byz!yCCDCyz!BA", "FGE"),
    20: ("FGF", "CCBBCCCDBCBBBA", "FGE"),
    21: ("FGF", "CDDDCCCDBCCCBA", "FGE"),
    22: ("FGF", "CDDDCCCDBCCCBA", "FGE"),
    23: ("FGF", "CCCCCCDDBBCCBA", "FGE"),
    24: ("FGF", "BCCCCCAACCCCBA", "FGE"),
    25: ("EGF", "BCCCACCCCACCBA", "FGE"),
    26: (".FF", "EBCCCAAAACCBAE", "FE."),
    27: (".EF", "EABCCDDDCCBAAE", "E.."),
    28: ("...", "...ABBBBBBA...", "..."),
}
for y, (a, m, b) in F.items(): c.put(14, y, [a + m + b])
# hair: strand clusters down the sides and across the fringe (dark gaps between locks, light on the top-left)
c.fill(c.line(18, 10, 15, 16) | c.line(16, 17, 16, 24), 'F'); c.fill(c.line(28, 9, 32, 14) | c.line(32, 15, 32, 24), 'E')
c.fill(c.line(23, 13, 29, 15), 'F'); c.fill(c.line(21, 10, 25, 9), 'H')
# a warm light on the forehead and cheekbone
c.put(19, 14, ['t']); c.put(19, 15, ['tt']); c.put(18, 21, ['tt']); c.put(18, 22, ['t'])
# ---- the prop: a short stack of gold coins on her palm at mid-chest, each coin rimmed dark so the stack reads
coins = c.rect(30, 35, 36, 44)
c.fill(coins, 'c')
c.put(30, 35, ['.dd!dd.', 'dddddcc'])
for y in (37, 39, 41, 43): c.put(30, y, ['acccccb'[:6] + 'a', 'aaaaaaa'])
c.edge(coins, '1')
c.put(29, 44, ['BCCCCCCCB', 'ABCCCCCBA', '.AABBBAA.'])                  # her palm under the stack
c.put(28, 41, ['CD', 'BC', 'BC'])                                       # her thumb on its side
PORTRAIT = {'id': 'gold.banker', 'name': 'Banker', 'kind': 'member', 'sphere': 'gold',
            'people': [{'skin': 'deep', 'hair': 'grey'}], 'accent': 'red', 'px': c.rows()}
