# Writes portraits/out-gold-silver-yellow.json from gold.py, silver.py, yellow.py.
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here)
from common import build
out = []
for mod, sphere in (('gold', 'gold'), ('silver', 'silver'), ('yellow', 'yellow')):
    try: m = __import__(mod)
    except ModuleNotFoundError: continue
    out += build(m.ENTRIES, sphere)
path = os.path.join(here, '..', '..', 'out-gold-silver-yellow.json')
with open(path, 'w') as f:
    f.write('[\n' + ',\n'.join(json.dumps(o) for o in out) + '\n]\n')
print(len(out), 'portraits ->', os.path.normpath(path))
