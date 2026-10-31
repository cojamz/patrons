# Shared helpers for batch e (gold). Not a portrait (the leading underscore keeps build_batch from loading it).
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas

def rows(c, x0, d):
    """d: {y: str} or {y: (x, str)} hand-drawn rows; '.' and ' ' keep what is there."""
    for y, r in d.items():
        if isinstance(r, tuple): c.put(r[0], y, [r[1]])
        else: c.put(x0, y, [r])

def jacket(c, top=33.4, l=1, r=46, sh=6, cx=24):
    """Sloped shoulders in the sphere ramp, lit from the top-left, one fold under the near arm."""
    body = c.poly([(l, 48), (l + 1, 40), (l + 5, 36), (cx - 10, top + 0.6), (cx - 5, top), (cx + 4, top), (cx + 9, top + 0.6),
                   (r - 5, 36), (r - 1, 40), (r, 48)])
    c.fill(body, '3'); c.outside(body, '2', cx - 6, 38, 21, 13); c.outside(body, '1', cx - 8, 37, 27, 17)
    c.rim(body, '4', 0, -1, 1, only='3')
    c.fill(c.line(l + 6, 40, l + 7, 47), '2')
    return body
