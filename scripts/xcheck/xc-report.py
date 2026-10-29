#!/usr/bin/env python3
"""Report on xc-run.mjs output. Usage: python3 scripts/xcheck/xc-report.py <files.jsonl...> [--json out.json] [--min 40]
Members get two lifts: raw (owner win share minus the share expected from the owner's member count, as the balance
thread does) and adjusted (a ridge linear-probability model of win share on every member, artifact and member-count
bucket at once, so a card isn't credited for the cards it's bought alongside). +-: one standard error."""
import json, sys, math, collections
import numpy as np

args = sys.argv[1:]
jout = args[args.index('--json') + 1] if '--json' in args else None
MIN = int(args[args.index('--min') + 1]) if '--min' in args else 40
files = [a for i, a in enumerate(args) if not a.startswith('--') and (i == 0 or args[i - 1] not in ('--json', '--min'))]
rows = [json.loads(l) for f in files for l in open(f) if l.strip()]
nm = {}
try:
    nm = json.load(open('.xc/names.json'))
except Exception:
    pass
name = lambda d: nm.get(d, d) if d else d
bots = lambda r: [p for p in r['players'] if p['pol'] != 'buyer']
out = {'games': len(rows)}
pct = lambda x: f'{100 * x:.1f}%'

# --- by seats
print(f'{len(rows)} games, policies {sorted(set(r["policy"] for r in rows))}')
for S in sorted(set(r['seats'] for r in rows)):
    rs = [r for r in rows if r['seats'] == S]
    b = [p['win'] for r in rs for p in r['players'] if p['pol'] == 'buyer']
    f = [p['f'] for r in rs for p in bots(r)]
    mc = [p['mc'] for r in rs for p in bots(r)]
    se = math.sqrt(max(np.mean(b) * (1 - np.mean(b)), .01) / max(len(b), 1)) if b else 0
    print(f'{S}p: {len(rs)} games; buy-followers-only seat wins {pct(np.mean(b)) if b else "-"} +-{pct(se)} (fair {pct(1/S)}, n={len(b)}); bots avg {np.mean(f):.1f} followers, {np.mean(mc):.1f} members')
    out[f'{S}p'] = {'buyer': float(np.mean(b)) if b else None, 'buyerN': len(b)}

# --- expected share by (seats, member count)
curve = collections.defaultdict(lambda: [0, 0.0])
for r in rows:
    for p in bots(r):
        c = curve[(r['seats'], min(p['mc'], 16))]; c[0] += 1; c[1] += p['win']
def expected(S, c):
    n = w = 0
    for d in range(4):
        for x in {c - d, c + d}:
            v = curve.get((S, min(x, 16)))
            if v: n += v[0]; w += v[1]
        if n >= 60: break
    return w / n if n else 1 / S

# --- regression design: one row per bot seat; target = win share minus 1/seats
feats = {}
def fi(k):
    if k not in feats: feats[k] = len(feats)
    return feats[k]
X, y = [], []
for r in rows:
    S = r['seats']
    for p in bots(r):
        x = {fi(f'mc{S}:{min(p["mc"], 14)}'): 1.0, fi(f'seat{S}:{p["i"]}'): 1.0}
        for m in set(p['members']): x[fi('m:' + m)] = 1.0
        if p['art']: x[fi('a:' + p['art'])] = 1.0
        X.append(x); y.append(p['win'] - 1 / S)
A = np.zeros((len(X), len(feats)))
for i, x in enumerate(X):
    for j, v in x.items(): A[i, j] = v
y = np.array(y)
lam = 5.0
G = A.T @ A + lam * np.eye(len(feats))
coef = np.linalg.solve(G, A.T @ y)
resid = y - A @ coef
s2 = resid @ resid / max(len(y) - len(feats), 1)
Ginv = np.linalg.inv(G)
cse = np.sqrt(np.diag(Ginv @ (A.T @ A) @ Ginv) * s2)
adj = {k: (coef[j], cse[j]) for k, j in feats.items()}

# --- members
own = collections.defaultdict(lambda: [0, 0.0, 0.0, 0.0])  # n, win, expected, followers-margin
offered = collections.Counter(); bought = collections.Counter(); roundgot = collections.defaultdict(collections.Counter)
for r in rows:
    S = r['seats']; bf = [p['f'] for p in bots(r)]
    for d in r['offered']: offered[d] += 1
    for d in set(m for p in bots(r) for m in p['got']):
        if d in r['offered']: bought[d] += 1
    for p in bots(r):
        e = expected(S, p['mc'])
        for d, rd in p['got'].items(): roundgot[d][rd] += 1
        for m in set(p['members']):
            o = own[m]; o[0] += 1; o[1] += p['win']; o[2] += e
mem = []
for m, (n, w, e, _) in own.items():
    if n < MIN: continue
    a, ase = adj.get('m:' + m, (0, 0))
    se = math.sqrt(max((w / n) * (1 - w / n), .05) / n)
    mem.append({'id': m, 'name': name(m), 'owners': n, 'win': w / n, 'lift': (w - e) / n, 'se': se, 'adj': a, 'adjse': ase,
                'offered': offered[m], 'pick': bought[m] / offered[m] if offered[m] else None})
mem.sort(key=lambda x: -x['adj'])
print('\nMembers (adjusted lift order). lift = vs member-count expectation; adj = regression; pts of win share')
for x in mem:
    flag = ' <<' if abs(x['adj']) > 2 * x['adjse'] and abs(x['adj']) > .03 else ''
    pk = f"{100 * x['pick']:.0f}%" if x['pick'] is not None else '-'
    print(f"  {x['name'][:24]:24} {x['id'][:22]:22} n={x['owners']:5} win {pct(x['win']):>6} lift {100*x['lift']:+5.1f}+-{100*x['se']:.1f} adj {100*x['adj']:+5.1f}+-{100*x['adjse']:.1f} pick {pk:>4}{flag}")
out['members'] = mem

# --- artifacts
art = collections.defaultdict(lambda: [0, 0.0, 0.0, 0])
artOffer = collections.Counter()
for r in rows:
    S = r['seats']
    for p in bots(r):
        if p['art']:
            a = art[p['art']]; a[0] += 1; a[1] += p['win']; a[2] += 1 / S
print('\nArtifacts: holders, win share vs fair, adjusted')
arts = []
for k, (n, w, e, _) in sorted(art.items(), key=lambda kv: -(kv[1][1] - kv[1][2]) / kv[1][0]):
    a, ase = adj.get('a:' + k, (0, 0)); se = math.sqrt(max((w / n) * (1 - w / n), .05) / n)
    print(f"  {name(k)[:24]:24} n={n:5} win {pct(w/n):>6} vs {pct(e/n)} ({100*(w-e)/n:+.1f}+-{100*se:.1f}) adj {100*a:+.1f}+-{100*ase:.1f}")
    arts.append({'id': k, 'name': name(k), 'n': n, 'win': w / n, 'fair': e / n, 'adj': a, 'adjse': ase})
out['artifacts'] = arts

# --- spaces: per placement followers and resources gained, by round
sp = collections.defaultdict(lambda: collections.defaultdict(list))
use = collections.Counter(); tables = collections.Counter()
for r in rows:
    seen = set()
    for pl in r['placements']:
        if r['players'][pl['p']]['pol'] == 'buyer': continue
        sp[pl['space']][pl['round']].append((pl['df'], pl['dr']))
        use[pl['space']] += 1; seen.add(pl['space'])
    for s in seen: tables[s] += 1
print('\nSpaces: placements per table it was on; per placement followers / resources gained (net of spent) by round; value = followers + resources')
spaces = []
for s in sorted(sp, key=lambda s: -np.mean([a + b for rr in sp[s].values() for a, b in rr])):
    parts = []
    rec = {'space': s, 'uses': use[s], 'perTable': use[s] / tables[s]}
    for rd in (1, 2, 3):
        v = sp[s].get(rd)
        if v:
            df = np.mean([a for a, _ in v]); dr = np.mean([b for _, b in v])
            parts.append(f'R{rd} {df:+.1f}f {dr:+.1f}r ={df+dr:+.1f} (n={len(v)})'); rec[f'r{rd}'] = [float(df), float(dr), len(v)]
    allv = [a + b for rr in sp[s].values() for a, b in rr]
    rec['value'] = float(np.mean(allv))
    tk = [(p['win'], 1 / r['seats']) for r in rows if s in {pl['space'] for pl in r['placements']} for p in bots(r) if any(pl['p'] == p['i'] and pl['space'] == s for pl in r['placements'])]
    rec['takerWin'] = float(np.mean([a for a, _ in tk]) - np.mean([b for _, b in tk])) if tk else None
    parts.insert(0, f"takers win {100*rec['takerWin']:+.1f}" if tk else '')
    print(f"  {s[:20]:20} {use[s]/tables[s]:4.1f}/table  val {np.mean(allv):+5.2f}   " + '  '.join(parts))
    spaces.append(rec)
out['spaces'] = spaces

# --- Echo copying Last Call
ec = [pl for r in rows for pl in r['placements'] if pl.get('prev') == 'Last Call']
lc = [pl for r in rows for pl in r['placements'] if pl['space'] == 'Last Call']
games_lc = sum(1 for r in rows if any(pl['space'] == 'Last Call' for pl in r['placements']))
print(f'\nLast Call: {len(lc)} placements in {games_lc} games, mean +{np.mean([p["df"] for p in lc]) if lc else 0:.2f} followers')
byleft = collections.defaultdict(list)
for p in lc: byleft[(p['round'], p['left'])].append(p['df'])
print('  by (round, minions before placing): ' + ', '.join(f'R{k[0]} {k[1]}: {np.mean(v):+.1f} n={len(v)}' for k, v in sorted(byleft.items())))
print(f'  Echo right after Last Call: {len(ec)} times, mean +{np.mean([p["df"] for p in ec]) if ec else 0:.2f} followers, +{np.mean([p["dr"] for p in ec]) if ec else 0:.2f} res')
# win share of players who took Last Call first in their round (with all minions)
def took(r, p, sname, first=False):
    for pl in r['placements']:
        if pl['p'] == p['i'] and pl['space'] == sname:
            if not first: return True
            if pl['left'] == {1: 3, 2: 4, 3: 5}[pl['round']]: return True
    return False
for tag, fn in [('took Last Call', lambda r, p: took(r, p, 'Last Call')), ('took Last Call as first minion', lambda r, p: took(r, p, 'Last Call', True)),
                ('Echoed Last Call', lambda r, p: any(pl['p'] == p['i'] and pl.get('prev') == 'Last Call' for pl in r['placements']))]:
    ws = [(p['win'], 1 / r['seats']) for r in rows for p in bots(r) if fn(r, p)]
    if ws: print(f'  players who {tag}: n={len(ws)} win {pct(np.mean([a for a, _ in ws]))} vs fair {pct(np.mean([b for _, b in ws]))}')
out['lastcall'] = {'n': len(lc), 'echoN': len(ec)}

# --- skips
mx = collections.Counter(); tot = []
for r in rows:
    for p in r['players']:
        tot.append(sum(p['skipped'])); mx[max(p['skipped'])] += 1
cause = collections.Counter()
for r in rows:
    for k, v in r['skipBy'].items(): cause[k] += v
n = sum(mx.values())
print(f'\nSkips: avg {np.mean(tot):.2f} skipped turns per player per game; most in one round: ' + ', '.join(f'{k}: {100*v/n:.1f}%' for k, v in sorted(mx.items())))
print('  by cause per game: ' + ', '.join(f'{k} {v/len(rows):.2f}' for k, v in cause.most_common()))
# chain: a player skipped 3+ times in one round, and who caused it
chain = [r for r in rows if any(max(p['skipped']) >= 3 for p in r['players'])]
print(f'  games with a player skipped 3+ times in one round: {len(chain)} ({pct(len(chain)/len(rows))})')
vict = [(p['win'], 1 / r['seats']) for r in rows for p in bots(r) if max(p['skipped']) >= 3]
if vict: print(f'  those players win {pct(np.mean([a for a,_ in vict]))} vs fair {pct(np.mean([b for _,b in vict]))} (n={len(vict)})')
out['skips'] = {'avg': float(np.mean(tot)), 'max': dict(mx), 'cause': dict(cause)}

# --- contests: who placed last, and colors only one player held
C = [(r, c) for r in rows for c in r.get('contests', [])]
if C:
    lastw = [(c['won'][c['last']] / max(sum(c['won']), 1), 1 / r['seats']) for r, c in C if c.get('last') is not None]
    print(f'\nContests ({len(C)} round-ends): the round\'s last placer takes {pct(np.mean([a for a,_ in lastw]))} of the prize followers (fair {pct(np.mean([b for _,b in lastw]))})')
    for rd in (1, 2, 3):
        lw = [(c['won'][c['last']] / max(sum(c['won']), 1), 1 / r['seats']) for r, c in C if c.get('last') is not None and c['round'] == rd]
        if lw: print(f'  round {rd}: last placer {pct(np.mean([a for a,_ in lw]))} (fair {pct(np.mean([b for _,b in lw]))}, n={len(lw)})')
    mono = collections.defaultdict(lambda: [0, 0])
    for r, c in C:
        for col in c['res'][0]:
            holders = sum(1 for x in c['res'] if x.get(col, 0) > 0)
            m = mono[col]; m[0] += 1; m[1] += holders == 1
    print('  a color held by only one player at the round end: ' + ', '.join(f'{k} {pct(v[1]/v[0])}' for k, v in sorted(mono.items(), key=lambda kv: -kv[1][1]/kv[1][0])))
    out['contests'] = {'last': float(np.mean([a for a,_ in lastw])), 'mono': {k: v[1]/v[0] for k, v in mono.items()}}

if jout: json.dump(out, open(jout, 'w'), indent=1, default=float)
