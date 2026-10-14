// UI-B's lab (?lab=b[&seed=N&phase=place|buy]): the Lamplit shop, seat rail, your table and every hover card on a
// real mid-game state, for screenshots beside the vision frames before the shell mounts them. Not part of the game.
import { useMemo } from 'react';
import '../v4.css';
import '../lamp.css';
import { createGame, applyMove, chooseBotMove } from '../../engine/v4/index.js';
import { seededRandom } from '../../engine/v4/rng.js';
import ShopCards from '../game/ShopCards.jsx';
import SeatRail from '../game/SeatRail.jsx';
import YourTable from '../game/YourTable.jsx';
import { SpaceCard, StandingsCard, SeatCard, ShopCardHover, useHoverCards, HoverCardLayer } from '../game/HoverCards.jsx';
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
  const state = useMemo(() => labState(seed, phase), [seed, phase]);
  const hover = useHoverCards();
  const opts = new Map((state.pending && state.pending.player === 0 ? state.pending.options : []).map(o => [o.id, o]));
  const optionFor = id => opts.get(id) || null;
  const pick = id => console.log('pick', id); // eslint-disable-line no-console
  const firstSlot = state.pending && state.pending.options.find(o => o.kind === 'slot');
  const firstCard = state.shop[0];
  const props = { state, me: 0, mySeats: [0], optionFor, onPick: pick, onDenied: () => {}, phase, hover };
  return (
    <div className="app game lt lab-b" data-phase={phase} style={{ padding: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '600px 600px', gap: 24 }}>
        <section className="lt-rail" data-region="rail" style={{ gridColumn: '1 / -1' }}><SeatRail {...props} /></section>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="popover lab-note" style={{ position: 'static', width: 280 }}><div className="lt-note pinned">{firstSlot && <SpaceCard state={state} me={0} spaceKey={`${firstSlot.q}-${firstSlot.i}`} optionFor={optionFor} onPick={pick} pinned />}</div></div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div className="popover lab-note" style={{ position: 'static', width: 280 }}><div className="lt-note"><StandingsCard state={state} qid="gold" meId={0} /></div></div>
            <div className="popover lab-note" style={{ position: 'static', width: 280 }}><div className="lt-note"><SeatCard state={state} pid={1} meId={0} /></div></div>
          </div>
          <div className="popover lab-note" style={{ position: 'static', width: 280 }}><div className="lt-note pinned"><ShopCardHover state={state} me={0} uid={firstCard} optionFor={optionFor} onPick={pick} pinned /></div></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <section className="lt-shop" data-region="shop"><ShopCards {...props} /></section>
          <section className="lt-table" data-region="table"><YourTable {...props} /></section>
        </div>
      </div>
      <HoverCardLayer hover={hover} state={state} me={0} optionFor={optionFor} onPick={pick} />
      <TouchTips />
    </div>
  );
}
