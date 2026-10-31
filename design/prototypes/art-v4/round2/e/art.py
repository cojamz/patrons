"""Option E, clean flat shapes: 48x48, no outlines, two tones per material (light from top-left),
round geometric shapes, minimal faces, a soft card-colour tile behind each figure."""
from lib import C

STYLE = {
    'title': 'E  Clean flat shapes  (48x48: no outlines, two tones per material, light from top-left)',
    'short': 'E Clean flat',
    'sub': '48x48, no outlines',
}

N = 48
INK = '#241a1e'      # eyes, mouths
W = ('#f7f2ea', '#d9d2c6')

# skins (light, shadow)
PALE = ('#f4d6c2', '#dfb49b')
LIGHT = ('#efc29c', '#d4a079')
OLIVE = ('#d6a676', '#b78757')
MED = ('#a96c43', '#8b5533')
DEEP = ('#74452b', '#5c3520')
VDEEP = ('#4f2d1e', '#3e2216')


# ---------- shape kit ----------

def inside_rr(x, y, x0, y0, x1, y1, r):
    """Pixel (x,y) inside a rounded rect with corner radius r (inclusive box)."""
    if x < x0 or x > x1 or y < y0 or y > y1:
        return False
    px, py = x + 0.5, y + 0.5
    L, T, R, B = x0, y0, x1 + 1, y1 + 1
    cx = L + r if px < L + r else (R - r if px > R - r else None)
    cy = T + r if py < T + r else (B - r if py > B - r else None)
    if cx is None or cy is None:
        return True
    return (px - cx) ** 2 + (py - cy) ** 2 <= r * r + 0.3


def inside_ell(x, y, x0, y0, x1, y1):
    cx, cy = (x0 + x1 + 1) / 2, (y0 + y1 + 1) / 2
    rx, ry = (x1 - x0 + 1) / 2, (y1 - y0 + 1) / 2
    px, py = x + 0.5, y + 0.5
    return ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1.0 + 0.04


class Shape:
    def __init__(self, test):
        self.test = test

    @staticmethod
    def rr(x0, y0, x1, y1, r):
        return Shape(lambda x, y: inside_rr(x, y, x0, y0, x1, y1, r))

    @staticmethod
    def ell(x0, y0, x1, y1):
        return Shape(lambda x, y: inside_ell(x, y, x0, y0, x1, y1))

    @staticmethod
    def rect(x0, y0, x1, y1):
        return Shape(lambda x, y: x0 <= x <= x1 and y0 <= y <= y1)

    @staticmethod
    def poly(P):
        from lib import _inside
        return Shape(lambda x, y: _inside(x + 0.5, y + 0.5, P))

    def __or__(self, o):
        return Shape(lambda x, y: self.test(x, y) or o.test(x, y))

    def __and__(self, o):
        return Shape(lambda x, y: self.test(x, y) and o.test(x, y))

    def __sub__(self, o):
        return Shape(lambda x, y: self.test(x, y) and not o.test(x, y))

    def shift(self, dx, dy):
        return Shape(lambda x, y: self.test(x - dx, y - dy))


def fill(c, s, k, only=None):
    for y in range(c.h):
        for x in range(c.w):
            if s.test(x, y) and (only is None or c.get(x, y) in only):
                c.px(x, y, k)


def two(c, s, light, dark, sx=2, sy=1):
    """One material: shadow shape on the lower right, light where the shape shifted up-left still covers."""
    lit = s & s.shift(-sx, -sy)
    for y in range(c.h):
        for x in range(c.w):
            if s.test(x, y):
                c.px(x, y, light if lit.test(x, y) else dark)


def tile(c, k):
    fill(c, Shape.rr(1, 1, 46, 46, 10), k)


# ---------- Kingpin ----------

def kingpin():
    c = C(N)
    fill(c, Shape.ell(3, 2, 44, 43), 'z')
    # suit
    body = Shape.rr(5, 35, 42, 56, 9)
    two(c, body, '1', '2', sx=5, sy=0)
    # shirt opening + white tie
    fill(c, Shape.poly([(17, 35), (31, 35), (24, 46)]), 'g')
    fill(c, Shape.poly([(22, 36), (26, 36), (25, 44), (24, 46), (23, 44)]), 'w')
    fill(c, Shape.rect(23, 35, 25, 37), 'w')
    # lapels as shadow wedges
    fill(c, Shape.poly([(14, 35), (19, 35), (24, 47), (22, 47)]), '2')
    fill(c, Shape.poly([(29, 35), (34, 35), (26, 47), (24, 47)]), '2')
    fill(c, Shape.rr(33, 39, 37, 41, 1), 'w')       # pocket square
    # neck
    fill(c, Shape.rect(19, 30, 28, 35), 'A')
    # head
    head = Shape.rr(15, 14, 32, 33, 7)
    two(c, head, 'a', 'A', sx=3, sy=0)
    two(c, Shape.ell(13, 21, 16, 26), 'a', 'A', sx=1, sy=0)
    fill(c, Shape.ell(31, 21, 34, 26), 'A')
    # hat shadow on brow
    fill(c, Shape.rect(15, 15, 32, 16), 'A', only='a')
    # fedora: crown with a centre dent, brim, magenta band
    crown = Shape.rr(16, 6, 31, 14, 4)
    two(c, crown, 'g', 'G', sx=4, sy=0)
    fill(c, Shape.rect(15, 11, 32, 13), '1')
    fill(c, Shape.rect(29, 11, 32, 13), '2')
    two(c, Shape.rr(9, 14, 38, 16, 1), 'g', 'G', sx=4, sy=0)
    # face: heavy brows, narrow eyes, moustache, cigar
    fill(c, Shape.rect(18, 19, 22, 19), 'h')
    fill(c, Shape.rect(26, 19, 30, 19), 'h')
    fill(c, Shape.rect(19, 21, 21, 22), 'k')
    fill(c, Shape.rect(26, 21, 28, 22), 'k')
    fill(c, Shape.rect(24, 24, 24, 25), 'A')        # nose shadow
    fill(c, Shape.rr(20, 27, 28, 28, 1), 'h')       # moustache
    fill(c, Shape.rect(22, 30, 26, 30), 'k')        # flat mouth
    fill(c, Shape.rect(27, 29, 34, 30), 'c')
    fill(c, Shape.rect(35, 29, 35, 30), 'e')
    # smoke: two soft round puffs, no line
    fill(c, Shape.ell(36, 24, 38, 26), 'm')
    fill(c, Shape.ell(37, 19, 40, 22), 'm')
    return c.rows(), {
        'z': '#e8b6cd', 'k': INK, 'w': W[0], '1': '#c2457f', '2': '#97305f',
        'a': OLIVE[0], 'A': OLIVE[1], 'g': '#3d3440', 'G': '#2c252f', 'h': '#2e2320',
        'c': '#7b4a2b', 'e': '#ef7a3c', 'm': '#f3dce6'}


# ---------- Mob ----------

def face(c, x0, y0, x1, y1, skin, eye_y, eyes, mouth_y, mw=4, open_mouth=True):
    two(c, Shape.rr(x0, y0, x1, y1, (x1 - x0) // 2 - 1), skin[0], skin[1], sx=2, sy=0)
    for ex in eyes:
        fill(c, Shape.rect(ex, eye_y, ex, eye_y + 1), 'k')
    cx = (x0 + x1 + 1) / 2
    a = int(cx - mw / 2)
    fill(c, Shape.rect(a, mouth_y, a + mw - 1, mouth_y), 'k')
    if open_mouth:
        fill(c, Shape.rect(a + 1, mouth_y + 1, a + mw - 2, mouth_y + 1), 'k')


def mob():
    c = C(N)
    # back-left fan: open hand up, waving
    two(c, Shape.rr(3, 9, 6, 26, 2), '2', '2')
    two(c, Shape.rr(2, 3, 7, 10, 2) | Shape.rr(0, 6, 2, 9, 1), 'c', 'C', sx=1, sy=0)
    fill(c, Shape.rect(4, 3, 4, 5), 'C'); fill(c, Shape.rect(6, 3, 6, 5), 'C')
    two(c, Shape.rr(4, 21, 19, 40, 6), '2', '2')
    face(c, 6, 9, 16, 21, ('c', 'C'), 14, (9, 13), 18, mw=4)
    fill(c, Shape.rr(6, 7, 16, 11, 3), 'h')
    fill(c, Shape.rect(6, 11, 6, 13), 'h')
    # back-right fan holds the pennant on a straight stick
    fill(c, Shape.rect(43, 2, 44, 18), 'p')
    fill(c, Shape.rect(43, 1, 44, 2), 'p')
    fill(c, Shape.poly([(43, 3), (43, 11), (26, 7)]), 'y')
    fill(c, Shape.poly([(43, 7), (43, 11), (26, 7)]), 'Y')
    fill(c, Shape.rect(40, 4, 42, 10) & Shape.poly([(43, 3), (43, 11), (26, 7)]), '1')
    two(c, Shape.rr(41, 13, 44, 30, 2), '2', '2')
    two(c, Shape.ell(41, 11, 46, 16), 'b', 'B', sx=1, sy=0)
    two(c, Shape.rr(28, 21, 43, 40, 6), '2', '2')
    face(c, 30, 10, 40, 22, ('b', 'B'), 15, (33, 37), 19, mw=4)
    fill(c, Shape.rr(29, 8, 41, 12, 3), 'r')
    fill(c, Shape.rect(29, 12, 29, 15), 'r'); fill(c, Shape.rect(41, 12, 41, 15), 'r')
    # front-left fan: deep skin, round afro
    two(c, Shape.rr(-4, 40, 16, 58, 7), '1', '2', sx=3, sy=0)
    two(c, Shape.ell(-2, 22, 14, 37), 'h', 'h')
    face(c, 0, 27, 12, 40, ('e', 'E'), 32, (3, 9), 36, mw=4)
    fill(c, Shape.rr(0, 26, 12, 29, 2), 'h')
    # front-right fan: olive skin, white bobble hat with a red band
    two(c, Shape.rr(31, 40, 51, 58, 7), '1', '2', sx=3, sy=0)
    face(c, 34, 27, 46, 40, ('a', 'A'), 32, (37, 43), 36, mw=4)
    two(c, Shape.rr(33, 22, 47, 30, 4), 'w', 'W', sx=3, sy=0)
    fill(c, Shape.rect(33, 28, 47, 30), '1')
    two(c, Shape.ell(38, 18, 42, 22), 'w', 'W', sx=1, sy=0)
    # centre fan: light skin, brown hair, scarf, biggest smile
    two(c, Shape.rr(13, 36, 35, 60, 9), '1', '2', sx=4, sy=0)
    fill(c, Shape.rr(17, 36, 31, 39, 2), 'w')
    fill(c, Shape.rect(19, 37, 21, 38), '1'); fill(c, Shape.rect(26, 37, 28, 38), '1')
    face(c, 16, 20, 31, 36, ('d', 'D'), 27, (20, 27), 31, mw=6)
    fill(c, Shape.rect(22, 33, 25, 33), 'k')
    fill(c, Shape.rr(15, 17, 32, 24, 4), 'n')
    fill(c, Shape.rr(15, 23, 17, 28, 1), 'n'); fill(c, Shape.rr(30, 23, 32, 28, 1), 'n')
    fill(c, Shape.rr(15, 17, 32, 22, 4) & Shape.rect(28, 17, 32, 22), 'N')
    return c.rows(), {
        'z': '#efbcae', 'k': INK, 'w': W[0], 'W': W[1], '1': '#d9534a', '2': '#ad3a33',
        'a': OLIVE[0], 'A': OLIVE[1], 'b': PALE[0], 'B': PALE[1], 'c': MED[0], 'C': MED[1],
        'd': LIGHT[0], 'D': LIGHT[1], 'e': DEEP[0], 'E': DEEP[1],
        'h': '#231915', 'r': '#c8622d', 'n': '#6b4429', 'N': '#553420',
        'y': '#f3c94e', 'Y': '#d9a92f', 'p': '#8a5a35'}


# ---------- Tiebreaker ----------

def stripes(c, s, x0, w=3, sx=4):
    lit = s & s.shift(-sx, 0)
    for y in range(c.h):
        for x in range(c.w):
            if s.test(x, y):
                white = ((x - x0) // w) % 2 == 0
                l = lit.test(x, y)
                c.px(x, y, ('w' if l else 'W') if white else ('s' if l else 'S'))


def tiebreaker():
    c = C(N)
    fill(c, Shape.ell(24, 0, 47, 23), 'z')
    # raised forearm (behind the shirt line), fist with thumb up, coin above
    two(c, Shape.rr(36, 25, 40, 40, 2), 'e', 'E', sx=1, sy=0)
    two(c, Shape.rr(34, 19, 42, 27, 3), 'e', 'E', sx=2, sy=0)
    two(c, Shape.rr(34, 16, 37, 21, 1), 'e', 'E', sx=1, sy=0)
    fill(c, Shape.rect(38, 22, 41, 22), 'E')
    two(c, Shape.ell(32, 4, 39, 11), 'o', 'O', sx=2, sy=1)
    fill(c, Shape.rect(35, 6, 36, 9), 'O')
    # striped shirt, short raised sleeve, black collar
    stripes(c, Shape.rr(5, 36, 42, 58, 9), 5)
    fill(c, Shape.rr(17, 34, 29, 38, 2), 's')
    # neck + head
    fill(c, Shape.rect(19, 29, 27, 35), 'E')
    head = Shape.rr(14, 12, 32, 32, 8)
    two(c, head, 'e', 'E', sx=3, sy=0)
    two(c, Shape.ell(13, 20, 15, 25), 'e', 'E', sx=1, sy=0)
    fill(c, Shape.ell(31, 20, 33, 25), 'E')
    # close-cropped hair, straight hairline
    fill(c, Shape.rr(14, 10, 32, 24, 8) & Shape.rect(0, 0, 47, 16), 'h')
    fill(c, Shape.rect(14, 16, 15, 18), 'h'); fill(c, Shape.rect(31, 16, 32, 18), 'h')
    # whistle on the collar
    # face: dark eyes, small smile
    fill(c, Shape.rect(18, 21, 19, 22), 'k')
    fill(c, Shape.rect(26, 21, 27, 22), 'k')
    fill(c, Shape.rect(23, 24, 23, 25), 'E')
    fill(c, Shape.rect(21, 28, 25, 28), 'k')
    fill(c, Shape.rect(20, 27, 20, 27), 'k'); fill(c, Shape.rect(26, 27, 26, 27), 'k')
    return c.rows(), {
        'z': '#d0d2ce', 'k': '#0d0806', 'w': W[0], 'W': W[1], 's': '#2b2a2e', 'S': '#1c1b1f',
        'e': '#5a3423', 'E': '#432619', 'h': '#16100d', 'o': '#f0c33f', 'O': '#c99a25',
        't': '#dfe3e6', 'T': '#a9b0b5'}


# ---------- Launderers ----------

def launderers():
    c = C(N)
    fill(c, Shape.rect(0, 0, 47, 47), 'z')
    # clothesline with a shirt and two bills pegged on it
    fill(c, Shape.rect(4, 5, 43, 5), 'l')
    two(c, Shape.rr(8, 6, 19, 9, 1) | Shape.rr(10, 6, 17, 16, 1), 'u', 'U', sx=3, sy=0)
    fill(c, Shape.rect(13, 6, 14, 6), 'l')
    for x0 in (21, 31):
        two(c, Shape.rr(x0, 6, x0 + 7, 10, 1), 'n', 'N', sx=0, sy=2)
        fill(c, Shape.ell(x0 + 2, 7, x0 + 5, 9), 'N')
        fill(c, Shape.rect(x0 + 1, 4, x0 + 1, 6), 'p'); fill(c, Shape.rect(x0 + 6, 4, x0 + 6, 6), 'p')
    fill(c, Shape.rect(11, 4, 11, 6), 'p'); fill(c, Shape.rect(16, 4, 16, 6), 'p')
    # front-loading washing machine
    two(c, Shape.rr(13, 19, 34, 50, 3), 'w', 'W', sx=4, sy=0)
    fill(c, Shape.rect(13, 23, 34, 23), 'W')
    fill(c, Shape.ell(29, 20, 31, 22), 'q'); fill(c, Shape.rect(16, 21, 21, 21), 'q')
    fill(c, Shape.ell(15, 26, 32, 43), 'q')
    two(c, Shape.ell(17, 28, 30, 41), 'v', 'V', sx=2, sy=2)
    # bills tumbling in the porthole, flat and square to the frame
    for (x0, y0, w, h) in ((19, 31, 6, 3), (23, 36, 6, 3), (25, 30, 3, 5), (19, 35, 3, 4)):
        two(c, Shape.rect(x0, y0, x0 + w - 1, y0 + h - 1), 'n', 'N', sx=0, sy=1)
    # left launderer: medium skin, bun, basket of bills
    two(c, Shape.rr(-6, 30, 13, 56, 7), '1', '2', sx=3, sy=0)
    fill(c, Shape.rect(3, 26, 8, 30), 'A')
    two(c, Shape.rr(0, 14, 11, 28, 5), 'a', 'A', sx=2, sy=0)
    fill(c, Shape.rr(0, 12, 11, 18, 4), 'h'); two(c, Shape.ell(2, 8, 7, 13), 'h', 'h')
    fill(c, Shape.rect(3, 21, 3, 22), 'k'); fill(c, Shape.rect(8, 21, 8, 22), 'k')
    fill(c, Shape.rect(5, 25, 7, 25), 'k')
    # right launderer: pale skin, ginger, arm up pinning a bill
    # raised arm, sleeve rolled to the elbow, hand at the line
    two(c, Shape.rr(39, 21, 44, 36, 2), '3', '4', sx=2, sy=0)
    fill(c, Shape.rect(39, 19, 44, 21), 'x')
    two(c, Shape.rr(40, 10, 43, 19, 1), 'b', 'B', sx=1, sy=0)
    two(c, Shape.rr(39, 5, 44, 10, 2), 'b', 'B', sx=1, sy=0)
    two(c, Shape.rr(29, 30, 52, 56, 7), '3', '4', sx=3, sy=0)
    fill(c, Shape.rect(32, 27, 37, 31), 'B')
    two(c, Shape.rr(29, 14, 39, 29, 5), 'b', 'B', sx=2, sy=0)
    fill(c, Shape.rr(29, 12, 39, 18, 4), 'r'); fill(c, Shape.rect(29, 18, 29, 20), 'r')
    fill(c, Shape.rect(32, 22, 32, 23), 'k'); fill(c, Shape.rect(36, 22, 36, 23), 'k')
    fill(c, Shape.rect(33, 26, 35, 26), 'k')
    two(c, Shape.rr(39, 21, 44, 33, 2), '3', '4', sx=2, sy=0)
    fill(c, Shape.rect(39, 19, 44, 21), 'x')
    # basket in front of left launderer, heaped with bills, hands on the rim
    two(c, Shape.ell(1, 31, 7, 36) | Shape.ell(5, 30, 12, 35) | Shape.ell(-1, 33, 4, 37), 'n', 'N', sx=1, sy=1)
    fill(c, Shape.rect(3, 33, 5, 33), 'N'); fill(c, Shape.rect(8, 32, 10, 32), 'N')
    bask = Shape.rr(-2, 35, 13, 47, 2)
    for y in range(35, 48):
        for x in range(0, 14):
            if bask.test(x, y):
                c.px(x, y, 'g' if (y - 35) % 3 else 'G')
    fill(c, Shape.rect(-2, 35, 13, 36) & bask, 'g')
    fill(c, Shape.rect(9, 27, 13, 29), 'x')
    two(c, Shape.rr(10, 29, 13, 37, 1), 'a', 'A', sx=1, sy=0)
    two(c, Shape.rr(9, 35, 13, 39, 1), 'a', 'A', sx=1, sy=0)
    return c.rows(), {
        'z': '#dadcd8', 'k': INK, 'w': W[0], 'W': W[1], 'l': '#6c6f70', 'p': '#b98a55',
        'u': '#7fb2d8', 'U': '#5c8fb8', 'n': '#7fbf6a', 'N': '#4f8f45',
        'q': '#7d8386', 'v': '#cfe6ef', 'V': '#a9cbd9',
        '1': '#8d9592', '2': '#6f7774', '3': '#6c7a84', '4': '#56626b',
        'a': MED[0], 'A': MED[1], 'b': PALE[0], 'B': PALE[1], 'h': '#231915', 'r': '#c8622d',
        'g': '#d8b077', 'G': '#b88e55', 'x': '#b9c0bd'}


PORTRAITS = [
    ('kingpin', 'Kingpin', kingpin),
    ('mob', 'Mob', mob),
    ('tiebreaker', 'Tiebreaker', tiebreaker),
    ('launderers', 'Launderers', launderers),
]
