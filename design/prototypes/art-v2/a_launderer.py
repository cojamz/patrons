from pix import *
g = G(24)
g.put(1, 13, ['   44WWAWW32   ','  443WWAWW3321 ',' 44333VAV32221 ','4433343A3432221','4433334A4332221','4433333A3322221','443333333322221','443333333322211','443333333222211','443333332222111','433333322222111'])
g.put(5, 2, ['   HHHH   ',' HHhhjjhH ','HHhjjhhhhH','HhSSSSSShH','HSSSSSSSst','SKwKKKwKKt','SsKKSsKKst','SSSSSSSsst',' SSSttSst ','  sssstt  ','   tst    '])
g.put(14, 10, ['LLLLLLLM','LNMNMMMN','MMMMMMMN','LMMNNMMN','LMNDDNMN','LND4wDNN','LND32DNN','LMNDDNMN','LMMNNMMN','MNNNNNNN'])
g.put(13, 15, ['SS','ts'])
open('a_launderer.txt','w').write('\n'.join(g.rows()))
