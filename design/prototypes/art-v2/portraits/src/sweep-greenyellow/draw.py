# Sweep greenyellow: builds portraits/out-z-greenyellow.json from green.py and yellow.py (falls back to the input px).
import sys, json
sys.path.insert(0, '/home/user/patrons/design/prototypes/art-v2/portraits/src/sweep-greenyellow')
import green
try: import yellow; Y = yellow.ENTRIES
except ImportError: Y = {}
NEW = {**green.ENTRIES, **Y}
ORDER = json.load(open('/home/user/patrons/design/prototypes/art-v2/portraits/in-sweep-greenyellow.json'))
out = []
for m in ORDER:
    px = NEW[m['id']]().rows() if m['id'] in NEW else m['px']
    out.append({'id': m['id'], 'name': m['name'], 'kind': m['kind'], 'sphere': m['sphere'], 'px': px})
json.dump(out, open('/home/user/patrons/design/prototypes/art-v2/portraits/out-z-greenyellow.json', 'w'), indent=1)
json.dump([o for o in out if o['sphere'] == 'green'], open('/tmp/sweep-greenyellow/green.json', 'w'))
json.dump([o for o in out if o['sphere'] == 'yellow'], open('/tmp/sweep-greenyellow/yellow.json', 'w'))
