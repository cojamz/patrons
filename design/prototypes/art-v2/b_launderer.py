from pix import *
import math
g = G(32)
# the portrait's doorway: a dome in the sphere's dark, a lighter inner rim
arch = []
for y in range(3, 32):
    hw = 12 if y >= 15 else int(round(math.sqrt(max(0, 12.4**2 - (15 - y)**2))))
    arch.append((y, hw))
for y, hw in arch:
    if hw <= 0: continue
    row = 'c' + 'b' * (2 * hw - 2) + 'c' if hw > 1 else 'cc'
    g.put(16 - hw, y, [row])
g.put(16 - 12 + 1, 4, [''])
g.put(10, 5, ['   HHHHHH   ',' HHhhjjjhHH ','HHhhjjjjhhHH','HhhjjhhhhhhH','HhSSSSSSSShH','HSSSSSSSSSst','SSSSSSSSSSst','KKKKKKKKKKKK','sKwKKSSKwKKt','sSKKSSSSKKst','SSSSSttSSSst',' SSSSSSSSst ',' SSStttttst ','  sSSSSSst  ','   ssssst   ','    tsst    '])
g.put(9, 13, ['s']); g.put(22, 13, ['t'])
g.put(5, 21, ['      44WWAAWW32      ','    4443WWAAWW3322    ','  44433VWWAAWWV33221  ',' 4433333VWAAWV3332221 ','443333334VAAV433322221','4433333334AA4333222221','4433333333AA3333222221','443333333AAAA333222211','4433333333AA3332222211','4433333333333322222111','4333333333333222222111'])
g.put(8, 25, ['WW','VW'])
g.put(19, 15, ['LLLLLLLLLLLM','LNMNMMMMMLMN','LMMMMMMMMMMN','MNNNNNNNNNNN','LMMMNNNNMMMN','LMMNDDDDNMMN','LMNDwBBDDNMN','LMNDB43BDNMN','LMNDB21BDNMN','LMNDDBBDDNMN','LMMNDDDDNMMN','LMMMNNNNMMMN','LMMMMMMMMMMN','MNNNNNNNNNNN'])
g.put(17, 22, ['SSs','tss'])
open('b_launderer.txt','w').write('\n'.join(g.rows()))
