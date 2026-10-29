"""Tiny drawing kit that produces char-grid portraits (key per pixel, '.' = transparent)."""


class C:
    def __init__(self, w, h=None):
        self.w, self.h = w, h or w
        self.g = [['.'] * self.w for _ in range(self.h)]

    def ok(self, x, y):
        return 0 <= x < self.w and 0 <= y < self.h

    def px(self, x, y, k):
        if self.ok(x, y):
            self.g[y][x] = k

    def get(self, x, y):
        return self.g[y][x] if self.ok(x, y) else '.'

    def pts(self, k, pts):
        for x, y in pts:
            self.px(x, y, k)

    def rect(self, x0, y0, x1, y1, k):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.px(x, y, k)

    def hl(self, x0, x1, y, k):
        self.rect(x0, y, x1, y, k)

    def vl(self, x, y0, y1, k):
        self.rect(x, y0, x, y1, k)

    def ell(self, x0, y0, x1, y1, k, only=None):
        """Filled ellipse inside the inclusive box."""
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        rx, ry = (x1 - x0 + 1) / 2, (y1 - y0 + 1) / 2
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0:
                    if only is None or self.get(x, y) in only:
                        self.px(x, y, k)

    def ring(self, x0, y0, x1, y1, k):
        tmp = C(self.w, self.h)
        tmp.ell(x0, y0, x1, y1, '#')
        for y in range(self.h):
            for x in range(self.w):
                if tmp.get(x, y) == '#' and any(tmp.get(x + dx, y + dy) != '#' for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    self.px(x, y, k)

    def poly(self, P, k, only=None):
        xs = [p[0] for p in P]; ys = [p[1] for p in P]
        for y in range(int(min(ys)), int(max(ys)) + 1):
            for x in range(int(min(xs)), int(max(xs)) + 1):
                if _inside(x + 0.5, y + 0.5, P):
                    if only is None or self.get(x, y) in only:
                        self.px(x, y, k)

    def line(self, x0, y0, x1, y1, k):
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        err = dx + dy
        while True:
            self.px(x0, y0, k)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy; x0 += sx
            if e2 <= dx:
                err += dx; y0 += sy

    def stamp(self, x, y, rows, keymap=None):
        """Hand-drawn patch; '.' in rows = leave as is, ' ' too."""
        for j, r in enumerate(rows):
            for i, ch in enumerate(r):
                if ch in '. ':
                    continue
                if keymap:
                    ch = keymap.get(ch, ch)
                self.px(x + i, y + j, ch)

    def recolor(self, frm, to, box=None):
        x0, y0, x1, y1 = box or (0, 0, self.w - 1, self.h - 1)
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if self.get(x, y) in frm:
                    self.px(x, y, to)

    def outline(self, k, skip='', diag=False):
        """Uniform outline: every empty pixel touching the figure becomes k."""
        nb = [(1, 0), (-1, 0), (0, 1), (0, -1)]
        if diag:
            nb += [(1, 1), (-1, -1), (1, -1), (-1, 1)]
        add = []
        for y in range(self.h):
            for x in range(self.w):
                if self.g[y][x] != '.':
                    continue
                for dx, dy in nb:
                    v = self.get(x + dx, y + dy)
                    if v != '.' and v not in skip and v != k:
                        add.append((x, y)); break
        for x, y in add:
            self.g[y][x] = k

    def mirror_ok(self):
        return True

    def rows(self):
        return [''.join(r) for r in self.g]


def _inside(x, y, P):
    n, c = len(P), False
    j = n - 1
    for i in range(n):
        xi, yi = P[i]; xj, yj = P[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            c = not c
        j = i
    return c


def paste(dst, src):
    for y in range(src.h):
        for x in range(src.w):
            if src.g[y][x] != '.':
                dst.px(x, y, src.g[y][x])
C.paste = paste


def paste_gap(dst, src, gap=1, keep=''):
    """Paste with a paper gap: pixels of dst just outside src are knocked out to '.' (screen-print separation)."""
    ring = set()
    for y in range(src.h):
        for x in range(src.w):
            if src.g[y][x] != '.':
                continue
            for dx in range(-gap, gap + 1):
                for dy in range(-gap, gap + 1):
                    if abs(dx) + abs(dy) > gap:
                        continue
                    if src.get(x + dx, y + dy) != '.':
                        ring.add((x, y))
    for x, y in ring:
        if dst.get(x, y) not in keep:
            dst.px(x, y, '.')
    dst.paste(src)
C.paste_gap = paste_gap
