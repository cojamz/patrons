"""Option E, graphic poster: 64x64 screenprint. At most 8 flat colours per portrait, big colour-block
backgrounds with a clear horizon, figures as simple confident shapes, dot-eye faces, one flat shadow block."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from lib import C

STYLE = {
    'title': 'E  Graphic poster  (64x64: screenprint, 8 colours max, colour-block setting, dot faces)',
    'short': 'E Graphic poster',
    'sub': '64x64, 8 colours',
}

N = 64


def head(c, x0, y0, w, h, k):
    """Rounded block head (corners clipped)."""
    x1, y1 = x0 + w - 1, y0 + h - 1
    c.rect(x0, y0 + 1, x1, y1 - 1, k)
    c.hl(x0 + 1, x1 - 1, y0, k)
    c.hl(x0 + 1, x1 - 1, y1, k)


# ---------------------------------------------------------------- Kingpin
def kingpin():
    c = C(N)
    pal = {'k': '#1e1620', 'p': '#4a2547', 'm': '#c2457f', 'w': '#f4e9d4', 'y': '#f2c94c',
           'g': '#6fa85a', 'b': '#7a4a2c', 's': '#d9a070'}
    c.rect(0, 0, 63, 63, 'p')                                   # plum wall
    # window with blinds: lamp-yellow slats of street light
    c.rect(36, 3, 61, 37, 'k')
    for y in range(5, 36, 4):
        c.rect(38, y, 59, y + 1, 'y')
    # figure: shoulders and suit
    c.poly([(8, 48), (11, 35), (18, 31), (40, 31), (47, 35), (50, 48)], 'm')
    c.poly([(37, 31), (40, 31), (47, 35), (50, 48), (39, 48)], 'p', only='m')   # one flat shadow block
    c.poly([(24, 31), (34, 31), (29, 40)], 'w')                  # shirt V
    c.poly([(28, 32), (30, 32), (31, 39), (29, 41), (27, 39)], 'k')  # tie
    c.rect(25, 28, 33, 31, 's')                                  # neck
    head(c, 21, 15, 17, 15, 's')
    c.rect(20, 20, 20, 23, 's'); c.rect(38, 20, 38, 23, 's')     # ears
    # fedora: low crown with a dent, magenta band, wide brim
    c.rect(22, 7, 36, 13, 'k'); c.hl(23, 35, 6, 'k'); c.hl(24, 34, 5, 'k')
    c.hl(27, 31, 5, 'p')                                         # dent in the crown
    c.rect(22, 11, 36, 12, 'm')                                  # band
    c.rect(16, 14, 42, 15, 'k'); c.hl(15, 15, 15, 'k'); c.px(43, 15, 'k')
    c.hl(22, 36, 16, 'b')                                        # brim shadow on brow
    # face: dot eyes, smirk, cigar
    c.hl(24, 27, 19, 'k'); c.hl(31, 34, 19, 'k')                # heavy brows
    c.rect(25, 21, 26, 21, 'k'); c.rect(32, 21, 33, 21, 'k')     # narrowed eyes
    c.hl(27, 31, 25, 'k'); c.px(32, 24, 'k')
    c.rect(32, 25, 39, 26, 'b'); c.rect(40, 25, 40, 26, 'y')
    # desk: top surface, then front
    c.rect(0, 46, 63, 54, 'b')
    c.rect(0, 55, 63, 63, 'k')
    c.rect(14, 58, 19, 58, 'y'); c.rect(44, 58, 49, 58, 'y')     # brass pulls
    # hands resting on the desk top
    c.rect(13, 44, 21, 48, 'm'); c.rect(37, 44, 45, 48, 'p')
    c.rect(21, 45, 25, 48, 's'); c.rect(33, 45, 37, 48, 's')
    c.px(25, 45, 'b'); c.px(33, 45, 'b')                         # rounded knuckles
    c.rect(23, 46, 23, 47, 'y')                                  # gold ring
    # banker's lamp, left: pool of light on the desk, brass stem, green shade
    c.rect(3, 48, 12, 50, 'y'); c.hl(4, 11, 47, 'y')              # brass base
    c.rect(7, 39, 8, 47, 'y')                                    # stem
    c.poly([(0, 40), (2, 34), (14, 34), (16, 40)], 'g')
    c.hl(1, 15, 40, 'y')                                         # lit rim
    c.hl(3, 12, 51, 'k')                                         # shadow under base
    # cash stacks, right, on the desk top
    for x0, y0 in ((46, 36), (54, 40)):
        c.rect(x0, y0, x0 + 8, 50, 'g')
        for y in range(y0 + 2, 51, 3):
            c.hl(x0, x0 + 8, y, 'k')
        c.rect(x0 + 3, y0, x0 + 4, 50, 'w')                      # paper band
    return c.rows(), pal


# ---------------------------------------------------------------- Mob
def mob():
    c = C(N)
    pal = {'o': '#e8874a', 'y': '#f8d977', 'r': '#a8302c', 'p': '#4b2f4f', 'k': '#1f1820',
           'a': '#f6d2b0', 'm': '#a4623a', 'd': '#5a3322'}
    c.rect(0, 0, 63, 63, 'o')                                   # dusk sky
    c.ell(42, 2, 59, 19, 'y')                                    # big rising moon
    # village roofline on the horizon, lit windows
    c.rect(0, 40, 63, 63, 'k')
    for x0, w, top in ((0, 9, 33), (10, 12, 30), (24, 8, 35), (34, 14, 31), (50, 13, 34)):
        mid = x0 + w // 2
        c.poly([(x0, 41), (x0, top + 4), (mid, top), (x0 + w, top + 4), (x0 + w, 41)], 'k')
    for x, y in ((4, 38), (14, 36), (19, 36), (28, 39), (38, 37), (43, 37), (56, 38)):
        c.rect(x, y, x + 1, y + 1, 'y')

    def body(x0, x1, y0, k, sh=None):
        c.poly([(x0, 64), (x0 + 1, y0 + 3), (x0 + 4, y0), (x1 - 4, y0), (x1 - 1, y0 + 3), (x1, 64)], k)

    # ---- back row
    body(12, 27, 31, 'p')
    head(c, 15, 18, 10, 12, 'a')                                 # blond, shouting
    c.rect(15, 16, 24, 19, 'y'); c.hl(16, 23, 15, 'y'); c.vl(14, 18, 23, 'y'); c.vl(25, 18, 23, 'y')
    c.px(17, 22, 'k'); c.px(22, 22, 'k')
    c.rect(19, 25, 20, 27, 'k')                                  # oval shout
    body(37, 52, 30, 'r')
    head(c, 40, 18, 10, 12, 'm')                                 # mid, bun, shouting
    c.rect(40, 16, 49, 19, 'k'); c.hl(41, 48, 15, 'k'); c.rect(43, 12, 46, 14, 'k')
    c.vl(40, 20, 22, 'k'); c.vl(49, 20, 22, 'k')
    c.px(42, 22, 'k'); c.px(47, 22, 'k')
    c.rect(44, 25, 45, 27, 'k')
    # back-right's pitchfork across the moon
    c.vl(52, 4, 30, 'k')
    c.hl(49, 55, 9, 'k')
    for x in (49, 52, 55):
        c.vl(x, 3, 9, 'k')
    c.rect(49, 18, 50, 21, 'r')                                  # sleeve
    c.rect(50, 18, 54, 22, 'm'); c.px(51, 18, 'd'); c.px(53, 18, 'd')   # fist round the shaft
    c.vl(52, 18, 22, 'm')

    # ---- front row
    body(1, 19, 42, 'p')
    head(c, 6, 29, 11, 12, 'm')                                  # mid, flat cap, shouting
    c.rect(6, 27, 16, 30, 'k'); c.hl(7, 15, 26, 'k'); c.hl(14, 19, 30, 'k')
    c.px(9, 33, 'k'); c.px(14, 33, 'k')
    c.rect(11, 36, 12, 38, 'k')
    # his pitchfork, left edge
    c.vl(4, 5, 50, 'k')
    c.hl(1, 7, 11, 'k')
    for x in (1, 4, 7):
        c.vl(x, 4, 11, 'k')
    c.rect(2, 22, 5, 41, 'p')                                    # raised sleeve
    c.rect(2, 19, 6, 23, 'm'); c.px(3, 19, 'd'); c.px(5, 19, 'd')   # fist round the shaft
    c.vl(4, 19, 23, 'm')

    body(46, 63, 42, 'p')
    head(c, 50, 29, 11, 12, 'd')                                 # deep, steady, beside them
    c.rect(50, 27, 60, 30, 'k'); c.hl(51, 59, 26, 'k')
    c.hl(52, 54, 32, 'm'); c.hl(56, 58, 32, 'm')                 # lit brow
    c.px(53, 33, 'k'); c.px(57, 33, 'k')
    c.hl(54, 56, 37, 'k')

    # lead: light, centre, shouting, torch high
    body(21, 42, 37, 'r')
    c.poly([(30, 37), (34, 37), (32, 41)], 'p')                  # collar
    head(c, 26, 22, 13, 15, 'a')
    c.rect(26, 20, 38, 23, 'k'); c.hl(27, 37, 19, 'k'); c.vl(26, 24, 26, 'k'); c.vl(38, 24, 25, 'k')
    c.px(29, 26, 'k'); c.px(30, 27, 'k'); c.px(35, 26, 'k'); c.px(34, 27, 'k')   # angry brows
    c.rect(29, 28, 30, 29, 'k'); c.rect(34, 28, 35, 29, 'k')
    c.rect(31, 32, 33, 34, 'k'); c.px(31, 32, 'a'); c.px(33, 32, 'a'); c.px(31, 34, 'a'); c.px(33, 34, 'a')
    c.hl(31, 33, 32, 'k'); c.px(32, 35, 'k')
    # raised arm and torch
    c.poly([(21, 40), (21, 19), (25, 19), (26, 40)], 'r')
    c.vl(22, 8, 22, 'k'); c.vl(23, 8, 22, 'k')
    c.rect(20, 14, 25, 18, 'a')                                  # fist round the shaft
    c.px(22, 14, 'k')
    c.poly([(18, 8), (19, 3), (22, -1), (24, 1), (27, 4), (27, 8)], 'r')
    c.poly([(20, 8), (21, 4), (23, 2), (25, 5), (25, 8)], 'y')
    return c.rows(), pal


# ---------------------------------------------------------------- Tiebreaker
def tiebreaker():
    c = C(N)
    pal = {'b': '#8fc6d8', 'g': '#5c9e45', 'G': '#467f36', 'w': '#f2efe6', 'k': '#17141a',
           's': '#33190f', 'l': '#5c3322', 'y': '#f0bf3e'}
    c.rect(0, 0, 63, 63, 'b')                                   # sky
    # pitch: mown bands widening toward us
    c.rect(0, 38, 63, 63, 'g')
    y = 38
    for i, h in enumerate((2, 3, 4, 5, 6, 7)):
        if i % 2:
            c.rect(0, y, 63, y + h - 1, 'G')
        y += h
    # far goal, left
    c.vl(2, 25, 38, 'w'); c.vl(15, 25, 38, 'w'); c.hl(2, 15, 25, 'w')
    c.hl(0, 63, 38, 'w')                                         # goal line
    # referee body: striped shirt
    c.poly([(10, 64), (11, 47), (15, 42), (43, 42), (47, 47), (48, 64)], 'w')
    for x in range(10, 49):
        if (x - 11) % 6 >= 3:
            c.recolor('w', 'k', (x, 42, x, 63))
    c.poly([(24, 42), (34, 42), (29, 47)], 'k')                  # black collar
    c.rect(25, 37, 33, 42, 's')                                  # neck
    # head: very deep skin, lit from the left
    head(c, 21, 20, 17, 18, 'l')
    c.poly([(35, 20), (38, 20), (38, 37), (33, 37), (35, 35)], 's', only='l')   # one flat shadow block
    c.rect(20, 27, 20, 31, 'l'); c.rect(38, 27, 38, 31, 's')     # ears
    c.rect(21, 17, 37, 22, 'k'); c.hl(22, 36, 16, 'k')          # short flat-top hair
    c.px(21, 23, 'k'); c.px(37, 23, 'k')
    c.rect(25, 27, 26, 28, 'k'); c.rect(32, 27, 33, 28, 'k')     # dot eyes
    c.px(26, 33, 'k'); c.hl(27, 31, 34, 'k'); c.px(32, 33, 'k')  # closed smile
    # left arm down at his side
    c.poly([(10, 64), (11, 47), (14, 44), (16, 64)], 'k')
    # right arm raised (screen right), striped sleeve, forearm, fist, thumb flicking
    c.rect(43, 29, 48, 47, 'w'); c.rect(44, 29, 45, 47, 'k'); c.rect(48, 29, 48, 47, 'k')
    c.rect(43, 19, 47, 29, 'l'); c.rect(46, 19, 47, 29, 's')
    c.rect(42, 13, 48, 19, 'l'); c.vl(48, 13, 19, 's')           # fist
    c.hl(42, 47, 16, 's')                                        # curled-finger line
    c.rect(41, 13, 41, 15, 'l')
    c.rect(41, 9, 43, 12, 'l'); c.px(43, 9, 'b')                 # thumb up, mid-flick
    # the coin: a clean gold disc just off the thumb
    c.ell(37, 0, 45, 7, 'y')
    return c.rows(), pal


# ---------------------------------------------------------------- Launderers
def launderers():
    c = C(N)
    pal = {'t': '#8fb3b0', 'T': '#3f5f63', 'w': '#f3eee4', 'g': '#6ea95a', 'G': '#3d6b3a',
           'k': '#1f1a1c', 'a': '#efc39c', 'd': '#6a3e27'}
    c.rect(0, 0, 63, 63, 't')                                   # laundromat wall
    c.rect(0, 55, 63, 63, 'T')                                   # floor
    # clothesline with a shirt and two banknotes pegged
    c.hl(0, 63, 4, 'k')

    def bill(x0, y0, w=11, h=6):
        c.rect(x0, y0, x0 + w - 1, y0 + h - 1, 'g')
        c.rect(x0 + w // 2 - 1, y0 + 2, x0 + w // 2 + 1, y0 + h - 3, 'G')
        c.px(x0 + 1, y0 + 1, 'G'); c.px(x0 + w - 2, y0 + h - 2, 'G')
    c.poly([(2, 5), (14, 5), (17, 9), (14, 11), (14, 19), (2, 19), (2, 11), (-1, 9)], 'w')   # tee
    c.hl(6, 10, 5, 't')                                          # neck hole
    bill(22, 5); bill(37, 5); bill(51, 5)
    for x in (3, 13, 23, 31, 38, 46, 52, 60):
        c.vl(x, 3, 6, 'T')                                       # pegs
    # washer, left: control strip, knob, round porthole full of bills
    c.rect(0, 24, 21, 58, 'w')
    c.vl(21, 24, 58, 'T')   # flat shadow side
    c.hl(0, 21, 29, 'T')
    c.rect(2, 26, 7, 27, 'T'); c.rect(16, 25, 18, 27, 'k')
    c.ell(1, 32, 19, 50, 'T')
    c.ell(4, 35, 16, 47, 'k')
    c.rect(5, 39, 9, 41, 'g'); c.px(7, 40, 'G')
    c.rect(10, 42, 14, 44, 'g'); c.px(12, 43, 'G')
    c.rect(9, 36, 12, 37, 'G')
    # person A, light skin, short bob, teal work shirt
    c.poly([(23, 56), (24, 37), (27, 34), (38, 34), (41, 37), (42, 56)], 'T')
    c.rect(29, 31, 35, 34, 'a')
    head(c, 26, 18, 13, 14, 'a')
    c.rect(26, 16, 38, 20, 'k'); c.hl(27, 37, 15, 'k')
    c.rect(25, 18, 26, 26, 'k'); c.rect(38, 18, 39, 26, 'k')     # bob
    c.rect(29, 23, 30, 24, 'k'); c.rect(34, 23, 35, 24, 'k')
    c.px(30, 27, 'k'); c.hl(31, 33, 28, 'k'); c.px(34, 27, 'k')
    # person B, deep skin, short rounded hair, white shirt
    c.poly([(42, 56), (43, 35), (46, 32), (58, 32), (61, 35), (62, 56)], 'w')
    c.poly([(57, 32), (58, 32), (61, 35), (62, 56), (58, 56)], 'T', only='w')   # flat shadow block
    c.rect(49, 29, 55, 32, 'd')
    head(c, 46, 16, 13, 14, 'd')
    c.rect(46, 13, 58, 18, 'k'); c.hl(47, 57, 12, 'k'); c.hl(48, 56, 11, 'k')
    c.rect(45, 16, 45, 21, 'k'); c.rect(59, 16, 59, 21, 'k')
    c.rect(49, 21, 50, 22, 'k'); c.rect(54, 21, 55, 22, 'k')
    c.px(50, 25, 'k'); c.hl(51, 53, 26, 'k'); c.px(54, 25, 'k')
    # basket of bills between them, both hands on the rim
    heap = C(N); heap.ell(27, 35, 57, 52, '#')
    for y in range(35, 46):
        for x in range(27, 58):
            if heap.get(x, y) != '#':
                continue
            r = (y - 35) // 3; off = 3 if r % 2 else 0
            bx = (x - 27 + off) % 7
            edge = (y - 35) % 3 == 2 or bx == 6
            c.px(x, y, 'G' if edge else 'g')
    c.poly([(26, 44), (58, 44), (56, 58), (28, 58)], 'w')
    c.rect(26, 44, 58, 45, 'w')
    for x in range(31, 55, 4):
        c.rect(x, 48, x + 1, 54, 't')                            # basket slots
    c.rect(23, 42, 27, 46, 'a')                                  # hands on the rim
    c.rect(57, 42, 61, 46, 'd')
    c.hl(27, 57, 59, 'T')
    return c.rows(), pal


PORTRAITS = [
    ('kingpin', 'Kingpin', kingpin),
    ('mob', 'Mob', mob),
    ('tiebreaker', 'Tiebreaker', tiebreaker),
    ('launderers', 'Launderers', launderers),
]
