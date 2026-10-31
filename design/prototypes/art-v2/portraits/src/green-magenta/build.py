import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
import echo, thieves
out = []
for mod, sphere in ((echo, 'green'), (thieves, 'magenta')):
    for pid, name, fn in mod.ALL:
        out.append({'id': pid, 'name': name, 'kind': 'member', 'sphere': sphere, 'px': fn().rows()})
json.dump(out, open('/home/user/patrons/design/prototypes/art-v2/portraits/out-green-magenta.json', 'w'), indent=0)
print(len(out))
