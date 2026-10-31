import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Tribute Band (green): a rock-and-roll tribute act mid-song. A tall black pompadour, long sideburns, a high popped
# collar with gold studs, a microphone at his lips, eyes shut in the moment. 3/4 to our left. Template: 1 person.
c = Canvas()
body = torso(c, 2, 45, 33)
c.fill(c.poly([(19, 33), (28, 33), (23.5, 41)]), 'B')
for pts, k in (([(12, 35), (14, 25.5), (19.5, 28), (20, 33), (17, 38)], '4'), ([(35, 35), (33, 25.5), (27.5, 28), (27, 33), (30, 38)], '2')):
    col = c.poly(pts); c.fill(col, k); c.edge(col, '1')                                              # stand-up collar
for x, y in ((11, 38), (36, 38), (14, 44), (33, 44)): c.put(x, y, ['cd', 'bc'])           # studs
neck(c, 20, 26, 28, 34)
face(c, 15, 32, 13, 28, 19, 19, [(15, 'shut3'), (21, 'shut4')], (17, ['.AA.', 'AzzA', '.AA.']), jaw='long',
     hair='F', brows=[(15, -3, ['FF']), (21, -3, ['FFFF'])], plane=5, cheek=False, ear=(31, 'R'), mouth_y=24)
c.put(21, 20, ['DDD', '.DD'])
burns = c.poly([(28.5, 15), (31, 15), (31, 25), (29.5, 26.5), (28.5, 24)])
c.fill(burns, 'F'); c.fill(c.rect(31, 15, 31, 24), 'E')
quiff = c.poly([(13.5, 18), (13, 13), (11, 8), (14, 4.5), (20, 2.5), (27, 3), (32, 5.5), (34, 10), (33.5, 17),
                (31.2, 17), (30, 14), (24, 13.6), (17, 13.4), (15, 15)])
c.fill(quiff, 'F'); c.outside(quiff, 'E', 21, 8, 11, 5.5); c.rim(quiff, 'G', -1, -1, 1, only='F')
c.fill(c.line(14, 6, 25, 4), 'G'); c.fill(c.line(13, 9, 22, 7), 'H')
c.edge(quiff, 'E')
# the microphone, close to his mouth
c.fill(c.line(11, 34, 15, 27), 'z')
c.fill(c.line(12, 34, 16, 27), 'e')
head = c.ellipse(16, 25.5, 2.6, 2.4)
c.fill(head, 'g'); c.fill(head & c.ellipse(15.3, 24.8, 1.3, 1.2), 'h'); c.outside(head, 'f', 15.6, 25, 2.4, 2.2); c.edge(head, 'e')
c.put(8, 33, ['.CCD', 'CCCC', 'BCCB', '.BB.'])
PORTRAIT = {'id': 'echo.dejavu', 'name': 'Tribute Band', 'kind': 'member', 'sphere': 'green',
            'people': [{'skin': 'olive', 'hair': 'black'}], 'accent': 'red', 'px': c.rows()}
