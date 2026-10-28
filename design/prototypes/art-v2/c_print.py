# Direction C: the same drawings printed as a woodcut in three inks (ink, paper, the sphere's spot color), shade by hatching.
import sys
from pix import *
KIND = 'm' if 'launderer' in sys.argv[1] else 'a'
INK, PAPER, SPOT = '#2b2018', '#f2e8d2', sys.argv[3] if len(sys.argv) > 3 else '#d49b27'
def cell(ch, x, y):
    chk = (x + y) % 2 == 0
    diag = (x - y) % 4 == 0
    m = {
      '4': SPOT if KIND == 'm' else SPOT, '3': INK if KIND == 'm' else SPOT, '2': INK if KIND == 'm' else SPOT, '1': INK,
      'S': PAPER, 's': PAPER, 't': INK,
      'H': INK, 'h': INK, 'j': INK,
      'K': INK, 'w': PAPER, 'l': PAPER, 'W': PAPER, 'V': PAPER, 'A': INK,
      'L': PAPER, 'M': PAPER, 'N': INK, 'D': INK,
      'B': SPOT, 'P': INK, 'p': INK,
      'b': SPOT, 'c': INK,
    }
    return m.get(ch, INK)
rows = open(sys.argv[1]).read().split('\n')
g = [[cell(ch, x, y) if ch != '.' else '.' for x, ch in enumerate(r)] for y, r in enumerate(rows)]
g = outline([''.join('X' if c != '.' else '.' for c in r) for r in g], INK)
for y, r in enumerate(rows):
    for x, ch in enumerate(r):
        if ch != '.': g[y][x] = cell(ch, x, y)
render(g, {}, int(sys.argv[4]) if len(sys.argv) > 4 else 10).save(sys.argv[2])
