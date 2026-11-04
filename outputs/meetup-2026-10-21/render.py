from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
import math, random, subprocess
OUT=Path(__file__).parent
ROOT=OUT.parent.parent
W,H=1080,1350
CREAM='#F6F4EC'; MUTED='#A3B4C8'; CYAN='#69E9DD'; ORANGE='#FF794D'
FONTS='/System/Library/Fonts/Supplemental/'
def font(n,bold=False): return ImageFont.truetype(FONTS+('Arial Bold.ttf' if bold else 'Arial.ttf'),n)
def text(d,xy,s,n,color=CREAM,bold=False): d.text(xy,s,font=font(n,bold),fill=color,stroke_width=0)
def layer(): return Image.new('RGBA',(W,H))
def ease(x): return 1-(1-max(0,min(1,x)))**3
# Background is drawn once; stars and orbit markers animate over it.
bg=Image.new('RGB',(W,H)); px=bg.load()
for y in range(H):
 for x in range(W):
  glow=math.exp(-(((x-1000)/600)**2+((y-390)/600)**2))
  px[x,y]=(int(8+7*glow),int(16+22*glow),int(31+29*glow))
d=ImageDraw.Draw(bg)
for x in range(0,W,90): d.line((x,0,x,H),fill=(17,29,44))
for y in range(0,H,90): d.line((0,y,W,y),fill=(17,29,44))
for r in [190,300,410,520]: d.ellipse((990-r,300-r,990+r,300+r),outline=(36,59,75),width=2)
random.seed(21)
stars=[(random.randrange(W),random.randrange(H),random.choice([1,1,2]),random.random()*6.28) for i in range(65)]
# Layer 1: established community mark and identity.
brand=layer(); d=ImageDraw.Draw(brand)
logo=Image.open(ROOT/'src/assets/images/space-coast-devs-icon-256x256.png').convert('RGBA').resize((84,84),Image.Resampling.LANCZOS)
mask=Image.new('L',(84,84)); ImageDraw.Draw(mask).ellipse((0,0,83,83),fill=255)
brand.paste(logo,(72,65),mask)
text(d,(179,72),'SPACE COAST',31,CREAM,True); text(d,(179,108),'DEVS',31,CYAN,True)
text(d,(72,188),'MONTHLY MEETUP',22,MUTED,True)
hero=layer(); d=ImageDraw.Draw(hero)
text(d,(63,239),'TONIGHT',169,CREAM,True)
d.rounded_rectangle((76,433,429,480),radius=23,fill=ORANGE)
text(d,(99,443),'WED, OCT 21, 2026',24,'#08101F',True)
text(d,(66,505),'6–8 PM',151,CYAN,True)
text(d,(78,685),'Meet your local tech community.',37,CREAM)
venue=layer(); d=ImageDraw.Draw(venue)
d.line((76,789,1004,789),fill='#355062',width=2)
text(d,(76,829),'AT PROTOWORK STUDIO',42,CREAM,True)
text(d,(76,891),'575 S Wickham Rd · Suite G',32,MUTED)
text(d,(76,936),'West Melbourne, FL',32,MUTED)
d.rounded_rectangle((76,1024,1004,1126),radius=17,fill='#132C3B',outline='#325265',width=2)
text(d,(102,1042),'6–7  NETWORKING',26,CYAN,True)
text(d,(102,1080),'7–8  TALKS + PROJECT UPDATES',26,CREAM,True)
cta=layer(); d=ImageDraw.Draw(cta)
text(d,(76,1181),'RSVP ON MEETUP',29,CREAM,True)
d.line((935,1201,1003,1201),fill=ORANGE,width=4)
d.line((986,1184,1003,1201,986,1218),fill=ORANGE,width=4)
text(d,(76,1237),'space-coast.dev',25,MUTED)

def render(t):
 im=bg.copy().convert('RGBA'); d=ImageDraw.Draw(im)
 for x,y,r,p in stars:
  v=int(85+65*(.5+.5*math.sin(t*.8+p)))
  d.ellipse((x-r,y-r,x+r,y+r),fill=(v,v+15,min(v+35,255),255))
 for r,s in [(190,.18),(300,-.12),(410,.085)]:
  a=t*s-.8; x=990+r*math.cos(a); y=300+r*math.sin(a)
  d.ellipse((x-6,y-6,x+6,y+6),fill=CYAN)
 # Small launch trail in upper-right corner.
 x,y=927,130+7*math.sin(t*1.7)
 d.line((x-24,y+34,x-57,y+75),fill=ORANGE,width=4)
 d.polygon([(x+16,y-27),(x+5,y+21),(x-18,y+3)],fill=CREAM)
 for item,start,dur in [(brand,0,.6),(hero,.22,.85),(venue,.8,.8),(cta,1.2,.65)]:
  a=ease((t-start)/dur)
  if a:
   l=item.copy(); l.putalpha(l.getchannel('A').point(lambda p:int(p*a)))
   im.alpha_composite(l,(0,round(35*(1-a))))
 # A quiet animated progress accent.
 d=ImageDraw.Draw(im); progress=(t%12)/12
 d.line((76,1300,1004,1300),fill='#254152',width=3)
 d.line((76,1300,76+928*progress,1300),fill=ORANGE,width=3)
 return im.convert('RGB')
def command(name,w,h):
 return ['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r','24','-i','-','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/name)]
p1=subprocess.Popen(command('space-coast-devs-tonight-feed.mp4',1080,1350),stdin=subprocess.PIPE)
p2=subprocess.Popen(command('space-coast-devs-tonight-story.mp4',1080,1920),stdin=subprocess.PIPE)
# Fill the taller canvas with the same navy and understated corner framing.
storybg=Image.new('RGB',(1080,1920),'#08101F'); sd=ImageDraw.Draw(storybg)
for x in range(0,1080,90): sd.line((x,0,x,1920),fill='#111D2C')
for y in range(0,1920,90): sd.line((0,y,1080,y),fill='#111D2C')
for i in range(288):
 im=render(i/24); story=storybg.copy(); story.paste(im,(0,250))
 p1.stdin.write(im.tobytes()); p2.stdin.write(story.tobytes())
 if i==108:
  im.save(OUT/'space-coast-devs-tonight-feed.png'); story.save(OUT/'space-coast-devs-tonight-story.png')
 if i%72==0: print(f'Rendered {i}/288 frames',flush=True)
p1.stdin.close(); p2.stdin.close()
assert p1.wait()==0 and p2.wait()==0
print('Finished both videos',flush=True)
