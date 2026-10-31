"""Style A, sharp scenes: the little-scenes look redrawn at 96x96.
Flat fills, two tones per material, one ink outline around every object, half-body figures in a setting."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from lib import C

STYLE = {
    'title': 'A  Sharp scenes  (96x96: today\'s little scenes, twice the detail)',
    'short': 'A Sharp scenes',
    'sub': '96x96, figure + setting, one ink line',
}

N = 96
INK = '#2a1e26'
W, W2 = '#f4ede1', '#d3cbbd'

PALE = ('#f3d5c0', '#d9ab92')
LIGHT = ('#ebbd94', '#cc946d')
OLIVE = ('#d1a072', '#ad7c52')
MED = ('#a4683f', '#83502f')
DEEP = ('#6e4128', '#55301d')
VDEEP = ('#4a2a1b', '#371e13')
CASH, CASH2 = '#8fb877', '#5d8a50'


def obj(fn):
    l = C(N)
    fn(l)
    l.outline('k')
    return l


def lay(c, fn):
    c.paste(obj(fn))


# ------------------------------------------------------------------ people kit
def head(l, x0, y0, w, h, sk, sh, ears=True):
    """Rounded head, flat jaw curve. Lit from the top left: shade plane on the right and under the jaw."""
    x1, y1 = x0 + w - 1, y0 + h - 1
    l.ell(x0, y0, x1, y0 + (2 * h) // 3, sk)
    l.ell(x0, y0 + h // 3, x1, y1, sk)
    l.rect(x0, y0 + h // 4, x1, y0 + (2 * h) // 3, sk)
    if ears:
        ey = y0 + h // 2 - 2
        for ex in (x0 - 2, x1 + 1):
            l.rect(ex, ey, ex + 1, ey + 4, sk)
        l.rect(x1 + 1, ey, x1 + 2, ey + 4, sh)
        l.px(x0 - 1, ey + 2, sh)
    # shade plane: right edge 3px wide below the temple, jaw underside 1 row
    for y in range(y0 + h // 3, y1 + 1):
        xs = [x for x in range(x0, x1 + 1) if l.get(x, y) == sk]
        if xs:
            for x in xs[-3:]:
                l.px(x, y, sh)
    xs = [x for x in range(x0, x1 + 1) if l.get(x, y1) in (sk, sh)]
    for x in xs:
        l.px(x, y1, sh)


def eyes(l, lx, rx, y, kind='open', glint='w'):
    """Two eyes, 2 wide. lx, rx = left x of each eye. y = top row."""
    for x in (lx, rx):
        if kind == 'open':
            l.rect(x, y, x + 1, y + 2, 'k')
            if glint:
                l.px(x, y, glint)
        elif kind == 'narrow':
            l.hl(x - 1, x + 1, y + 1, 'k'); l.px(x, y + 2, 'k'); l.px(x + 1, y + 2, 'k')
        elif kind == 'glare':
            l.rect(x, y + 1, x + 1, y + 2, 'k')
            if glint:
                l.px(x + (1 if x == lx else 0), y + 1, glint)
        elif kind == 'happy':
            l.px(x - 1, y + 2, 'k'); l.hl(x, x + 1, y + 1, 'k'); l.px(x + 2, y + 2, 'k')


def brows(l, lx, rx, y, k, mood='calm'):
    if mood == 'calm':
        l.hl(lx - 1, lx + 2, y, k); l.hl(rx - 1, rx + 2, y, k)
    elif mood == 'angry':   # down toward the nose
        l.hl(lx - 1, lx, y - 1, k); l.hl(lx + 1, lx + 2, y, k)
        l.hl(rx - 1, rx, y, k); l.hl(rx + 1, rx + 2, y - 1, k)
    elif mood == 'fury':    # thick, steep, down toward the nose
        l.hl(lx - 2, lx - 1, y - 2, k); l.hl(lx - 2, lx + 1, y - 1, k); l.hl(lx, lx + 2, y, k)
        l.hl(rx + 2, rx + 3, y - 2, k); l.hl(rx, rx + 3, y - 1, k); l.hl(rx - 1, rx + 1, y, k)
    elif mood == 'cross':   # thick, low
        l.hl(lx - 1, lx + 2, y, k); l.hl(lx, lx + 2, y + 1, k)
        l.hl(rx - 1, rx + 2, y, k); l.hl(rx - 1, rx + 1, y + 1, k)
    elif mood == 'up':
        l.hl(lx - 1, lx, y, k); l.hl(lx + 1, lx + 2, y - 1, k)
        l.hl(rx - 1, rx, y - 1, k); l.hl(rx + 1, rx + 2, y, k)


def shout(l, cx, y, m, M, big=False):
    """Open oval mouth, no teeth: dark inside, red tongue at the bottom. cx = left of the 2px centre."""
    if big:
        l.hl(cx - 1, cx + 2, y, 'k')
        l.rect(cx - 2, y + 1, cx + 3, y + 4, 'k')
        l.hl(cx - 1, cx + 2, y + 5, 'k')
        l.rect(cx - 1, y + 1, cx + 2, y + 4, M)
        l.hl(cx - 1, cx + 2, y + 1, 'k')
        l.rect(cx - 1, y + 3, cx + 2, y + 4, m)
    else:
        l.hl(cx - 1, cx + 2, y, 'k')
        l.rect(cx - 2, y + 1, cx + 3, y + 3, 'k')
        l.hl(cx - 1, cx + 2, y + 4, 'k')
        l.rect(cx - 1, y + 2, cx + 2, y + 3, m)



HAND_REST = [            # back of a hand resting on a surface, fingers curled over; thumb on the right
    "..aaaaaaa....",
    ".aaaaaaaaaa..",
    "aaaaaaaaaaaa.",
    "aaaaaaaaaaaAa",
    "aaaaaaaaaaAaa",
    "aAaaAaaAaaAaa",
    "aAaaAaaAaa.aa",
    "aAaaAaaAaa.A.",
    "AA.AA.AA.A...",
]


def stamp(l, x, y, rows, sk, sh, flip=False):
    for j, r in enumerate(rows):
        if flip:
            r = r[::-1]
        for i, ch in enumerate(r):
            if ch == 'a':
                l.px(x + i, y + j, sk)
            elif ch == 'A':
                l.px(x + i, y + j, sh)
            elif ch not in '. ':
                l.px(x + i, y + j, ch)


# ================================================================ Kingpin
def kingpin():
    c = C(N)
    sk, sh = OLIVE
    pal = {'k': INK, 'w': W, 'W': W2, '1': '#c2457f', '2': '#8f2f5d',
           'a': sk, 'A': sh, 'g': '#3e3542', 'G': '#2b2430',
           'v': '#6b2f3a', 'V': '#52222c', 'o': '#8a5a3c', 'O': '#6a4330',
           'l': '#4f8a62', 'L': '#386a4a', 'y': '#f2d27a', 'b': '#c9a24a', 'B': '#9b7a30',
           'n': CASH, 'N': CASH2, 'c': '#7a4a2c', 'e': '#e8703a', 'p': '#b99a86', 'P': '#a68570'}

    c.rect(0, 0, 95, 75, 'p')                                       # striped wallpaper
    for x in range(4, 96, 12):
        c.rect(x, 0, x + 5, 75, 'P')

    def chair(l):  # tall leather chair back framing him
        l.rect(12, 20, 83, 76, 'v')
        l.ell(12, 4, 83, 36, 'v')
        l.poly([(72, 0), (84, 0), (84, 76), (72, 76)], 'V', only='v')
    lay(c, chair)

    def body(l):
        l.poly([(8, 82), (10, 70), (16, 63), (34, 58), (62, 58), (80, 63), (86, 70), (88, 82)], '1')
        l.poly([(66, 59), (80, 63), (86, 70), (88, 82), (72, 82)], '2', only='1')
        l.poly([(38, 58), (58, 58), (48, 76)], 'w')                 # shirt V
        l.poly([(53, 58), (58, 58), (48, 76)], 'W', only='w')
        l.poly([(34, 59), (39, 58), (48, 77), (44, 77), (38, 66), (32, 64)], '2')   # lapels
        l.poly([(62, 59), (57, 58), (48, 77), (52, 77), (58, 66), (64, 64)], '2')
        l.poly([(46, 61), (50, 61), (51, 70), (48, 74), (45, 70)], 'g')  # tie, no bar
        l.poly([(49, 61), (50, 61), (51, 70), (48, 74)], 'G', only='g')
        l.rect(46, 58, 50, 61, 'G')                                  # knot
        l.poly([(66, 67), (73, 67), (72, 70), (67, 70)], 'w')        # pocket square
        l.rect(41, 54, 55, 58, 'A')                                  # neck
    lay(c, body)

    def face_(l):
        head(l, 32, 24, 32, 33, 'a', 'A')
        l.ell(33, 42, 62, 57, 'a', only='.')                         # heavy jaw
        l.recolor('A', 'a', (30, 24, 66, 57))
        for y in range(34, 58):                                      # one shade plane down the right
            xs = [x for x in range(32, 64) if l.get(x, y) == 'a']
            for x in xs[-3:]:
                l.px(x, y, 'A')
        for x in range(32, 64):
            if l.get(x, 57) == 'a' or l.get(x, 57) == 'A':
                l.px(x, 57, 'A')
        l.rect(64, 38, 65, 42, 'A')                                  # far ear in shade
        l.hl(33, 63, 30, 'A'); l.hl(34, 62, 31, 'A')                 # hat shadow
        l.rect(32, 32, 34, 41, 'W'); l.rect(61, 32, 63, 41, 'W')     # grey temples
        brows(l, 39, 55, 35, 'g', 'cross')
        eyes(l, 39, 55, 37, 'narrow')
        l.vl(48, 40, 44, 'A'); l.hl(47, 50, 45, 'A')                 # nose
        l.hl(43, 51, 50, 'k'); l.px(42, 49, 'k')                     # smirk
    lay(c, face_)

    def cigar(l):
        l.rect(52, 49, 63, 51, 'c'); l.vl(60, 49, 51, '1')
        l.rect(64, 49, 65, 51, 'e')
    lay(c, cigar)

    def hat(l):
        l.poly([(35, 32), (36, 14), (41, 9), (55, 9), (60, 14), (61, 32)], 'g')
        l.poly([(44, 9), (52, 9), (48, 14)], 'G')                    # pinch
        l.poly([(55, 10), (60, 14), (61, 32), (56, 32)], 'G', only='g')
        l.rect(35, 23, 61, 27, '1'); l.rect(56, 23, 61, 27, '2')     # band
        l.ell(22, 27, 74, 33, 'g'); l.hl(25, 71, 33, 'G')            # brim
    lay(c, hat)

    def desk(l):
        l.rect(0, 77, 95, 82, 'o'); l.hl(0, 95, 82, 'O')
        l.rect(0, 83, 95, 95, 'O')
        l.rect(5, 85, 38, 95, 'o'); l.rect(57, 85, 90, 95, 'o')
        l.rect(18, 89, 25, 90, 'b'); l.rect(70, 89, 77, 90, 'b')
    lay(c, desk)

    def lamp(l):  # banker's lamp
        l.rect(3, 73, 19, 76, 'b'); l.hl(3, 19, 76, 'B')
        l.rect(10, 62, 11, 72, 'b')
        l.poly([(0, 62), (3, 54), (18, 54), (22, 62)], 'l')
        l.poly([(12, 54), (18, 54), (22, 62), (14, 62)], 'L', only='l')
        l.hl(1, 21, 62, 'y'); l.hl(2, 20, 63, 'y')
    lay(c, lamp)

    def cash(l):
        l.rect(80, 58, 93, 76, 'n')                                  # tall stack
        for y in range(60, 77, 3):
            l.hl(80, 93, y, 'N')
        l.rect(85, 58, 87, 76, 'w')
        l.rect(58, 70, 78, 76, 'n')                                  # low stack under his hand
        for y in (72, 74, 76):
            l.hl(58, 78, y, 'N')
        l.rect(73, 70, 75, 76, 'w')
    lay(c, cash)

    def arms(l):
        l.poly([(12, 68), (20, 64), (30, 72), (28, 79), (14, 79)], '1')
        l.poly([(86, 66), (80, 60), (68, 61), (67, 71), (84, 73)], '2')
        l.rect(27, 71, 29, 78, 'w'); l.rect(66, 63, 68, 70, 'w')     # cuffs
    lay(c, arms)
    lay(c, lambda l: stamp(l, 30, 71, HAND_REST, 'a', 'A'))
    lay(c, lambda l: stamp(l, 54, 64, HAND_REST, 'a', 'A', flip=True))
    return c.rows(), pal


# ================================================================ Mob
FORK = [                 # pitchfork head: three tines on a curved bar
    "i...i...i",
    "i...i...i",
    "i...i...i",
    "i...i...i",
    "i...i...i",
    "I...i...I",
    "Ii..i..iI",
    ".IiiiiiI.",
    "...IiI...",
]

FIST = [                 # fist round a vertical shaft, knuckles to the viewer, thumb over the top
    ".aaaaa.",
    "aaaaaaA",
    "AAAAAAA",
    "aaaaaaA",
    "AAAAAAA",
    "aaaaaaA",
    ".AAAAA.",
]


def mob():
    c = C(N)
    pal = {'k': INK, '1': '#d9534a', '2': '#a83a35', 'o': '#8a5a3c', 'O': '#5e3b28',
           'h': '#1f1714', 'r': '#b8582c', 'i': '#b9b6ad', 'I': '#7c7a74',
           'y': '#f7d774', 'e': '#ee8a3a', 's': '#4a3f5e', 'S': '#3a3049', 'w': W}
    tones = {'p': PALE, 'l': LIGHT, 'a': OLIVE, 'd': DEEP, 'v': VDEEP}
    for key, (f, sh) in tones.items():
        pal[key] = f; pal[key.upper()] = sh

    c.rect(0, 0, 95, 95, 's')                                       # dusk sky
    c.poly([(0, 46), (0, 30), (8, 22), (16, 30), (16, 46)], 'S')     # rooftops far off
    c.poly([(74, 46), (74, 28), (84, 18), (95, 28), (95, 46)], 'S')
    c.poly([(30, 46), (30, 34), (40, 26), (50, 34), (50, 46)], 'S')

    def face(l, x0, y0, w, h, t, hair, style, brow, mouth, fringe=(3, 2, 2, 3, 4, 3, 2, 3)):
        sk, sh = t, t.upper()
        head(l, x0, y0, w, h, sk, sh)
        cx = x0 + w // 2
        ey = y0 + h // 2 - 1
        lx, rx = cx - w // 4 - 1, cx + w // 4 - 1
        top = y0 + h // 4
        if style in ('short', 'curls', 'crop'):
            grow = {'short': 2, 'curls': 4, 'crop': 1}[style]
            hl_ = C(N); hl_.ell(x0 - grow, y0 - grow - 1, x0 + w - 1 + grow, y0 + h // 2 + grow, '#')
            for x in range(x0 - grow, x0 + w + grow):
                f = fringe[(x - x0) % len(fringe)] if style != 'crop' else 0
                for y in range(y0 - grow - 2, top + f + (h // 2 if x < x0 or x >= x0 + w else 0)):
                    if hl_.get(x, y) == '#':
                        l.px(x, y, hair)
            if style == 'curls':                                    # curls to the jaw on both sides
                l.ell(x0 - 4, y0 + 2, x0 + 2, y0 + h - 5, hair)
                l.ell(x0 + w - 3, y0 + 2, x0 + w + 3, y0 + h - 5, hair)
        elif style == 'puff':                                       # hair pulled up into a round puff
            l.ell(x0 + 2, y0 - 12, x0 + w - 3, y0 + 2, hair)
            l.ell(x0 - 1, y0 - 2, x0 + w, top + 3, hair, only='.' + sk + sh)
            l.ell(x0 + 1, y0 + 3, x0 + w - 2, y0 + h - 2, sk, only=hair)
        elif style == 'cap':
            l.ell(x0 - 1, y0 - 2, x0 + w + 1, top + 5, hair)        # flat cap, low crown
            l.rect(x0 - 1, top + 1, x0 + w + 1, top + 2, hair)
            l.hl(x0 + 2, x0 + w - 2, y0 - 1, 'O')
            l.rect(x0 - 2, top + 3, x0 + w - 4, top + 4, 'O')        # peak over the brow
        brows(l, lx, rx, ey - 2, 'h', brow)
        kind = 'glare' if brow in ('angry', 'fury') else 'open'
        eyes(l, lx, rx, ey, kind, glint='w' if t in 'pla' else None)
        l.px(cx - 1, ey + 4, sh); l.px(cx, ey + 4, sh); l.px(cx - 2, ey + 3, sh)   # nose
        my = ey + 7
        if mouth == 'shout':
            shout(l, cx - 1, my - 1, '1', '2', big=w >= 24)
        elif mouth == 'set':
            l.hl(cx - 3, cx + 1, my, 'k')
        elif mouth == 'frown':
            l.hl(cx - 2, cx, my, 'k'); l.px(cx - 3, my + 1, 'k'); l.px(cx + 1, my + 1, 'k')

    def torso(l, x0, x1, y0, cloth, shade):
        l.poly([(x0, 96), (x0 + 1, y0 + 5), (x0 + 5, y0), (x1 - 5, y0), (x1 - 1, y0 + 5), (x1, 96)], cloth)
        l.poly([(x1 - 6, y0), (x1 - 1, y0 + 5), (x1, 96), (x1 - 6, 96)], shade, only=cloth)

    # ---- back left: olive, flat cap, shouting, raises a pitchfork
    def bl(l):
        torso(l, 10, 40, 40, '2', '2')
        l.rect(21, 38, 27, 41, 'A')
        face(l, 15, 17, 20, 24, 'a', 'h', 'short', 'angry', 'shout', fringe=(2, 3, 4, 3, 2, 1, 2, 3, 4, 3))
    lay(c, bl)
    lay(c, lambda l: (l.rect(9, 12, 10, 80, 'o'), l.vl(10, 12, 80, 'O')))
    lay(c, lambda l: stamp(l, 5, 1, FORK, 'i', 'I'))
    lay(c, lambda l: l.poly([(5, 30), (13, 30), (16, 46), (6, 46)], '2'))   # raised sleeve
    lay(c, lambda l: stamp(l, 6, 24, FIST, 'a', 'A'))

    # ---- back right: very deep, cropped hair, set mouth, raises a pitchfork
    def br(l):
        torso(l, 60, 92, 40, '1', '2')
        l.rect(71, 38, 77, 41, 'V')
        face(l, 65, 18, 20, 22, 'v', 'h', 'crop', 'calm', 'set')
    lay(c, br)
    lay(c, lambda l: (l.rect(86, 12, 87, 80, 'o'), l.vl(87, 12, 80, 'O')))
    lay(c, lambda l: stamp(l, 82, 1, FORK, 'i', 'I'))
    lay(c, lambda l: l.poly([(82, 30), (90, 30), (92, 46), (80, 46)], '2'))
    lay(c, lambda l: stamp(l, 83, 24, FIST, 'v', 'V'))

    # ---- front left: deep, short hair, frowning
    def fl(l):
        torso(l, -4, 26, 66, '1', '2')
        l.poly([(-4, 96), (-3, 71), (1, 66), (6, 66), (5, 96)], 'O')     # brown waistcoat sides
        l.poly([(26, 96), (25, 71), (21, 66), (16, 66), (17, 96)], 'O')
        l.rect(7, 63, 13, 66, 'D')
        face(l, 1, 45, 20, 22, 'd', 'h', 'puff', 'cross', 'frown')
    lay(c, fl)

    # ---- front right: pale, ginger curls, shouting
    def fr(l):
        torso(l, 70, 100, 66, '1', '2')
        l.rect(81, 63, 87, 66, 'P')
        face(l, 74, 45, 20, 21, 'p', 'r', 'curls', 'angry', 'shout')
    lay(c, fr)

    # ---- lead: light, centre, shouting, torch up
    def lead(l):
        torso(l, 26, 70, 62, '1', '2')
        l.poly([(40, 62), (56, 62), (48, 70)], 'w')                 # open collar
        l.rect(42, 57, 54, 62, 'L')
        face(l, 34, 32, 28, 28, 'l', 'O', 'short', 'fury', 'shout', fringe=(1, 2, 1, 0, 1, 3, 2, 1, 0, 1))
    lay(c, lead)
    lay(c, lambda l: l.poly([(58, 30), (66, 30), (68, 64), (60, 64)], '2'))   # raised sleeve
    def torch(l):
        l.rect(61, 10, 63, 30, 'O'); l.vl(61, 10, 30, 'o')
        l.rect(59, 10, 65, 13, 'I')                                  # iron cup
    lay(c, torch)
    def flame(l):
        l.poly([(56, 10), (55, 4), (58, 6), (59, 0), (62, 3), (64, -1), (66, 4), (69, 1), (69, 6), (68, 10)], '1')
        l.poly([(58, 10), (57, 6), (60, 7), (61, 2), (63, 5), (65, 2), (66, 6), (67, 10)], 'e')
        l.poly([(60, 10), (60, 7), (62, 5), (63, 7), (65, 6), (65, 10)], 'y')
    lay(c, flame)
    lay(c, lambda l: stamp(l, 59, 24, FIST, 'l', 'L'))
    return c.rows(), pal


# ================================================================ Tiebreaker
FLICK = [                # fist with the thumb up, about to flick; thumb on the left
    ".aa.....",
    ".aaH....",
    ".aaa....",
    "aaaaaaa.",
    "aaaaaaaA",
    "aAAAAAAA",
    "aaaaaaaA",
    "aAAAAAAA",
    "aaaaaaaA",
    ".AAAAAA.",
]


def tiebreaker():
    c = C(N)
    sk, sh = VDEEP
    pal = {'k': INK, 'a': sk, 'A': sh, 'H': '#6a4130', 'L': '#6e3a30', 'h': '#1c1412',
           'w': '#f4f1ea', 'g': '#26282c', 'c': '#b88220', 'y': '#efc04a', 'Y': '#fbe3a0',
           'b': '#c7dbdc', 's': '#8a93a0', 'S': '#77808d', 'p': '#86b46a', 'P': '#76a35b',
           'f': '#f0c040', 'F': '#d9a02c'}

    c.rect(0, 0, 95, 30, 'b')                                       # sky
    c.rect(0, 22, 95, 40, 's')                                      # stand
    for y in (26, 31, 36):
        c.hl(0, 95, y, 'S')
    c.rect(0, 41, 95, 95, 'p')                                      # pitch, mown bands
    for x0 in range(0, 96, 16):
        c.rect(x0, 41, x0 + 7, 95, 'P')
    c.hl(0, 95, 40, 'k')
    c.rect(0, 58, 95, 59, 'w')                                      # touchline

    def flag(l):
        l.rect(86, 34, 87, 58, 'w')
        l.poly([(88, 34), (88, 43), (95, 38.5)], 'f')
        l.poly([(88, 39), (88, 43), (95, 38.5)], 'F', only='f')
    lay(c, flag)

    def body(l):
        l.poly([(6, 96), (8, 76), (14, 68), (30, 62), (58, 62), (72, 68), (78, 76), (80, 96)], 'w')
        for x in range(0, N):
            if x % 6 < 3:
                l.recolor('w', 'g', (x, 0, x, 95))
        l.poly([(34, 62), (54, 62), (50, 68), (44, 70), (38, 68)], 'g')   # black collar
        l.rect(38, 56, 50, 63, 'A')                                       # neck
        l.rect(38, 56, 40, 61, 'a')
    lay(c, body)

    def head_(l):
        head(l, 30, 26, 28, 32, 'a', 'A')
        l.ell(28, 19, 59, 42, 'h', only='.aA')                       # short natural hair
        l.ell(31, 28, 56, 57, 'a', only='h')
        for y in range(36, 58):                                      # keep the right plane
            xs = [x for x in range(30, 58) if l.get(x, y) == 'a']
            for x in xs[-3:]:
                l.px(x, y, 'A')
        l.rect(30, 30, 30, 36, 'h'); l.rect(57, 30, 57, 36, 'h')     # hairline at the temples
        l.pts('H', [(35, 31), (36, 31), (37, 31), (34, 32), (35, 32)])   # forehead light, top left
        l.hl(35, 39, 38, 'h'); l.hl(48, 52, 38, 'h')                 # brows
        l.hl(36, 38, 39, 'H'); l.hl(49, 51, 39, 'H')                 # lit lids
        l.rect(36, 41, 37, 42, 'h'); l.rect(49, 41, 50, 42, 'h')     # dark eyes
        l.vl(43, 42, 46, 'H')                                        # lit nose bridge
        l.px(44, 47, 'A'); l.px(42, 47, 'A')                         # nostrils, dark not light
        l.hl(40, 47, 51, 'L'); l.px(39, 50, 'L'); l.px(48, 50, 'L')  # closed smile, warm lips
        l.hl(41, 46, 52, 'A')
    lay(c, head_)

    def upper(l):  # his left upper arm down the side, short striped sleeve
        l.poly([(70, 76), (84, 76), (83, 84), (79, 88), (72, 88), (70, 84)], 'a')   # bare upper arm to the elbow
        l.poly([(79, 76), (84, 76), (83, 84), (79, 88)], 'A', only='a')
        l.poly([(64, 63), (76, 64), (83, 70), (85, 77), (69, 77)], 'w')            # short sleeve
        for x in range(0, N):
            if (x + 1) % 6 < 3:
                l.recolor('w', 'g', (x, 0, x, 95))
        l.recolor('w', 'g', (60, 75, 86, 77))                       # black sleeve hem
    lay(c, upper)

    def fore(l):  # forearm bent up to the coin, tapering to the wrist
        l.poly([(64, 84), (63, 80), (65, 52), (72, 52), (76, 80), (74, 86), (68, 87)], 'a')
        l.poly([(71, 52), (72, 52), (76, 80), (74, 86), (71, 86)], 'A', only='a')
    lay(c, fore)
    lay(c, lambda l: stamp(l, 64, 43, FLICK, 'a', 'A'))

    def coin(l):
        l.ell(60, 30, 70, 40, 'c')
        l.ell(61, 31, 68, 38, 'y', only='c')
        l.pts('Y', [(63, 32), (64, 32), (62, 33)])
    lay(c, coin)
    return c.rows(), pal


# ================================================================ Launderers
GRIP = [                 # hand gripping a rim from the front: four fingers over the edge, thumb behind
    ".aaaaaa.",
    "aaaaaaaa",
    "aAaaAaaA",
    "aAaaAaaA",
    "AA.AA.AA",
]

PEG_HAND = [             # raised hand pinching a peg from the right: fingertips left, knuckles right
    "..aaaa...",
    ".aaaaaaa.",
    "aaAAaaaaa",
    "aaaaaaaaA",
    ".aAaaaaaA",
    "..aaaaaA.",
    "...aaaaA.",
    "...aaaaA.",
]


def launderers():
    c = C(N)
    pal = {'k': INK, 'w': W, 'W': W2, 'x': '#8d9698', 'u': '#cfe0e3', 'U': '#a9c2c7',
           'n': CASH, 'N': CASH2, 'e': '#d8dccf', 'E': '#c2c8b8', 'p': '#c9a066',
           'q': '#c99a5c', 'Q': '#9c7240', 'a': MED[0], 'A': MED[1], 'b': PALE[0], 'B': PALE[1],
           'h': '#2a1d17', 'o': '#7a4e32', '1': '#a9aeac', '2': '#7d8381', 'c': '#7f9db3', 'C': '#62809a'}

    c.rect(0, 0, 95, 95, 'e')                                       # laundromat wall
    c.rect(0, 56, 95, 95, 'E')
    c.hl(0, 95, 55, 'W')
    c.hl(0, 95, 8, 'x')                                             # clothesline

    def tee(l):
        l.poly([(4, 9), (9, 9), (11, 11), (16, 11), (18, 9), (23, 9), (26, 15), (22, 17), (21, 15), (21, 29), (8, 29), (8, 15), (7, 17), (2, 15)], 'w')
        l.poly([(18, 9), (23, 9), (26, 15), (22, 17), (21, 15), (21, 29), (18, 29)], 'W', only='w')
    lay(c, tee)

    def bill(l, x0, y0):
        l.rect(x0, y0, x0 + 14, y0 + 8, 'n')
        l.rect(x0 + 1, y0 + 1, x0 + 13, y0 + 7, 'N'); l.rect(x0 + 2, y0 + 2, x0 + 12, y0 + 6, 'n')
        l.ell(x0 + 5, y0 + 2, x0 + 9, y0 + 6, 'w')
    lay(c, lambda l: bill(l, 30, 9))
    lay(c, lambda l: bill(l, 48, 9))
    for x in (6, 20, 36, 54):
        lay(c, lambda l, x=x: l.rect(x, 6, x + 1, 11, 'p'))

    def washer(l):
        l.rect(0, 42, 30, 95, 'w'); l.rect(27, 42, 30, 95, 'W')
        l.hl(0, 30, 49, 'W')
        l.rect(2, 44, 10, 46, 'x')                                  # detergent drawer
        l.ell(21, 43, 26, 48, 'x'); l.px(23, 44, 'W')              # dial
        l.ell(1, 54, 28, 81, 'x')                                   # porthole rim
        l.ell(4, 57, 25, 78, 'u')
        l.ell(15, 57, 25, 78, 'U', only='u')
        l.hl(0, 30, 88, 'W')
    lay(c, washer)

    def tumble(l):  # bills in the drum, at easy angles
        l.rect(7, 62, 14, 66, 'n'); l.rect(9, 63, 12, 65, 'N')
        l.rect(14, 69, 21, 73, 'n'); l.rect(16, 70, 19, 72, 'N')
        l.rect(7, 71, 11, 74, 'N')
    lay(c, tumble)

    # ---- B: pale, right, pegging a bill on the line
    def b_body(l):
        l.poly([(60, 96), (61, 74), (66, 68), (86, 68), (91, 74), (92, 96)], 'c')
        l.poly([(85, 68), (91, 74), (92, 96), (86, 96)], 'C', only='c')
        l.rect(72, 63, 80, 68, 'B')
        head(l, 64, 38, 24, 27, 'b', 'B')
        l.ell(62, 34, 89, 50, 'o', only='.bB')                      # short brown hair, side part
        l.ell(65, 41, 86, 63, 'b', only='o')
        l.rect(64, 40, 65, 46, 'o'); l.rect(86, 40, 87, 46, 'o')
        l.hl(66, 72, 41, 'o')
        for y in range(48, 65):
            xs = [x for x in range(64, 88) if l.get(x, y) == 'b']
            for x in xs[-3:]:
                l.px(x, y, 'B')
        eyes(l, 69, 80, 50, 'happy')
        l.hl(68, 71, 47, 'o'); l.hl(79, 82, 47, 'o')
        l.px(75, 54, 'B'); l.px(76, 54, 'B')
        l.px(72, 57, 'k'); l.hl(73, 77, 58, 'k'); l.px(78, 57, 'k')
    lay(c, b_body)

    def b_arm(l):
        l.poly([(82, 72), (83, 42), (91, 42), (92, 72)], 'c')       # sleeve, rolled at the elbow
        l.rect(82, 40, 91, 43, 'C')
        l.poly([(83, 40), (83, 20), (89, 20), (90, 40)], 'b'); l.poly([(88, 20), (89, 20), (90, 40), (88, 40)], 'B', only='b')
    lay(c, b_arm)
    lay(c, lambda l: bill(l, 64, 9))
    lay(c, lambda l: stamp(l, 80, 12, PEG_HAND, 'b', 'B'))
    lay(c, lambda l: (l.rect(78, 6, 79, 13, 'p')))

    # ---- A: medium skin, centre, bob, holding the basket
    def a_body(l):
        l.poly([(28, 96), (29, 70), (34, 64), (58, 64), (63, 70), (64, 96)], '1')
        l.poly([(56, 64), (63, 70), (64, 96), (57, 96)], '2', only='1')
        l.rect(42, 59, 50, 64, 'A')
        head(l, 34, 34, 24, 26, 'a', 'A')
        l.ell(31, 30, 60, 56, 'h', only='.aA')                      # bob to the jaw
        l.ell(35, 38, 56, 59, 'a', only='h')
        l.rect(33, 45, 36, 55, 'h'); l.rect(56, 45, 59, 55, 'h')
        for y in range(44, 60):
            xs = [x for x in range(35, 57) if l.get(x, y) == 'a']
            for x in xs[-3:]:
                l.px(x, y, 'A')
        l.hl(38, 41, 43, 'h'); l.hl(50, 53, 43, 'h')
        eyes(l, 39, 51, 45, 'open')
        l.px(45, 49, 'A'); l.px(46, 49, 'A')
        l.px(42, 52, 'k'); l.hl(43, 48, 53, 'k'); l.px(49, 52, 'k')
    lay(c, a_body)

    def basket(l):
        heap = C(N); heap.ell(26, 66, 70, 90, '#')
        for y in range(66, 79):
            for x in range(26, 71):
                if heap.get(x, y) != '#':
                    continue
                r = (y - 66) // 4; off = 4 if r % 2 else 0
                bx = (x - 26 + off) % 9
                l.px(x, y, 'N' if (y - 66) % 4 == 3 or bx == 8 or (bx in (3, 4) and (y - 66) % 4 == 1) else 'n')
        l.poly([(24, 77), (72, 77), (69, 96), (27, 96)], 'q')
        for y in (81, 85, 89, 93):
            l.hl(25, 71, y, 'Q')
        l.rect(24, 77, 72, 79, 'Q')
    lay(c, basket)

    def a_arms(l):  # rolled sleeves, forearms down to the rim
        l.rect(24, 66, 31, 69, 'W'); l.rect(25, 70, 30, 76, 'a'); l.vl(30, 70, 76, 'A')
        l.rect(61, 66, 68, 69, 'W'); l.rect(62, 70, 67, 76, 'a'); l.vl(67, 70, 76, 'A')
    lay(c, a_arms)
    lay(c, lambda l: stamp(l, 24, 76, GRIP, 'a', 'A'))
    lay(c, lambda l: stamp(l, 61, 76, GRIP, 'a', 'A'))
    return c.rows(), pal


PORTRAITS = [
    ('kingpin', 'Kingpin', kingpin),
    ('mob', 'Mob', mob),
    ('tiebreaker', 'Tiebreaker', tiebreaker),
    ('launderers', 'Launderers', launderers),
]
