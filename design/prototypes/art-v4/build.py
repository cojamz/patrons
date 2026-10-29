"""Build samples.json from samples/<style>/art.py (each defines STYLE and PORTRAITS)."""
import importlib.util, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ORDER = ['flat', 'toy', 'print']
out = {'styles': []}
for sid in ORDER:
    path = os.path.join(HERE, 'samples', sid, 'art.py')
    if not os.path.exists(path):
        continue
    spec = importlib.util.spec_from_file_location('art_' + sid, path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    st = dict(m.STYLE, id=sid, portraits=[])
    for pid, name, fn in m.PORTRAITS:
        grid, pal = fn()
        used = set(''.join(grid)) - {'.'}
        missing = used - set(pal)
        assert not missing, (sid, pid, missing)
        st['portraits'].append({'id': pid, 'name': name, 'grid': grid, 'pal': {k: v for k, v in pal.items() if k in used}})
    out['styles'].append(st)
json.dump(out, open(os.path.join(HERE, 'samples.json'), 'w'), indent=1)
print('built', [len(s['portraits']) for s in out['styles']])
