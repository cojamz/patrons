"""Style C, bold comic panel: 96x96. Thick ink (2px round every silhouette, 1px inside),
hard cel shading with one shadow tone per material, one flat background colour per card
with the setting drawn in a darker shade of it. No dithering."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from lib import C

STYLE = {
    'title': 'C  Bold comic panel  (96x96: thick ink, flat cel shading, one background colour)',
    'short': 'C Comic panel',
    'sub': '96x96, ink + cel, flat ground',
}

N = 96
INK = '#1b1418'
W, W2 = '#f6efe2', '#cfc5b4'
PALE = ('#f7d6c1', '#dba98e')
LIGHT = ('#f0c095', '#cf9168')
OLIVE = ('#d4a06e', '#ab7a4b')
MED = ('#a96a40', '#7f4b2b')
DEEP = ('#7a472c', '#57311e')
VDEEP = ('#5a3424', '#3d2217')
CASH, CASH2 = '#9ccb7e', '#5f9450'


# ---------------------------------------------------------------- kit
def obj(fn):
    l = C(N)
    fn(l)
    l.outline('k')
    return l


def mask(fn):
    t = C(N)
    fn(t)
    return {(x, y) for y in range(N) for x in range(N) if t.g[y][x] != '.'}


def cel(l, m, base, shade, dx=2, dy=2, only=None):
    """Fill mask m: base where the light (top-left) reaches, shade on the far rim."""
    for x, y in m:
        if only is not None and l.get(x, y) not in only:
            continue
        lit = (x + dx, y + dy) in m and (x + dx, y) in m and (x, y + dy) in m
        l.px(x, y, base if lit else shade)


def ellm(x0, y0, x1, y1):
    return mask(lambda t: t.ell(x0, y0, x1, y1, '#'))


def polym(P):
    return mask(lambda t: t.poly(P, '#'))


def rectm(x0, y0, x1, y1):
    return mask(lambda t: t.rect(x0, y0, x1, y1, '#'))


def finish(bg, fg):
    """fg already carries 1px ink per object; one more ring makes the silhouette 2px."""
    fg.outline('k')
    bg.paste(fg)
    return bg


def fist_up(l, x, y, s, S):
    """Raised fist seen from the front, knuckles up, 8 wide x 8 tall at (x,y) top-left."""
    l.rect(x + 1, y, x + 6, y + 6, s)
    l.rect(x, y + 1, x + 7, y + 5, s)
    l.vl(x + 7, y + 1, y + 6, S); l.hl(x + 1, x + 6, y + 6, S)
    for fx in (x + 2, x + 4):                    # finger splits
        l.vl(fx, y + 1, y + 2, 'k')
    l.px(x + 6, y + 1, 'k'); l.px(x + 6, y + 2, 'k')
    l.hl(x + 1, x + 5, y + 3, 'k')              # thumb crease across the fingers
    l.hl(x + 1, x + 4, y + 4, S)                # thumb


def grip(l, x, y, s, S, w=8, h=6):
    """A fist closed round a vertical pole; pole column stays visible above and below."""
    l.rect(x, y, x + w - 1, y + h - 1, s)
    l.hl(x, x + w - 1, y + h - 1, S); l.vl(x + w - 1, y, y + h - 1, S)
    for i in range(1, h - 1, 2):
        l.hl(x + 1, x + w - 3, y + i, 'k')        # finger rows wrapped round
    l.vl(x, y, y + h - 1, s)


# ---------------------------------------------------------------- Kingpin
def kingpin():
    bgc, bgd = '#b9437c', '#8b2c5b'
    pal = {'k': INK, 'M': bgc, 'm': bgd, 'w': W, 'W': W2,
           's': LIGHT[0], 'S': LIGHT[1], 'g': '#3c3644', 'G': '#26212c',
           'y': '#efc24e', 'Y': '#b98d2a', 'o': '#93593a', 'O': '#683c25',
           'l': '#3f8c5c', 'L': '#2a6641', 'n': CASH, 'N': CASH2, 'u': '#fbe6a0'}
    bg = C(N); bg.rect(0, 0, N - 1, N - 1, 'M')
    # window with blinds behind him
    bg.rect(10, 4, 85, 60, 'm')
    for y in range(7, 58, 5):
        bg.rect(13, y, 82, y + 1, 'M')
    bg.vl(47, 4, 60, 'm'); bg.vl(48, 4, 60, 'm')
    fg = C(N)

    def body(l):
        P = [(14, 72), (17, 54), (26, 47), (40, 45), (56, 45), (70, 47), (79, 54), (82, 72)]
        cel(l, polym(P), 'g', 'G', 4, 3)
        l.poly([(41, 45), (55, 45), (48, 60)], 'w')               # shirt V
        l.poly([(52, 45), (55, 45), (48, 60), (49, 52)], 'W', only='w')
        l.poly([(46, 47), (50, 47), (53, 60), (49, 64), (45, 59)], 'y')   # wide tie, angled
        l.poly([(50, 47), (53, 60), (49, 64), (50, 55)], 'Y', only='y')
        l.rect(46, 46, 50, 48, 'Y')                                  # knot
        l.line(40, 45, 46, 62, 'k'); l.line(56, 45, 51, 62, 'k')    # lapels
        l.line(36, 46, 42, 58, 'k'); l.line(60, 46, 55, 58, 'k')
    fg.paste(obj(body))

    def head(l):
        cel(l, ellm(37, 22, 59, 46), 's', 'S', 3, 3)
        cel(l, ellm(34, 30, 38, 38), 's', 'S', 2, 2)                 # ears
        cel(l, ellm(58, 30, 62, 38), 's', 'S', 1, 1)
        l.recolor('S', 's', (38, 31, 38, 37))
        l.hl(39, 57, 26, 'S'); l.hl(38, 58, 27, 'S')                # brim shadow on the brow
        # brows (one cocked) and eyes
        l.hl(40, 44, 29, 'k'); l.hl(41, 45, 30, 'k')                # heavy brow, lowered
        l.line(51, 29, 55, 27, 'k'); l.line(51, 30, 56, 28, 'k')    # the other cocked
        l.rect(42, 31, 43, 32, 'k'); l.rect(52, 31, 53, 32, 'k')
        # nose
        l.poly([(47, 31), (50, 31), (51, 37), (46, 37)], 'S')
        l.hl(46, 50, 37, 'k')
        # smug grin, one corner up
        l.line(42, 41, 44, 42, 'k'); l.hl(45, 51, 42, 'k'); l.line(52, 41, 54, 39, 'k')
        l.hl(46, 50, 44, 'S')                                        # chin crease shade
    fg.paste(obj(head))

    def hat(l):
        cel(l, polym([(38, 24), (39, 12), (42, 9), (54, 9), (57, 12), (58, 24)]), 'g', 'G', 3, 2)
        l.hl(44, 52, 10, 'G')                                        # crown dent
        l.rect(38, 19, 58, 22, 'M'); l.hl(38, 58, 22, 'm')          # magenta band
        cel(l, polym([(29, 26), (33, 23), (63, 23), (67, 26), (63, 27), (33, 27)]), 'g', 'G', 2, 1)
    fg.paste(obj(hat))

    def desk(l):
        l.rect(0, 70, 95, 75, 'o'); l.hl(0, 95, 75, 'O')
        l.rect(0, 76, 95, 95, 'O')
        l.rect(6, 80, 36, 95, 'O'); l.rect(59, 80, 89, 95, 'O')
        for x0 in (6, 59):
            l.hl(x0, x0 + 30, 79, 'k'); l.vl(x0, 79, 95, 'k'); l.vl(x0 + 30, 79, 95, 'k')
            l.rect(x0 + 12, 84, x0 + 18, 85, 'y')
    fg.paste(obj(desk))

    def arms(l):  # forearms on the desk, meeting in the middle
        cel(l, polym([(16, 66), (22, 57), (40, 63), (39, 72), (17, 72)]), 'g', 'G', 2, 2)
        cel(l, polym([(80, 66), (74, 57), (56, 63), (57, 72), (79, 72)]), 'g', 'G', 2, 2)
    fg.paste(obj(arms))

    def clasp(l):  # hands folded on the desk: knuckles up, fingers laced at the front
        cel(l, polym([(40, 65), (42, 62), (47, 61), (49, 62), (54, 61), (56, 63), (56, 72), (40, 72)]), 's', 'S', 2, 2)
        l.hl(41, 55, 66, 'S')                                       # knuckle row
        for x in (44, 48, 52):
            l.vl(x, 69, 71, 'k')                                    # laced fingertips
        l.vl(48, 62, 65, 'k')                                       # the two hands meet
    fg.paste(obj(clasp))

    def lamp(l):
        l.rect(6, 66, 22, 70, 'y'); l.hl(6, 22, 70, 'Y')
        l.rect(13, 50, 15, 66, 'y'); l.vl(15, 50, 66, 'Y')
        cel(l, polym([(2, 50), (6, 40), (22, 40), (26, 50)]), 'l', 'L', 3, 2)
        l.hl(3, 25, 51, 'u'); l.hl(4, 24, 52, 'u')
    fg.paste(obj(lamp))

    def cash(l):
        for x0, y0, h in ((69, 50, 20), (83, 57, 13)):
            l.rect(x0, y0, x0 + 11, y0 + h, 'n')
            for y in range(y0 + 2, y0 + h, 3):
                l.hl(x0, x0 + 11, y, 'N')
            l.vl(x0 + 11, y0, y0 + h, 'N')
            l.rect(x0 + 4, y0, x0 + 7, y0 + h, 'y'); l.vl(x0 + 7, y0, y0 + h, 'Y')
    fg.paste(obj(cash))
    return finish(bg, fg).rows(), pal


# ---------------------------------------------------------------- Mob
def side_fist(l, x, y, s, S):
    """A fist closed round a vertical pole (pole passes behind), 8x8 at (x,y), knuckles to the left."""
    l.stamp(x, y, [
        '.ssssss.',
        'sssssssS',
        'kkssssSS',
        'sssssssS',
        'kkssssSS',
        'sssssssS',
        '.sssssS.',
        '..SSSS..',
    ], {'s': s, 'S': S})


def mob():
    bgc, bgd = '#c9463b', '#952d27'
    pal = {'k': INK, 'R': bgc, 'r': bgd, 'w': W, 'W': W2,
           'y': '#f7d24f', 'o': '#ee8730', 't': '#a06a3e', 'T': '#6f4527', 'm': '#c3c6c9',
           'c': '#c9a46c', 'C': '#9a7848', 'b': '#5f6e86', 'B': '#434f66'}
    tones = {'a': PALE, 'd': LIGHT, 'e': MED, 'f': OLIVE, 'v': VDEEP}
    for key, (f, s) in tones.items():
        pal[key] = f; pal[key.upper()] = s
    bg = C(N); bg.rect(0, 0, N - 1, N - 1, 'R')
    # village on a hill: rooftops and a castle tower in the darker red
    bg.poly([(0, 60), (0, 40), (8, 32), (16, 40), (16, 46), (26, 38), (36, 46), (36, 60)], 'r')
    bg.rect(62, 14, 74, 60, 'r')
    for x in (62, 66, 70, 73):
        bg.rect(x, 10, x + 1, 14, 'r')
    bg.rect(74, 34, 95, 60, 'r'); bg.poly([(72, 34), (84, 22), (96, 34)], 'r')
    bg.rect(67, 20, 69, 25, 'R')                                    # tower window
    bg.rect(0, 60, 95, 95, 'r')
    fg = C(N)

    def person(l, x0, y0, w, h, skin, cloth, hair, hstyle, mouth, brows):
        S = skin.upper()
        cx = x0 + w // 2
        bw = w + 12
        cel(l, polym([(cx - bw // 2 - 2, 96), (cx - bw // 2, y0 + h + 4), (cx - 4, y0 + h - 1),
                      (cx + 4, y0 + h - 1), (cx + bw // 2, y0 + h + 4), (cx + bw // 2 + 2, 96)]),
            cloth, cloth.upper(), 4, 3)
        cel(l, ellm(x0, y0, x0 + w - 1, y0 + h - 1), skin, S, 2, 2)
        ey = y0 + h // 2 - 1
        el, er = x0 + w // 2 - 4, x0 + w // 2 + 3
        if hstyle == 'cap':
            cel(l, polym([(x0, y0 + 5), (x0 + 2, y0 - 2), (x0 + w - 3, y0 - 2), (x0 + w - 1, y0 + 5)]), 'b', 'B', 2, 1)
            l.hl(x0 - 3, x0 + w - 1, y0 + 5, 'B'); l.hl(x0 - 3, x0 + w - 1, y0 + 4, 'B')
        elif hstyle == 'short':
            for x, y in ellm(x0, y0 - 1, x0 + w - 1, y0 + 7):
                if y <= y0 + 3 or ((x <= x0 + 1 or x >= x0 + w - 2) and y <= y0 + 5):
                    l.px(x, y, hair)
        elif hstyle == 'curly':
            for x, y in ellm(x0 - 2, y0 - 3, x0 + w + 1, y0 + 9):
                if y <= y0 + 3 or ((x <= x0 + 1 or x >= x0 + w - 2) and y <= y0 + 7):
                    l.px(x, y, hair)
        if brows == 'angry':
            l.line(el - 1, ey - 3, el + 2, ey - 2, 'k'); l.line(er + 1, ey - 3, er - 2, ey - 2, 'k')
        elif brows == 'set':
            l.hl(el - 1, el + 2, ey - 2, 'k'); l.hl(er - 2, er + 1, ey - 2, 'k')
        l.rect(el, ey, el + 1, ey + 1, 'k'); l.rect(er - 1, ey, er, ey + 1, 'k')
        my = ey + 5
        if mouth == 'shout':
            l.ell(cx - 3, my - 1, cx + 2, my + 3, 'k'); l.ell(cx - 2, my, cx + 1, my + 2, 'T')
        elif mouth == 'yell':
            l.ell(cx - 2, my, cx + 1, my + 2, 'k'); l.px(cx - 1, my + 1, 'T'); l.px(cx, my + 1, 'T')
        elif mouth == 'grim':
            l.hl(cx - 3, cx + 2, my + 1, 'k'); l.px(cx - 4, my + 2, 'k'); l.px(cx + 3, my + 2, 'k')
        l.px(cx, ey + 2, S); l.px(cx, ey + 3, S); l.px(cx - 1, ey + 3, S)   # nose

    def fork(l, x, top, bottom):
        l.rect(x, top + 11, x + 2, bottom, 't'); l.vl(x + 2, top + 11, bottom, 'T')
        l.rect(x - 5, top + 9, x + 7, top + 11, 'm')
        for tx in (x - 5, x + 6):
            l.rect(tx, top + 1, tx + 1, top + 8, 'm')
        l.rect(x, top, x + 2, top + 8, 'm')

    # back row: ginger man with the torch, a man in a cap
    fg.paste(obj(lambda l: person(l, 13, 26, 15, 16, 'a', 'c', 'o', 'short', 'yell', 'angry')))
    fg.paste(obj(lambda l: person(l, 66, 25, 15, 16, 'f', 'w', 'b', 'cap', 'yell', 'angry')))

    def torch(l):
        l.rect(31, 12, 33, 40, 't'); l.vl(33, 12, 40, 'T')
        l.rect(29, 10, 35, 13, 'T')                                       # wrapped head
        l.poly([(27, 11), (25, 5), (28, 7), (29, 0), (32, 4), (34, 1), (36, 6), (38, 4), (37, 11)], 'o')
        l.poly([(29, 11), (29, 7), (31, 8), (32, 4), (34, 8), (35, 11)], 'y')
    fg.paste(obj(torch))
    fg.paste(obj(lambda l: (cel(l, polym([(28, 30), (35, 30), (34, 46), (27, 46)]), 'c', 'C', 2, 1),
                            side_fist(l, 28, 23, 'a', 'A'))))

    # front row
    def fl(l):
        person(l, 9, 50, 17, 18, 'e', 'w', 'T', 'curly', 'grim', 'angry')
    fg.paste(obj(fl))
    fg.paste(obj(lambda l: fork(l, 5, 6, 84)))
    fg.paste(obj(lambda l: (cel(l, polym([(4, 46), (11, 46), (14, 74), (6, 74)]), 'w', 'W', 2, 2),
                            side_fist(l, 3, 40, 'e', 'E'))))

    def fr(l):
        person(l, 77, 46, 17, 18, 'v', 'c', 'k', 'short', 'grim', 'set')
    fg.paste(obj(fr))
    fg.paste(obj(lambda l: fork(l, 88, 2, 84)))
    fg.paste(obj(lambda l: (cel(l, polym([(87, 44), (94, 44), (95, 74), (88, 74)]), 'c', 'C', 2, 2),
                            side_fist(l, 86, 36, 'v', 'V'))))

    def lead(l):
        person(l, 36, 35, 23, 24, 'd', 'b', 'o', 'curly', 'shout', 'angry')
    fg.paste(obj(lead))

    def lead_arm(l):  # raised fist above the crowd
        cel(l, polym([(55, 70), (59, 27), (66, 27), (64, 70)]), 'b', 'B', 2, 2)
    fg.paste(obj(lead_arm))
    fg.paste(obj(lambda l: fist_up(l, 58, 19, 'd', 'D')))
    return finish(bg, fg).rows(), pal


# ---------------------------------------------------------------- Tiebreaker
def tiebreaker():
    bgc, bgd = '#a5abaa', '#7f8787'
    sk, sh = VDEEP
    pal = {'k': INK, 'A': bgc, 'a': bgd, 'w': W, 'W': W2, 's': sk, 'S': sh,
           'q': '#2c2b30', 'y': '#f2c94c', 'Y': '#c4962c', 'e': '#f1e8dc', 'i': '#7a4a2e'}
    bg = C(N); bg.rect(0, 0, N - 1, N - 1, 'A')
    # pitch: ground in the darker grey, lines left in the light grey
    bg.rect(0, 58, 95, 95, 'a')
    bg.hl(0, 95, 62, 'A')
    bg.ring(-30, 74, 126, 120, 'A')                                    # centre circle edge
    bg.vl(48, 62, 95, 'A')
    # goal in the distance
    bg.rect(4, 40, 5, 58, 'a'); bg.rect(30, 40, 31, 58, 'a'); bg.rect(4, 40, 31, 41, 'a')
    fg = C(N)

    def body(l):
        P = [(10, 96), (12, 66), (18, 58), (30, 54), (52, 54), (64, 58), (70, 66), (72, 96)]
        t = polym(P)
        for x, y in t:
            l.px(x, y, 'q' if (x // 3) % 2 == 0 else ('w' if (x + 2, y + 2) in t else 'W'))
        l.poly([(33, 54), (49, 54), (41, 61)], 'q')                        # black collar
        l.poly([(36, 54), (46, 54), (41, 58)], 's')
    fg.paste(obj(body))

    def arm_down(l):  # his right arm, hand on hip
        t = polym([(8, 96), (11, 66), (17, 58), (22, 62), (21, 96)])
        for x, y in t:
            l.px(x, y, 'q' if (x // 3) % 2 == 0 else ('w' if (x + 2, y + 2) in t else 'W'))
        l.vl(21, 70, 95, 'k')
    fg.paste(obj(arm_down))

    def head(l):
        cel(l, ellm(30, 30, 51, 54), 's', 'S', 3, 3)
        cel(l, ellm(27, 39, 31, 46), 's', 'S', 1, 1)
        cel(l, ellm(50, 39, 54, 46), 's', 'S', 1, 1)
        # close-cropped hair
        for x, y in ellm(29, 27, 52, 46):
            if y <= 34 - (2 if 33 <= x <= 48 else 0) or (y <= 37 and (x <= 31 or x >= 50)):
                l.px(x, y, 'q')
        # eyes looking up at the coin: small whites, iris up and right
        for ex in (35, 44):
            l.hl(ex, ex + 2, 40, 'k')                                     # upper lid line
            l.px(ex, 41, 'e'); l.px(ex + 1, 41, 'i'); l.px(ex + 2, 41, 'k')
        l.line(34, 37, 37, 36, 'k'); l.line(44, 36, 47, 37, 'k')        # brows lifted
        # nose and closed smile
        l.poly([(39, 42), (42, 42), (43, 47), (38, 47)], 'S')
        l.line(37, 50, 38, 51, 'k'); l.hl(39, 43, 51, 'k'); l.line(44, 51, 45, 50, 'k')
    fg.paste(obj(head))

    def stripes(l, P):
        t = polym(P)
        for x, y in t:
            l.px(x, y, 'q' if (x // 3) % 2 == 0 else ('w' if (x + 2, y + 2) in t else 'W'))

    fg.paste(obj(lambda l: stripes(l, [(62, 56), (71, 58), (90, 70), (84, 79)])))   # upper arm out to the elbow

    def forearm(l):
        cel(l, polym([(82, 74), (90, 70), (88, 51), (80, 51)]), 's', 'S', 1, 1)
    fg.paste(obj(forearm))

    def hand(l):  # fist, thumb cocked up: he has just flicked the coin
        cel(l, polym([(77, 45), (80, 42), (88, 42), (90, 45), (90, 53), (78, 53)]), 's', 'S', 1, 1)
        l.vl(80, 46, 52, 'k')                                       # finger tips curled in
        l.hl(81, 88, 47, 'k'); l.hl(81, 88, 50, 'k')
        cel(l, polym([(79, 43), (78, 35), (82, 34), (83, 42)]), 's', 'S', 1, 1)   # thumb
    fg.paste(obj(hand))

    def coin(l):
        cel(l, ellm(73, 12, 88, 27), 'y', 'Y', 2, 2)
        l.ring(76, 15, 85, 24, 'Y')
    fg.paste(obj(coin))
    return finish(bg, fg).rows(), pal


# ---------------------------------------------------------------- Launderers
def launderers():
    import math
    bgc, bgd = '#9ea6b0', '#79828e'
    pal = {'k': INK, 'A': bgc, 'a': bgd, 'w': W, 'W': W2,
           'u': '#bfe0ea', 'U': '#8fbccb', 'n': CASH, 'N': CASH2,
           's': OLIVE[0], 'S': OLIVE[1], 'd': DEEP[0], 'D': DEEP[1],
           't': '#3f9a92', 'T': '#2c7069', 'j': '#e0a43e', 'J': '#ad7a26',
           'h': '#2b2024', 'q': '#c99a5b', 'Q': '#94683a', 'x': '#d65a4a', 'X': '#a8403a',
           'i': '#8a5434'}
    bg = C(N); bg.rect(0, 0, N - 1, N - 1, 'A')
    # a row of machines along the back wall, in the darker grey
    for x0 in (0, 32, 64):
        bg.rect(x0 + 2, 30, x0 + 29, 72, 'a')
        bg.ell(x0 + 7, 42, x0 + 24, 59, 'A'); bg.ell(x0 + 10, 45, x0 + 21, 56, 'a')
        bg.rect(x0 + 5, 33, x0 + 12, 35, 'A')
    bg.rect(0, 72, 95, 95, 'a')
    fg = C(N)
    fg.line(0, 8, 95, 12, 'k')                                          # clothesline

    def shirt(l):
        cel(l, polym([(4, 10), (10, 9), (14, 12), (18, 9), (24, 10), (27, 17), (23, 18), (23, 32), (5, 32), (5, 18), (1, 17)]), 'x', 'X', 3, 2)
        l.vl(14, 13, 31, 'k')
        l.poly([(10, 9), (14, 12), (18, 9), (14, 15)], 'X')              # collar
        for y in (18, 23, 28):
            l.px(15, y, 'w')
    fg.paste(obj(shirt))

    def bill(l, x0, y0):
        l.rect(x0, y0, x0 + 15, y0 + 8, 'n'); l.hl(x0, x0 + 15, y0 + 8, 'N'); l.vl(x0 + 15, y0, y0 + 8, 'N')
        l.ell(x0 + 5, y0 + 2, x0 + 10, y0 + 6, 'N')
    fg.paste(obj(lambda l: bill(l, 32, 11)))
    fg.paste(obj(lambda l: bill(l, 50, 12)))

    def pegs(l):
        for x, y in ((7, 8), (21, 9), (35, 9), (44, 9), (53, 10), (62, 10)):
            l.rect(x, y - 2, x + 1, y + 3, 'q')
    fg.paste(obj(pegs))

    # B, right: pegging the next note
    def pb(l):
        cel(l, polym([(62, 96), (64, 62), (72, 57), (86, 57), (94, 62), (96, 96)]), 'j', 'J', 4, 3)
        cel(l, ellm(67, 34, 86, 56), 'd', 'D', 2, 2)
        for x, y in ellm(66, 31, 87, 52):
            if y <= 38 or (y <= 42 and (x <= 68 or x >= 85)):
                l.px(x, y, 'h')
        for ex in (71, 79):                                             # eyes up at the line
            l.hl(ex, ex + 2, 41, 'k'); l.px(ex, 42, 'w'); l.px(ex + 1, 42, 'i')
        l.line(70, 38, 73, 38, 'k'); l.line(79, 38, 82, 38, 'k')
        l.poly([(75, 43), (78, 43), (78, 48), (74, 48)], 'D')
        l.line(73, 51, 74, 52, 'k'); l.hl(75, 78, 52, 'k'); l.line(79, 52, 80, 51, 'k')
    fg.paste(obj(pb))
    fg.paste(obj(lambda l: cel(l, polym([(84, 62), (91, 60), (90, 30), (83, 30)]), 'j', 'J', 2, 2)))
    fg.paste(obj(lambda l: bill(l, 68, 13)))
    fg.paste(obj(lambda l: l.rect(72, 9, 73, 15, 'q')))

    def pb_hand(l):  # forearm up, hand gripping the note's corner, thumb in front
        cel(l, polym([(83, 31), (90, 31), (89, 20), (83, 20)]), 'd', 'D', 1, 1)
        cel(l, polym([(81, 21), (80, 13), (84, 10), (90, 11), (91, 21)]), 'd', 'D', 1, 1)
        l.hl(85, 90, 14, 'k'); l.hl(85, 90, 17, 'k')                   # fingers
        l.line(84, 12, 84, 19, 'k')                                     # thumb edge
    fg.paste(obj(pb_hand))

    # A, middle: grinning, fanning a fistful of bills
    def pa(l):
        cel(l, polym([(34, 96), (36, 62), (42, 57), (58, 57), (64, 62), (66, 96)]), 't', 'T', 4, 3)
        cel(l, ellm(40, 34, 59, 56), 's', 'S', 2, 2)
        for x, y in ellm(38, 30, 61, 48):
            if y <= 38 or (y <= 44 and (x <= 41 or x >= 58)):
                l.px(x, y, 'h')
        cel(l, ellm(55, 26, 62, 33), 'h', 'h', 0, 0)                     # bun
        l.rect(44, 43, 45, 44, 'k'); l.rect(53, 43, 54, 44, 'k')
        l.line(43, 40, 46, 40, 'k'); l.line(52, 40, 55, 40, 'k')
        l.poly([(48, 44), (51, 44), (51, 48), (47, 48)], 'S')
        l.line(45, 50, 46, 51, 'k'); l.hl(47, 51, 52, 'k'); l.line(52, 51, 53, 50, 'k')
    fg.paste(obj(pa))

    def washer(l):
        cel(l, rectm(2, 54, 38, 95), 'w', 'W', 3, 0)
        l.hl(2, 38, 62, 'k')
        l.rect(6, 57, 14, 59, 'W'); l.rect(31, 57, 33, 59, 'k')
        l.ell(5, 66, 35, 93, 'k')
        l.ell(8, 69, 32, 90, 'u'); l.ell(16, 69, 32, 90, 'U', only='u')
        for x0, y0 in ((11, 76), (19, 72), (20, 81)):
            l.rect(x0, y0, x0 + 8, y0 + 4, 'n'); l.hl(x0, x0 + 8, y0 + 4, 'N'); l.px(x0 + 4, y0 + 2, 'N')
    fg.paste(obj(washer))

    def pa_arm(l):  # elbow on the washer, hand up by her face
        cel(l, polym([(36, 60), (42, 58), (44, 66), (36, 64)]), 't', 'T', 2, 2)
        cel(l, polym([(30, 50), (36, 50), (40, 60), (34, 62)]), 's', 'S', 1, 1)
    fg.paste(obj(pa_arm))

    def tilted(cx, cy, ang, w=8, h=15):
        a = math.radians(ang)
        def r(px, py):
            return (cx + px * math.cos(a) - py * math.sin(a), cy + px * math.sin(a) + py * math.cos(a))
        return [r(-w / 2, -h), r(w / 2, -h), r(w / 2, 0), r(-w / 2, 0)]

    for ang in (-32, 0, 32):
        def fan(l, ang=ang):
            P = tilted(32, 50, ang)
            m = polym(P)
            cel(l, m, 'n', 'N', 2, 2)
            cx = sum(p[0] for p in P) / 4; cy = sum(p[1] for p in P) / 4
            l.ell(int(cx) - 1, int(cy) - 2, int(cx) + 1, int(cy) + 2, 'N')
        fg.paste(obj(fan))

    def pa_hand(l):
        cel(l, polym([(27, 46), (35, 45), (37, 53), (29, 54)]), 's', 'S', 1, 1)
        l.hl(29, 35, 49, 'k'); l.hl(30, 35, 51, 'k')
    fg.paste(obj(pa_hand))

    def basket(l):
        cel(l, polym([(54, 78), (95, 78), (91, 95), (58, 95)]), 'q', 'Q', 3, 2)
        for y in (83, 88):
            l.hl(56, 93, y, 'Q')
        l.rect(52, 76, 95, 79, 'Q')
    fg.paste(obj(basket))
    for x0, y0 in ((56, 71), (68, 69), (80, 71)):
        fg.paste(obj(lambda l, x0=x0, y0=y0: (l.rect(x0, y0, x0 + 12, y0 + 6, 'n'), l.hl(x0, x0 + 12, y0 + 6, 'N'),
                                              l.ell(x0 + 4, y0 + 1, x0 + 8, y0 + 5, 'N'))))
    fg.paste(obj(basket))
    return finish(bg, fg).rows(), pal


PORTRAITS = [
    ('kingpin', 'Kingpin', kingpin),
    ('mob', 'Mob', mob),
    ('tiebreaker', 'Tiebreaker', tiebreaker),
    ('launderers', 'Launderers', launderers),
]
