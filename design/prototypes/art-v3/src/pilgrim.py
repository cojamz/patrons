import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas

# Pilgrim (yellow): an old walker in a broad hat with a scallop shell pinned on the crown, a shoulder cape, white
# hair in a braid over her shoulder, her staff in hand. Weathered, smiling into the light.
c = Canvas()
cloak = c.poly([(4, 48), (6, 40), (10, 35), (18, 31), (28, 31), (36, 35), (40, 40), (42, 48)])
c.fill(cloak, '2'); c.outside(cloak, '1', 18, 39, 19, 14)
cape = c.poly([(8, 38), (11, 34.5), (18, 31), (28, 31), (35, 34.5), (38, 38), (37, 40.5), (30, 41.5), (23, 42), (16, 41.5), (9, 40.5)])
c.fill(cape, '3'); c.fill(cape & c.ellipse(17, 33, 10, 4), '4'); c.outside(cape, '2', 20, 34, 16, 8.5)
c.rim(cape, '5', 0, -1, 1, only='4'); c.edge(cape, '1')
c.fill(c.rect(19, 29, 27, 32), 'A')                                 # neck
c.put(21, 32, ['qrrq', '.qq.', '.r.r'])                             # the cloak's cord
# face, by hand (x 15..31): turned to our left into the light; forehead line, crow's feet, smile folds
FACE = [
    '...BBBBBBBBBBBB..',  # 13
    '..BCCCCCCCCBBBBB.',  # 14
    '.BCDDCCCCCCCCBBBA',  # 15
    '.CDDCCCCCCCCCBBBA',  # 16
    '.CHHHCCCHHHHCCBBA',  # 17
    '.CEEECCCEEEEBCBBA',  # 18
    '.C!zCCDCCz!yBBBBA',  # 19
    '.CCBCCDCBCCBCBBBA',  # 20
    'BCCCCDCCCCCCCBBBA',  # 21
    'DDCCDCCCCCCBCCBBA',  # 22
    'BAACCCCCCCBCCCBA.',  # 23
    '.CACCCCCACBCCBBA.',  # 24
    '.CCABBBBACCCCBBA.',  # 25
    '.CCCDDDCCCCCBBA..',  # 26
    '..BCCCCCCCCBBA...',  # 27
    '...BBCDDCCBBA....',  # 28
    '.....AAAAAAA.....',  # 29
]
assert all(len(r) == 17 for r in FACE)
c.put(15, 13, FACE)
# white hair at the temple, a braid over her right shoulder (our right), in front of the cape
c.put(28, 13, ['HGGF', 'GGFF', '.GFE', '.FE.'])
for y in range(25, 38):                                             # one continuous plait, a lump every 3 rows
    x0 = 29 if y < 27 or y > 34 else 30
    c.put(x0, y, ['FE' if y % 3 == 0 else ('GF' if y % 3 == 1 else 'FF')])
c.put(29, 38, ['rq'])                                               # braid tie
# hat: domed crown, broad brim, the shell pinned on the crown
brim = c.ellipse(23, 12.4, 15, 2.9)
c.fill(brim, '3'); c.fill(brim & c.rect(0, 0, 47, 11), '4'); c.fill(brim & c.rect(0, 13, 47, 15), '2')
c.fill(brim & c.rect(31, 12, 47, 12), '2'); c.rim(brim, '1', 0, 1, 1)
crown = c.ellipse(23.5, 10, 8.6, 7) & c.rect(0, 0, 47, 10)
c.fill(crown, '3'); c.outside(crown, '2', 21.5, 8.5, 8.4, 7); c.fill(crown & c.ellipse(19.5, 5.2, 4.5, 2.2), '4')
c.fill(crown & c.rect(0, 9, 47, 10), '2'); c.fill(crown & c.rect(0, 9, 22, 9), '3')     # band
c.put(20, 3, ['..lkl..', '.lkjkl.', 'lkjkjkl', 'kjkkkjk', '.jjijj.', '...i...'])            # scallop shell
c.edge(c.mask_of('ijkl') & c.rect(19, 2, 28, 9), '1')
# staff in her right hand
c.fill(c.rect(37, 3, 38, 47), 'r'); c.fill(c.rect(37, 3, 37, 47), 's'); c.fill(c.rect(36, 2, 39, 4), 'r'); c.fill(c.rect(36, 2, 38, 2), 't')
c.edge(c.rect(36, 2, 39, 47), 'q')
fist = c.ellipse(37.5, 30.5, 2.8, 2.6)
c.fill(fist, 'C'); c.outside(fist, 'B', 37, 30, 2.6, 2.4); c.put(35, 30, ['D', 'A']); c.put(36, 31, ['AA'])
PORTRAIT = {'id': 'yellow.pilgrim', 'name': 'Pilgrim', 'kind': 'member', 'sphere': 'yellow',
            'people': [{'skin': 'brown', 'hair': 'white'}], 'accent': 'red', 'px': c.rows()}
