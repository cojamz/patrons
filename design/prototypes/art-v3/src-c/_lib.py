# Batch c helpers: hand-tuned building blocks for faces, hair and clothes. Every portrait still finishes its face by
# hand (put() overrides after the helper), so the helper is a starting block, never the whole face.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas, step, darkest

PEOPLE = [('ABCD', 'EFGH'), ('IJKL', 'MNOP'), ('QRST', 'UVWX')]

def seg(c, rows):
    for y, parts in rows.items():
        for x, s in parts: c.put(x, y, [s])

JAWS = {  # insets (each side) for the last rows of the head, top to bottom
    'round': [0, 1, 1, 2, 3, 5],
    'square': [0, 0, 1, 1, 2, 3],
    'narrow': [1, 1, 2, 3, 4, 6],
    'jowl': [0, 0, 0, 1, 2, 3],
    'long': [0, 1, 1, 2, 2, 3, 4],
    'small': [1, 2, 4],
}

def head_mask(c, box, jaw='round', top=(3, 1, 1)):
    x0, y0, x1, y1 = box
    sched = JAWS[jaw]
    m = set()
    for y in range(y0, y1 + 1):
        i = y - y0
        ins = top[i] if i < len(top) else 0
        j = y - (y1 - len(sched) + 1)
        if j >= 0: ins = max(ins, sched[j])
        for x in range(x0 + ins, x1 - ins + 1): m.add((x, y))
    return m

def face(c, box, eye, p=0, view='front', jaw='round', eyes='round', look=0, brows='level', mouth='smile',
         ear=True, back=False, nose=True, cheek=True, mouth_dy=None, socket=True, lids=None, top=(3, 1, 1)):
    """Draw a lit head in box (template), eye = lower-lid row. view: 'front', 'r' (turned to our right), 'l'.
    back=True: a person behind (no highlight step, skin a step darker: base J, lit K->J...). Returns dict of anchors."""
    sk, hk = PEOPLE[p]
    A, B, C, D = sk
    E, F, G, H = hk
    if back: A, B, C, D = A, A, B, C          # one value darker, no highlight step
    x0, y0, x1, y1 = box
    w = x1 - x0 + 1; h = y1 - y0 + 1
    m = head_mask(c, box, jaw, top)
    c.fill(m, C)
    cx = (x0 + x1 + 1) / 2
    shift = {'front': 0, 'r': round(w * 0.12), 'l': -round(w * 0.12)}[view]
    # shadow: a curved terminator, the lit oval up-left of the head's centre
    c.outside(m, B, cx - w * 0.20 + max(0, shift) * 0.5 + (2 if view == 'l' else 0), y0 + h * 0.30, w * 0.43, h * 0.62)
    c.rim(m, A, 1, 0, 1, only=B + C)          # far edge, darkest
    c.rim(m, A, 0, 1, 1, only=B + C)          # under the jaw
    # eyes
    big = 4 if w >= 16 else 3
    small = 3 if w >= 16 else 2
    gap = 2 if w >= 15 else 2
    ex = round(cx + shift) - 1                # the nose column (ridge)
    if view == 'front':
        L = (ex - gap - big + 1, big); R = (ex + gap, big)
    elif view == 'r':
        L = (ex - gap - big + 1, big); R = (ex + gap, small)
    else:
        L = (ex - gap - small + 1, small); R = (ex + gap, big)
    anchors = dict(L=L, R=R, nose=ex, eye=eye, m=m)
    if socket:
        for (x, n) in (L, R):
            for i in range(-1, n + 1):
                if (x + i, eye - 1) in m: c.set(x + i, eye - 1, B)
    for side, (x, n) in (('L', L), ('R', R)):
        _eye(c, x, eye, n, eyes, look, side, A, B, C, back)
    # brows
    for side, (x, n) in (('L', L), ('R', R)):
        _brow(c, x, eye, n, brows, side, E, F)
    # nose
    if nose:
        nl = D if not back else C
        if view == 'l':  # turned left: shadow falls on the near side (right)
            c.put(ex, eye, [nl, nl, B]); c.put(ex + 1, eye + 1, [B, A])
        else:
            for yy in (eye, eye + 1): c.set(ex, yy, nl)
            c.set(ex + 1, eye + 1, B); c.set(ex + 1, eye + 2, A); c.set(ex, eye + 2, B)
    # cheek plane
    if cheek and not back:
        # on the cheekbone, a row lower and a pixel outward from the eye (right under the eye reads as a bruise)
        for i, (dx, dy) in enumerate(((-2, 3), (-1, 3), (0, 3), (-1, 4), (0, 4))):
            if (L[0] + dx, eye + dy) in m and c.get(L[0] + dx, eye + dy) == C: c.set(L[0] + dx, eye + dy, D)
    # mouth
    my = eye + (mouth_dy if mouth_dy is not None else (5 if h >= 17 else 3))
    mx = ex + (1 if view == 'r' else 0)
    _mouth(c, mx, my, mouth, A, B, C, D, back)
    anchors['mouth'] = (mx, my)
    # ear
    if ear:
        if view == 'r':
            c.put(x0 - 1, eye - 1, [C + C, C + A, C + A, B + B])
        else:
            c.put(x1 + 1, eye - 1, [B + A, B + A, B + A, A + '.'])
    return anchors

def _eye(c, x, eye, n, style, look, side, A, B, C, back):
    if style == 'none': return
    if style == 'closed':      # serene: lid line curving down at the ends
        c.put(x, eye - 1, [B * n]); c.put(x, eye, ['z' * n])
        return
    if style == 'laugh':       # an upturned arc
        c.put(x, eye - 1, ['.' + 'z' * (n - 2) + '.']); c.put(x, eye, ['z' + C * (n - 2) + 'z'])
        return
    if style == 'shade':       # under a brim: dark socket, a glint
        c.put(x, eye - 1, [A * n]); c.put(x, eye, [A + 'z' + '!' + A][:n] if n >= 3 else 'z!')
        return
    if back:                   # small faces behind: a lid shadow and a 2px dark eye, looking where look says
        c.put(x, eye - 1, [B * n])
        off = {0: (n - 2) // 2, 1: n - 2, -1: 0}[look]
        c.put(x, eye - 1, ['.' * off + 'zz']); c.put(x, eye, ['.' * off + 'zz'])
        return
    if style in ('round', 'wide'):  # a bright 2x2 iris with a glint, one white pixel on the outer side, no lid bar
        off = {0: (n - 2) // 2 + (1 if side == 'L' and n == 3 else 0), 1: n - 2, -1: 0}[look]
        c.put(x, eye - 1, [B * n])
        top = '!z' if look >= 0 else 'z!'
        c.put(x + off, eye - 1, [top]); c.put(x + off, eye, ['zz'])
        wx = x + off - 1 if (look > 0 or (look == 0 and side == 'L')) else x + off + 2
        if look == 0 and n >= 3: wx = x + off - 1 if side == 'L' else x + off + 2
        if x <= wx < x + n: c.set(wx, eye, 'y')
        if style == 'wide': c.put(x + off, eye - 2, ['zz'])
        return
    # open: lid line, then white + pupil (+ glint on the near eye)
    c.put(x, eye - 1, ['z' * n])
    if n >= 4:
        row = {0: 'yz!B', 1: 'yyz!', -1: 'z!yB'}[look] if side == 'L' else {0: 'B!zy', 1: 'By!z', -1: '!zyB'}[look]
        row = list(row)
    elif n == 3:
        row = list({0: 'yz!', 1: 'yz!', -1: 'z!y'}[look]) if side == 'L' else list({0: '!zy', 1: 'y!z', -1: '!zy'}[look])
    else:
        row = ['z', 'z']
    if back: row = ['z' if k == 'z' else B for k in row]
    c.put(x, eye, [''.join(row)])

def _brow(c, x, eye, n, style, side, E, F):
    y = eye - 2
    if style == 'none': return
    if style == 'level':
        c.put(x, y, [F * n])
    elif style == 'raised':
        c.put(x, y - 1, [F * n])
    elif style == 'stern':   # inner ends down
        if side == 'L': c.put(x, y, [F * (n - 1)]); c.set(x + n - 1, y + 1, E)
        else: c.put(x + 1, y, [F * (n - 1)]); c.set(x, y + 1, E)
    elif style == 'worried':  # inner ends up
        if side == 'L': c.put(x, y, [F * (n - 1)]); c.set(x + n - 1, y - 1, F)
        else: c.put(x + 1, y, [F * (n - 1)]); c.set(x, y - 1, F)
    elif style == 'arch':
        c.put(x, y - 1, ['.' + F * (n - 2) + '.']); c.set(x, y, F); c.set(x + n - 1, y, F)

def _mouth(c, mx, my, style, A, B, C, D, back):
    if style == 'smile':
        c.put(mx - 1, my, ['AAA'.replace('A', A)]); c.set(mx - 2, my - 1, B); c.set(mx + 2, my - 1, B)
        if not back: c.put(mx - 1, my + 1, [D * 2])
    elif style == 'grin':      # a wide closed smile
        c.put(mx - 2, my, [A * 5]); c.set(mx - 3, my - 1, A); c.set(mx + 3, my - 1, A)
        if not back: c.put(mx - 1, my + 1, [D * 3])
    elif style == 'flat':
        c.put(mx - 1, my, [A * 3])
    elif style == 'frown':
        c.put(mx - 1, my, [A * 3]); c.set(mx - 2, my + 1, B); c.set(mx + 2, my + 1, B)
    elif style == 'o':
        c.put(mx - 1, my, ['.' + A + '.', A + 'z' + A, '.' + A + '.'])
    elif style == 'open':      # a small open laugh, no teeth
        c.put(mx - 2, my, [A * 5, '.' + 'z' * 3 + '.', '..' + A + '..'])
    elif style == 'pursed':
        c.put(mx, my, [A * 2])

def hair(c, pts, cx, cy, rx, ry, p=0, lit=True, keys=None):
    E, F, G, H = keys or PEOPLE[p][1]
    m = c.poly(pts)
    c.fill(m, F); c.outside(m, E, cx, cy, rx, ry)
    if lit: c.rim(m, G, -1, -1, 1, only=F)
    return m

def cloth(c, pts, lo=('1', '2', '3', '4'), terminator=None):
    """A garment: base lo[2], a shadow crescent lo[1], deep shadow lo[0], top rim lo[3]."""
    k1, k2, k3, k4 = lo
    m = c.poly(pts)
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    w, h = x1 - x0, y1 - y0
    tx, ty, rx, ry = terminator or (x0 + w * 0.40, y0 + h * 0.45, w * 0.45, h * 0.55)
    c.fill(m, k3); c.outside(m, k2, tx, ty, rx, ry)
    c.outside(m, k1, tx - 2, ty, rx * 1.25, ry * 1.4)
    if k4: c.rim(m, k4, 0, -1, 1, only=k3)
    return m

def neck(c, x0, x1, y0, y1, p=0, back=False):
    A, B, C, D = PEOPLE[p][0]
    if back: B, C = A, B
    c.fill(c.rect(x0, y0, x1, y1), C)
    c.fill(c.rect(x0, y0, x1, y0 + 1), A)              # chin shadow on the neck
    c.fill(c.rect(x1 - 1, y0, x1, y1), B if not back else A)

def lift(c, mask, keys='ABCD'):
    """Ride a face one step up its ramp (for the deepest skins, whose steps sit close): C->D, B->C, A->B inside mask."""
    A, B, C, D = keys
    up = {C: D, B: C, A: B}
    for x, y in mask:
        k = c.get(x, y)
        if k in up: c.set(x, y, up[k])

def merge(c, m):
    """Fold small ramp steps into their neighbours to keep a portrait under the color cap: merge(c, {'a': 'b'})."""
    c.g = [[m.get(k, k) for k in r] for r in c.g]

def behind3(c, p, side, eyes='open', look=None, mouth='smile', brows='level', hair_pts=None, hair_lo='M', hair_hi='N', collar=None, jaw='narrow', dx=0):
    if look is None: look = 1 if side == 'L' else -1
    """A person behind in a 3-person card: side 'L' (box 4..15) or 'R' (box 32..43), eye 18, shoulders 29.
    Body on sphere steps 1-2, skin a step darker, small face. Returns the head box."""
    box = (4, 11, 15, 24) if side == 'L' else (32, 11, 43, 24)
    pts = [(0, 48), (0, 31), (3, 29), (14, 29), (18, 32), (19, 48)] if side == 'L' else \
          [(28, 48), (29, 32), (33, 29), (44, 29), (47, 31), (47, 48)]
    b = c.poly(pts); c.fill(b, '2'); c.outside(b, '1', box[0] + 4, box[3] + 9, 9, 7)
    nx = 8 if side == 'L' else 36
    neck(c, nx, nx + 4, box[3], box[3] + 5, p=p, back=True)
    face(c, box, 18, p=p, back=True, view='front', jaw=jaw, eyes='none', mouth='none', mouth_dy=3,
         brows='none', ear=False, nose=False, socket=False)
    back_face(c, box, p, 18, look=look, eyes=eyes, brows=brows, mouth=mouth, dx=dx)
    if hair_pts:
        h = c.poly(hair_pts); c.fill(h, hair_hi); c.outside(h, hair_lo, box[0] + 5, box[1] + 3, 7, 5)
    return box

def back_face(c, box, p, eye, look=1, eyes='open', brows='level', mouth='smile', dx=0):
    """Features for a small face behind (12-13 wide): eyes of a 1px iris and a 1px white under a soft lid, a brow row in
    the hair's dark, a nose shadow and a 2px mouth. Every back face sets its own look, eyes, brows and mouth."""
    I, J = PEOPLE[p][0][0], PEOPLE[p][0][1]
    H = PEOPLE[p][1][1]
    x0, y0, x1, y1 = box
    cx = x0 + (x1 - x0 + 1) // 2 + dx
    for ex in (cx - 4, cx + 1):                      # each eye is 2 wide: ex, ex+1
        if eyes == 'open':
            iris, white = (ex + 1, ex) if look > 0 else (ex, ex + 1)
            c.set(iris, eye - 1, 'z'); c.set(white, eye - 1, I)
            c.set(iris, eye, 'z'); c.set(white, eye, 'y')
        elif eyes == 'laugh':                         # a 3px arc
            c.set(ex, eye, 'z'); c.set(ex + 1, eye - 1, 'z'); c.set(ex + 2, eye, 'z')
        elif eyes == 'closed':
            c.put(ex, eye, ['zz'])
        by = eye - 3 if brows == 'raised' else eye - 2
        if brows == 'worried':
            c.put(ex, eye - 2, [H + H]); c.set(ex + 1 if ex < cx else ex, eye - 3, H)
        elif brows != 'none':
            c.put(ex, by, [H + H]); c.set(ex - 1 if ex < cx else ex + 2, by + (0 if brows == 'raised' else 1), H)
    c.set(cx - 1, eye + 1, I); c.set(cx - 1, eye + 2, I)                            # nose shadow
    my = eye + 4
    if mouth == 'smile':
        c.put(cx - 2, my - 1, [I + '..' + I]); c.put(cx - 1, my, [I + I])
    elif mouth == 'grin':
        c.put(cx - 2, my - 1, ['z..z']); c.put(cx - 1, my, ['zz'])
    elif mouth == 'flat':
        c.put(cx - 1, my, [I + I])
    elif mouth == 'o':
        c.put(cx - 1, my - 1, ['II']); c.put(cx - 1, my, ['zz'])
