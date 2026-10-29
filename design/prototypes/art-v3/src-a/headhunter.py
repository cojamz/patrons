import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Headhunter (red): a sharp recruiter in a sleek black bob and a red blazer, holding up her business card between two
# fingers, eyes sliding to our right (she has spotted your best member). 3/4 to our right. Template: 1 person.
c = Canvas()
# ---- body: blazer with sharp lapels over a pale blouse
b = body(c, [(2, 48), (3, 40), (8, 36), (16, 34), (31, 34), (39, 36), (44, 40), (45, 48)])
c.fill(c.poly([(19.5, 33.5), (28.5, 33.5), (24, 42)]), 'k')
c.fill(c.poly([(19.5, 33.5), (22, 33.5), (24, 42)]), 'l')
lapL = c.poly([(15.5, 34.2), (19.5, 33.5), (24, 43), (21.5, 43), (17.5, 38.5), (14, 36)])
lapR = c.poly([(28.5, 33.5), (32.5, 34.2), (34, 36), (30.5, 38.5), (26.5, 43), (24, 43)])
c.fill(lapL, '4'); c.edge(lapL, '1'); c.fill(lapR, '2'); c.edge(lapR, '1')
c.fill(c.line(9, 41, 10, 47), '2'); c.fill(c.line(38, 41, 37, 47), '1')
neck(c, 0, 21, 26, 29, 33)
# ---- face, 3/4 right, sly side-glance, a one-sided smile
f = face(c, 0, 15, 19, 18, 6, 9, view='r', eyes='side', mouth='smirk', jaw='oval', ears=False)
# ---- bob: a helmet of hair, fringe cut straight, ends curling under at the jaw
hr = c.poly([(12.5, 27), (12, 17), (13.5, 11), (18, 7.5), (24, 6.5), (30, 7.5), (34, 11), (35, 17), (35, 26),
             (33, 27.5), (33, 17), (31, 15.6), (17, 15.6), (15, 17), (15, 27.5)])
hair(c, hr, 0, 21, 12, 12, 9)
c.fill(c.poly([(15, 11), (18, 8.6), (23, 8), (22, 9.6), (17.5, 10.6), (15.5, 12.6)]), 'G')   # the shine on the crown
c.fill(c.rect(13, 25, 15, 27) & hr, 'E'); c.fill(c.rect(31, 24, 34, 27) & hr, 'E')
c.fill(c.line(24, 8, 21, 15) & hr, 'E')                              # the parting
c.edge(hr, None)
# ---- the business card, held up by the shoulder between two fingers
sleeve = c.poly([(30, 48), (31, 43), (35, 41.5), (39, 43), (39, 48)])
c.fill(sleeve, '3'); c.rim(sleeve, '4', -1, -1, 1, only='3'); c.fill(c.rect(36, 44, 39, 48) & sleeve, '2'); c.edge(sleeve, '1')
card = c.rect(32, 33, 41, 38)
c.fill(card, 'k'); c.fill(c.rect(32, 33, 41, 33), 'l'); c.fill(c.rect(41, 34, 41, 38), 'j')
c.fill(c.rect(34, 35, 39, 35), '3'); c.fill(c.rect(34, 37, 38, 37), 'j')
c.edge(card, 'j')
c.put(33, 38, ['CDC', 'BCC', 'BCB', '.B.'])                         # two fingers and a thumb under the card
PORTRAIT = portrait(c, 'red.headhunter', 'Headhunter', 'red', [{'skin': 'warmtan', 'hair': 'black'}])
