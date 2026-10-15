// Paying (Cory, 2026-10-15: "Using these currencies is rather confusing … something more intuitive"). A paper card in
// the plate's grammar: what you're buying and its cost exactly as the card prints it ("2● 2◐"), then the cost as a row
// of sockets with the coins that pay it sitting in them, then your resources as stacks of dots. The suggested way is
// already in: the coins leaving your stacks show as empty rings at the top of each stack, and the number under a
// stack is what you keep. Click a stack to pay with that color instead; click a coin in the cost to send it home.
// Either way the payment stays whole: the engine's nearest other legal way takes its place, and the coins fly between
// stack and socket so you see the swap. Pay (Enter) pays; Cancel (Escape) goes back to the buy step.
// The engine lists every legal spend (pending.options of kind 'pay'); this only ever moves between those options.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cardDef, defById, quadrant, memberPrice, TIERS } from '../../engine/v4/index.js';
import { costParts } from '../format.js';
import { useDialog, TurnOf } from './parts.jsx';
import { Follower } from '../art/Follower.jsx';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { ResourceGlyph } from './Glyphs.jsx';
import { CostDots, cardColor, onTable } from './Info.jsx';
import { priceNotes } from './priceNotes.js';
import { motionOK } from './flight.js';
import './pay.css';

const vecOf = (res, v) => Object.fromEntries(res.map(r => [r, (v && v[r]) || 0]));
const dist = (res, a, b) => res.reduce((s, r) => s + Math.abs((a[r] || 0) - (b[r] || 0)), 0);
const defsOf = card => [defById(card.def), ...(card.copy ? [defById(card.copy)] : [])];
const STACK_MAX = 12; // coins drawn in one stack; more say so in their number
const STEP = 6; // px between stacked coins

/**
 * What the sockets are: one per unit owed, the colored part first ({ c: color }), then the any part ({ c: 'any' }),
 * and what one coin of each color pays (a Penny Pincher gold pays 2 toward a member). From the engine's price rule.
 */
function costShape(state, p, pend) {
  if (pend.uid === undefined) {
    const tier = TIERS.find(t => t.key === pend.tier);
    return { units: Array.from({ length: tier.cost }, () => 'any'), worth: () => 1 };
  }
  const pr = memberPrice(state, p, pend.uid);
  const pp = p.members.some(u => defsOf(state.cards[u]).some(d => d.goldPaysDouble));
  const units = [...Array.from({ length: pr.colored }, () => pr.color), ...Array.from({ length: Math.max(0, pr.total - pr.colored) }, () => 'any')];
  return { units, worth: c => (c === 'gold' && pp ? 2 : 1) };
}

/** The coins in the sockets, in order: the colored part's color first, then table order. Each coin covers `span`
 *  sockets from `at`; key is the coin's place in its stack (the top coins leave first). */
function seat(res, units, spend, worth, have) {
  const q = units.find(u => u !== 'any') || null;
  const order = q ? [q, ...res.filter(r => r !== q)] : res;
  const out = [];
  let at = 0;
  for (const r of order) {
    for (let j = 0; j < (spend[r] || 0); j++) {
      const span = Math.max(1, Math.min(worth(r), units.length - at));
      out.push({ r, at, span, key: `${r}-${(have[r] || 0) - 1 - j}` });
      at += span;
    }
  }
  return out;
}

export default function PayPicker({ state, onPick, busy, turnOf = null }) {
  const pend = state.pending;
  const p = state.players[pend.player];
  const res = state.resources;
  const ways = useMemo(() => pend.options.filter(o => o.kind === 'pay'), [pend]);
  const back = pend.options.find(o => o.kind === 'back');
  const suggested = vecOf(res, (ways.find(o => o.default) || ways[0])?.spend);
  const [spend, setSpend] = useState(suggested);
  const [nudge, setNudge] = useState(null); // { text, n }: why a click changed nothing
  useEffect(() => { setSpend(suggested); setNudge(null); }, [pend]); // eslint-disable-line react-hooks/exhaustive-deps
  const id = `pay:${res.map(r => spend[r] || 0).join('-')}`;
  const match = ways.find(o => o.id === id) || null;

  const def = pend.uid !== undefined ? cardDef(state, pend.uid) : null;
  const tier = pend.tier ? TIERS.find(t => t.key === pend.tier) : null;
  const title = def ? `Recruit ${def.name}` : `Buy ${tier.get} follower${tier.get > 1 ? 's' : ''}`;
  const shape = useMemo(() => costShape(state, p, pend), [pend]); // eslint-disable-line react-hooks/exhaustive-deps
  const printed = def ? costParts(def, res) : [{ color: 'any', n: tier.cost }];
  // every rule-changer bending this price, one quiet line each (the sockets already show what it comes to)
  const notes = useMemo(() => (def ? priceNotes(state, p, pend.uid).filter(n => n.key !== 'total') : []), [pend]); // eslint-disable-line react-hooks/exhaustive-deps
  const pay = () => { if (match && !busy) onPick(match.id); };
  const box = useDialog(back ? () => { if (!busy) onPick('back'); } : null);

  // Pay holds the keyboard as soon as it can be pressed, so Enter pays; closing hands focus back (useDialog)
  useEffect(() => {
    const el = box.current;
    if (!el || busy || el.contains(document.activeElement)) return;
    const b = el.querySelector('[data-autofocus]:not([disabled])');
    if (b) b.focus({ preventScroll: true });
  }, [pend, busy, !!match]); // eslint-disable-line react-hooks/exhaustive-deps

  // the coins fly between stack and socket: where each coin was before a change, then a FLIP after it
  const before = useRef(null);
  const snap = () => {
    if (!box.current || !motionOK()) return;
    const m = new Map();
    box.current.querySelectorAll('[data-coin]').forEach(e => m.set(e.dataset.coin, e.getBoundingClientRect()));
    before.current = m;
  };
  useLayoutEffect(() => {
    const was = before.current;
    before.current = null;
    if (!was || !box.current) return;
    box.current.querySelectorAll('[data-coin]').forEach(e => {
      const a = was.get(e.dataset.coin);
      if (!a) return;
      const b = e.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (Math.abs(dx) + Math.abs(dy) < 1) return;
      e.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.25,.6,.3,1)' });
    });
  }, [spend]);

  const say = text => setNudge(n => ({ text, n: (n ? n.n : 0) + 1 }));
  // the nearest legal way that moves one coin of r the asked direction; ties go to the engine's own order
  const nearest = want => {
    let best = null, bd = Infinity;
    for (const o of ways) {
      if (!want(o.spend)) continue;
      const d = dist(res, o.spend, spend);
      if (d < bd) { best = o; bd = d; }
    }
    return best;
  };
  // click a stack: one more coin of r goes in, the nearest other coin comes home
  const add = r => {
    if (busy) return;
    const have = p.res[r] || 0;
    if (!have) return;
    if ((spend[r] || 0) >= have) { say(`All your ${r} is already in.`); return; }
    const o = nearest(v => (v[r] || 0) > (spend[r] || 0));
    if (!o) { say(`No more ${r} fits this cost.`); return; }
    snap(); setSpend(vecOf(res, o.spend)); setNudge(null);
  };
  // click a coin in the cost: it goes home, and another color takes its socket
  const remove = r => {
    if (busy) return;
    const o = nearest(v => (v[r] || 0) < (spend[r] || 0));
    if (!o) {
      const only = shape.units[0] !== 'any' && r === shape.units[0];
      say(only ? `Only ${r} can pay the ${r} part.` : `Nothing else you hold can pay this.`);
      return;
    }
    snap(); setSpend(vecOf(res, o.spend)); setNudge(null);
  };

  const coins = seat(res, shape.units, spend, shape.worth, p.res);
  const tall = Math.min(STACK_MAX, Math.max(1, ...res.map(r => p.res[r] || 0)));
  const payParts = res.filter(r => spend[r] > 0).map(r => ({ color: r, n: spend[r] }));
  const sphere = def ? (onTable(state, def) ? (() => { try { return quadrant(def.quadrant).resource; } catch { return 'colorless'; } })() : 'colorless') : null;

  return (
    <div className="overlay sheet pay-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="dialog pay pay-card" ref={box}
        onKeyDown={e => { if (e.key === 'Enter' && !e.target.closest('[data-pay-add],[data-pay-coin],[data-option="back"]')) { e.preventDefault(); pay(); } }}>
        {turnOf && <TurnOf player={turnOf} />}
        {/* what you're buying, as its card prints it (the hover card's head) */}
        <div className="mc pay-id" style={def ? { '--c': cardColor(state, def) } : undefined}>
          <div className="mc-head">
            <span className={`mc-art${def ? '' : ' fol'}`} aria-hidden="true">
              {def ? <Sprite id={[def.id, spriteId(def.name)]} kind="member" sphere={sphere} size={48} /> : <Follower size={30} title="followers" />}
            </span>
            <span className="mc-id">
              <span className="mc-row">
                <h2 className="mc-name">{def ? def.name : `${tier.get} follower${tier.get > 1 ? 's' : ''}`}</h2>
                {def && <span className="mc-worth" title={`Worth ${def.f} follower${def.f === 1 ? '' : 's'}`}><b className="n">{def.f}</b><Follower size={14} title={`worth ${def.f} follower${def.f === 1 ? '' : 's'}`} /></span>}
              </span>
              <small className="mc-cost" data-pay-cost={printed.map(c => `${c.n}${c.color}`).join(' ')}>costs <CostDots parts={printed} /></small>
            </span>
          </div>
        </div>

        {/* the cost as sockets, the coins that pay it sitting in them; a click sends one home */}
        <div className="pay-sockets" role="group" aria-label={`The cost: ${shape.units.length} to pay. Click a coin to pay that part another way.`}
          data-units={shape.units.length} style={{ '--units': shape.units.length }}>
          {shape.units.map((u, k) => <span key={k} className={`pay-socket${u === 'any' ? ' any' : ''}`} data-socket={u} style={{ gridColumn: k + 1, ...(u === 'any' ? {} : { '--c': `var(--${u})` }) }} aria-hidden="true" />)}
          {coins.map(c => (
            <button key={c.key} type="button" className={`pay-coin${c.span > 1 ? ' wide' : ''}`} data-pay-coin={c.r} data-coin={c.key}
              style={{ gridColumn: `${c.at + 1} / span ${c.span}` }} disabled={busy}
              aria-label={`${c.r}${c.span > 1 ? ` (pays ${c.span})` : ''}: pay this part another way`} title={`${c.r[0].toUpperCase()}${c.r.slice(1)}${c.span > 1 ? `, worth ${c.span} here` : ''}. Click to pay this part another way.`}
              onClick={() => remove(c.r)}>
              <ResourceGlyph r={c.r} size={24} decorative />{c.span > 1 && <span className="x num">×{c.span}</span>}
            </button>
          ))}
        </div>

        {/* your resources: a stack of dots per color; the coins paying are empty rings at the top, the number is what you keep */}
        <div className="pay-stacks" role="group" aria-label="Your resources: click a stack to pay with that color" style={{ '--tall': tall }}>
          {res.map(r => {
            const have = p.res[r] || 0, out = spend[r] || 0, keep = have - out;
            const drawn = Math.min(have, STACK_MAX);
            const say2 = have ? `${have} ${r}: ${out ? `${out} pay${out === 1 ? 's' : ''} this, ` : ''}you keep ${keep}. Click to pay with ${r}.` : `No ${r}`;
            return (
              <button key={r} type="button" className={`pay-stack${have ? '' : ' none'}`} data-pay-add={r} data-keep={keep} disabled={busy || !have}
                title={say2} aria-label={say2} onClick={() => add(r)}>
                <span className="ps-coins" aria-hidden="true">
                  {Array.from({ length: drawn }, (_, k) => {
                    const leaving = k >= drawn - Math.min(out, drawn);
                    return leaving
                      ? <i key={k} className="ps-ghost" style={{ '--k': k }}><ResourceGlyph r={r} size={24} decorative /></i>
                      : <i key={k} className="ps-coin" data-coin={`${r}-${k + (have - drawn)}`} style={{ '--k': k }}><ResourceGlyph r={r} size={24} decorative /></i>;
                  })}
                </span>
                <b className="ps-n num">{keep}</b>
              </button>
            );
          })}
        </div>

        {(notes.length > 0 || nudge) && (
          <div className="pay-notes">
            {notes.length > 0 && <ul className="pay-rules" data-pay-rules={notes.length}>{notes.map(n => <li key={n.key} data-pay-rule={n.key}>{n.text}</li>)}</ul>}
            {nudge && <p key={nudge.n} className="pay-nudge" role="status">{nudge.text}</p>}
          </div>
        )}

        <div className="pay-foot">
          {back && <button type="button" className="pay-cancel" data-option="back" disabled={busy} onClick={() => onPick('back')}>Cancel</button>}
          <button type="button" className="pay-go" data-autofocus data-option={match ? match.id : undefined} disabled={!match || busy}
            data-pay-total={payParts.map(c => `${c.n}${c.color}`).join(' ')} onClick={pay}>
            Pay <CostDots parts={payParts} />
          </button>
        </div>
      </div>
    </div>
  );
}
