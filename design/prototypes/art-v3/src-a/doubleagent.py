import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Double Agent (magenta): a spy who is someone else today. Trench coat with the collar turned up, a neat side part, dark
# glasses with a glint, an unreadable calm mouth, and a lanyard ID card on his chest with someone else's face on it.
# 3/4 to our right. Template: 1 person.
c = Canvas()
body(c, [(1, 48), (2, 40), (7, 35.5), (16, 33.5), (31, 33.5), (40, 35.5), (45, 40), (46, 48)])
c.fill(c.poly([(19, 33), (29, 33), (24, 44)]), 'n')                                # dark shirt
col = c.poly([(13, 36), (14, 29), (19, 27.6), (21, 33), (24, 44), (17, 39)])
c.fill(col, '4'); c.rim(col, '5', -1, 0, 1); c.edge(col, '2')
colR = c.poly([(35, 36), (34, 29), (29, 27.6), (27, 33), (24, 44), (31, 39)])
c.fill(colR, '2'); c.rim(colR, '3', -1, 0, 1); c.edge(colR, '1')
neck(c, 0, 21, 27, 28, 32)
face(c, 0, 15, 19, 18, 6, 9, view='r', eyes='calm', mouth='calm', jaw='square', dk=True)
c.put(17, 17, ['zzzzzzz.zzzzzz', 'zzz!zzzzzz!zzz', '.zzzz...zzzz..'][0:0])
c.put(17, 17, ['zzzzzz.zzzzzz', 'z!zzzzzz!zzzz', '.zzzz...zzzz.'])       # dark glasses
hr = c.poly([(14, 20), (14, 13), (16, 10), (21, 8.4), (28, 8.4), (32, 10), (34, 13.4), (34, 18), (32.6, 18), (32, 14.8),
             (24, 13.6), (20, 14.6), (16, 14.6), (15.6, 20)])
hair(c, hr, 0, 21, 10, 8, 4)
c.fill(c.line(20, 9, 19, 13), 'E')                                            # the side part
# ID card on a lanyard: a little face that isn't his
c.fill(c.line(20, 33, 24, 39) | c.line(28, 33, 26, 39), 'w')
cd = c.rect(22, 39, 29, 46)
c.fill(cd, 'k'); c.fill(c.rect(22, 39, 29, 39), 'w'); c.edge(cd, 'i')
c.put(23, 41, ['ttt', 'sts', 'sss']); c.fill(c.rect(27, 41, 28, 41) | c.rect(27, 43, 28, 43), 'i')
PORTRAIT = portrait(c, 'thieves.doubleagent', 'Double Agent', 'magenta', [{'skin': 'brown', 'hair': 'black'}], accent='teal')
