# Build out-z-bluesilver.json: every member of in-sweep-bluesilver.json, drawn by the functions in blue.py/silver.py
# (named d_<id tail>); any without a function is copied through. Args: ids to close-up into /tmp/sweep-bluesilver/close.png.
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__)); ART = '/home/user/patrons/design/prototypes/art-v2'
sys.path.insert(0, HERE); sys.path.insert(0, ART)
import blue, silver
inp = json.load(open(os.path.join(ART, 'portraits/in-sweep-bluesilver.json')))
out, drawn = [], []
for m in inp:
    tail = m['id'].split('.')[-1]
    fn = getattr(blue, 'd_' + tail, None) or getattr(silver, 'd_' + tail, None)
    px = fn().rows() if fn else m['px']
    if fn: drawn.append(tail)
    out.append({'id': m['id'], 'name': m['name'], 'kind': 'member', 'sphere': m['sphere'], 'px': px})
json.dump(out, open(os.path.join(ART, 'portraits/out-z-bluesilver.json'), 'w'), indent=1)
print('drawn:', ' '.join(drawn))
