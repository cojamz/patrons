import json, glob, sys
from PIL import Image, ImageDraw
import render, palette as P
icons=[]
for f in sorted(glob.glob('out/*.json')): icons+=json.load(open(f))
order=['red','green','magenta','purple','blue','white','gold','silver','yellow','colorless']
icons.sort(key=lambda i:(order.index(i.get('sphere')) if i.get('sphere') in order else 99, i['id']))
sc=int(sys.argv[2]) if len(sys.argv)>2 else 2; cols=12; cell=48*sc+8
rows=(len(icons)+cols-1)//cols
im=Image.new('RGB',(cols*cell+8, rows*(cell+14)+8),'#2a2420'); d=ImageDraw.Draw(im)
for n,ic in enumerate(icons):
  x=8+(n%cols)*cell; y=8+(n//cols)*(cell+14)
  t=render.image(ic,sc,bg=P.CARD); im.paste(t,(x,y))
  d.text((x,y+48*sc+1),ic['name'][:16],fill='#f2e8d2',font=render.font(10))
im.save(sys.argv[1]); print(len(icons))
