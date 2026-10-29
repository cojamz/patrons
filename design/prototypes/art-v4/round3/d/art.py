"""Style D, storybook vignette: 64x64. No black ink: every object is outlined in a darker shade of its own
colour, on all sides. Soft, muted, warm picture-book palette. The scene sits in a rounded arch on the card
colour, the setting stepping out to the edge in two flat tints. Gentle faces, half-body figures."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from lib import C

STYLE = {
    'title': 'D  Storybook vignette  (64x64: own-colour outlines, muted warm palette, arch vignette)',
    'short': 'D Storybook vignette',
    'sub': '64x64, arch, soft outlines',
}

N = 64
CARD = (0xe9, 0xdc, 0xc4)


def mix(hexc, t):
    """Blend a colour toward the card colour by t (0 = colour, 1 = card)."""
    h = hexc.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    r, g, b = (round(v + (cv - v) * t) for v, cv in zip((r, g, b), CARD))
    return '#%02x%02x%02x' % (r, g, b)


# ------------------------------------------------------------------ kit
def own_outline(l, dark):
    """Every empty pixel touching the object takes the darker shade of the colour it touches."""
    add = []
    for y in range(l.h):
        for x in range(l.w):
            if l.g[y][x] != '.':
                continue
            for dx, dy in ((0, 1), (1, 0), (-1, 0), (0, -1)):
                v = l.get(x + dx, y + dy)
                if v in dark:
                    add.append((x, y, dark[v])); break
    for x, y, k in add:
        l.g[y][x] = k


def obj(c, fn, dark):
    l = C(N)
    fn(l)
    own_outline(l, dark)
    c.paste(l)
    return l


def arch_inside(x, y, top=1):
    cx, r = 31.5, 30.0
    cy = top + r
    if x < 2 or x > 61:
        return False
    return y >= cy or (abs(x - cx) / r) ** 3 + (abs(y - cy) / r) ** 3 <= 1.0


def vignette(c, paint, steps, top=1):
    """paint(l) fills the setting; then the arch masks it and the outer band steps toward the card.
    steps: key -> (outer key, inner key)."""
    l = C(N)
    paint(l)
    inside = [[arch_inside(x, y, top) for x in range(N)] for y in range(N)]
    # inset distance from the arch edge (sides and top only; the bottom is the card edge)
    INF = 99
    d = [[0 if not inside[y][x] else INF for x in range(N)] for y in range(N)]
    for _ in range(5):
        for y in range(N):
            for x in range(N):
                if not inside[y][x]:
                    continue
                best = d[y][x]
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < N and 0 <= yy < N:
                        best = min(best, d[yy][xx] + 1)
                    elif yy < 0 or xx < 0 or xx >= N:
                        best = min(best, 1)
                d[y][x] = best
    for y in range(N):
        for x in range(N):
            if not inside[y][x]:
                l.g[y][x] = '.'
                continue
            k = l.g[y][x]
            if k in steps:
                if d[y][x] <= 2:
                    l.g[y][x] = steps[k][0]
                elif d[y][x] <= 4:
                    l.g[y][x] = steps[k][1]
    c.paste(l)


def tones(pal, key, base, shade, line):
    """key = base, key.upper() = shade, line key given separately."""
    pal[key] = base
    if shade:
        pal[key.upper()] = shade
    return line


# skin: base, shade, line
PALE = ('#f3d6c1', '#e2b9a0', '#bd8a70')
LIGHT = ('#ecc29f', '#d8a47f', '#b07a58')
OLIVE = ('#d3a477', '#ba8a5c', '#8e6541')
MED = ('#b07650', '#94603e', '#6e442b')
DEEP = ('#83503a', '#6c402d', '#4c2c1e')
VDEEP = ('#5b3527', '#4a2a1e', '#331d14')
BLUSH = '#e79f8f'



def head(l, x0, y0, skin, w=13, h=14, ear=1):
    """Rounded head shape (no features). ear: 1 = right ear, -1 = left, 0 none."""
    x1, y1 = x0 + w - 1, y0 + h - 1
    l.rect(x0 + 2, y0, x1 - 2, y0, skin)
    l.rect(x0 + 1, y0 + 1, x1 - 1, y0 + 1, skin)
    l.rect(x0, y0 + 2, x1, y1 - 4, skin)
    l.rect(x0 + 1, y1 - 3, x1 - 1, y1 - 2, skin)
    l.rect(x0 + 2, y1 - 1, x1 - 2, y1 - 1, skin)
    l.rect(x0 + 4, y1, x1 - 4, y1, skin)
    if ear == 1:
        l.rect(x1 + 1, y0 + 5, x1 + 1, y0 + 7, skin)
    elif ear == -1:
        l.rect(x0 - 1, y0 + 5, x0 - 1, y0 + 7, skin)


# ---------------------------------------------------------------- Kingpin
def kingpin():
    c = C(N)
    pal = {}
    e = '#3a2631'
    pal['e'] = e
    pal['w'], pal['W'], pal['V'] = '#c99aa4', mix('#c99aa4', .62), mix('#c99aa4', .32)   # wall + steps
    pal['a'], pal['A'], pal['q'] = LIGHT                                                 # skin
    pal['1'], pal['2'], pal['3'] = '#b5527f', '#954169', '#6f2d4e'                       # suit
    pal['c'] = '#f4ead9'                                                                 # shirt
    pal['h'] = '#4c3946'                                                                 # hat (line e)
    pal['o'], pal['O'], pal['p'] = '#a86c43', '#8c5734', '#633b22'                       # desk
    pal['y'] = '#d8ad57'                                                                 # brass (line p)
    pal['l'], pal['L'] = '#71a074', '#4a6f4e'                                            # lamp shade, line
    pal['g'] = '#f6dc8c'                                                                 # glow
    pal['n'], pal['N'] = '#a9c88b', '#86a96b'                                            # cash (line L)
    pal['b'] = BLUSH

    vignette(c, lambda l: l.rect(0, 0, N - 1, N - 1, 'w'), {'w': ('W', 'V')})

    # lamp light pooled on the wall behind the lamp
    def body(l):
        l.poly([(15, 64), (16, 36), (20, 31), (26, 29), (38, 29), (44, 31), (48, 36), (49, 64)], '1')
        l.poly([(41, 29), (44, 31), (48, 36), (49, 64), (42, 64)], '2', only='1')
        l.poly([(27, 29), (37, 29), (32, 39)], 'c')                    # shirt V
        l.poly([(25, 29), (28, 29), (32, 40), (30, 40)], '2', only='1c')  # lapel line left
        l.poly([(36, 29), (39, 29), (34, 40), (32, 40)], '2', only='1c')  # lapel right
        l.rect(31, 30, 33, 31, 'h')                                    # tie knot
        l.poly([(31, 32), (33, 32), (34, 38), (32, 40), (30, 38)], 'h')
        l.rect(28, 26, 36, 29, 'A')                                    # neck
    obj(c, body, {'1': '3', '2': '3', 'A': 'q', 'c': '3', 'h': '3'})

    def face(l):
        head(l, 26, 13, 'a')
        l.hl(27, 37, 13, 'A'); l.hl(26, 38, 14, 'A')                  # brim shadow
        l.stamp(26, 13, [
            ".............",
            ".............",
            ".............",
            ".............",
            "..qq.....qq..",
            ".............",
            "..ee.....ee..",
            "......A......",
            ".bb...q....bb",
            "...q.....q...",
            "....qqqqq....",
        ])
    obj(c, face, {'a': 'q', 'A': 'q'})

    def hat(l):
        l.rect(26, 6, 38, 13, 'h'); l.hl(27, 37, 5, 'h')
        l.hl(31, 33, 5, '.'); l.px(26, 6, '.'); l.px(38, 6, '.')     # soft crown dent
        l.rect(26, 11, 38, 12, '1')                                    # magenta band
        l.rect(21, 13, 43, 14, 'h'); l.hl(22, 42, 15, '.')
    obj(c, hat, {'h': 'e', '1': 'e'})

    def lamp(l):
        l.rect(5, 41, 17, 43, 'y'); l.hl(7, 15, 40, 'y')
        l.rect(11, 33, 11, 39, 'y')
        l.poly([(4, 33), (7, 27), (15, 27), (18, 33)], 'l')
        l.hl(5, 17, 33, 'g'); l.hl(6, 16, 34, 'g')
    obj(c, lamp, {'y': 'p', 'l': 'L', 'g': 'y'})

    def desk(l):
        l.rect(0, 44, 63, 47, 'o'); l.hl(0, 63, 47, 'O')
        l.rect(0, 48, 63, 63, 'O')
        l.rect(4, 51, 22, 63, 'o'); l.rect(41, 51, 59, 63, 'o')      # drawers
        l.hl(11, 15, 56, 'y'); l.hl(48, 52, 56, 'y')
    obj(c, desk, {'o': 'p', 'O': 'p', 'y': 'p'})

    def cash(l):
        for x0, y0, layers in ((46, 35, 3), (54, 38, 2)):
            for i in range(layers):
                y = y0 + i * 3
                l.rect(x0, y, x0 + 9, y + 2, 'n'); l.hl(x0, x0 + 9, y + 2, 'N')
                l.rect(x0 + 4, y, x0 + 5, y + 2, 'c')
    obj(c, cash, {'n': 'L', 'N': 'L', 'c': 'L'})

    def arms(l):
        l.poly([(15, 38), (20, 36), (28, 41), (27, 46), (17, 46)], '1')   # forearms on the desk
        l.poly([(49, 38), (44, 36), (36, 41), (37, 46), (47, 46)], '2')
        # clasped hands: his right over his left, knuckles and a thumb
        l.stamp(27, 39, [
            "...aa.aa...",
            ".aaaaaaaaa.",
            "aaqaqaqaqaa",
            "aaqaqaqaqaa",
            ".aaaaaaaaa.",
            "..AAAAAAA..",
        ])
    obj(c, arms, {'1': '3', '2': '3', 'a': 'q', 'A': 'q'})
    return c.rows(), pal


# ---------------------------------------------------------------- Mob
def mob():
    c = C(N)
    pal = {'e': '#2b1e1d', 'k': '#4b3631'}
    sk = {'p': PALE, 'l': LIGHT, 'o': OLIVE, 'm': MED, 'v': VDEEP}
    line = {}
    for key, t in sk.items():
        pal[key] = t[0]; pal[key.upper()] = t[2]; line[key] = key.upper()
    pal['1'], pal['2'], pal['3'] = '#cd5f50', '#ad4a40', '#7c3029'      # red clothes
    pal['r'], pal['R'] = '#9a6a42', '#684429'                            # wood, hair brown
    pal['t'], pal['T'] = '#d2ccc1', '#8e877f'                            # tines, collar
    pal['y'], pal['f'] = '#f5d47a', '#e48b4c'                            # flame, ginger
    pal['s'], pal['S'], pal['u'] = '#a99cb5', mix('#a99cb5', .62), mix('#a99cb5', .32)   # dusk sky + steps
    dark = dict(line, **{'1': '3', '2': '3', 'r': 'R', 'R': 'e', 't': 'T', 'k': 'e', 'y': 'f', 'f': '3'})

    def sky(l):
        l.rect(0, 0, N - 1, N - 1, 's')
        l.ell(31, 0, 47, 17, 'S')                                        # torch glow on the dusk sky
    vignette(c, sky, {'s': ('S', 'u')})
    c.ell(34, 2, 48, 15, 'u', only='s') if False else None

    def fork(l, x):
        l.vl(x, 17, 30, 'r')                                             # shaft
        l.hl(x - 2, x + 2, 17, 't')                                      # crossbar
        for tx in (x - 2, x, x + 2):
            l.vl(tx, 11, 17, 't')

    def fist(l, x0, y0, skin):
        """Fist around a vertical shaft, knuckles toward us."""
        l.rect(x0, y0, x0 + 4, y0 + 3, skin)
        l.px(x0, y0, '.'); l.px(x0 + 4, y0 + 3, '.')
        l.pts(skin.upper(), [(x0 + 1, y0 + 1), (x0 + 3, y0 + 1)])

    def person(l, x0, y0, skin, w=11, h=12, ear=1, cloth='2', shw=4):
        l.poly([(x0 - shw, 64), (x0 - shw + 1, y0 + h + 4), (x0 + 1, y0 + h + 1), (x0 + w - 2, y0 + h + 1),
                (x0 + w + shw - 2, y0 + h + 4), (x0 + w + shw - 1, 64)], cloth)
        l.rect(x0 + w // 2 - 2, y0 + h - 1, x0 + w // 2 + 2, y0 + h + 1, skin.upper())
        head(l, x0, y0, skin, w, h, ear)

    # back left: pale, ginger, shouting, pitchfork
    def bl(l):
        fork(l, 8)
        l.rect(7, 23, 10, 34, '2')                                        # raised sleeve
        person(l, 12, 19, 'p', ear=0, cloth='2')
        l.rect(12, 18, 22, 21, 'f'); l.hl(13, 21, 17, 'f'); l.rect(11, 20, 12, 23, 'f'); l.rect(22, 20, 23, 23, 'f')
        l.stamp(12, 19, ["...........", "...........", "...........",
                         "..e.....e..", "...e...e...", "...e...e...", "...........",
                         "....eee....", "....eee....", ".....e....."])
        fist(l, 6, 21, 'p')
    obj(c, bl, dark)

    # back right: olive, frowning, pitchfork
    def br(l):
        fork(l, 55)
        l.rect(53, 23, 56, 34, '2')
        person(l, 42, 19, 'o', ear=0, cloth='2')
        l.rect(42, 18, 52, 21, 'k'); l.hl(43, 51, 17, 'k'); l.rect(51, 20, 53, 26, 'k'); l.rect(41, 20, 42, 24, 'k')
        l.stamp(42, 19, ["...........", "...........", "...........",
                         "..e.....e..", "...e...e...", "...e...e...", "...........",
                         "....OOO....", "...O...O..."])
        fist(l, 53, 21, 'o')
    obj(c, br, dark)

    # lead, centre front: light, brown hair, shouting, torch held high
    def lead(l):
        l.vl(39, 12, 26, 'r')                                            # torch stick
        l.rect(38, 22, 41, 40, '1')                                      # raised sleeve
        person(l, 25, 27, 'l', w=13, h=14, ear=-1, cloth='1', shw=6)
        l.poly([(28, 42), (35, 42), (31, 46)], 't')                      # shirt collar
        l.rect(25, 26, 37, 28, 'r'); l.hl(26, 36, 25, 'r'); l.rect(24, 28, 25, 32, 'r'); l.rect(26, 29, 29, 29, 'r'); l.px(37, 29, 'r')
        l.pts('r', [(29, 24), (30, 24), (30, 23)])                   # a tuft
        l.stamp(25, 27, ["..............", "..............", "..............",
                         "..e.......e...", "...e.....e....", "...ee...ee....", "..............",
                         "......L.......", ".....eeee.....", "....eeeeee....", "....eeeeee....", ".....eeee....."])
        fist(l, 37, 19, 'l')
    obj(c, lead, dark)

    def flame(l):
        l.poly([(35, 12), (36, 7), (39, 2), (42, 7), (43, 12)], 'f')
        l.poly([(37, 12), (38, 8), (39, 6), (40, 8), (41, 12)], 'y')
        l.hl(36, 42, 12, 'r'); l.hl(37, 41, 13, 'R')                     # wrapped head of the torch
    obj(c, flame, dark)

    # front left: mid, red knit cap, set jaw
    def fl(l):
        person(l, 4, 33, 'm', ear=1, cloth='2', shw=5)
        l.rect(4, 31, 14, 35, '1'); l.hl(5, 13, 30, '1'); l.hl(4, 14, 35, '3')
        l.stamp(4, 33, ["...........", "...........", "...........",
                        "..e.....e..", "...e...e...", "...e...e...", "...........",
                        "...........", "....MMM....", "...M...M..."])
    obj(c, fl, dark)

    # front right: very deep, close crop, determined (closed mouth)
    def fr(l):
        person(l, 49, 33, 'v', ear=-1, cloth='2', shw=5)
        l.rect(49, 32, 59, 34, 'k'); l.hl(50, 58, 31, 'k')
        l.pts('#', [])
        l.stamp(49, 33, ["...........", ".hh........", ".h.........",
                         "...........", "..e.....e..", "..e.....e..", "...........",
                         "...........", "....VVV....", "..........."], {'h': 'm'})
    obj(c, fr, dark)
    return c.rows(), pal


# ---------------------------------------------------------------- Tiebreaker
def tiebreaker():
    c = C(N)
    pal = {'e': '#24171a', 'k': '#38262a'}
    pal['a'], pal['A'], pal['q'] = VDEEP
    pal['H'] = '#7d4c36'                                                  # light on brow, nose bridge, cheekbone
    pal['L'] = '#8a4e40'                                                  # warm lips
    pal['c'], pal['d'], pal['D'] = '#f1e9da', '#45434a', '#2c2b31'        # shirt cream, charcoal, line
    pal['s'], pal['S'], pal['u'] = '#a9c3cc', mix('#a9c3cc', .62), mix('#a9c3cc', .32)   # sky
    pal['t'], pal['T'] = '#94a0a6', mix('#94a0a6', .45)                 # stand
    pal['g'], pal['G'], pal['j'] = '#88b072', '#7aa265', mix('#88b072', .45)            # pitch
    pal['y'], pal['Y'], pal['o'] = '#f3cd5e', '#dcae3e', '#9f7428'      # coin
    dark = {'a': 'q', 'A': 'q', 'H': 'q', 'c': 'D', 'd': 'D', 'k': 'e', 'y': 'o', 'Y': 'o'}

    def field(l):
        l.rect(0, 0, N - 1, 33, 's')
        l.rect(0, 34, N - 1, 39, 't')
        for x in range(0, N, 4):                                          # stand seats, a row of steps
            l.hl(x, x + 1, 35, 'T')
        l.rect(0, 40, N - 1, 63, 'g')
        for y in (44, 45, 50, 51, 56, 57):
            l.hl(0, N - 1, y, 'G')                                        # mowing stripes
        l.hl(0, N - 1, 47, 'c')                                           # touchline
    vignette(c, field, {'s': ('S', 'u'), 't': ('T', 'T'), 'g': ('j', 'j'), 'G': ('j', 'j'), 'c': ('j', 'j')})

    def flag(l):  # corner flag on the touchline
        l.vl(8, 27, 47, 'c')
        l.poly([(9, 27), (9, 33), (15, 30)], 'y')
    obj(c, flag, dark)

    def body(l):
        l.poly([(11, 64), (12, 40), (16, 34), (22, 31), (37, 31), (43, 34), (47, 40), (48, 64)], 'c')
        for x in range(N):
            if x % 4 in (0, 1):
                l.recolor('c', 'd', (x, 0, x, 63))
        l.rect(26, 28, 33, 31, 'A')                                       # neck
        l.poly([(24, 31), (35, 31), (32, 35), (27, 35)], 'd')             # black collar
        l.rect(27, 31, 32, 33, 'A'); l.hl(28, 31, 34, 'A')                # open neck
    obj(c, body, dark)

    def face(l):
        head(l, 23, 14, 'a', w=14, h=15, ear=-1)
        l.rect(24, 12, 35, 15, 'k'); l.hl(25, 34, 11, 'k'); l.px(23, 15, 'k'); l.px(36, 15, 'k')   # close crop
        l.stamp(23, 14, [
            "..............",
            "..............",
            "..HHH.........",
            "..............",
            "...ee....ee...",
            "...ee....ee...",
            "..........H...",
            ".HH....H......",
            "......AAA.....",
            "..............",
            "....L.....L...",
            ".....LLLLL....",
        ])
    obj(c, face, dark)

    def arm(l):  # his left arm bent up, thumb ready to flick
        l.poly([(42, 34), (47, 38), (50, 46), (46, 48), (41, 41)], 'c')
        for x in range(N):
            if x % 4 in (0, 1):
                l.recolor('c', 'd', (x, 34, x, 48))
        l.rect(46, 30, 50, 44, 'a'); l.vl(50, 30, 44, 'A')                # forearm
        l.rect(45, 25, 51, 30, 'a'); l.hl(46, 50, 31, 'A')                # fist
        l.pts('q', [(46, 27), (46, 29)])                                  # curled fingers
        l.rect(51, 23, 52, 26, 'a')                                       # thumb up
    obj(c, arm, dark)

    def coin(l):
        l.ell(47, 8, 54, 15, 'y')
        l.ell(51, 8, 55, 16, 'Y', only='y')
        l.px(49, 10, 'c'); l.px(49, 11, 'c'); l.px(50, 10, 'c')
    obj(c, coin, dark)
    return c.rows(), pal


# ---------------------------------------------------------------- Launderers
def launderers():
    c = C(N)
    pal = {'e': '#2b1f1d', 'k': '#3d2c28', 'h': '#6a4530'}
    pal['a'], pal['A'], pal['q'] = OLIVE
    pal['b'], pal['B'], pal['r'] = DEEP
    pal['H'] = '#9a6448'                                                  # light on her colleague's brow
    pal['1'], pal['2'], pal['3'] = '#a7adae', '#8a9192', '#5f6667'        # grey shirts
    pal['w'], pal['x'] = '#f3eee4', '#99928a'        # washer, rope
    pal['u'] = '#bcd6d8'                                                  # porthole glass
    pal['n'], pal['N'], pal['m'] = '#a6c78a', '#83a86a', '#58784a'        # bills
    pal['v'], pal['V'] = '#c6a46c', '#94733f'                             # wicker, pegs
    pal['s'], pal['S'], pal['t'] = '#b9d1cc', mix('#b9d1cc', .62), mix('#b9d1cc', .32)   # tiled wall
    dark = {'a': 'q', 'A': 'q', 'b': 'r', 'B': 'r', 'H': 'r', '1': '3', '2': '3', 'w': 'x', 'S': 'x',
            'u': 'x', 'n': 'm', 'N': 'm', 'v': 'V', 'k': 'e', 'h': 'e'}

    def wall(l):
        l.rect(0, 0, N - 1, N - 1, 's')
        for y in range(5, N, 7):
            l.hl(0, N - 1, y, 'S')
        for y0 in range(5, N, 7):
            off = 0 if (y0 // 7) % 2 else 4
            for x in range(off, N, 8):
                l.vl(x, y0, y0 + 7, 'S')
    vignette(c, wall, {'s': ('S', 't'), 'S': ('S', 't')})

    c.hl(4, 59, 11, 'x')                                                  # clothesline

    def shirt(l):  # a small shirt pegged by the shoulders
        l.rect(9, 12, 18, 22, 'w'); l.rect(6, 12, 8, 16, 'w'); l.rect(19, 12, 21, 16, 'w')
        l.hl(12, 15, 12, 'S'); l.px(13, 13, 'S'); l.px(14, 13, 'S')       # collar
        l.vl(13, 14, 22, 'S')                                             # button placket
    obj(c, shirt, dark)

    def bill(l, x0, y0):
        l.rect(x0, y0, x0 + 7, y0 + 5, 'n')
        l.ell(x0 + 3, y0 + 1, x0 + 4, y0 + 4, 'N')
    obj(c, lambda l: bill(l, 50, 12), dark)

    def person_a(l):  # left of centre: olive, bun, pegging a bill
        l.poly([(19, 64), (20, 42), (23, 38), (34, 38), (37, 42), (38, 64)], '1')
        l.rect(26, 34, 31, 38, 'A')
        head(l, 23, 23, 'a', w=12, h=13, ear=-1)
        l.rect(23, 22, 34, 25, 'h'); l.hl(24, 33, 21, 'h'); l.vl(34, 25, 28, 'h'); l.vl(23, 25, 26, 'h')
        l.ell(26, 16, 31, 21, 'h')                                        # bun
        l.stamp(23, 23, [
            "............",
            "............",
            "............",
            "............",
            "...e....e...",
            "..e.e..e.e..",
            "............",
            "......A.....",
            ".bb.......bb",
            "....q...q...",
            ".....qqq....",
        ], {'b': '#'})
        l.recolor('#', 'B')
        # raised arm, sleeve rolled to the elbow
        l.rect(34, 30, 38, 40, '1')
        l.hl(34, 38, 29, '2'); l.hl(34, 38, 30, '2')                      # rolled cuff
        l.rect(35, 19, 38, 28, 'a'); l.vl(38, 19, 28, 'A')
    obj(c, person_a, dark)

    obj(c, lambda l: bill(l, 39, 12), dark)

    def pegs(l):
        for x in (7, 20, 45, 51, 56):
            l.rect(x, 10, x, 13, 'v')
    obj(c, pegs, dark)

    def grip(l):  # her hand holding the bill's corner up to the line
        l.rect(34, 14, 39, 18, 'a'); l.hl(35, 38, 13, 'a')
        l.pts('q', [(36, 14), (38, 14)]); l.vl(34, 15, 17, 'A')
    obj(c, grip, dark)

    def washer(l):
        l.rect(2, 31, 20, 63, 'w'); l.vl(20, 31, 63, 'S')
        l.hl(2, 20, 36, 'S')                                              # panel line
        l.rect(4, 32, 9, 34, 'S')                                         # soap drawer
        l.ell(15, 32, 18, 35, 'x')                                        # dial
        l.ell(3, 39, 19, 55, 'x')                                         # porthole rim
        l.ell(5, 41, 17, 53, 'u')
        for bx, by in ((6, 44), (10, 48), (8, 51)):
            l.rect(bx, by, bx + 5, by + 2, 'n'); l.hl(bx, bx + 5, by + 2, 'N'); l.px(bx + 2, by + 1, 'N')
        l.hl(2, 20, 59, 'S')
    obj(c, washer, dark)

    def person_b(l):  # right: deep, close hair, holding the basket
        l.poly([(36, 64), (37, 43), (40, 40), (52, 40), (55, 43), (56, 64)], '2')
        l.rect(43, 36, 48, 40, 'B')
        head(l, 40, 25, 'b', w=12, h=13, ear=1)
        l.rect(40, 24, 51, 27, 'k'); l.hl(41, 50, 23, 'k'); l.px(40, 28, 'k'); l.px(51, 28, 'k')
        l.stamp(40, 25, [
            "............",
            "............",
            "............",
            ".HH.........",
            "............",
            "...ee...ee..",
            "...ee...ee..",
            "......H.....",
            ".......B....",
            "............",
            "....r....r..",
            ".....rrrr...",
        ])
    obj(c, person_b, dark)

    def basket(l):
        # heap of bills on top, laid like bricks
        for bx, by in ((40, 42), (48, 43), (35, 45), (43, 45), (51, 46), (38, 47), (46, 48), (54, 48)):
            l.rect(bx, by, bx + 7, by + 3, 'n')
            l.hl(bx, bx + 7, by + 3, 'N'); l.vl(bx + 7, by, by + 3, 'N')
            l.px(bx + 3, by + 1, 'N'); l.px(bx + 4, by + 1, 'N')
        l.poly([(32, 50), (61, 50), (58, 64), (35, 64)], 'v')
        for y in (54, 58, 62):
            l.hl(33, 60, y, 'V')
        l.hl(32, 61, 50, 'V')
    obj(c, basket, dark)

    def hands(l):  # gripping the rim, sleeves rolled
        l.rect(31, 44, 35, 47, '2'); l.rect(32, 48, 35, 52, 'b'); l.hl(32, 35, 52, 'B')
        l.rect(56, 44, 60, 47, '2'); l.rect(56, 48, 59, 52, 'b'); l.hl(56, 59, 52, 'B')
    obj(c, hands, dark)
    return c.rows(), pal


PORTRAITS = [
    ('kingpin', 'Kingpin', kingpin),
    ('mob', 'Mob', mob),
    ('tiebreaker', 'Tiebreaker', tiebreaker),
    ('launderers', 'Launderers', launderers),
]
