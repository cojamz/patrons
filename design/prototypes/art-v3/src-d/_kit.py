# Batch d drawing helpers (not a portrait: build_batch skips files starting with _).
# A face is laid out by hand-picked numbers (edges, eye spots, nose column, mouth) and painted with the face recipe
# from template.py: brow-shadow row, side-of-nose shadow, a lit cheek cluster, chin shadow on the neck, sel-out
# against hair. Light from the top-left; the right side of every head is the shadow plane.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas, step  # noqa: F401

def seg(c, rows):
    for y, parts in rows.items():
        for x, s in parts: c.put(x, y, [s])

JAWS = {  # (left inset, right inset) from the chin row upward
    'round': [(4, 4), (2, 2), (1, 1)],
    'square': [(3, 3), (1, 1)],
    'pointed': [(6, 6), (4, 4), (2, 2), (1, 1)],
    'soft': [(5, 5), (3, 3), (1, 1)],
    'long': [(5, 5), (3, 3), (2, 2), (1, 1), (1, 1)],
}

EYES = {
    # name: rows (top = lid row at eye-1, bottom = eye row)
    'o4c': ['zzzz', 'yzzy'], 'o4l': ['zzzz', 'zzyy'], 'o4r': ['zzzz', 'yyzz'],
    'o3c': ['zzz', 'yzy'], 'o3l': ['zzz', 'zzy'], 'o3r': ['zzz', 'yzz'],
    'o2l': ['zz', 'zy'], 'o2r': ['zz', 'yz'],
    'g4c': ['zzzz', 'yz!y'], 'g4r': ['zzzz', 'yyz!'], 'g4l': ['zzzz', '!zyy'], 'g3c': ['zzz', 'y!z'], 'g3r': ['zzz', 'yz!'],
    'shut4': ['z..z', '.zz.'], 'shut3': ['z.z', '.z.'],          # closed, serene / asleep (a smile of lashes)
    'joy4': ['.zz.', 'z..z'], 'joy3': ['.z.', 'z.z'],            # laughing, eyes squeezed shut
    'down4': ['....', 'zzzz'], 'down3': ['...', 'zzz'],          # looking down / reading
    # open eyes with a warm iris (%) and one pixel of white, lid only over the top: never the sleepy lid bar
    'i4c': ['.zz.', 'y%z.'], 'i4r': ['.zzz', '.y%z'], 'i4l': ['zzz.', 'z%y.'],
    'i3c': ['.z.', 'y%z'], 'i3r': ['zz.', 'y%z'], 'i3l': ['.zz', 'z%y'],
}

def face(c, x0, x1, y0, chin, eye, nx, eyes, mouth, jaw='round', keys='ABCD', hair='F', brows=None, plane=3,
         cheek=True, nose=True, chin_lit=True, ear=None, mouth_y=None, socket=True, lit=1, iris='q'):
    """Paint a face. x0..x1 widest skin columns, y0 top skin row (hair goes over it later), chin last face row.
    eyes: [(x, eye-name), ...] near eye first. brows: [(x, dy, rows)] or None for straight brows over each eye.
    mouth: (x, rows). plane: width of the shadow plane on the right."""
    A, B, C, D = keys
    prof = JAWS[jaw]
    span = {}
    for y in range(y0, chin + 1):
        k = chin - y
        l, r = prof[k] if k < len(prof) else (0, 0)
        if y == y0: l, r = max(l, 1), max(r, 1)
        span[y] = (x0 + l, x1 - r)
        for x in range(x0 + l, x1 - r + 1): c.set(x, y, C)
        L, R = span[y]
        pw = plane - 1 if y < eye - 1 else (plane + 1 if eye + 1 <= y <= eye + 4 else plane)  # the terminator bows out at the cheek
        for x in range(max(L, R - pw + 1), R + 1): c.set(x, y, B)
        c.set(R, y, A if y > y0 else B)
        if k <= 2: c.set(L, y, B)
    if lit >= 3:  # deep skin: the lit front plane carries the face (forehead, cheek, nose side) so features read
        for y in range(y0 + 1, chin - 1):
            L, R = span[y]
            for x in range(L + 1, L + 1 + int((R - L) * 0.42)):
                if c.get(x, y) == C: c.set(x, y, D)
    # underside of the jaw
    L, R = span[chin]
    for x in range(L, R + 1): c.set(x, chin, B)
    c.set(R, chin, A); c.set(L, chin, A)
    # forehead light
    c.put(span[y0 + 1][0] + 1, y0 + 1, [D * (2 + 2 * (lit > 1))] + ([D * 3] if lit > 1 else []))
    # sockets: the lid row is a step darker between and around the eyes
    if socket and eyes:
        xs = [x for x, _ in eyes]; ws = [len(EYES[n][0]) for _, n in eyes]
        lo, hi = min(xs) - 1, max(x + w for x, w in zip(xs, ws))
        for x in range(lo, hi + 1):
            if c.get(x, eye - 1) == C: c.set(x, eye - 1, B)
        if nose: c.set(nx, eye - 1, C)
    # brows
    if brows is None: brows = [(x, -2, [hair * len(EYES[n][0])]) for x, n in eyes]
    for x, dy, rows in brows: c.put(x, eye + dy, rows)
    for x, n in eyes: c.put(x, eye - 1, [r.replace('%', iris) for r in EYES[n]])
    # cheek plane on the lit side
    if cheek:
        cx = span[eye + 1][0] + 1
        c.put(cx, eye + 1, [D * 3, '.' + D * 2] if lit < 2 else [D * 4, D * 4, '.' + D * 2])
    # nose: lit ridge, shadow on the far side, underside
    if nose:
        c.put(nx, eye + 1 - (lit > 1), ([D] if lit > 1 else []) + [D, D + B, C + A + A])
    # mouth
    mx, mrows = mouth
    c.put(mx, mouth_y if mouth_y is not None else eye + 5, mrows)
    if chin_lit:
        c.put(mx + max(0, len(mrows[0]) // 2 - 1), chin - 1, [D * 2])
    if ear:
        ex, side = ear
        c.put(ex, eye - 1, ['.' + C, C + A, C + A, '.' + B] if side == 'L' else [B + A, B + A, B + A, A + '.'])
    return span

def neck(c, x0, x1, y0, y1, keys='AB'):
    """Chin shadow on the top two rows (the darkest step), the rest a step up, the far edge dark."""
    A, B = keys
    c.fill(c.rect(x0, y0, x1, y1), B)
    c.fill(c.rect(x0, y0, x1, y0 + 1), A); c.fill(c.rect(x1 - 1, y0, x1, y1), A)

def torso(c, x0, x1, top, keys='12345', ox=0, deep=True):
    """Sloped shoulders like Kingpin's, shaded from the top-left. Returns the mask."""
    k1, k2, k3, k4 = keys[0], keys[1], keys[2], keys[3]
    cx, w = (x0 + x1) / 2, (x1 - x0) / 2
    body = c.poly([(x0, 48), (x0, top + 7), (x0 + 2, top + 3.5), (x0 + 6, top + 1.5), (cx - 5 + ox, top), (cx + 5 + ox, top),
                   (x1 - 6, top + 1.5), (x1 - 2, top + 3.5), (x1, top + 7), (x1, 48)])
    c.fill(body, k3)
    c.outside(body, k2, cx - 6.5, top + 6, w * 0.93, 13)
    if deep: c.outside(body, k1, cx - 8.5, top + 5, w * 1.15, 17)
    c.rim(body, k4, 0, -1, 1, only=k3)
    return body

def blob(c, mask, keys, cx, cy, rx, ry, lit=None):
    """Fill a mask with a mid key, a terminator shadow outside (cx, cy, rx, ry), optional lit rim (top-left)."""
    c.fill(mask, keys[1]); c.outside(mask, keys[0], cx, cy, rx, ry)
    if lit: c.rim(mask, lit, -1, -1, 1, only=keys[1])
