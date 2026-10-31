# Builds portraits/out-z-goldguests.json from p_*.py here; previews in /tmp/sweep-goldguests/.
import sys, json, importlib, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); ART = "/home/user/patrons/design/prototypes/art-v2"
sys.path.insert(0, HERE); sys.path.insert(0, ART)
from pix import G
import kit
ins = json.load(open(f"{ART}/portraits/in-sweep-goldguests.json"))
out = []; missing = []
for it in ins:
    mod = 'p_' + it['id'].replace('.', '_')
    if os.path.exists(f"{HERE}/{mod}.py"):
        m = importlib.import_module(mod); g = m.draw(); px = g.rows()
    elif it.get('px'):
        px = it['px']; missing.append(it['id'])
    else:
        missing.append(it['id']); continue
    out.append({"id": it['id'], "name": it['name'], "kind": "member", "sphere": it['sphere'], "px": px})
json.dump(out, open(f"{ART}/portraits/out-z-goldguests.json", "w"), indent=1)
print('not drawn yet:', missing)
kit.sheet(out, "/tmp/sweep-goldguests/sheet.png")
