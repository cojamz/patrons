# Calibration helper for the art upgrade: grids of palette keys, layered drawing, outline, PNG render.
from PIL import Image
class G:
    def __init__(s, n): s.n = n; s.c = [['.'] * n for _ in range(n)]
    def put(s, x, y, rows):
        for j, r in enumerate(rows.split('|') if isinstance(rows, str) else rows):
            for i, ch in enumerate(r):
                if ch != ' ' and 0 <= x + i < s.n and 0 <= y + j < s.n: s.c[y + j][x + i] = ch
        return s
    def rows(s): return [''.join(r) for r in s.c]
def outline(rows, key='k', skip=''):
    n = len(rows); g = [list(r) for r in rows]
    f = lambda x, y: 0 <= x < n and 0 <= y < n and rows[y][x] not in '.' + skip
    out = []
    for y in range(n):
        for x in range(n):
            if rows[y][x] == '.':
                nb = [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]
                hit = [rows[b][a] for a, b in nb if f(a, b)]
                if hit: g[y][x] = key(hit) if callable(key) else key
    return g
def render(rows, pal, scale, bg=None):
    n = len(rows); im = Image.new('RGBA', (n * scale, n * scale), bg or (0, 0, 0, 0))
    px = im.load()
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch == '.': continue
            col = ch if ch.startswith('#') else pal[ch]; c = tuple(int(col[i:i+2], 16) for i in (1, 3, 5)) + (255,)
            for dy in range(scale):
                for dx in range(scale): px[x*scale+dx, y*scale+dy] = c
    return im
