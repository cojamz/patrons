# Build one rollout batch: src-<b>/*.py (each defines PORTRAIT) -> out/<b>.json, _renders/<b>/sheet.png, 8x zooms.
#   python3 build_batch.py <b> [ids...]
import importlib.util, json, os, sys, glob
import draw, render
HERE = os.path.dirname(os.path.abspath(__file__))
MAX_COLORS = 22

def load(path):
    spec = importlib.util.spec_from_file_location('p_' + os.path.basename(path)[:-3], path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m.PORTRAIT

def main(b, ids):
    want = [x['id'] for x in json.load(open(os.path.join(HERE, f'in-{b}.json')))]
    out = [load(p) for p in sorted(glob.glob(os.path.join(HERE, f'src-{b}', '*.py'))) if not os.path.basename(p).startswith('_')]
    out.sort(key=lambda p: want.index(p['id']) if p['id'] in want else 999)
    failed = []
    for p in out:
        assert len(p['px']) == 48 and all(len(r) == 48 for r in p['px']), p['id']
        cols = {c for row in render.grid(p) for c in row if c}
        keys = sorted({c for r in p['px'] for c in r} - {'.'})
        cnt = {k: sum(r.count(k) for r in p['px']) for k in keys}
        rare = {k: n for k, n in cnt.items() if n < 4 and k not in 'yz!:^"'}
        if len(cols) > MAX_COLORS: failed.append(p['id'])
        print(f"{p['id']:24} colors {len(cols):2}{' OVER CAP' if len(cols) > MAX_COLORS else ''} rare {rare}")
    missing = [i for i in want if i not in {p['id'] for p in out}]
    if missing: print('MISSING:', ', '.join(missing))
    json.dump(out, open(os.path.join(HERE, 'out', f'{b}.json'), 'w'), indent=1)
    d0 = os.path.join(HERE, '_renders', b); os.makedirs(d0, exist_ok=True)
    sel = [p for p in out if not ids or p['id'] in ids]
    render.sheet(sel, os.path.join(d0, 'sheet.png'))
    for p in sel:
        render.image(p, 8, render.P.CARD).save(f"{d0}/{p['id']}-8x-card.png")
    if failed: print(f"FAIL: over {MAX_COLORS} colors: {', '.join(failed)}"); sys.exit(1)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:])
