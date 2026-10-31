# Shared helpers for batch f (guest members). Not a portrait (build_batch skips files starting with _).
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.dirname(HERE))
from draw import Canvas, step  # noqa

def blk(c, x0, y0, text):
    """Hand-drawn block: each line starts with '|' (after any indent); '.' and ' ' keep what is there."""
    rows = [ln.split('|', 1)[1] for ln in text.split('\n') if '|' in ln]
    if len({len(r) for r in rows}) > 1: print('blk rows differ in length at', (x0, y0), [len(r) for r in rows])
    c.put(x0, y0, rows)

def torso(c, pts, cx, cy, mid='3', dark='2', deep='1', lite='4', rx=(17, 22), ry=(10, 14)):
    """A body in the sphere ramp: lit upper left, two terminator steps down the shadow side, a lit top rim."""
    m = c.poly(pts)
    c.fill(m, mid); c.outside(m, dark, cx, cy, rx[0], ry[0]); c.outside(m, deep, cx - 2, cy - 1, rx[1], ry[1])
    if lite: c.rim(m, lite, 0, -1, 1, only=mid)
    return m

def back(c, skins='IJKLQRST', drop=3):
    """Depth rule: everything drawn so far (the people behind) goes a skin step darker and drops `drop` rows."""
    c.shift(c.mask_of(skins), -1)
    c.g = [['.'] * 48 for _ in range(drop)] + c.g[:48 - drop]

def portrait(id, name, c, people, accent):
    return {'id': id, 'name': name, 'kind': 'member', 'sphere': 'colorless', 'people': people, 'accent': accent,
            'px': c.rows()}

def bubble(c, cx, cy, r, glint='"'):
    """A soap bubble: see-through film inside a thin dark ring, a bright arc of glint on the upper left. Never outlined."""
    disk = c.ellipse(cx, cy, r, r)
    ring = {p for p in disk if any((p[0] + a, p[1] + b) not in disk for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))}
    for (x, y) in disk: c.set(x, y, '^' if (x, y) in ring else ':')
    gx, gy = cx - r * 0.42, cy - r * 0.42
    for (x, y) in disk - ring:
        if (x + .5 - gx) ** 2 + (y + .5 - gy) ** 2 <= max(0.5, r * 0.18) ** 2 + 0.3: c.set(x, y, glint)

def fist(c, x, y, cuff='4', flip=False):
    """A gripping hand seen from the back, 7 wide and 6 tall from (x, y): a knuckle row, a thumb on the near side,
    a wrist cuff step below. flip puts the thumb on the right."""
    rows = ['.DDCCC.',
            'DCCCCCB',
            'CBCBCBB',
            'CCCCCBA',
            '.BBBBA.',
            '.' + cuff * 5 + '.']
    if flip: rows = [r[::-1] for r in rows]
    c.put(x, y, rows)
    c.put(x - 1 if not flip else x + 7, y + 1, ['D', 'C', 'B'])
