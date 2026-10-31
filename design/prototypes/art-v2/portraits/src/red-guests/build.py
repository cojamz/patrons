# Builds portraits/out-red-guests.json from the per-portrait scripts here, plus previews in /tmp/red-guests/.
import sys, json, importlib, os
HERE = os.path.dirname(os.path.abspath(__file__)); ART = "/home/user/patrons/design/prototypes/art-v2"
sys.path.insert(0, HERE); sys.path.insert(0, ART)
from pix import G
import kit
from PIL import Image

ins = json.load(open(f"{ART}/portraits/in-red.json")) + json.load(open(f"{ART}/portraits/in-guests.json"))
out = []
for it in ins:
    mod = it['id'].split('.')[1]
    try: m = importlib.import_module(mod)
    except ModuleNotFoundError: continue
    g = G(32); m.draw(g)
    out.append({"id": it['id'], "name": it['name'], "kind": "member", "sphere": it['sphere'], "px": g.rows()})
json.dump(out, open(f"{ART}/portraits/out-red-guests.json", "w"), indent=1)
os.makedirs("/tmp/red-guests", exist_ok=True)
kit.sheet(out, "/tmp/red-guests/sheet.png")
# 4x close-ups, 6 per row, and a seat strip at 32px
sc = 4; cols = 6
im = Image.new('RGB', (cols * 136, ((len(out) + cols - 1) // cols) * 136), kit.TABLE)
for k, ic in enumerate(out):
    r = kit.render(ic, ic['sphere'], sc); im.paste(r, ((k % cols) * 136 + 4, (k // cols) * 136 + 4), r)
im.save("/tmp/red-guests/close.png")
seat = Image.new('RGB', (len(out) * 36 + 4, 40), kit.TABLE)
for k, ic in enumerate(out):
    r = kit.render(ic, ic['sphere'], 1); seat.paste(r, (4 + k * 36, 4), r)
seat = seat.resize((seat.width * 2, seat.height * 2), Image.NEAREST); seat.save("/tmp/red-guests/seat.png")
