# python3 preview.py <module> ...  -> /tmp/sweep-whitepurple/prev.png (4x, then 1x in color and gray)
import sys, os, json, importlib
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
sys.path.insert(0, '/home/user/patrons/design/prototypes/art-v2')
import kit
from PIL import Image
meta = {e['id'].split('.')[1]: e for e in json.load(open('/home/user/patrons/design/prototypes/art-v2/portraits/in-sweep-whitepurple.json'))}
alias = {'raider': 'raider', 'secondwind': 'secondwind'}
mods = sys.argv[1:]; S = 7; W = 32 * S + 6
im = Image.new('RGB', (W * len(mods), 32 * S + 44), '#d9ceb6')
for k, m in enumerate(mods):
    e = meta[m]; ic = {'id': e['id'], 'sphere': e['sphere'], 'px': importlib.import_module(m).draw().rows()}
    r = kit.render(ic, ic['sphere'], S); im.paste(r, (k * W + 2, 2), r)
    r = kit.render(ic, ic['sphere'], 1); im.paste(r, (k * W + 2, 32 * S + 8), r)
    r = kit.render(ic, 'colorless', 1); im.paste(r, (k * W + 40, 32 * S + 8), r)
im.save('/tmp/sweep-whitepurple/prev.png'); print('ok')
