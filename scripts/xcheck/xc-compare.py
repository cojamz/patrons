#!/usr/bin/env python3
"""Compare two xc-report.py --json outputs (base, variant): changed members first, then the biggest movers and spread.
Usage: python3 scripts/xcheck/xc-compare.py base.json variant.json [names to watch...]"""
import json, sys, numpy as np
a, b = json.load(open(sys.argv[1])), json.load(open(sys.argv[2])); watch = sys.argv[3:]
A = {m['id']: m for m in a['members']}; B = {m['id']: m for m in b['members']}
for k in [k for k in a if k.endswith('p')]: print(f"{k} buyer {100*a[k]['buyer']:.1f}% -> {100*b[k]['buyer']:.1f}% (n {a[k]['buyerN']}/{b[k]['buyerN']})")
def line(i):
    x, y = A.get(i), B.get(i)
    if not x or not y: return f'  {i}: missing'
    pk = lambda m: f"{100*m['pick']:.0f}%" if m['pick'] is not None else '-'
    return f"  {y['name'][:26]:26} adj {100*x['adj']:+5.1f}±{100*x['adjse']:.1f} -> {100*y['adj']:+5.1f}±{100*y['adjse']:.1f}  owners {x['owners']}->{y['owners']}  pick {pk(x)}->{pk(y)}"
print('Watched:')
for w in watch:
    for i in A:
        if i == w or A[i]['name'].lower().startswith(w.lower()): print(line(i))
common = [i for i in A if i in B and A[i]['owners'] >= 150 and B[i]['owners'] >= 150]
sa = np.std([A[i]['adj'] for i in common]); sb = np.std([B[i]['adj'] for i in common])
print(f'Spread of member lifts (sd, {len(common)} members with 150+ owners): {100*sa:.2f} -> {100*sb:.2f} pts')
mv = sorted(common, key=lambda i: -abs(B[i]['adj'] - A[i]['adj']))[:8]
print('Biggest movers:'); [print(line(i)) for i in mv]
AA = {x['id']: x for x in a['artifacts']}; BB = {x['id']: x for x in b['artifacts']}
print('Artifacts: ' + ', '.join(f"{AA[i]['name'].split()[0]} {100*AA[i]['adj']:+.1f}->{100*BB[i]['adj']:+.1f}" for i in AA if i in BB))
