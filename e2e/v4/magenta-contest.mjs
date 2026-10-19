// Actual Magenta resource tie through final placement and round summary, with member-rich nonleader.
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
import { browserPath } from './lib/browser.mjs';
import { buildStamp } from './lib/stamp.mjs';
import { seedSave } from './lib/seed.mjs';
import { createGame, applyMove, quadrant } from '../../src/engine/v4/index.js';
import { resume } from '../../src/engine/v4/core.js';
const base=(process.env.V4_URL||'http://localhost:5323').replace(/\/$/,'');
const out=`${process.env.V4_SHOTS||'/tmp/cults-resource-contests'}/resource-contests`;
mkdirSync(out,{recursive:true});
const seats=['You','Bo','Cy','Di'].map(name=>({name,kind:'human'}));
let s=createGame({seats,seed:53,quadrants:['thieves','red','silver','echo']});
Object.assign(s,{round:1,queue:[{t:'turn',p:0},{t:'endRound'},{t:'afterRound'}],pending:null,slots:{},squats:{},order:[0],log:[]});
delete s.echo;
s.players.forEach((p,i)=>{p.left=i===0?1:0;p.res=Object.fromEntries(s.resources.map(r=>[r,0]));});
for(const def of ['thieves.crew','thieves.cutpurse','thieves.watchdog']){
 const uid=Object.keys(s.cards).map(Number).find(u=>s.cards[u].def===def);
 if(uid===undefined)throw Error(`Missing ${def}`);
 s.shop=s.shop.filter(u=>u!==uid);s.pile=s.pile.filter(u=>u!==uid);s.players[0].members.push(uid);
}
s.players[1].res.magenta=8;s.players[2].res.magenta=8;s.players[3].res.silver=99;
s=resume(s);s.build=buildStamp();
const save={config:{seats,speed:'fast'},state:s,undo:null,savedAt:Date.now()};
const action=`slot:1-${quadrant('red').actions.findIndex(a=>a.key==='turnout')}`;
let expected=applyMove(s,{player:0,option:action});
if(expected.pending?.kind!=='buy')throw new Error('Fixture must reach buying');
expected=applyMove(expected,{player:0,option:'pass'});
const contests=expected.contests.at(-1);
for(const [qid,winners] of [['thieves',[1,2]]]){
 const row=contests.results.find(r=>r.qid===qid);
 if(JSON.stringify(row.winners)!==JSON.stringify(winners))throw new Error(`${qid}: bad expected fixture`);
}
const browser=await chromium.launch({executablePath:browserPath});
try{
 for(const [tag,options]of[['desktop',{viewport:{width:1270,height:700}}],['phone',devices['iPhone 13']]]){
  const ctx=await browser.newContext(options),page=await ctx.newPage();page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await seedSave(page,save);await page.goto(`${base}/?intro=0&speed=quick`);
  await page.locator('[data-home="resume"]').click();
  if(await page.locator('[data-handoff]').isVisible())await page.locator('[data-handoff]').click();
  await page.locator('.app.game:not([data-animating])').waitFor();await page.waitForTimeout(450);
  for(const qid of ['thieves']){
   const rim=page.locator(`.rim-rule[data-plaque="${qid}"]`);
   if(!/RESOURCES/.test(await rim.textContent())||/MEMBERS/.test(await rim.textContent()))throw new Error(`${tag}: ${qid} rim label incorrect`);
  }
  const button=page.locator(`[data-option="${action}"]:not([disabled])`).first();
  if(tag==='phone')await button.tap();else await button.click();
  const confirm=page.getByRole('button',{name:'Place here',exact:true});if(await confirm.isVisible())await confirm.click();
  await page.locator('[data-option="pass"]:not([disabled])').first().click();
  await page.waitForFunction(want=>{
   const state=JSON.parse(localStorage.getItem('patrons.v4.local')).state;
   return JSON.stringify(state.contests.at(-1))===JSON.stringify(want);
  },contests);
  const summary=page.getByRole('dialog',{name:'Round I scoring',exact:true});
  await summary.waitFor({timeout:25000});
  for(const [qid,winners]of[['thieves','1,2']]){
   const row=summary.locator(`[data-qid="${qid}"]`);
   if(await row.getAttribute('data-winners')!==winners||!/resources/i.test(await row.innerText()))throw new Error(`${tag}: ${qid} summary disagrees`);
  }
  await page.screenshot({path:`${out}/${tag}-summary.png`});
  if(errors.length)throw new Error(errors.join('; '));
  console.log(`${tag}: resource rim labels; actual last move; exact contest records; Magenta resource tie while member-rich player loses; round summary.`);
  await ctx.close();
 }
}finally{await browser.close();}
