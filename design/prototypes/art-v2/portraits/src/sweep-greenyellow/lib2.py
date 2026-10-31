# Shared kit for sweep-greenyellow: green-magenta's lib (doorway, body, head, mini, layer, oval) plus finishing passes.
import sys
sys.path.insert(0, '/home/user/patrons/design/prototypes/art-v2/portraits/src/green-magenta')
from lib import *

def shade_under(g, keys='hHjK', x0=0, x1=32, y0=0, y1=32):
    """A row of skin shadow under hair and hats: S right under any of keys becomes s."""
    hits = [(x, y) for y in range(max(1, y0), y1) for x in range(x0, x1) if g.c[y][x] == 'S' and g.c[y - 1][x] in keys]
    for x, y in hits: g.c[y][x] = 's'
    return g

def fill(g, x, y, w, h, ch):
    for j in range(h):
        for i in range(w):
            if 0 <= x + i < N and 0 <= y + j < N: g.c[y + j][x + i] = ch
    return g

def recolor(g, frm, to, x0=0, x1=32, y0=0, y1=32):
    for y in range(y0, y1):
        for x in range(x0, x1):
            if g.c[y][x] in frm: g.c[y][x] = to
    return g

def collar_shadow(g, cx=16, top=22, half=4):
    """Darken the shirt right under the chin so the head sits in front of the body."""
    for x in range(cx - half, cx + half):
        if g.c[top][x] in '34': g.c[top][x] = '2'
    return g

def stripes_v(g, cx, top, every=3, key='4', base='3'):
    for y in range(top, N):
        for x in range(N):
            if g.c[y][x] == base and (x - cx) % every == 0: g.c[y][x] = key
    return g
