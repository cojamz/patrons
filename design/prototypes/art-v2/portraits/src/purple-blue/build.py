# Build out-purple-blue.json from the p_*.py scripts here; optional args: render 4x close-ups of those ids.
import sys, os, json, importlib
HERE = os.path.dirname(os.path.abspath(__file__))
ART = '/home/user/patrons/design/prototypes/art-v2'
sys.path.insert(0, HERE); sys.path.insert(0, ART)
ORDER = ['secondwind', 'lateriser', 'courier', 'clockmaker', 'nightowl', 'earlybird', 'bouncer', 'gossip',
         'extrashift', 'timekeepers', 'closer', 'streak', 'crew',
         'connoisseur', 'patroness', 'snob', 'windowshopper', 'restocker', 'shopaholic', 'windowdresser',
         'plusone', 'doorman', 'regular', 'trendsetter', 'critic']
out = []
for name in ORDER:
    try: m = importlib.import_module('p_' + name)
    except ModuleNotFoundError: continue
    rows = m.draw().rows()
    out.append({'id': m.ID, 'name': m.NAME, 'kind': 'member', 'sphere': m.SPHERE, 'px': rows})
json.dump(out, open(os.path.join(ART, 'portraits/out-purple-blue.json'), 'w'), indent=1)
print(len(out), 'portraits')
if len(sys.argv) > 1:
    import kit
    from PIL import Image
    pick = [ic for ic in out if any(a in ic['id'] for a in sys.argv[1:])]
    W = 140 * len(pick); im = Image.new('RGB', (max(W, 140), 280 + 10), '#d9ceb6')
    for k, ic in enumerate(pick):
        big = kit.render(ic, ic['sphere'], 4); im.paste(big, (k * 140 + 2, 2), big)
        sm = kit.render(ic, ic['sphere'], 1); im.paste(sm, (k * 140 + 2, 136), sm)
        g = kit.render(ic, 'colorless', 1); im.paste(g, (k * 140 + 40, 136), g)
    im.save('/tmp/purple-blue/close.png')
