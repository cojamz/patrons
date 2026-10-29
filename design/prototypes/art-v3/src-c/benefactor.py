import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Benefactor (silver): a stout, kindly man of means with a short dark beard and a receding hairline, warm smile, a
# fur-collared silver greatcoat, holding out an open purse brimming with gold coins. 3/4 to our left.
# Template: 1 person.
c = Canvas()
body = cloth(c, [(0, 48), (1, 40), (5, 35.5), (15, 33), (32, 33), (42, 35.5), (46, 40), (47, 48)])
fur = c.poly([(10, 36), (13, 32), (19, 30.5), (28, 30.5), (34, 32), (37, 36), (33, 37.6), (28, 36), (24, 38), (20, 36), (14, 37.6)])
c.fill(fur, 'k'); c.outside(fur, 'j', 21, 32, 11, 4); c.rim(fur, 'l', 0, -1, 1, only='k')
for x in (14, 19, 25, 31): c.put(x, 33, ['l.', '.j'])
c.fill(c.line(24, 38, 24, 47), '2')
neck(c, 19, 27, 27, 31)
f = face(c, (15, 10, 32, 28), 19, view='l', jaw='jowl', mouth='smile', brows='level', eyes='round', look=-1)
# short dark beard along the jaw and chin, mouth showing
seg(c, {
    23: [(15, 'FF'), (31, 'FE')],
    24: [(15, 'FFF'), (30, 'FFE')],
    25: [(15, 'FFFG'), (20, 'FFFFFFF'), (28, 'FFFE')],
    26: [(16, 'FFGGFFFFFFFFFFE')],
    27: [(17, 'FFFFFFFFFFFFE')],
    28: [(18, 'EFFFFFFFFEE')],
    29: [(20, 'EEEEEEE')],
})
c.put(20, 24, ['BAAAAB'])
c.put(21, 23, ['FGGF']); c.put(20, 23, ['F']); c.put(25, 23, ['F'])            # moustache
c.put(21, 25, ['DDD'])
# receding hair: bare dome, dark hair at the sides and back
c.put(16, 11, ['DDDD', 'DDD.'])
hair(c, [(13.5, 21), (13.5, 14), (16, 12), (17, 15), (15.5, 21)], 14, 14, 2, 3)
hair(c, [(31, 12), (34, 14), (34.5, 21), (32.6, 21), (32, 15)], 32, 13, 2, 3)
# the coin purse held out in his hand, a gold coin on top
purse = c.ellipse(9, 42.5, 5.8, 4.6)                                           # a drawstring pouch: round belly, cinched neck
c.fill(purse, 'v'); c.outside(purse, 'u', 8, 41.5, 5, 3.8); c.fill(purse & c.ellipse(6.5, 41, 2, 1.3), 'w')
c.put(5, 34, ['vv.vv.vv', '.vvvvvv.', '..uvvu..', '..cbbc..', '..vvvu..'])               # the ruffled top, the gold cord
c.put(13, 33, ['.cc', 'cdc', 'bcb'])                                              # coins spilling out over the top
c.put(15, 37, ['.cc', 'cdb', '.bb']); c.put(16, 30, ['cc', 'bb'])
c.put(13, 42, ['.CD.', 'CDCD', 'CCCB', 'BCBB', '.BB.'])                          # his hand under it: knuckles, thumb
merge(c, {'4': '3', 'a': 'b', 'd': 'c', 'l': 'k', '!': 'y'})
PORTRAIT = {'id': 'silver.benefactor', 'name': 'Benefactor', 'kind': 'member', 'sphere': 'silver',
            'people': [{'skin': 'coolbrown', 'hair': 'darkbrown'}], 'accent': 'red', 'px': c.rows()}
