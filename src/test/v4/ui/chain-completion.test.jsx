import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { sceneQ } from '../../engine/v4/cards-helpers.js';
import { chainRunning, onChainEnd, playChain, skipChain } from '../../../v4/game/director.js';
import { holdStack, landAll, motionPending } from '../../../v4/game/flight.js';
import { stageShow, stageGone, stageClear, stageItems } from '../../../v4/game/stage.js';
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
 stageGone('homeward');await Promise.resolve();expect(chainRunning()).toBe(false);expect(ended).toHaveBeenCalledOnce();
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
