// The action stage on screen (stage.js says what it is). A space flies out of the wheel to the hub as a card and a
// member steps off its seat beside it; while they're out their places on the board stand dimmed, and when the chain
// ends each flies back home. Nothing here takes a click: the stage never stands between a player and the board.
import { useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { subscribeStage, stageItems, stageGone, CARD, MEMBER } from './stage.js';
import { Rich } from './Rich.jsx';
import { Sprite } from '../art/Sprite.jsx';
import { Minion } from '../art/Leader.jsx';
import { MO } from '../motion.js';
import { play } from '../sound.js';
import { track } from './flight.js';
import './stage.css';

const EASE_OUT = 'cubic-bezier(.2,.9,.25,1.15)'; // lands with a little give, like a card slapped on the table
const EASE_HOME = 'cubic-bezier(.45,0,.65,1)';

/** The transform that puts a box of `size` (left/top at `at`) over the rect `r`. */
const over = (at, size, r) => {
  const s = Math.max(0.2, Math.min(1, Math.min(r.width / size.w, r.height / size.h)));
  const dx = r.left + r.width / 2 - (at.left + size.w / 2), dy = r.top + r.height / 2 - (at.top + size.h / 2);
  return `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(${s.toFixed(3)})`;
};
const live = el => (el && el.isConnected && el.getBoundingClientRect().width > 0 ? el.getBoundingClientRect() : null);

function StageItem({ it }) {
  const el = useRef(null);
  const left = useRef(false);
  const size = it.size || (it.kind === 'space' ? CARD : MEMBER);
  // in: from where it stood on the board to its spot on the stage; its home dims while it's out
  useLayoutEffect(() => {
    const e = el.current;
    if (!e || !e.animate) return undefined;
    if (it.homeEl && it.homeEl.classList) it.homeEl.classList.add('on-stage');
    const from = it.from;
    const frames = from
      ? [{ transform: over(it.at, size, from), opacity: 0.6, offset: 0 }, { transform: 'translate(0,-8px) scale(1.04)', opacity: 1, offset: 0.78 }, { transform: 'none', opacity: 1 }]
      : [{ transform: 'scale(.8)', opacity: 0 }, { transform: 'none', opacity: 1 }];
    const arrival = track(e.animate(frames, { duration: it.dur, easing: EASE_OUT, fill: 'backwards' }));
    // a member's bubble pops with its little sound as it lands (a recruit's sound is its landing in the crowd)
    if (it.kind === 'member' && !it.recruit) arrival.finished.then(() => { if (e.isConnected && !it.leaving) play('member'); }, () => {});
    return () => { if (it.homeEl && it.homeEl.classList) it.homeEl.classList.remove('on-stage'); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // a member that acts again while it's out hops again
  useLayoutEffect(() => {
    const e = el.current;
    if (!it.again || !e || !e.animate) return;
    track(e.animate([{ transform: 'none' }, { transform: 'translateY(-8px) scale(1.06)', offset: 0.4 }, { transform: 'none' }], { duration: MO.hop, easing: 'cubic-bezier(.3,1.4,.5,1)' }));
  }, [it.again]);
  // out: back to where it lives on the board (wherever that is now), and its home lights back up as it lands
  useLayoutEffect(() => {
    const e = el.current;
    if (!it.leaving || left.current) return;
    left.current = true;
    const home = live(it.homeEl) || it.from;
    const done = () => { if (it.homeEl && it.homeEl.classList) it.homeEl.classList.remove('on-stage'); stageGone(it.id); };
    if (!e || !e.animate || !home) { done(); return; }
    const a = track(e.animate([{ transform: 'none', opacity: 1 }, { transform: over(it.at, size, home), opacity: 0.15 }], { duration: it.out || MO.stageOut, easing: EASE_HOME, fill: 'forwards' }));
    // a recruit lands in its buyer's crowd with its sound and the crowd's landing ring; a bubble goes back quietly
    a.finished.then(() => { if (it.onHome && a.playState === 'finished') it.onHome(); done(); }, done);
  }, [it.leaving]); // eslint-disable-line react-hooks/exhaustive-deps
  const style = { left: it.at.left, top: it.at.top, width: size.w, height: size.h, '--q': it.color, '--pc': it.pc };
  if (it.kind === 'space') {
    return (
      <div ref={el} className="as-card" style={style} data-stage="space" data-stage-key={it.key}>
        <span className="as-who"><Minion emoji={it.emoji} color={it.pc} size={14} /><span>{it.who}</span></span>
        <span className="as-main"><Rich text={it.main} /></span>
        {it.second && <span className="as-second"><Rich text={it.second} /></span>}
        {it.note && <span className="as-note"><Rich text={it.note} /></span>}
      </div>
    );
  }
  return (
    <div ref={el} className={`as-member${it.recruit ? ' at-hub' : ' bubble'}`} style={style} data-stage="member" data-stage-uid={it.uid}>
      <span className="as-fig"><Sprite id={it.sprite} kind="member" sphere={it.sphere} size={it.recruit ? 48 : 36} /></span>
      <span className="as-words">
        <span className="as-name">{it.name}</span>
        {it.text && <span className="as-rule"><Rich text={it.text} /></span>}
        {it.got && <span className="as-got"><Rich text={it.got} /></span>}
      </span>
    </div>
  );
}

/** The stage layer: every staged card and member, over the board. */
export default function ActionStage() {
  const items = useSyncExternalStore(subscribeStage, stageItems, stageItems);
  if (!items.length || typeof document === 'undefined') return null;
  return createPortal(<div className="action-stage" aria-hidden="true">{items.map(it => <StageItem key={it.id} it={it} />)}</div>, document.body);
}
