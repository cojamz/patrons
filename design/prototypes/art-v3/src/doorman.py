import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas

# Doorman (blue): an old hand at the door, peaked cap, double-breasted greatcoat. Stern, proper.
c = Canvas()
# coat: broad square shoulders, double row of gold buttons
body = c.poly([(3, 48), (4, 40), (8, 35.5), (17, 32), (31, 32), (40, 35.5), (44, 40), (45, 48)])
c.fill(body, '3')
c.outside(body, '2', 20, 36, 20, 13)
c.outside(body, '1', 18, 35, 24, 16)
c.rim(body, '4', 0, -1, 2, only='3')                               # the tops of the shoulders catch the light
c.fill(c.line(27, 36, 28, 47), '1'); c.fill(c.line(28, 36, 29, 47), '2')  # where the coat closes
c.fill(c.line(11, 38, 9, 47), '2')                                 # the left sleeve seam
for bx, by in ((21, 38), (21, 42), (31, 38), (31, 42), (21, 46), (31, 46)):
    c.put(bx, by, ['dc', 'cb'])
# gold braid looped from the left shoulder to the top button (a hotel doorman, not a policeman)
for (x0, x1, y) in ((8, 9, 36), (10, 11, 37), (12, 13, 38), (14, 16, 39), (17, 20, 40)):
    c.fill(c.rect(x0, y, x1, y), 'c'); c.set(x0, y, 'd'); c.fill(c.rect(x0, y + 1, x1, y + 1), 'b')
# head and neck
neck = c.rect(21, 27, 28, 32)
c.fill(neck, 'A'); c.fill(c.rect(21, 27, 22, 32), 'B')
head = c.ellipse(25, 19, 8, 9.2) | c.poly([(17, 19), (32.6, 19), (32, 24), (29.5, 28.5), (25, 31), (21, 30.5), (18, 27.5), (17, 24)])
c.fill(head, 'C')
c.outside(head, 'B', 22.5, 18.5, 8.6, 11.0)
c.outside(head, 'A', 21.5, 17.5, 10.6, 12.8)
ear = c.ellipse(32.4, 22, 1.8, 2.8)
c.fill(ear - head, 'B'); c.put(32, 21, ['A', 'A'])
# standing collar with gold piping
collar = c.poly([(16, 31), (21, 30.5), (24, 32), (27, 30.5), (32, 31), (33, 35), (27, 36.5), (21, 36.5), (15, 35)])
c.fill(collar, '3'); c.outside(collar, '2', 21, 32, 9, 4.5)
c.fill(c.line(16, 31, 21, 31), 'c'); c.fill(c.line(27, 31, 32, 31), 'c'); c.fill(c.line(22, 32, 26, 32), 'c')
c.fill(c.line(21, 36, 27, 36), '1')
# cap: a wide crown tipped toward us, gold cord on the band, a black glossy visor
crown = c.poly([(12.5, 9), (14.5, 6), (19, 4), (25, 3.4), (31, 4), (35.5, 6), (37, 8.5), (35.5, 11.5), (14, 11.5)])
c.fill(crown, '3')
c.fill(crown & c.ellipse(20, 5, 9, 3.4), '4'); c.fill(crown & c.ellipse(18, 4.5, 4.5, 1.8), '5')
c.outside(crown, '2', 22, 6, 15.5, 6.8)
c.fill(c.rect(15, 11, 34, 14), '2'); c.fill(c.rect(15, 12, 34, 12), 'c'); c.fill(c.rect(32, 11, 34, 14), '1')
c.put(22, 7, ['dc', 'ba'])                                          # cap badge
visor = c.poly([(12, 14.5), (30, 14.5), (29, 17), (17, 17), (13, 16)])
c.fill(visor, 'm'); c.fill(c.line(14, 15, 26, 15), 'o'); c.fill(c.line(15, 15, 19, 15), 'p')
c.fill(head & c.rect(17, 17, 33, 17), 'B'); c.fill(head & c.rect(28, 17, 33, 18), 'A')  # the visor's shadow
# face: heavy brows, eyes looking out to our left, nose, a grey moustache, a set mouth
c.put(18, 18, ['FF....GFF'])
c.put(18, 19, ['zzz..zzzz'])
c.put(18, 20, ['!zB..!zyB'])
c.put(29, 18, ['G', 'G', 'F'])                                      # sideburn
c.put(21, 20, ['D', 'D', 'C'])                                      # nose bridge catches the light
c.put(22, 21, ['B', 'B', 'A'])
c.put(19, 23, ['DCA'])                                              # nose tip, nostril
c.put(18, 25, ['FGGGGF', 'EFFFFE'])                                 # moustache
c.put(19, 27, ['.AAA'])                                             # mouth
c.put(20, 29, ['DC'])                                               # chin light
PORTRAIT = {'id': 'market.doorman', 'name': 'Doorman', 'kind': 'member', 'sphere': 'blue',
            'people': [{'skin': 'fair', 'hair': 'grey'}], 'accent': 'red', 'px': c.rows()}
