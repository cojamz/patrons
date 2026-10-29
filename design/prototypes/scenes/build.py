"""Build one batch of scene portraits: b<N>/*.py (each defines PORTRAIT = (id, fn) with fn() -> (grid, pal)) -> out/batch-<N>.json
plus _renders/b<N>/sheet.png (96 and 32 px) and <id>-4x.png. python3 build.py <N> [ids...]"""
import importlib.util, json, os, sys, glob
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'art-v4'))
from render import card, font, SHEET_BG
from PIL import Image, ImageDraw
B = sys.argv[1]
meta = {m['id']: m for m in json.load(open(os.path.join(HERE, f'batch-{B}.json')))}
out, errs = [], []
for path in sorted(glob.glob(os.path.join(HERE, f'b{B}', '*.py'))):
    if os.path.basename(path).startswith('_'): continue
    spec = importlib.util.spec_from_file_location('p_' + os.path.basename(path)[:-3], path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    pid, fn = m.PORTRAIT
    grid, pal = fn()
    n = len(grid)
    assert n == 64 and all(len(r) == 64 for r in grid), (pid, 'not 64x64')
    used = set(''.join(grid)) - {'.'}
    assert not (used - set(pal)), (pid, used - set(pal))
    pal = {k: v for k, v in pal.items() if k in used}
    if len(set(pal.values())) > 24: errs.append(f'{pid}: {len(set(pal.values()))} colours (max 24)')
    mm = meta.get(pid) or {}
    out.append({'id': pid, 'name': mm.get('name', pid), 'sphere': mm.get('sphere'), 'grid': grid, 'pal': pal})
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
json.dump(out, open(os.path.join(HERE, 'out', f'batch-{B}.json'), 'w'))
rd = os.path.join(HERE, '_renders', f'b{B}'); os.makedirs(rd, exist_ok=True)
cols = 6; cw = 96 + 32 + 30; ch = 96 + 24
im = Image.new('RGB', (cols * cw + 10, ((len(out) + cols - 1) // cols) * ch + 10), SHEET_BG); d = ImageDraw.Draw(im)
for i, p in enumerate(out):
    x, y = 10 + (i % cols) * cw, 10 + (i // cols) * ch
    im.paste(card(p, 96), (x, y)); im.paste(card(p, 32), (x + 100, y + 64))
    d.text((x, y + 98), p['name'][:20], fill=(220, 210, 196), font=font(11))
    card(p, 256).save(os.path.join(rd, p['id'] + '-4x.png'))
im.save(os.path.join(rd, 'sheet.png'))
print('built', len(out), 'of', len(meta), 'missing:', [k for k in meta if k not in {p['id'] for p in out}]); [print('WARN', e) for e in errs]
