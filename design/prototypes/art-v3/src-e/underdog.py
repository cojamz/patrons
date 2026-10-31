import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, jacket

# Underdog (gold), round 1. A scrappy kid who is behind and not worried about it: a newsboy cap, brows set, a small determined smile. A patched gold jacket. Prop: a pink piggy bank hugged to her chest.
# Frontal. Template: 1 person.
c = Canvas()
body = jacket(c, top=32.4, l=3, r=44)
c.fill(c.poly([(19.5, 32), (28.5, 32), (24, 37)]), '1')
c.put(20, 32, ['44', '.4']); c.put(26, 32, ['22', '2.'])
c.fill(c.rect(7, 41, 11, 45) & body, '4'); c.put(7, 41, ['22222', '2...2', '2...2', '2...2', '22222'])   # the patch
# neck
c.fill(c.rect(21, 28, 26, 31), 'B'); c.fill(c.rect(21, 28, 26, 29), 'A'); c.fill(c.rect(25, 30, 26, 31), 'A')
# ---- face x15..32
rows(c, 15, {
    13: "..CDDDDCCCCCCCCBA.",
    14: ".BCDDDDCCCCCCCCCBA",
    15: ".BCDDDCCCCCCCCCCBA",
    16: ".BCDDCCCCCCCCCCCBA",
    17: ".BCEEECCCCCCEEECBA",
    18: ".BCzzzzCCCCzzzzBBA",
    19: ".BCyzzyCDDCyzzyBBA",
    20: ".BCyz!yCDDCyz!yBBA",
    21: ".BCCBBCCDDBCBBCBBA",
    22: ".BDDDDCCDDBCDDDBBA",
    23: ".BDDDDCCCCBCDDDBBA",
    24: ".BCDDCCCAABCCCCBA.",
    25: "..BCCCCCCCCCCCBBA.",
    26: "..BCCCACCCCACCBA..",
    27: "...BCCCAAAACCBA...",
    28: "....BBCCDDCCBA....",
    29: "......ABBBBA......",
})
# short dark hair escaping the cap at the sides
c.put(14, 14, ['EF', 'EFF', 'EF', 'E', 'EF']); c.put(32, 14, ['FE', 'FFE', '.FE', '..E'])
# ---- newsboy cap: a soft crown slumped to our right, a short brim, a button on top
crown = c.poly([(14, 14), (14.5, 9), (18, 5.6), (24, 4.6), (31, 5.4), (35.5, 8), (36.6, 12), (34, 14.4), (14, 14.6)])
c.fill(crown, '2'); c.outside(crown, '1', 22, 8, 12, 5.5); c.fill(crown & c.ellipse(20, 7.2, 5, 2.2), '3')
c.fill(c.line(18, 12, 24, 6) & crown, '1'); c.fill(c.line(27, 6, 31, 12) & crown, '1')
c.put(23, 3, ['44', '33'])
brim = c.poly([(13.6, 13.4), (33, 13.4), (31.5, 15.8), (16, 15.8)])
c.fill(brim, '1'); c.fill(brim & c.rect(0, 13, 47, 13), '2')
# ---- the piggy bank hugged to her chest, facing our right: a round pink body, two ears, a flat snout, a coin slot
pig = c.ellipse(23.5, 41.6, 8, 5.4)
c.fill(pig, 'w'); c.outside(pig, 'v', 22.4, 40.4, 7.4, 4.8); c.fill(pig & c.ellipse(20.5, 39.4, 4, 1.8), 'x')
snout = c.ellipse(32.2, 41.6, 1.8, 2.4)
c.fill(snout, 'x'); c.fill(snout & c.rect(33, 40, 34, 44), 'w'); c.set(32, 40, 'u'); c.set(32, 43, 'u')
c.set(29, 39, 'z'); c.set(29, 38, 'u')                                                  # eye, under a brow
c.put(22, 37, ['uuu'])                                                                  # the coin slot

c.edge(pig | snout, 'u')
c.put(17, 46, ['vv', 'vv']); c.put(27, 46, ['vv', 'vv'])            # stub legs
c.put(20, 33, ['u...', 'uxu..', 'uxwu.', 'uwwwu']); c.put(26, 33, ['...u', '..uwu', '.uwvu', 'uwwvu'])          # ears
c.put(13, 39, ['.CD', 'CCD', 'BCC', 'ABB'])                                             # her hands round it
c.put(33, 45, ['CC', 'BC'])
PORTRAIT = {'id': 'gold.underdog', 'name': 'Underdog', 'kind': 'member', 'sphere': 'gold',
            'people': [{'skin': 'warmtan', 'hair': 'black'}], 'accent': 'rose', 'px': c.rows()}
