# Build samples.json from src/*.py (each defines PORTRAIT with px), lint, and render a sheet.
#   python3 build.py [ids...]   -> samples.json, _renders/sheet.png, per-portrait renders in _renders/<id>/
import importlib.util, json, os, sys, glob
import draw, render

HERE = os.path.dirname(os.path.abspath(__file__))
ORDER = ['benders.launderer', 'thieves.kingpin', 'purple.nightowl', 'benders.hr', 'market.doorman', 'yellow.pilgrim']

def load(path):
    spec = importlib.util.spec_from_file_location(os.path.basename(path)[:-3], path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m.PORTRAIT

def main(ids):
    out = [load(p) for p in sorted(glob.glob(os.path.join(HERE, 'src', '*.py')))]
    out.sort(key=lambda p: ORDER.index(p['id']) if p['id'] in ORDER else 99)
    for p in out:
        assert len(p['px']) == 48 and all(len(r) == 48 for r in p['px']), p['id']
        o = draw.orphans(p['px'])
        keys = sorted({c for r in p['px'] for c in r} - {'.'})
        print(f"{p['id']:22} keys {len(keys):2} {''.join(keys)}  orphans {len(o)} {o[:12]}")
    json.dump(out, open(os.path.join(HERE, 'samples.json'), 'w'), indent=1)
    sel = [p for p in out if not ids or p['id'] in ids]
    render.sheet(sel, os.path.join(HERE, '_renders', 'sheet.png'))
    for p in sel:
        d = os.path.join(HERE, '_renders', p['id']); os.makedirs(d, exist_ok=True)
        for sc in (1, 2, 4):
            for nm, bg in (('table', render.P.TABLE), ('card', render.P.CARD)):
                render.image(p, sc, bg).save(f"{d}/{sc}x-{nm}.png")
        render.image(p, 4, render.P.TABLE, grey=True).save(f"{d}/grey-4x.png")
        render.image(p, 8, render.P.TABLE).save(f"{d}/8x-table.png")

if __name__ == '__main__':
    main(sys.argv[1:])
