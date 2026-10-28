import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { sceneQ } from '../../engine/v4/cards-helpers.js';
import { chainRunning, onChainEnd, playChain, skipChain } from '../../../v4/game/director.js';
import { holdStack, landAll, motionPending, track, landedEarly } from '../../../v4/game/flight.js';
import { stageShow, stageGone, stageClear, stageItems } from '../../../v4/game/stage.js';
import { flyPath } from '../../../v4/game/flight.js';
import { play } from '../../../v4/sound.js';
const control = vi.hoisted(() => ({ settles: [], motion: true }));
vi.mock('../../../v4/game/flight.js', async original => {
 const actual = await original();
 return { ...actual, motionOK: () => control.motion,
  flyPath: vi.fn(() => ({ finished: Promise.resolve() })),
  settle: () => {
   let resolve; const events = new EventTarget();
   const anim = { finished: new Promise(r => { resolve = r; }), addEventListener: (...a) => events.addEventListener(...a),
    finish(){ resolve(); events.dispatchEvent(new Event('finish')); }, cancel(){ this.finish(); } };
   control.settles.push(anim);return actual.track(anim);
  },
 };
});
vi.mock('../../../v4/sound.js', () => ({ play: vi.fn() }));
vi.mock('../../../v4/game/stage.js', async original => ({ ...await original(), stageRect: () => ({ left:400,top:200,width:184,height:104 }) }));
let off;
beforeEach(() => { vi.useFakeTimers(); control.settles=[]; control.motion=true;
 vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockReturnValue({left:10,top:10,width:52,height:52,right:62,bottom:62}); });
afterEach(() => { skipChain();landAll();stageClear();off?.();vi.restoreAllMocks();vi.useRealTimers();document.body.innerHTML=''; });
function start(){
 const root=document.createElement('div');root.innerHTML='<div class="lt-cult-seat" data-seat="0"><div class="cs-crowd"><div class="cs-member" data-uids="102"></div></div></div><div class="lt-cult-seat" data-seat="1"><div class="cs-crowd"><div class="cs-member" data-uids="101"></div></div></div>';document.body.append(root);
 const before=sceneQ({quadrants:['gold','silver']});const cause={kind:'move',pid:0};
 const move=(uid,from,to)=>({type:'member-move',cause,from:{kind:'crowd',pid:from},to:{kind:'crowd',pid:to},what:{uid,worth:1}});
 const after={...before,moves:before.moves+1,effects:[move(101,0,1),move(102,1,0)]};playChain(root,before,after);return root;
}
const finishSettles=()=>{for(const a of control.settles)a.finish();};

it('does not end a chain when flights land but the actual destination settles are unfinished',async()=>{
 const ended=vi.fn();off=onChainEnd(ended);const root=start();await vi.advanceTimersByTimeAsync(5000);
 expect(control.settles).toHaveLength(2);expect(chainRunning()).toBe(true);expect(root.dataset.chain).toBe('1');expect(ended).not.toHaveBeenCalled();
 control.settles[0].finish();await Promise.resolve();expect(chainRunning()).toBe(true);
 control.settles[1].finish();await Promise.resolve();expect(chainRunning()).toBe(false);expect(root.dataset.chain).toBeUndefined();expect(ended).toHaveBeenCalledOnce();
});
it('waits through a staged member return until it actually leaves the stage',async()=>{
 const ended=vi.fn();off=onChainEnd(ended);stageShow({id:'homeward',chain:1,kind:'member'});start();await vi.advanceTimersByTimeAsync(5000);finishSettles();await Promise.resolve();
 expect(stageItems()[0].leaving).toBe(true);expect(chainRunning()).toBe(true);expect(ended).not.toHaveBeenCalled();
 stageGone(stageItems()[0].uid);await Promise.resolve();expect(chainRunning()).toBe(false);expect(ended).toHaveBeenCalledOnce();
});
it('a member back on stage while its last bubble flies home is its own piece: each leaves on its own (v0.9.807 hang)',async()=>{
 stageShow({id:'m',chain:1,kind:'member'});stageShow({id:'x',chain:2,kind:'space'});stageShow({id:'m',chain:2,kind:'member'});
 const [a,,b]=stageItems();expect(a.leaving).toBe(true);expect(b.leaving).toBeFalsy();expect(a.uid).not.toBe(b.uid);
 stageGone(a.uid);expect(stageItems().map(i=>i.uid)).toEqual([stageItems()[0].uid,b.uid]);expect(stageItems()).toContain(b);
});
it('a piece sent home leaves even if its flight never reports back',async()=>{
 stageShow({id:'m',chain:1,kind:'member'});stageShow({id:'y',chain:2,kind:'space'});
 expect(stageItems()[0].leaving).toBe(true);await vi.advanceTimersByTimeAsync(5000);expect(stageItems().map(i=>i.id)).toEqual(['y']);
});
it('waits for a real held resource roll, including its final release',async()=>{
 const stack=document.createElement('div');stack.innerHTML='<b class="num">5</b>';document.body.append(stack);
 const hold=holdStack(stack,5);hold.roll(3,20000);hold.done();start();await vi.advanceTimersByTimeAsync(5000);finishSettles();await Promise.resolve();
 expect(chainRunning()).toBe(true);expect(motionPending()).toBe(true);
 await vi.advanceTimersByTimeAsync(21000);expect(chainRunning()).toBe(false);expect(stack.querySelector('b').hasAttribute('data-hold')).toBe(false);
});
it('skip immediately clears stage, settles and count rolls, without a second completion later',async()=>{
 const ended=vi.fn();off=onChainEnd(ended);stageShow({id:'skip-home',chain:1,kind:'member'});
 const stack=document.createElement('div');stack.innerHTML='<b class="num">5</b>';document.body.append(stack);const hold=holdStack(stack,5);hold.roll(3,20000);hold.done();
 start();await vi.advanceTimersByTimeAsync(5000);expect(chainRunning()).toBe(true);expect(skipChain()).toBe(true);
 expect(chainRunning()).toBe(false);expect(motionPending()).toBe(false);expect(stageItems()).toHaveLength(0);expect(ended).toHaveBeenCalledOnce();
 await vi.advanceTimersByTimeAsync(25000);expect(ended).toHaveBeenCalledOnce();expect(motionPending()).toBe(false);
});
it('a reduced-motion action creates no completion wait for animations that never start',()=>{
 control.motion=false;start();expect(chainRunning()).toBe(false);expect(motionPending()).toBe(false);
});
it('a motion a skip lands is marked as landed early, so its landing sound stays quiet (audit #44)',()=>{
 const fake=()=>{const ev=new EventTarget();return{finished:new Promise(()=>{}),playState:'running',addEventListener:(...a)=>ev.addEventListener(...a),finish(){this.playState='finished';ev.dispatchEvent(new Event('finish'));},cancel(){}};};
 const played=fake(),skipped=fake();track(played);track(skipped);
 played.finish();expect(landedEarly(played)).toBe(false);
 landAll();expect(landedEarly(skipped)).toBe(true);expect(landedEarly(null)).toBe(false);
});
// Undo (H24): the state is already restored; the move's motion plays backwards, never landing (counting, sounding) again
function placement(){
 const root=document.createElement('div');
 root.innerHTML='<div class="lt-wheel"><div data-slot="0-0"><div class="base"></div></div><b class="rim" data-rim-res="gold"></b></div><div class="lt-cult-seat" data-seat="0"><div class="cs-minions"><i data-minion="1"></i></div><div class="cs-stack" data-res="gold"><b class="num">4</b></div></div>';
 document.body.append(root);
 const restored=sceneQ({quadrants:['gold','silver'],res:[{gold:2}]});
 const undone={...restored,moves:restored.moves+1,slots:{...restored.slots,'0-0':0},effects:[{type:'gain',cause:{kind:'space',pid:0,key:'0-0'},from:{kind:'space',key:'0-0'},to:{kind:'stack',pid:0,r:'gold'},what:{r:'gold',n:2}}]};
 return {root,restored,undone};
}
for (const when of ['during','after']) it(`undo ${when} the move's motion plays it backwards without landing anything again (H24)`,async()=>{
 const {root,restored,undone}=placement();
 playChain(root,restored,undone,{mine:[0]});
 if(when==='after'){await vi.advanceTimersByTimeAsync(5000);finishSettles();await Promise.resolve();expect(chainRunning()).toBe(false);}
 else expect(chainRunning()).toBe(true);
 play.mockClear();flyPath.mockClear();
 const plan=playChain(root,undone,restored,{mine:[0]});
 expect(plan.rewind).toBe(true);
 // the table never waits on it: no chain runs, and the restored number stands
 expect(chainRunning()).toBe(false);
 await vi.advanceTimersByTimeAsync(5000);await Promise.resolve();
 expect(flyPath.mock.calls.length).toBeGreaterThanOrEqual(2); // the coins back to the rim, the minion home
 expect(flyPath.mock.calls.some(c=>String(c[1]).includes('minion-flight'))).toBe(true);
 expect(play).not.toHaveBeenCalled();
 expect(root.querySelector('.cs-stack b').textContent).toBe('4');
 expect(root.querySelector('.cs-stack b').hasAttribute('data-hold')).toBe(false);
});
