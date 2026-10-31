import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket

# Alchemist (gold.tinker), round 2. A delighted inventor eyeing the flask she just turned to gold: a big crown of
# curls, a pleased closed smile, eyes on her work (calm, not wide: see audit.md). Gold work robe with a high collar. Prop: a round-bottomed flask held up at her
# shoulder, glowing gold inside. True 3/4 to our right. Template: 1 person.
c = Canvas()
body = jacket(c, top=34, l=2, r=45)
col = c.poly([(17, 31), (22, 32.6), (28, 32), (31.5, 31), (32.4, 35.4), (24, 37), (16, 35.4)])
c.fill(col, '4'); c.fill(col & c.rect(26, 31, 33, 37), '2'); c.edge(col, '1')
c.fill(c.line(24, 37, 23, 47), '2')
c.fill(c.rect(20, 27, 26, 31) - col, 'B'); c.fill(c.rect(20, 27, 26, 28), 'A')
# ---- face, 3/4 to our right
# Very deep skin keeps its tone; the face reads by light (whole-set review, round 2): D planes on the top-left forehead,
# the cheekbone and the nose bridge, warm brown irises (her hair's mid step), a closed smile with no light row under it,
# and a glow from the flask on her far jaw.
rows(c, 14, {
    12: "....BDDDDDDCCCCB....",
    13: "...BDDDDDDDDCCCB....",
    14: "...BDDDDDDDDCCCBA...",
    15: "...BDDDDDDDCCCCCBA..",
    16: "...BCEEEEDDCCCEEECBA",
    17: "..BBCBBBBBDDCBBBBBA.",
    18: "..BCDBzzzzDDDCzzzBA.",
    19: "..BCDByGzyDDHCyGzBA.",
    20: "..BCDDDDDDDDHCCCCBA.",
    21: "..ABDDDHHHDDHCCCCCDA",
    22: "..ABDDDDHDDDDDBCCCDA",
    23: "...ABDDDDDDCCDDABCDA",
    24: "...ABCDDDDDCCAACBCDA",
    25: "....ABCDDzCCCzCCCDA.",
    26: "....ABCCCCzzzCCCCDA.",
    27: ".....ABBCCCCCCCCDA..",
    28: ".......AABBBBBBAA...",
})
c.put(15, 18, ['CD', 'BCC', 'ABC', 'BA'])                         # the near ear
# ---- a big rounded crown of curls: lit on the top-left, small curl shadows staggered across it
hair = c.ellipse(24, 11, 12.4, 8.6) | c.ellipse(15.5, 16, 4.4, 5.6) | c.ellipse(33.2, 15, 3.4, 5)
hair -= c.poly([(18, 30), (18, 14), (21, 12.4), (27, 12), (31.4, 13.6), (32.4, 16), (33, 30)])
hair -= c.rect(13, 18, 17, 22) & c.mask_of('ABCD')
c.fill(hair, 'G'); c.outside(hair, 'F', 21, 8.5, 12, 7.5); c.outside(hair, 'E', 22, 9, 14.5, 9.5)
c.fill(hair & c.ellipse(18.5, 6, 6, 3.2), 'H'); c.fill(hair & c.ellipse(17, 7.6, 3.4, 1.8) - c.ellipse(19, 5, 4, 2.2), 'G')
for k, y in enumerate(range(4, 22, 3)):
    for x in range(12 + (k % 2) * 2, 38, 4):
        if (x, y) in hair and (x + 1, y) in hair and (x, y + 1) in hair:
            cur = c.get(x, y); d = {'H': 'G', 'G': 'F', 'F': 'E', 'E': 'E'}[cur]
            c.set(x, y + 1, d); c.set(x + 1, y + 1, d); c.set(x + 1, y, d) if cur != 'H' else None
c.rim(hair, 'H', -1, -1, 1)
c.edge(hair, 'E')
# ---- the flask held up at her shoulder: glass with a gold glow inside, a cork
fl = c.ellipse(39.5, 30.5, 4.6, 4.4) | c.rect(38, 21, 41, 27)
c.fill(fl, 'k'); c.fill(c.ellipse(39.5, 31, 3.4, 3.2), 'c'); c.fill(c.ellipse(38.6, 30, 1.8, 1.4) & c.ellipse(39.5, 31, 3.4, 3.2), 'd')
c.fill(c.rect(38, 21, 41, 22), '2'); c.fill(c.rect(39, 24, 40, 27), 'j'); c.set(37, 28, '!')
c.inner_edge(fl, lambda k: '1')
c.put(35, 33, ['DC', 'CHD', 'BCH', 'ABB'])                         # her fingers round it, knuckles lit
c.put(42, 17, ['.!.', '!.!', '.!.']); c.set(44, 21, '!')          # a spark off the gold
# Lighting pass for 1x (very deep skin): the near jaw and the cheek beside the mouth lit as one plane with the cheek
# above, the upper lip lit, so the lower face is no longer a dark mass that reads as a goatee.
for (x, y) in ((19, 24), (20, 25), (20, 26), (21, 26), (22, 26), (23, 26), (21, 27), (22, 27), (24, 25), (25, 25)):
    if c.get(x, y) == 'C': c.set(x, y, 'D')
for (x, y) in ((23, 27), (24, 27), (25, 27), (26, 27)):                            # the chin top
    if c.get(x, y) == 'C': c.set(x, y, 'r')                                          # one warm midtone (wood r)
PORTRAIT = {'id': 'gold.tinker', 'name': 'Alchemist', 'kind': 'member', 'sphere': 'gold',
            'people': [{'skin': 'verydeep', 'hair': 'brown'}], 'accent': 'red', 'px': c.rows()}
