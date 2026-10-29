# Batch b kit: shared hand-drawn face templates and features (faces stay hand-drawn rows; this only saves retyping).
# Keys are written for person 0 (ABCD skin, EFGH hair) and translated for persons 1 and 2.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas, step, darkest

TR = {0: str.maketrans('', ''), 1: str.maketrans('ABCDEFGH', 'IJKLMNOP'), 2: str.maketrans('ABCDEFGH', 'QRSTUVWX')}

def new():
    return Canvas()

def put(c, x, y, rows, n=0, keep='. '):
    c.put(x, y, [r.translate(TR[n]) for r in rows], keep)

def seg(c, rows, n=0):
    for y, parts in rows.items():
        for x, s in parts: c.put(x, y, [s.translate(TR[n])])

# ---------------------------------------------------------------- face templates (skin only; features go on top)
# Each: rows (top row first), the top y offset from the eye line, the near/far eye columns, nose column, mouth row.
# Light from the top-left: the far (right) side of the face is the B/A shadow plane, the near cheek gets a D cluster.
T = {}
# single person, 18 wide, front, oval jaw
T['oval'] = dict(top=-7, rows=[
    '...CCCCCCCCCCCB...',
    '.CCCCCCCCCCCCCBB..',
    'CCCCCCCCCCCCCCBBB.',
    'CDDCCCCCCCCCCCBBBA',
    'CCCCCCCCCCCCCCBBBA',
    'CCCCCCCCCCCCCCBBBA',  # brows
    'CBBBBBCCBBBBBCBBBA',  # brow shadow / upper lids
    'CCCCCCCCCCCCCCBBBA',  # eye line
    'CDDDDCCCCCCCCBBBBA',
    'CDDDCCCDCCCCCBBBBA',
    'CCDCCCCDBCCCCBBBBA',
    '.CCCCCCAABCCCBBBA.',
    '.CCCCCCCCCCCCBBBA.',
    '..CCCCCCCCCCCBBA..',
    '..BCCCCCCCCCBBBA..',
    '...BBCCCCCCBBBA...',
    '.....ABBBBBBAA....',
], eyes=(2, 9), nose=7, mouth=6, w=18)
# single, 18 wide, front, square heavy jaw (big men)
T['square'] = dict(top=-7, rows=[
    '..CCCCCCCCCCCCB...',
    '.CCCCCCCCCCCCCBB..',
    'CCCCCCCCCCCCCCBBB.',
    'CDDCCCCCCCCCCCBBBA',
    'CCCCCCCCCCCCCCBBBA',
    'CCCCCCCCCCCCCCBBBA',
    'CBBBBBCCBBBBBCBBBA',
    'CCCCCCCCCCCCCCBBBA',
    'CDDDDCCCCCCCCBBBBA',
    'CDDDCCCDCCCCCBBBBA',
    'CCDCCCCDBCCCCBBBBA',
    'CCCCCCCAABCCCBBBBA',
    'CCCCCCCCCCCCCBBBBA',
    'CCCCCCCCCCCCCBBBBA',
    'BCCCCCCCCCCCBBBBAA',
    '.BBCCCCCCCCBBBBAA.',
    '..ABBBBBBBBBBAA...',
], eyes=(2, 9), nose=7, mouth=6, w=18)
# single, 18 wide, 3/4 turned to our right: far eye small, nose inside the far contour, far cheek in shadow
T['q34'] = dict(top=-7, rows=[
    '...CCCCCCCCCCB....',
    '.CCCCCCCCCCCCBB...',
    'CCCCCCCCCCCCCBBB..',
    'CDDCCCCCCCCCCCBBA.',
    'CCCCCCCCCCCCCCBBA.',
    'CCCCCCCCCCCCCCCBA.',
    'CBBBBBCCCBBBCBBBA.',
    'CCCCCCCCCCCCCBBBA.',
    'CDDDDCCCCCCCBBBBA.',
    'CDDDDCCCCCDCCBBBA.',
    'CCDDCCCCCCDCBBBBA.',
    'CCCCCCCCCAAABBBBA.',
    '.CCCCCCCCCCCCBBA..',
    '.CCCCCCCCCCCCBBA..',
    '..BCCCCCCCCCBBA...',
    '...BBCCCCCBBBA....',
    '.....ABBBBBAA.....',
], eyes=(3, 10), nose=10, mouth=7, w=18)
# single, 18 wide, 3/4 turned to our left (toward the light): far eye small on the left, broad lit near cheek
T['q34L'] = dict(top=-7, rows=[
    '....CCCCCCCCCB....',
    '...CDCCCCCCCCBB...',
    '..CDCCCCCCCCCCBB..',
    '.CDDCCCCCCCCCCBBA.',
    '.CDCCCCCCCCCCCBBA.',
    '.CCCCCCCCCCCCCBBA.',
    '.CBBBCCCBBBBBCBBA.',
    '.CCCCCCCCCCCCCBBA.',
    '.CCCCCDDDDDCCBBBA.',
    '.CDCCCDDDDCCCBBBA.',
    '.CDBCCCDDCCCCBBBA.',
    '.CAAACCCCCCCCBBBA.',
    '..CCCCCCCCCCCBBA..',
    '..CCCCCCCCCCBBBA..',
    '...CCCCCCCCCBBA...',
    '....BCCCCCBBBA....',
    '......ABBBBAA.....',
], eyes=(2, 8), nose=3, mouth=5, w=18)
# single, 16 wide, long gaunt face
T['long'] = dict(top=-7, rows=[
    '..CCCCCCCCCCB...',
    '.CCCCCCCCCCCBB..',
    'CCCCCCCCCCCCBBB.',
    'CDDCCCCCCCCCBBBA',
    'CCCCCCCCCCCCBBBA',
    'CCCCCCCCCCCCBBBA',
    'CBBBBCCBBBBCBBBA',
    'CCCCCCCCCCCCBBBA',
    'CDDDCCCCCCCBBBBA',
    'BDDCCCDCCCCBBBBA',
    'BCCCCCDBCCCBBBBA',
    'BCCCCCAABCCBBBBA',
    '.BCCCCCCCCCBBBA.',
    '.BCCCCCCCCCBBBA.',
    '..BCCCCCCCBBBA..',
    '..BBCCCCCCBBBA..',
    '...BBCCCCBBBA...',
    '....ABBBBBAA....',
], eyes=(2, 8), nose=6, mouth=6, w=16)
# single, 18 wide, round full face
T['round'] = dict(top=-7, rows=[
    '....CCCCCCCCCB....',
    '..CCCCCCCCCCCCBB..',
    '.CCCCCCCCCCCCCBBB.',
    'CCDDCCCCCCCCCCCBBA',
    'CDDCCCCCCCCCCCCBBA',
    'CCCCCCCCCCCCCCCBBA',
    'CBBBBBCCBBBBBCCBBA',
    'CCCCCCCCCCCCCCBBBA',
    'CDDDDCCCCCCCCDBBBA',
    'CDDDDCCDCCCCCBBBBA',
    'CDDDCCCDBCCCCBBBBA',
    'CCCCCCCAABCCCBBBBA',
    'CCCCCCCCCCCCCBBBBA',
    '.CCCCCCCCCCCCBBBA.',
    '.BCCCCCCCCCCBBBBA.',
    '..BBCCCCCCCBBBAA..',
    '....ABBBBBBBBA....',
], eyes=(2, 9), nose=7, mouth=6, w=18)
# two-person front head, 16 wide
T['f16'] = dict(top=-7, rows=[
    '..CCCCCCCCCCB...',
    '.CCCCCCCCCCCBB..',
    'CCCCCCCCCCCCBBB.',
    'CDDCCCCCCCCCBBBA',
    'CCCCCCCCCCCCBBBA',
    'CCCCCCCCCCCCBBBA',
    'CBBBBCCBBBBCBBBA',
    'CCCCCCCCCCCCBBBA',
    'CDDDCCCCCCCBBBBA',
    'CDDDCCDCCCCBBBBA',
    'CCDCCCDBCCCBBBBA',
    '.CCCCCAABCCBBBA.',
    '.CCCCCCCCCCBBBA.',
    '..BCCCCCCCCBBA..',
    '...BBCCCCCBBA...',
    '.....ABBBBAA....',
], eyes=(2, 8), nose=6, mouth=6, w=16)
T['f16q'] = dict(top=-7, rows=[
    '..CCCCCCCCCB....',
    '.CCCCCCCCCCBB...',
    'CCCCCCCCCCCBBB..',
    'CDDCCCCCCCCCBBA.',
    'CCCCCCCCCCCCBBA.',
    'CCCCCCCCCCCCCBA.',
    'CBBBBCCCBBBBBBA.',
    'CCCCCCCCCCCBBBA.',
    'CDDDCCCCCCBBBBA.',
    'CDDDCCCCCDCBBBA.',
    'CCDCCCCCCDCBBBA.',
    'CCCCCCCCAAABBBA.',
    '.CCCCCCCCCCBBA..',
    '..BCCCCCCCCBBA..',
    '...BBCCCCCBBA...',
    '.....ABBBBAA....',
], eyes=(3, 9), nose=9, mouth=6, w=16)
# behind head, 13 wide (drawn in full value, the depth shift darkens it afterwards)
T['b13'] = dict(top=-6, rows=[
    '..CCCCCCCCB..',
    '.CCCCCCCCCBB.',
    'CCCCCCCCCCBBA',
    'CDCCCCCCCCBBA',
    'CCCCCCCCCCBBA',
    'CBBBCCBBBCBBA',
    'CCCCCCCCCCBBA',
    'CDDCCCCCCBBBA',
    'CDCCCDCCCBBBA',
    'CCCCCABCCBBBA',
    '.CCCCCCCCBBA.',
    '.BCCCCCCCBBA.',
    '..BBCCCCBBA..',
    '....ABBBAA...',
], eyes=(1, 6), nose=5, mouth=5, w=13)
T['b13q'] = dict(top=-6, rows=[
    '..CCCCCCCB...',
    '.CCCCCCCCBB..',
    'CCCCCCCCCBBA.',
    'CDCCCCCCCCBA.',
    'CCCCCCCCCCBA.',
    'CBBBCCCBBBBA.',
    'CCCCCCCCCBBA.',
    'CDDCCCCCCBBA.',
    'CDCCCCCDCBBA.',
    'CCCCCCAAABBA.',
    '.CCCCCCCCBA..',
    '.BCCCCCCCBA..',
    '..BBCCCCBA...',
    '....ABBAA....',
], eyes=(2, 7), nose=7, mouth=5, w=13)

def face(c, tpl, x0, eye, n=0, eyes='open', brows='level', mouth='smile', near=None, far=None, glow=False, iris=None):
    """Lay a template at x0 with its eye line on row eye, then the features. Returns the template (for anchors).
    glow (deep skin): light the face, not the tone: a forehead and cheekbone highlight, a lit nose bridge."""
    t = T[tpl]
    y0 = eye + t['top']
    put(c, x0, y0, t['rows'], n)
    if glow:
        D = 'D'.translate(TR[n]); C = 'C'.translate(TR[n])
        ne = t['eyes'][0]; ns = t['nose']
        zone = (c.ellipse(x0 + ne + 2.5, y0 + 3, 4.2, 1.8) | c.ellipse(x0 + ne + 1.5, eye + 2, 2.6, 1.6)
                | c.rect(x0 + ns, eye, x0 + ns, eye + 2))
        c.fill(zone, D, only=C)
    ne, fe = t['eyes']
    small = t['w'] <= 13
    eye_(c, x0 + ne, eye, eyes, 'near', n, small, iris)
    eye_(c, x0 + fe, eye, eyes, 'far', n, small, iris)
    brow(c, x0 + ne, x0 + fe, eye, brows, n, small)
    mouth_(c, x0 + t['nose'] - (1 if tpl not in ('q34', 'f16q', 'b13q', 'q34L') else 2), eye + t['mouth'], mouth, n, small)
    return t

EYES = {  # (near rows, far rows); the bottom row sits on the eye line. A (the darkest skin step) is the warm iris.
    'open':   (['.zzz', 'yAzy'], ['zzz', 'Azy']),            # iris and pupil, a lid only over the iris
    'round':  (['.zz.', 'yAzy', '.BB.'], ['.zz', 'Azy', '.BB']),  # rounder, lower lid in shadow
    'wide':   (['.zz.', 'zy!z', 'yzzB'], ['.zz', 'zy!', 'yzz']),
    'right':  (['.zzz', 'yyAz'], ['zzz', 'yAz']),            # looking to our right (side glance)
    'left':   (['zzz.', 'zAyy'], ['zz.', 'zAy']),
    'down':   (['BBBB', 'zzzz'], ['BBB', 'zzz']),            # looking down (reading, counting)
    'closed': (['....', 'AzzA'], ['...', 'Azz']),            # serene / asleep: one lash line
    'happy':  (['.zz.', 'z..z'], ['.z.', 'z.z']),            # laughing, eyes closed upward
    'tired':  (['zzzz', 'yAzB', 'BAAB'], ['zzz', 'Azy', 'BAB']),  # heavy lids, bags under the eyes
    'dark':   (['.zz.', 'zAzy'], ['zz.', 'Azy']),            # deep skin: 1px white, warm iris, no bright slit
}
SMALL_EYES = {
    'open': (['.zz', 'yAz'], ['zz', 'Az']), 'round': (['.z.', 'yAz'], ['z.', 'Az']), 'right': (['.zz', 'yAz'], ['zz', 'yA']),
    'left': (['zz.', 'zAy'], ['zz', 'Ay']), 'closed': (['...', 'Azz'], ['..', 'zA']), 'happy': (['.z.', 'z.z'], ['z.', '.z']),
    'down': (['BBB', 'zzz'], ['BB', 'zz']), 'wide': (['.z.', 'z!z', 'yzz'], ['z.', '!z', 'zz']),
    'tired': (['zzz', 'yzB', 'BAB'], ['zz', 'yz', 'BA']), 'dark': (['.z.', 'zAy'], ['z.', 'Ay']),
}

def eye_(c, x, eye, style, which, n, small, iris=None):
    near, far = (SMALL_EYES if small else EYES)[style]
    rows = near if which == 'near' else far
    if iris and style not in ('closed', 'down', 'tired'): rows = [rw.replace('A', iris) for rw in rows]   # a warm iris (deep skin)
    put(c, x, eye - len(rows) + 1 + (1 if style == 'tired' else 0), rows, n)

BROWS = {
    'level':   (['FFFF'], ['FFF'], -2),
    'raised':  (['.FF.', 'F..F'], ['.FF', 'F..'], -3),
    'stern':   (['FF..', '.FFF'], ['..F', 'FF.'], -3),     # inner ends down
    'worried': (['..FF', 'FF..'], ['FF.', '..F'], -3),     # inner ends up
    'arched':  (['.FFF', 'F...'], ['FF.', '..F'], -3),
    'thick':   (['FFFF', 'EEEE'], ['FFF', 'EEE'], -3),
}

def brow(c, xn, xf, eye, style, n, small):
    a, b, dy = BROWS[style]
    if small: a, b = [r[:3] for r in a], [r[:2] for r in b]
    put(c, xn, eye + dy - (1 if style in ('wide',) else 0), a, n)
    put(c, xf, eye + dy, b, n)

MOUTHS = {
    'smile':  ['B...B', '.AAA.'],
    'grin':   ['A...A', '.zzz.', '..B..'],          # a small open smile, a dark gap, no teeth
    'flat':   ['.AAA.'],
    'frown':  ['.AAA.', 'B...B'],
    'o':      ['.AA.', 'AzzA', '.AA.'],
    'yawn':   ['.zz.', 'zzzz', '.zz.'],
    'smirk':  ['....B', '.AAA.'],          # one corner up, eyes level (not the banned half-lid smirk)
    'pursed': ['.AA.', '.BB.'],
}
SMALL_MOUTHS = {'smile': ['B..B', '.AA.'], 'flat': ['AAA'], 'grin': ['A..A', '.zz.'], 'o': ['.A.', 'AzA', '.A.'],
                'frown': ['.AA.', 'B..B'], 'smirk': ['...B', 'AAA.'], 'yawn': ['zz', 'zz'], 'pursed': ['AA']}

def mouth_(c, x, y, style, n, small):
    if style is None: return
    rows = (SMALL_MOUTHS if small else MOUTHS)[style]
    off = 1 if len(rows) > 1 and style not in ('o', 'flat', 'pursed') else 0
    put(c, x, y - off, rows, n)

# ---------------------------------------------------------------- bodies
def body(c, pts, cx, cy, rx, ry, light=True, base='3'):
    """A garment from a polygon, shaded like the samples (terminator on the lower right, a lit top rim)."""
    m = c.poly(pts)
    d = {'3': ('2', '1', '4'), '2': ('1', '1', '3')}[base]
    c.fill(m, base); c.outside(m, d[0], cx, cy, rx, ry); c.outside(m, d[1], cx - 2, cy - 1, rx + 5, ry + 4)
    if light: c.rim(m, d[2], 0, -1, 1, only=base)
    return m

def neck(c, x0, x1, y0, y1, n=0):
    k = 'ABCD'.translate(TR[n])
    c.fill(c.rect(x0, y0, x1, y1), k[0])
    c.fill(c.rect(x0, y0 + 3, x0 + 1, y1), k[1])

def behind(c, n, drop=3):
    """Template depth rule: the behind person's skin a value darker (no highlight step), then 3px lower."""
    c.shift(c.mask_of('IJKL' if n == 1 else 'QRST'), -1)
    c.g = [['.'] * 48 for _ in range(drop)] + c.g[:48 - drop]

def hair(c, pts, n, cx, cy, rx, ry, rim=True):
    k = 'EFGH'.translate(TR[n])
    m = c.poly(pts)
    c.fill(m, k[2] if n == 0 else k[1]); c.outside(m, k[1] if n == 0 else k[0], cx, cy, rx, ry)
    if rim and n == 0: c.rim(m, k[3], -1, -1, 1, only=k[2])
    return m

def ear(c, x, y, side='R', n=0):
    rows = ['BA', 'CA', 'BA', 'A.'] if side == 'R' else ['.C', 'CB', 'CB', '.B']
    put(c, x, y, rows, n)

def squash(c, minn=4, protect='yz!'):
    """Merge any ramp step used on fewer than minn pixels into its neighbour step (toward the ramp's middle), so
    a stray step never costs a color."""
    from draw import FAM
    done = set()
    while True:
        cnt = {}
        for r in c.g:
            for k in r:
                if k != '.' and k not in protect: cnt[k] = cnt.get(k, 0) + 1
        for k in list(cnt):
            if k in FAM and sum(cnt.get(x, 0) for x in FAM[k]) == cnt[k]: done.add(k)   # last step of its ramp
        rare = sorted((n, k) for k, n in cnt.items() if n < minn and k in FAM and k not in done)
        if not rare: return
        n, k = rare[0]
        f = FAM[k]; i = f.index(k); mid = (len(f) - 1) / 2
        present = [x for x in f if cnt.get(x) and x != k]
        alt = min(present, key=lambda x: (abs(f.index(x) - i), abs(f.index(x) - mid)))  # nearest step in use
        for row in c.g:
            for x, v in enumerate(row):
                if v == k: row[x] = alt
        if alt == k: return

def lint(c, protect='yz!'):
    """Orphan cleanup: a lone pixel whose 4 neighbours mostly agree takes their key (eyes and glints kept)."""
    c.clean(protect=protect)

def portrait(pid, name, sphere, people, c, accent='red', clean=True, **kw):
    for a, b in kw.pop('merge', {}).items():   # hand-picked merges to stay under the color cap
        for row in c.g:
            for x, v in enumerate(row):
                if v == a: row[x] = b
    if clean: squash(c, kw.pop('minn', 10))
    d = {'id': pid, 'name': name, 'kind': 'member', 'sphere': sphere, 'people': people, 'accent': accent, 'px': c.rows()}
    d.update(kw)
    return d
