// Shop layout regression: enlarge cards, retain their slots and readable rules through details toggles.
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
import { browserPath } from './lib/browser.mjs';
import { buildStamp } from './lib/stamp.mjs';
import { seedSave } from './lib/seed.mjs';
import { createGame, cardDef } from '../../src/engine/v4/index.js';
import { resume } from '../../src/engine/v4/core.js';
const base=process.env.V4_URL||'http://localhost:5331';
const out=process.env.V4_SHOTS||'/tmp/cults-shop-sizing';mkdirSync(out,{recursive:true});
const seats=['You','Bo','Cy','Di'].map(name=>({name,kind:'human'}));
function fixture(quadrants){
 let s=createGame({seats,quadrants,seed:53});s.pending=null;s.queue=[{t:'buy',p:0}];s.current=0;
 s.players[0].res=Object.fromEntries(s.resources.map(r=>[r,6]));
 const pool=[...s.shop,...s.pile];pool.sort((a,b)=>cardDef(s,b).text.length-cardDef(s,a).text.length);
 s.shop=pool.slice(0,8);s.pile=pool.slice(8);s=resume(s);s.build=buildStamp();
 return {config:{seats,speed:'quick'},state:s,undo:null,savedAt:Date.now()};
}
const browser=await chromium.launch({executablePath:browserPath});
try{for(const[tag,opts]of[['laptop',{viewport:{width:1270,height:700}}],['desktop',{viewport:{width:1600,height:900}}],['tablet',{viewport:{width:1100,height:700}}],['phone',devices['iPhone 13']]]){
 for(const[group,quads]of[['core',['gold','red','purple','echo']],['others',['market','thieves','silver','yellow']]]){
 const ctx=await browser.newContext(opts),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await seedSave(p,fixture(quads));await p.goto(`${base}/?intro=0`);await p.locator('[data-home="resume"]').click();
 const hand=p.locator('[data-handoff]');if(await hand.isVisible())await hand.click();
 await p.locator('.app.game[data-phase="buy"]:not([data-animating])').waitFor();
 const inspect=()=>p.locator('.lt-shop-cards').evaluate(e=>{
 const body=e.querySelector('.lt-shop-body'),r=x=>{const b=x.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height}};
 return {overflow:body.scrollHeight-body.clientHeight,docOverflow:document.documentElement.scrollWidth-innerWidth,deck:!!e.querySelector('.lt-deck').getClientRects().length,cards:[...e.querySelectorAll('.lt-card')].map(c=>({id:c.dataset.uid||c.dataset.rate,...r(c),footer:r(c.querySelector('.ft')),ability:c.querySelector('.lt-pick-ability')?r(c.querySelector('.lt-pick-ability')):null,clipped:c.querySelector('.lt-pick-ability')?(c.querySelector('.lt-pick-ability').getBoundingClientRect().bottom>c.querySelector('.ft').getBoundingClientRect().top+1||c.querySelector('.ft').getBoundingClientRect().bottom>c.getBoundingClientRect().bottom+1):false}))};
 });
 const a=await inspect();await p.screenshot({path:`${out}/${tag}-${group}-compact.png`});
 await p.getByRole('button',{name:'Show member abilities'}).click();const b=await inspect();
 await p.screenshot({path:`${out}/${tag}-${group}-details.png`});
 if(a.cards.length!==11||b.cards.length!==11)throw Error(`${tag}: missing cards`);
 if(!b.deck)throw Error(`${tag}: deck disappeared`);
 for(let i=0;i<a.cards.length;i++)for(const k of ['id','x','y','w','h'])if(a.cards[i][k]!==b.cards[i][k])throw Error(`${tag}: ${a.cards[i].id} moved/resized ${k}: ${a.cards[i][k]} -> ${b.cards[i][k]}`);
 if(b.cards.some(c=>c.clipped))throw Error(`${tag}: ability overlaps price: ${JSON.stringify(b.cards.filter(c=>c.clipped))}`);
 if(b.docOverflow>1)throw Error(`${tag}: page overflow`);
 if(['laptop','desktop'].includes(tag)&&(b.overflow>1||b.cards.some(c=>c.y+c.h>opts.viewport.height)))throw Error(`${tag}: desktop market needs scroll: ${JSON.stringify(b)}`);
 await p.getByRole('button',{name:'Show member abilities'}).click();const c=await inspect();
 if(JSON.stringify(a.cards)!==JSON.stringify(c.cards))throw Error(`${tag}: toggle did not restore slots`);
 if(errors.length)throw Error(errors.join(';'));
 console.log(`${tag}-${group}: ${a.cards[3].w.toFixed(1)}×${a.cards[3].h.toFixed(1)}px, stable slots, full abilities, no desktop scroll/page overflow.`);
 await ctx.close();
 }
}}finally{await browser.close();}
