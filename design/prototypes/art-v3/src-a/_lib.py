# Batch a helpers (red + magenta members). Files starting with _ are skipped by build_batch.py.
# A face is hand-built from a contour (a curved, stair-stepped jaw), a curved terminator, and stamped features in a
# small stamp alphabet: '0 1 2 3' = the person's skin A..D, '6 7 8 9' = their hair E..H, z y ! literal, '.' = keep.
# Portraits then add their own touches with c.put() (moustaches, glasses, freckles) on top.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas, step  # noqa: F401

SK = ['ABCD', 'IJKL', 'QRST']
HK = ['EFGH', 'MNOP', 'UVWX']


def tr(s, p, hp=None):
    """Stamp alphabet -> keys for person p (hair of person hp, default p)."""
    hp = p if hp is None else hp
    out = []
    for ch in s:
        if ch in '0123': out.append(SK[p]['0123'.index(ch)])
        elif ch in '6789': out.append(HK[hp]['6789'.index(ch)])
        else: out.append(ch)
    return ''.join(out)


def stamp(c, x, y, rows, p, hp=None, mirror=False):
    for j, r in enumerate(rows):
        if mirror: r = r[::-1]
        c.put(x, y + j, [tr(r, p, hp)])


def seg(c, rows, p=0, hp=None):
    for y, parts in rows.items():
        for x, s in parts: c.put(x, y, [tr(s, p, hp)])


# ---------------- eyes: (rows from eye-3 to eye) for the LEFT eye; the right eye is the mirror -------------
def eyes_for(expr, ew):
    """Return 4 rows (eye-3 .. eye) for a left eye of width ew. '.' keeps the skin."""
    blank = '.' * ew
    lid = 'z' * ew
    if ew >= 4: low = 'yz!1'
    elif ew == 3: low = 'yz!'
    else: low = 'z!'
    brow = '6' * (ew - 1) + '.' if ew >= 3 else '66'
    if expr in ('calm', 'smile', 'proud', 'polite', 'cheer', 'open'):
        return [brow, blank, lid, low]
    if expr == 'level':     # brows down on the lids: steady, serious
        return [blank, brow, lid, low]
    if expr == 'side':      # both pupils to our right
        lw = {4: 'yyz!', 3: 'yz!', 2: 'yz'}[ew]
        return [brow, blank, lid, lw]
    if expr == 'sideL':     # both pupils to our left
        lw = {4: 'z!yy', 3: 'z!y', 2: 'zy'}[ew]
        return [brow, blank, lid, lw]
    if expr == 'stern':
        b1 = {4: '66..', 3: '66.', 2: '6.'}[ew]; b2 = {4: '.666', 3: '.66', 2: '66'}[ew]
        lw = {4: '1z!1', 3: '1z!', 2: 'z!'}[ew]
        return [b1, b2, lid, lw]
    if expr == 'worried':
        b1 = {4: '..66', 3: '..6', 2: '.6'}[ew]; b2 = {4: '666.', 3: '66.', 2: '6.'}[ew]
        return [b1, b2, lid, low]
    if expr == 'surprised':
        return [brow, blank, lid, {4: 'yz!y', 3: 'yz!', 2: 'z!'}[ew]]
    if expr in ('laugh', 'happy'):  # closed, curved up
        return [brow, blank, {4: '.zz.', 3: '.z.', 2: 'zz'}[ew], {4: 'z..z', 3: 'z.z', 2: '..'}[ew]]
    if expr in ('serene', 'asleep'):  # closed, curved down
        return [brow, blank, {4: 'z..z', 3: 'z.z', 2: '..'}[ew], {4: '.zz.', 3: '.z.', 2: 'zz'}[ew]]
    raise ValueError(expr)


# open-eye styles (rows eye-1, eye) replacing the lid bar; glint stays top-left on both eyes (not mirrored)
EYE_STYLES = {
    'dot':   {4: ['.!z.', '.zz.'], 3: ['!z.', 'zz.'], 2: ['!z', 'zz']},           # round dark eyes, a glint
    'iris':  {4: ['.zzz', 'y0z!'], 3: ['zzz', '0z!'], 2: ['zz', '0z']},           # short upper lid, warm iris + pupil
    'bead':  {4: ['.z..', 'z!z.'], 3: ['.z.', 'z!z'], 2: ['z.', '!z']},           # small bright beads (deep skin: warm)
    'warm':  {4: ['.zz.', 'y1z.'], 3: ['zz.', 'yz.'], 2: ['zz', 'y1']},           # deep skin: lid, 1px white, warm iris
}


MOUTHS = {  # (rows, row offset from the mouth row)
    'L': {'calm': (['0000'], 0), 'smile': (['0....0', '.0000.'], -1), 'stern': (['00000', '1...1'], 0),
          'worried': (['.00.', '0..0'], 0), 'open': (['.000.', '0zzz0', '.000.'], -1), 'o': (['.0.', '0z0', '.0.'], -1), 'purse': (['.00', '00.'], 0),
          'smirk': (['....0', '0000.'], -1), 'smirkL': (['0....', '.0000'], -1)},
    'M': {'calm': (['000'], 0), 'smile': (['0...0', '.000.'], -1), 'stern': (['0000', '1..1'], 0),
          'worried': (['.0.', '0.0'], 0), 'open': (['.00.', '0zz0', '.00.'], -1), 'o': (['00', 'zz'], 0), 'purse': (['00', '1.'], 0),
          'smirk': (['...1', '000.'], -1), 'smirkL': (['1...', '.000'], -1)},
    'S': {'calm': (['00'], 0), 'smile': (['0..0', '.00.'], -1), 'purse': (['00'], 0), 'stern': (['000'], 0), 'worried': (['.0.', '0.0'], 0),
          'open': (['00', 'zz'], 0), 'o': (['0', 'z'], 0), 'smirk': (['..1', '00.'], -1), 'smirkL': (['1..', '.00'], -1)},
}


def face(c, p, x0, eye, w, above, below, view='f', eyes='calm', mouth='calm', jaw='oval', ears=True, hp=None,
         brow=True, cheek=True, nose=True, chin_hi=False, shift=None, dk=False, look=None, hi=None, lip=None, plane=False):
    """Draw a face for person p. x0: left column of the skin; w: width; eye: the eyes' lower-lid row; above/below:
    rows of skin above/below the eye row. view 'f' front, 'r' 3/4 to our right, 'l' 3/4 to our left.
    Returns the face mask (without ears)."""
    S = SK[p]
    top, chin = eye - above, eye + below
    size = 'L' if w >= 17 else ('M' if w >= 14 else 'S')
    # ---- contour
    n = chin - (eye + 2)
    fin = {'square': .24, 'oval': .30, 'round': .27, 'pointed': .36, 'long': .30}[jaw] * w
    pw = {'square': 2.4, 'oval': 1.35, 'round': 1.7, 'pointed': 1.0, 'long': 1.6}[jaw]
    mask = set()
    for y in range(top, chin + 1):
        if y == top: l = r = 2
        elif y == top + 1: l = r = 1
        elif y <= eye + 2: l = r = 0
        else:
            t = (y - (eye + 2)) / max(1, n)
            l = r = int(round(fin * t ** pw))
        if view == 'r' and y > eye + 1: r += 1
        if view == 'l' and y > eye + 1: l += 1
        for x in range(x0 + l, x0 + w - r): mask.add((x, y))
    c.fill(mask, S[2])
    # ---- terminator: a band on the right that widens toward the jaw; the jaw's underside in shadow
    rows = {}
    for x, y in mask: rows.setdefault(y, []).append(x)
    band0 = max(2, round(w * (0.19 if view == 'f' else 0.23)))
    if dk: band0 = max(2, band0 - 1)   # deep skin: a narrower shadow side, so the jaw never reads as a beard
    for y, xs in rows.items():
        lo, hx = min(xs), max(xs)
        extra = 0 if y < eye + 3 else (1 if y < chin - 1 else 2)
        if dk: extra = min(extra, 0 if y < chin else 1)
        if plane and y > eye + 2: extra = -band0 + 2
        if y <= top + 1: extra = -1
        b = band0 + extra
        for x in xs:
            if x > hx - b: c.set(x, y, S[1])
        c.set(hx, y, S[0] if y > top else S[1])
        if c.get(lo, y) == S[2]: c.set(lo, y, S[1])
    for x in rows[chin]: c.set(x, chin, S[0] if (x > min(rows[chin]) + 1 and not plane) or x == max(rows[chin]) else S[1])
    if chin - 1 in rows:
        xs = rows[chin - 1]
        for x in xs:
            if c.get(x, chin - 1) == S[2] and (x - min(xs)) < 2: c.set(x, chin - 1, S[1])
    # ---- features
    cx = x0 + w / 2.0 + (0 if view == 'f' else (1.5 if view == 'r' else -1.5)) + (shift or 0)
    ew = 4 if size == 'L' else (3 if size == 'M' else 2)
    gap = {'L': 4, 'M': 3, 'S': 2}[size]
    le_x = int(round(cx - gap / 2 - ew)); re_x = int(round(cx + gap / 2))
    lw, rw = ew, ew
    if view == 'r': rw = max(2, ew - 1)
    if view == 'l': lw = max(2, ew - 1); le_x += 1
    if brow:  # brow-shadow row across the sockets (the row under the brows), one step darker
        by = eye - 1 if eyes in ('stern', 'worried', 'level') else eye - 2
        for x in range(le_x - 1, re_x + rw + 1):
            if (x, by) in mask and c.get(x, by) == S[2]: c.set(x, by, S[1])
    closed = eyes in ('laugh', 'happy', 'serene', 'asleep')
    st = None if closed else (look or ('warm' if dk else None))
    def ey(w_):
        e = eyes_for(eyes, w_)
        if dk and closed: e[1] = '3' * w_
        return e
    if st and st != 'lid':
        L, R = ey(lw), ey(rw)
        stamp(c, le_x, eye - 3, L[:2], p, hp); stamp(c, re_x, eye - 3, R[:2], p, hp, mirror=True)
        sl, sr = EYE_STYLES[st][lw], EYE_STYLES[st][rw]
        if eyes == 'sideL': sl = [r[::-1] for r in sl]; sr = [r[::-1] for r in sr]
        stamp(c, le_x, eye - 1, sl, p, hp)
        stamp(c, re_x, eye - 1, [r[::-1] for r in sr] if eyes not in ('side', 'sideL') else sr, p, hp)
        if st in ('dot', 'bead'):  # keep the glint top-left on the right eye too
            stamp(c, re_x, eye - 1, sr, p, hp)
    else:
        stamp(c, le_x, eye - 3, ey(lw), p, hp)
        stamp(c, re_x, eye - 3, ey(rw), p, hp, mirror=True)
    if cheek:
        cxl = le_x + (0 if size != 'S' else 0)
        cs = (['3333', '333.'] if dk else ['333', '33.']) if size != 'S' else ['33']
        stamp(c, cxl, eye + 1, cs, p)
    nx = int(round(cx - 0.5)) + (1 if view == 'r' else 0)
    if nose:
        if size == 'L': stamp(c, nx, eye + 1, ['3.', '31', '31', '001'], p)
        elif size == 'M': stamp(c, nx, eye + 1, ['3.', '31', '01'], p)
        else: stamp(c, nx, eye + 1, ['31', '0.'], p)
    if mouth:
        rows_m, off = MOUTHS[size][mouth]
        my = eye + {'L': 6, 'M': 5, 'S': 3}[size] + off
        mx = int(round(cx - len(rows_m[0]) / 2.0))
        stamp(c, mx, my, rows_m, p)
    if plane:  # very deep skin: the lit upper-left of the face is one plane on the warm D step
        pe = c.ellipse(x0 + w * 0.34, eye - 0.5, w * 0.3, (chin - top) * 0.36)
        for (x, y) in mask & pe:
            if c.get(x, y) in (S[2], S[1]) and y not in (eye - 1, eye) and x < cx - 1 - (y - eye) * 0.5: c.set(x, y, S[3])
    if dk or hi:  # deep skin (palette has a tall warm D): light the face, not the tone. One forehead cluster, one
        # cheekbone plane joined to the nose bridge, so nothing reads as specks.
        D = S[3]
        for (x, y) in c.rect(x0 + 2, top + 1, x0 + 6, top + 2) | c.rect(x0 + 3, top + 3, x0 + 5, top + 3):
            if (x, y) in mask and c.get(x, y) in (S[2], S[1]): c.set(x, y, D)
        for (x, y) in c.rect(le_x, eye + 1, nx, eye + 1) | c.rect(le_x + 1, eye + 2, le_x + 2, eye + 2) | {(nx, eye + 2)}:
            if (x, y) in mask and c.get(x, y) in (S[2], S[1]): c.set(x, y, D)
    if chin_hi and size != 'S':
        stamp(c, int(round(cx - 1)), chin - 1, ['33'], p)
    # ---- ears
    if ears:
        eh = ['2', '20', '20', '1'] if size != 'S' else ['2', '20', '1']
        ehR = ['1', '01', '01', '0'] if size != 'S' else ['1', '01', '0']
        if view in ('f', 'r'): stamp(c, x0 - 1, eye - 1, [r[:1] if view == 'f' else r for r in eh], p)
        if view in ('f', 'l'):
            stamp(c, x0 + w - (0 if view == 'f' else 1), eye - 1, [r[-1:] if view == 'f' else r for r in ehR], p)
    return mask


def neck(c, p, x0, x1, y0, y1):
    S = SK[p]
    m = c.rect(x0, y0, x1, y1)
    c.fill(m, S[1]); c.fill(c.rect(x0, y0, x1, min(y1, y0 + 1)), S[0]); c.fill(c.rect(x1, y0, x1, y1), S[0])
    if y1 - y0 >= 5: c.fill(c.rect(x0, y0 + 3, x0 + (x1 - x0) // 2, y1), S[2])   # the lit side of a long neck
    return m


def hair(c, mask, p, cx, cy, rx, ry, lit=True, hp=None):
    H = HK[p if hp is None else hp]
    c.fill(mask, H[1]); c.outside(mask, H[0], cx, cy, rx, ry)
    if lit: c.rim(mask, H[2], -1, -1, 1, only=H[1])
    return mask


def body(c, pts, front=True, light=None):
    m = c.poly(pts)
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    cx = (min(xs) + max(xs)) / 2.0; cy = (min(ys) + max(ys)) / 2.0
    w = (max(xs) - min(xs)) / 2.0; h = (max(ys) - min(ys)) / 2.0
    if front:
        c.fill(m, '3'); c.outside(m, '2', cx - w * 0.25, cy - h * 0.1, w * 0.95, h * 1.4)
        c.outside(m, '1', cx - w * 0.35, cy - h * 0.2, w * 1.25, h * 1.9)
        c.rim(m, '4', 0, -1, 1, only='3')
    else:
        c.fill(m, '2'); c.outside(m, '1', cx - w * 0.3, cy - h * 0.1, w * 1.0, h * 1.5)
        c.rim(m, '3', 0, -1, 1, only='2')
    return m


def mat(c, mask, keys, cx, cy, rx, ry, rimk=None):
    """Fill a prop with a 4-key material ramp keys (dark..light): base keys[2], shadow keys[1], lit rim keys[3]."""
    c.fill(mask, keys[2]); c.outside(mask, keys[1], cx, cy, rx, ry)
    c.rim(mask, rimk or keys[3], -1, -1, 1, only=keys[2])
    return mask


def behind(c, p):
    """Depth rule: a person behind loses their highlight step (skin a value darker)."""
    c.shift(c.mask_of(SK[p]), -1)


def portrait(c, id, name, sphere, people, accent='red'):
    return {'id': id, 'name': name, 'kind': 'member', 'sphere': sphere, 'people': people, 'accent': accent,
            'px': c.rows()}


def snap(c):
    return [r[:] for r in c.g]


def changed(c, before):
    return {(x, y) for y in range(c.n) for x in range(c.n) if c.g[y][x] != before[y][x] and c.g[y][x] != '.'}


def hand(c, x, y, p=0, kind='fist', mirror=False):
    """A small hand in skin keys of person p."""
    H = {'fist': ['.2322.', '232221', '122210', '.1110.'],
         'flat': ['.23332', '222221', '.12210'],
         'grip': ['.232.', '22221', '12210', '.110.']}[kind]
    stamp(c, x, y, H, p, mirror=mirror)
