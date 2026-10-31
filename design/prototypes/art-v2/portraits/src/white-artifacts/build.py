# Builds portraits/out-white-artifacts.json from the per-portrait scripts in this folder.
import json, importlib, os, sys
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here)
ORDER = ['recluse', 'shopkeeper', 'heiress', 'broker', 'exporter', 'raider', 'cashier', 'undertaker', 'martyr',
         'oldmoney', 'hoarder', 'a_gold', 'a_red', 'a_echo', 'a_market', 'a_thieves', 'a_purple', 'a_silver', 'a_yellow', 'a_trading']
root = os.path.abspath(os.path.join(here, '..', '..'))
meta = {e['id']: e for e in json.load(open(os.path.join(root, 'in-trading.json'))) + json.load(open(os.path.join(root, 'in-artifacts.json')))}
out = []
for name in ORDER:
    try: m = importlib.import_module(name)
    except ModuleNotFoundError: continue
    e = meta[m.ID]
    out.append({'id': e['id'], 'name': e['name'], 'kind': e.get('kind', 'member'), 'sphere': e['sphere'], 'px': m.draw()})
json.dump(out, open(os.path.join(root, 'out-white-artifacts.json'), 'w'), indent=1)
print(len(out), 'written')
