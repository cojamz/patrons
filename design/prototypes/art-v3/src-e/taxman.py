import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket

# Tax Collector (gold.taxman), round 1. The man who turns up whenever you buy anything: a peaked official cap with a
# gold badge, a pencil moustache, level stern eyes, a flat mouth. Gold uniform coat, buttoned. Prop: the tax ledger,
# black with a gold clasp, held to his chest. Frontal. Template: 1 person.
c = Canvas()
body = jacket(c, top=33.6, l=2, r=45)
col = c.poly([(18, 31), (24, 32.6), (30, 31), (30.8, 35.4), (24, 36.6), (17.2, 35.4)])
c.fill(col, '2'); c.fill(col & c.rect(17, 31, 23, 33), '3'); c.edge(col, '1')
c.fill(c.line(24, 36, 24, 47), '1')
for y in (38, 42, 46): c.put(25, y, ['d'])
c.fill(c.rect(20, 27, 27, 31) - col, 'B'); c.fill(c.rect(20, 27, 27, 28), 'A'); c.fill(c.rect(26, 29, 27, 31) - col, 'A')
# ---- face x15..32, long and narrow
rows(c, 15, {
    13: ".BCDDDDCCCCCCCCBA.",
    14: ".BCDDDDCCCCCCCCBA.",
    15: ".BCDDDCCCCCCCCCBA.",
    16: ".BCDDDCCCCCCCCCBA.",
    17: ".BCEEEEECCEEEEEBA.",
    18: ".BCBzzzBCCBzzzBBA.",
    19: ".BCByz!CDCByz!BBA.",
    20: ".BCCBBCCDBCBBBBBA.",
    21: ".BDDDCCCDBCCCCCBA.",
    22: ".BDDDCCCDBBCCCCBA.",
    23: ".BCDCCCDDDBBCCBBA.",
    24: ".BCCCCCAAABCCCBA..",
    25: "..BCCEEEEEEEECBA..",
    26: "..BCCCCAAAACCCBA..",
    27: "...BCCCCDDCCCBA...",
    28: "....BBCCCCCBBA....",
    29: "......ABBBBA......",
})
c.put(14, 17, ['B', 'C', 'B', 'A'][0:0])
c.put(13, 18, ['.C', 'CB', 'CB', '.A']); c.put(32, 18, ['A.', 'BA', 'BA', 'A.'])     # ears
c.put(15, 13, ['E', 'EF', 'E', 'E']); c.put(31, 13, ['.F', 'FE', '.E', '.E'])          # hair, short at the temples
# ---- the peaked official cap: a stiff black crown, a gold band and badge, a glossy peak that shades the brow
crown = c.poly([(14.5, 13.6), (13.6, 8.5), (16, 5.6), (24, 4.4), (32, 5.6), (34.4, 8.5), (33.5, 13.6)])
c.fill(crown, 'n'); c.outside(crown, 'm', 22, 7.5, 11, 5); c.fill(crown & c.ellipse(19.5, 6.6, 4.2, 1.6), 'o')
band = c.rect(14, 11, 34, 13) & crown
c.fill(band, '3'); c.fill(band & c.rect(28, 11, 34, 13), '2'); c.fill(band & c.rect(14, 11, 27, 11), '4')
c.put(22, 7, ['dddc', 'dcc2', '.c2.'])
peak = c.poly([(15, 13.4), (33, 13.4), (31.5, 15.8), (17, 15.8)])
c.fill(peak, 'm'); c.fill(peak & c.rect(15, 13, 33, 13), 'o'); c.fill(peak & c.rect(15, 14, 26, 14), 'n')
# ---- the ledger held flat against his chest, its spine toward us, a gold clasp
led = c.poly([(10, 37), (21, 36), (21.6, 47.6), (11, 47.6)])
c.fill(led, 'n'); c.fill(led & c.rect(10, 36, 13, 47), 'o'); c.fill(led & c.rect(20, 36, 22, 47), 'm')
c.fill(c.rect(13, 37, 20, 37) & led, 'o')
c.fill(c.line(12, 36, 21, 35) | c.line(22, 36, 22, 46), 'k'); c.fill(c.line(22, 37, 22, 46), 'j')
c.put(17, 40, ['cd', 'cc'])
c.put(19, 43, ['.CD', 'CCDC', 'BCCC', 'ABBC'])                         # his hand flat on it
c.edge(led | c.mask_of('jk'), 'm')
PORTRAIT = {'id': 'gold.taxman', 'name': 'Tax Collector', 'kind': 'member', 'sphere': 'gold',
            'people': [{'skin': 'fair', 'hair': 'darkbrown'}], 'accent': 'red', 'px': c.rows()}
