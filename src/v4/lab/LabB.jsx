// UI-B's lab (?lab=b[&seed=N&phase=place|buy]): the Lamplit shop, seat rail, your table and every hover card on a
// real mid-game state, for screenshots beside the vision frames before the shell mounts them. Not part of the game.
import { useEffect, useMemo, useState } from 'react';
import '../v4.css';
import '../lamp.css';
import { createGame, applyMove, chooseBotMove, cardDef } from '../../engine/v4/index.js';
import { seededRandom } from '../../engine/v4/rng.js';
import ShopCards from '../game/ShopCards.jsx';
import CultSeat from '../game/CultSeat.jsx';
import Wheel from '../game/Wheel.jsx';
import { useHoverCards, HoverCardLayer, usePreviewWarmup } from '../game/HoverCards.jsx';
import { TouchTips } from '../game/Info.jsx';

function labState(seed, phase) {
  const rand = seededRandom(seed);
  let s = createGame({ seats: [{ name: 'You', kind: 'human' }, { name: 'Wren', kind: 'bot' }, { name: 'Ossian', kind: 'bot' }, { name: 'Ilse', kind: 'bot' }], seed, quadrants: ['gold', 'thieves', 'market', 'silver'] });
  // play bots (seat 0 too) into round II, then stop on seat 0's chosen step
  for (let k = 0; k < 4000 && !s.over; k++) {
    if (s.round >= 2 && s.pending && s.pending.player === 0 && s.pending.kind === phase && s.players[0].members.length >= 2) break;
    s = applyMove(s, chooseBotMove(s, rand));
  }
  return s;
}

export default function LabB() {
  const q = new URLSearchParams(location.search);
  const seed = Number(q.get('seed')) || 7;
  const phase = q.get('phase') || 'place';
  const base = useMemo(() => labState(seed, phase), [seed, phase]);
  const [state, setState] = useState(base);
  useEffect(() => { setState(base); }, [base]);
  // ?react=1: a moment after load, the log gains a trace line for a member someone holds ("Wren's Banker: +3 gold."),
  // exactly as the engine writes it, so its figure should hop (e2e/v4/info.mjs watches for it)
  useEffect(() => {
    if (q.get('react') !== '1') return undefined;
    const t = setTimeout(() => setState(s => {
      const p = s.players.find(x => x.members.length);
      if (!p) return s;
      const d = cardDef(s, p.members[0]);
      document.documentElement.dataset.reactMember = `${p.id}:${d.id}`;
      return { ...s, log: [...s.log, `${p.name}'s ${d.name}: +1 gold.`] };
    }), 700);
    return () => clearTimeout(t);
  }, [base]); // eslint-disable-line react-hooks/exhaustive-deps
  const hover = useHoverCards();
  usePreviewWarmup(state, 0);
  const opts = new Map((state.pending && state.pending.player === 0 ? state.pending.options : []).map(o => [o.id, o]));
  const optionFor = id => opts.get(id) || null;
  const legal = new Map([...opts.values()].filter(o => o.kind === 'slot' && o.q != null).map(o => [`${o.q}-${o.i}`, o.id]));
  const pick = id => console.log('pick', id); // eslint-disable-line no-console
  const props = { state, me: 0, mySeats: [0], optionFor, onPick: pick, onDenied: () => {}, phase, hover };
  const now = state.pending ? state.pending.player : null;
  // the wheel's spaces report hover to the layer (what UI-A's wheel does through onSpaceHover)
  const onOver = e => { const g = e.target.closest && e.target.closest('[data-slot]'); if (g && e.pointerType === 'mouse') hover.onSpaceHover(g.dataset.slot, g); };
  const onOut = e => { const g = e.target.closest && e.target.closest('[data-slot]'); if (g && e.pointerType === 'mouse' && !(e.relatedTarget && g.contains(e.relatedTarget))) hover.onSpaceHover(g.dataset.slot, null); };
  const seat = (pid, style) => <div style={{ position: 'absolute', ...style }}><CultSeat state={state} pid={pid} me={0} mine={pid === 0} now={now === pid} hover={hover} optionFor={optionFor} onPick={pick} /></div>;
  return (
    <div className="app game lt lab-b" data-phase={phase} style={{ padding: 0 }}>
      <div style={{ position: 'relative', width: 1270, height: 700 }}>
        <div style={{ position: 'absolute', left: 300, top: 10, width: 560, height: 560 }} onPointerOver={onOver} onPointerOut={onOut}>
          <Wheel state={state} legal={legal} onPick={pick} flash={new Set()} facing={0} onFacing={() => {}} meId={0} />
        </div>
        {seat(1, { left: 12, top: 12 })}
        {seat(2, { right: 12, top: 12 })}
        {seat(3, { left: 12, bottom: 150 })}
        {seat(0, { right: 12, bottom: 150 })}
        <section className="lt-shop" data-region="shop" style={{ position: 'absolute', left: 12, right: 12, bottom: 8 }}><ShopCards {...props} /></section>
      </div>
      <HoverCardLayer hover={hover} state={state} me={0} optionFor={optionFor} onPick={pick} />
      <TouchTips />
    </div>
  );
}
