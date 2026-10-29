import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas

# Kingpin (magenta), scene version (Cory, Oct 29: "little scenes"). The same old boss (fedora, noir brim band, jowls,
# grey slicked hair, cigar) now sits behind his desk in a tall leather chair: a brass lamp on the left, banded stacks
# of cash on the right, his two fists resting on the desk top. Setting in wood and brass, lower contrast than him.
c = Canvas()

def seg(rows):
    for y, parts in rows.items():
        for x, s in parts: c.put(x, y, [s])

# ---- the tall chair back (behind everything): a rounded leather slab, lit rim on the left, shadow side on the right
# (critic: arched top, a 1px light rim, a dark inner border, tuft buttons each side of the head)
chair = (c.rect(6, 15, 41, 42) | {(x, y) for (x, y) in c.ellipse(24, 15.5, 18.6, 9.6) if y < 16}) & c.rect(6, 0, 41, 47)
c.fill(chair, 'r')
inner = {(x, y) for (x, y) in chair if all((x + a, y + b) in chair for a in (-2, -1, 0, 1, 2) for b in (-2, -1, 0, 1, 2))}
c.fill(chair - inner, 'q'); c.rim(chair, 's', -1, -1, 1)
c.fill(chair & c.rect(38, 0, 47, 47) & inner, 'q')                                 # shadow side
for y in (17, 22, 27, 32):
    c.set(10, y, 'q'); c.set(36, y, 'q')                                        # tufting buttons
chair0 = [r[:] for r in c.g]
# ---- body (narrower than the portrait: he sits back in the chair)
body = c.poly([(6, 48), (6.5, 40), (8.5, 36.5), (12, 34.5), (16, 33.6), (19, 33), (28, 33), (31, 33.6), (35, 34.5), (38.5, 36.5),
               (40.5, 40), (41, 48)])
c.fill(body, '3'); c.outside(body, '2', 19, 39, 17, 12); c.outside(body, '1', 17, 38, 22, 16)
c.rim(body, '4', 0, -1, 1, only='3')
shirt = c.poly([(19.5, 33), (28.5, 33), (24, 44.5)])
c.fill(shirt, '1')
tie = c.poly([(23, 34), (25.4, 34), (26.6, 41.6), (25, 44.6), (23, 42)])
c.fill(tie, 'c'); c.fill(tie & c.rect(25, 35, 27, 44), 'a')
lapL = c.poly([(14.5, 33.5), (19.5, 33), (23.4, 44.6), (20.6, 44.6), (16, 38.5), (12.5, 35.8)])
lapR = c.poly([(28.5, 33), (33.5, 33.5), (35.5, 35.8), (32, 38.5), (27.4, 44.6), (24.6, 44.6)])
c.fill(lapL, '4'); c.edge(lapL, '1')
c.fill(lapR, '2'); c.rim(lapR, '3', -1, 0, 1); c.edge(lapR, '1')
c.put(20, 33, ['444', '.44', '..4']); c.put(25, 33, ['444', '44.', '4..'])      # collar points
# ---- neck, chin shadow
c.fill(c.rect(19, 29, 28, 33), 'A'); c.fill(c.rect(19, 32, 20, 33), 'B')
# ---- face (same as the live portrait)
seg({
    14: [(14, 'EF'), (16, 'AAAAAAAAAAAAAAAAA')],
    15: [(14, 'EFAAAAAAAAAAAAAAAFEA')],
    16: [(14, 'EFAAAAAAAAAAAAAAAFEA')],
    17: [(14, 'EFAAAEEEEEAAAAEEEAAA')],
    18: [(14, 'EFAAAAzzzzAAAAAzzzAA')],
    19: [(13, 'CC'), (15, 'BAAABz!AAABBA!zBAA')],
    20: [(13, 'CA'), (15, 'BCDDDCCCCCDCBBBBBA')],
    21: [(13, 'CA'), (15, 'BCDDCCCCCCCDCBBBBA')],
    22: [(13, 'CC'), (15, 'BCCCCCCCCCCCDCBBBA')],
    23: [(14, 'BCCCCCCCCCCCAAABBBBA')],
    24: [(14, 'BCCCCCCCCAAAAAABBBBA')],
    25: [(14, 'BCCCCCCCACDDDCBBBBBA')],
    26: [(14, 'BBCCCCCCCCCCCBBBBBBA')],
    27: [(15, 'BBCCCCCDDCCCBBBBBA')],
    28: [(16, 'ABBBCCCCCCBBBBBA')],
    29: [(18, 'AAAAAAAAAAAA')],
})
# the cigar (critic: it read as a long nose): a short stub from the right mouth corner, one row lower, tipping down,
# an ember at the tip, a 2px wisp of smoke above it, a small smirk at its base
c.put(29, 26, ['rss', 'qrrs'])
c.put(32, 27, ['.c']); c.put(32, 28, ['rc'])
c.put(34, 24, ['F', 'F'])
c.put(27, 26, ['AA'])
# ---- fedora
crown = c.poly([(16, 10.5), (16.5, 5), (19, 2.8), (23, 3.3), (24.5, 4.4), (26, 3.3), (30, 2.8), (32.5, 5), (33, 10.5)])
c.fill(crown, 'n'); c.outside(crown, 'm', 22, 6, 10.5, 6)
c.fill(crown & c.rect(0, 8, 47, 9), '3'); c.fill(crown & c.rect(29, 8, 47, 9), '2')
brim = c.poly([(7, 12), (10, 10), (39, 10), (42, 11.5), (40, 13.2), (31, 13.2), (29.5, 14.6), (18.5, 14.6), (17, 13.2), (9, 13.6)])
c.fill(brim, 'm'); c.fill(brim & c.rect(0, 10, 47, 10), 'n')
# ---- desk: a lit top edge, a front panel with one drawer line and two brass pulls
top = c.rect(0, 41, 47, 42)
c.fill(top, 's')
c.fill(c.rect(0, 43, 47, 47), 'r'); c.fill(c.rect(0, 43, 47, 43), 'q')
c.fill(c.rect(23, 44, 24, 47), 'q')
c.put(10, 45, ['cc']); c.put(37, 45, ['cc'])
# ---- his fists on the desk top: knuckle row, curled fingers, thumb on the inside, magenta cuff above
FIST = ['.2222.',
        'CDDCCB',
        'DCCCCB',
        'CCCCBB',
        'CBCBBA']
c.put(11, 36, FIST); c.put(17, 37, ['C', 'B'])
c.put(30, 36, [r[::-1] for r in FIST]); c.put(29, 37, ['D', 'C'])
# ---- brass lamp on the left: dome shade, thin stem, foot
shade = c.poly([(0, 33), (1, 29.5), (4, 28), (9, 28), (12, 29.5), (13, 33)])
c.fill(shade, 'c'); c.fill(shade & c.rect(9, 31, 13, 33), 'a'); c.fill(c.rect(0, 32, 13, 32) & shade, 'a')
c.fill(c.rect(6, 33, 7, 39), 'a'); c.fill(c.rect(6, 33, 6, 38), 'c')
c.fill(c.rect(3, 39, 10, 40), 'a'); c.fill(c.rect(4, 39, 9, 39), 'c')
# ---- banded stacks of cash on the right
def stack(x0, y0, x1):
    m = c.rect(x0, y0, x1, 40)
    c.fill(m, 'w')
    for y in range(y0 + 2, 41, 2): c.fill(c.rect(x0, y, x1, y), 'u')
    c.fill(c.rect(x1, y0 + 1, x1, 40), 'u')
    bx = (x0 + x1) // 2
    c.fill(c.rect(bx - 1, y0, bx, 40), 'c'); c.fill(c.rect(bx, y0 + 1, bx, 40), 'a')
stack(41, 31, 47); stack(35, 35, 42)
# separate the chair from everything in front of it: a 1px dark border where the panel touches him
cp = [(x, y) for (x, y) in chair - c.rect(27, 24, 33, 28) if c.get(x, y) in 'rs' and c.g[y][x] == chair0[y][x] and any((x + a, y + b) not in chair or c.get(x + a, y + b) not in 'qrs'
      for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))) and all(0 <= x + a < 48 for a in (1, -1))]
for (x, y) in cp:
    nb = [c.get(x + a, y + b) for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))]
    if any(c.g[y + b][x + a] != chair0[y + b][x + a] for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= y + b < 48): c.set(x, y, 'q')
PORTRAIT = {'id': 'thieves.kingpin', 'name': 'Kingpin', 'kind': 'member', 'sphere': 'magenta',
            'people': [{'skin': 'fair', 'hair': 'grey'}], 'accent': 'green', 'px': c.rows()}
