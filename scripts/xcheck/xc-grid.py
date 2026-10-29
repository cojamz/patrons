#!/usr/bin/env python3
"""One line per member across several xc-report.py --json files: adjusted lift ± SE. Usage: xc-grid.py label=file.json ... [--only a,b]"""
import json, sys
args = [a for a in sys.argv[1:] if not a.startswith('--')]
only = next((a.split('=')[1].split(',') for a in sys.argv[1:] if a.startswith('--only=')), None)
cols = [(a.split('=')[0], json.load(open(a.split('=')[1]))) for a in args]
ids = {}
for _, d in cols:
    for m in d['members']: ids[m['id']] = m['name']
def cell(d, i):
    m = next((x for x in d['members'] if x['id'] == i), None)
    return f"{100*m['adj']:+5.1f}±{100*m['adjse']:3.1f}" if m else '     -    '
rows = [(i, n) for i, n in ids.items() if not only or any(n.lower().startswith(o.lower()) for o in only)]
rows.sort(key=lambda r: -sum(next((x['adj'] for x in d['members'] if x['id'] == r[0]), 0) for _, d in cols))
print(f"{'':24}" + ''.join(f'{l:>12}' for l, _ in cols))
for i, n in rows: print(f'{n[:24]:24}' + ''.join(f'{cell(d, i):>12}' for _, d in cols))
for kind in ('artifacts',):
    for a in cols[0][1][kind]:
        print(f"{a['name'][:24]:24}" + ''.join(f"{(lambda x: f'{100*x[0]:+5.1f}±{100*x[1]:3.1f}' if x else '-')(next(((y['adj'], y['adjse']) for y in d[kind] if y['id'] == a['id']), None)):>12}" for _, d in cols))
