# Builds portraits/out-z-redmag.json from red.py and mag.py, plus previews in /tmp/sweep-redmag/.
import sys, json, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); ART = "/home/user/patrons/design/prototypes/art-v2"
sys.path.insert(0, HERE); sys.path.insert(0, ART)
import red, mag
F = {**red.F, **mag.F}
ins = json.load(open(f"{ART}/portraits/in-sweep-redmag.json"))
out = []
for it in ins:
    px = F[it['id']]().rows() if it['id'] in F else it['px']
    if px is None: continue
    out.append({"id": it['id'], "name": it['name'], "kind": "member", "sphere": it['sphere'], "px": px})
json.dump(out, open(f"{ART}/portraits/out-z-redmag.json", "w"), indent=1)
os.makedirs("/tmp/sweep-redmag", exist_ok=True)
