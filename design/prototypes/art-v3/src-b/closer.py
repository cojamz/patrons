import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Closer (purple): a sales closer at the end of the day, short natural black hair, gold hoops, sharp purple blazer over
# a linen blouse, holding up the signed contract with a gold pen. Proud, warm closed smile. 3/4 to our left (into the
# light). Template: 1 person.
c = new()
b = body(c, [(3, 48), (4, 40), (9, 35.5), (17, 33.5), (30, 33.5), (38, 35.5), (43, 40), (44, 48)], 20, 38, 19, 11)
bl = c.poly([(19, 33.5), (28, 33.5), (25.5, 41), (21.5, 41)])
c.fill(bl, 'k'); c.fill(bl & c.rect(24, 33, 30, 41), 'j')
lapL = c.poly([(15, 34), (19.5, 33.5), (23, 43), (20, 43), (16.5, 38), (13.5, 36)])
lapR = c.poly([(27.5, 33.5), (32, 34), (34, 36), (31, 38), (27, 43), (24.5, 43)])
c.fill(lapL, '4'); c.edge(lapL, '1'); c.fill(lapR, '2'); c.rim(lapR, '3', -1, 0, 1); c.edge(lapR, '1')
neck(c, 20, 28, 28, 34)
face(c, 'q34L', 15, 19, eyes='dark', brows='arched', mouth=None, glow=True, iris='a')
c.put(16, 24, ['B...B', '.AuA.'])                                                # closed smile, warm lips
ear(c, 31, 18)
c.put(31, 22, ['cc.', 'c.c', 'c.c', '.b.'])                                       # gold hoop
# short natural hair, rounded, a lit crown
hair(c, [(15.5, 18), (15, 12), (17, 7.5), (21, 5), (27, 4.8), (31.5, 6.8), (33.5, 11), (33.5, 18), (32.5, 18), (31.5, 13),
         (25, 11.6), (18, 12.6), (16.5, 18)], 0, 22, 8.5, 10, 5.5)
# the signed contract and the pen, lower right
doc = c.poly([(31, 36), (42, 34.5), (44, 47.5), (33, 48)])
c.fill(doc, 'k'); c.fill(doc & c.rect(38, 33, 47, 47), 'j'); c.fill(doc & c.rect(30, 34, 35, 38), 'l')
for y in (38, 41): c.fill(c.line(34, y, 40, y - 1), 'i')
c.put(34, 45, ['zzz.zzz'])                                              # the signature
c.edge(doc, 'i')
c.fill(c.line(41, 39, 46, 30), 'c'); c.fill(c.line(42, 39, 47, 30), 'b'); c.put(40, 40, ['z'])
c.put(30, 41, ['.CCD', 'CCCC', 'BCCC', '.BB.'])                                  # her hand on it
# Lighting pass for 1x (deep skin): a D rim down the lit front contour, a bigger forehead plane, the bridge lit from
# the brows to the eyes, the cheek beside the smile lit, warm brown irises (wood r) for the gold
# ones (gold eye pixels glow on deep skin), a warm bounce (r) inside the shadow-side jaw.
c.put(16, 12, [
    '...DDDDDD',
    '..DDDDDDD',
    '.DDDDDDDDD',
    '.DDDDDDDD',
    '.D...DD',
    '.....DD',
    'D....D',
    'D.r..D.r',
    'D',
    'D',
    'D',
    '.....DDD',
    '.....DD',
], keep='.')
for (x, y) in ((31, 20), (30, 21), (30, 22), (30, 23), (29, 24)):
    if c.get(x, y) == 'B': c.set(x, y, 'r')
PORTRAIT = portrait('purple.closer', 'Closer', 'purple', [{'skin': 'deep', 'hair': 'black'}], c, merge={'H': 'G', 'u': 'r'})  # u->r: the warm lip shares the iris step (color cap)
