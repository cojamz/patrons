# Side-by-side sheet of the deep and very deep faces at 1x, 2x and 4x on the card color.
import json, glob, sys
from PIL import Image, ImageDraw
import render, palette as P
ids=sys.argv[2].split(',')
icons={p['id']:p for f in glob.glob('out/*.json') for p in json.load(open(f))}
sel=[icons[i] for i in ids]
cols=5; cw=48*4+48*2+48+40; ch=48*4+30
im=Image.new('RGB',(cols*cw+10,((len(sel)+cols-1)//cols)*ch+10),'#2a2420'); d=ImageDraw.Draw(im)
for n,ic in enumerate(sel):
  x=10+(n%cols)*cw; y=10+(n//cols)*ch; xx=x
  for s in (4,2,1):
    t=render.image(ic,s,bg=P.CARD); im.paste(t,(xx,y)); xx+=48*s+6
  d.text((x,y+48*4+4),ic['name'],fill='#f2e8d2',font=render.font(12))
im.save(sys.argv[1])
