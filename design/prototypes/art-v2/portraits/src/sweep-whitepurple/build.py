# Builds portraits/out-z-whitepurple.json: every member of in-sweep-whitepurple.json, redrawn ones from the scripts here.
import sys, os, json, importlib
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
ROOT = '/home/user/patrons/design/prototypes/art-v2/portraits'
# every portrait is redrawn (Cory's raised bar): the script is named after the id's second half
out = []
for e in json.load(open(os.path.join(ROOT, 'in-sweep-whitepurple.json'))):
    px = e.get('px')
    mod = e['id'].split('.')[1]
    if os.path.exists(os.path.join(HERE, mod + '.py')):
        px = importlib.import_module(mod).draw().rows()
    out.append({'id': e['id'], 'name': e['name'], 'kind': e.get('kind', 'member'), 'sphere': e['sphere'], 'px': px})
json.dump(out, open(os.path.join(ROOT, 'out-z-whitepurple.json'), 'w'), indent=1)
print(len(out), 'written')
