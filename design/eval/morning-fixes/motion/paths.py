#!/usr/bin/env python3
# Draws every flying ghost's path from film.mjs probe.json files (one dot per 16ms frame), side by side, at 1270x700.
#   python3 paths.py <out.png> <label>=<probe.json> [<label>=<probe.json> ...] [--only=<class substring>]
import sys, json
from PIL import Image, ImageDraw
args = [a for a in sys.argv[2:] if not a.startswith('--')]
only = next((a.split('=', 1)[1] for a in sys.argv[2:] if a.startswith('--only=')), '')
W, H = 1270, 700
cols = {'token': (255, 196, 90), 'minion': (120, 200, 255), 'card': (255, 120, 160), 'piece': (150, 230, 140)}
panels = []
for a in args:
    label, path = a.split('=', 1)
    P = json.load(open(path))
    im = Image.new('RGB', (W, H + 24), (20, 24, 24))
    d = ImageDraw.Draw(im)
    tracks = {}
    for fr in P['tracks']:
        for gid, cls, x, y in fr['g']:
            if only and only not in cls: continue
            tracks.setdefault(gid, (cls, []))[1].append((x, y + 24))
    for gid, (cls, pts) in tracks.items():
        c = next((v for k, v in cols.items() if k in cls), (220, 220, 220))
        if len(pts) > 1: d.line(pts, fill=c, width=1)
        for x, y in pts: d.ellipse((x - 2, y - 2, x + 2, y + 2), fill=c)
    d.text((8, 6), f'{label}: {len(tracks)} ghosts, one dot per 16ms', fill='white')
    panels.append(im)
out = Image.new('RGB', (W, (H + 24) * len(panels)))
for i, p in enumerate(panels): out.paste(p, (0, i * (H + 24)))
out.save(sys.argv[1])
print(sys.argv[1])
