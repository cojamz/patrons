// Paying (Cory, 2026-10-15: "Using these currencies is rather confusing … something more intuitive"). A paper card in
// the plate's grammar: what you're buying and its cost exactly as the card prints it ("2● 2◐"), then your resources as
// stacks of dots, then Pay with the coins it pays. The suggested way is already in: the coins that pay are lifted off
// the top of their stacks, and the number under a stack is what you keep. Click a stack to pay with that color
// instead; click a lifted coin to put it back.
// Either way the payment stays whole: the engine's nearest other legal way takes its place, and the coins fly between
// stack and socket so you see the swap. Pay (Enter, wherever focus is) pays; Space works a focused stack or coin;
// Cancel (Escape) goes back to the buy step.
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
import { leadsLost } from './boardPick.js';
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
function costShape(state, p, pend, uid, how) {
  if (uid === undefined) {
    const tier = TIERS.find(t => t.key === pend.tier);
    return { units: Array.from({ length: tier.cost }, () => 'any'), worth: () => 1 };
  }
  const pr = memberPrice(state, p, uid, how);
  const pp = p.members.some(u => defsOf(state.cards[u]).some(d => d.goldPaysDouble));
  const units = [...Array.from({ length: pr.colored }, () => pr.color), ...Array.from({ length: Math.max(0, pr.total - pr.colored) }, () => 'any')];
  return { units, worth: c => (c === 'gold' && pp ? 2 : 1) };
}

/**
 * A choice that is a way to pay for a member outside the buy step (Snap Up, Half Price, Talent Scout): every answer is
 * a pay option naming its member (uid) and the price rule it's paid under (how). It gets the same sheet.
 */
export const payChoice = pend => {
  if (!(pend && pend.kind === 'choose')) return false;
  const isPay = o => o.kind === 'pay' && Number.isInteger(o.uid) && o.value && typeof o.value === 'object';
  const pays = pend.options.filter(isPay).length, back = pend.options.some(o => o.kind === 'back');
  // several ways, or one way that gives up a lead (the engine asks then, with Cancel)
  return pays > 0 && pend.options.every(o => isPay(o) || o.kind === 'back') && (pays > 1 || back);
};

export default function PayPicker({ state, onPick, busy, turnOf = null }) {
  const pend = state.pending;
  const p = state.players[pend.player];
  const res = state.resources;
  // the buy step's pay options carry spend; a pay choice (Snap Up…) carries the same vector as its value
  const ways = useMemo(() => pend.options.filter(o => o.kind === 'pay').map(o => (o.spend ? o : { ...o, spend: o.value })), [pend]);
  const asChoice = pend.kind === 'choose';
  const uid = asChoice ? ways[0].uid : pend.uid;
  const how = asChoice ? ways[0].how || {} : {};
  const back = pend.options.find(o => o.kind === 'back');
  const suggested = vecOf(res, (ways.find(o => o.default) || ways[0])?.spend);
  const [spend, setSpend] = useState(suggested);
  const [nudge, setNudge] = useState(null); // { text, n }: why a click changed nothing
  useEffect(() => { setSpend(suggested); setNudge(null); }, [pend]); // eslint-disable-line react-hooks/exhaustive-deps
  const id = `pay:${res.map(r => spend[r] || 0).join('-')}`;
  const match = ways.find(o => o.id === id) || null;

  const def = uid !== undefined ? cardDef(state, uid) : null;
  const tier = pend.tier ? TIERS.find(t => t.key === pend.tier) : null;
  const title = def ? `Recruit ${def.name}` : `Buy ${tier.get} follower${tier.get > 1 ? 's' : ''}`;
  const shape = useMemo(() => costShape(state, p, pend, uid, how), [pend]); // eslint-disable-line react-hooks/exhaustive-deps
  const printed = def ? costParts(def, res) : [{ color: 'any', n: tier.cost }];
  // every rule-changer bending this price, one quiet line each (the sockets already show what it comes to); a pay
  // choice says first what it's paid under ("Half Price: half its cost, in any colors")
  const asker = asChoice ? (String(pend.prompt || '').match(/^([^:]{2,40}):/) || [])[1] : null;
  const rule = asChoice ? (how.half ? 'half its cost, in any colors' : how.anyColors ? 'in any colors' : 'at its cost') : null;
  const notes = useMemo(() => [
    ...(asChoice && asker ? [{ key: 'how', text: `${asker}: ${rule}` }] : []),
    ...(def ? priceNotes(state, p, uid).filter(n => n.key !== 'total') : []),
  ], [pend]); // eslint-disable-line react-hooks/exhaustive-deps
  const pay = () => { if (match && !busy) onPick(match.id); };
  // this way gives up a contest lead or tie you hold (the engine's breaks): one quiet line says so
  const lostLead = match && match.breaks && match.breaks.length ? match.breaks : null;
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

  const tall = Math.min(STACK_MAX, Math.max(1, ...res.map(r => p.res[r] || 0)));
  const payParts = res.filter(r => spend[r] > 0).map(r => ({ color: r, n: spend[r] }));
  const sphere = def ? (onTable(state, def) ? (() => { try { return quadrant(def.quadrant).resource; } catch { return 'colorless'; } })() : 'colorless') : null;

  return (
    <div className="overlay sheet pay-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="dialog pay pay-card" ref={box}
        onKeyDown={e => { if (e.key === 'Enter' && !e.target.closest('[data-option="back"]')) { e.preventDefault(); pay(); } }}>
        {turnOf && <TurnOf player={turnOf} />}
        {/* what you're buying, as its card prints it (the hover card's head) */}
        <div className="mc pay-id" style={def ? { '--c': cardColor(state, def) } : undefined}>
          <div className="mc-head">
            <span className={`mc-art${def ? '' : ' fol'}`} aria-hidden="true">
              {/* followers: a small crowd of them (as many as you get, up to three), never one mark in a grey box,
                  which read as a missing picture (w3a #50) */}
              {def ? <Sprite id={[def.id, spriteId(def.name)]} kind="member" sphere={sphere} size={48} />
                : <span className="fol-crowd" data-n={Math.min(3, tier.get)}>{Array.from({ length: Math.min(3, tier.get) }, (_, k) => <Follower key={k} size={k === 0 ? 27 : 18} />)}</span>}
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

        {/* your resources: a stack of dots per color (wave-2 tester A: the payment once showed three times; now the
            stacks and the Pay button say it). The coins this pays with are lifted off the top of their stack and faded,
            and the number under a stack is what you keep. Click a stack to pay with one more of it; click a lifted coin
            to put it back (another color takes its place). */}
        <div className="pay-stacks" role="group" aria-label="Your resources" style={{ '--tall': tall }}>
          {/* only the colors you hold (blind tester B: a faint coin for a color you hold none of read as "this pays") */}
          {res.filter(r => (p.res[r] || 0) > 0).map(r => {
            const have = p.res[r] || 0, out = spend[r] || 0, keep = have - out;
            const drawn = Math.min(have, STACK_MAX), lifted = Math.min(out, drawn), base = have - drawn;
            const sayAdd = have ? `${have} ${r}: ${out ? `${out} pay${out === 1 ? 's' : ''} this, ` : ''}you keep ${keep}. Click to pay with one more ${r}.` : `No ${r}`;
            return (
              <div key={r} className={`pay-stack${have ? '' : ' none'}${out ? ' paying' : ''}`} data-stack={r} data-keep={keep} data-out={out}>
                <button type="button" className="ps-add" data-pay-add={r} data-keep={keep} disabled={busy || !have} title={sayAdd} aria-label={sayAdd} onClick={() => add(r)} />
                <span className="ps-coins">
                  {Array.from({ length: drawn - lifted }, (_, k) => (
                    <i key={k} className="ps-coin" data-coin={`${r}-${k + base}`} style={{ '--k': k }} aria-hidden="true"><ResourceGlyph r={r} size={24} decorative /></i>
                  ))}
                  {lifted > 0 && (
                    <button type="button" className="ps-out" data-pay-coin={r} disabled={busy} style={{ '--k0': drawn - lifted, '--n': lifted }}
                      title={`${out} ${r} pay${out === 1 ? 's' : ''} this. Click to put one back and pay with another color.`} aria-label={`${out} ${r} paying: put one back`}
                      onClick={() => remove(r)}>
                      {Array.from({ length: lifted }, (_, j) => (
                        <i key={j} className="ps-coin out" data-coin={`${r}-${drawn - lifted + j + base}`} style={{ '--j': j }} aria-hidden="true"><ResourceGlyph r={r} size={24} decorative /></i>
                      ))}
                    </button>
                  )}
                </span>
                <b className="ps-n num" aria-hidden="true">{keep}</b>
              </div>
            );
          })}
        </div>

        {/* the stacks' one legend (w3b #25: the numbers read as "cost per color", and the faded coins' meaning seemed to
            swap after a tap): faded coins pay, the number under a stack is what you keep */}
        <p className="pay-legend" data-pay-legend>Faded coins pay. The number under each stack is what you keep.</p>

        {(notes.length > 0 || nudge || lostLead) && (
          <div className="pay-notes">
            {notes.length > 0 && <ul className="pay-rules" data-pay-rules={notes.length}>{notes.map(n => <li key={n.key} data-pay-rule={n.key}>{n.text}</li>)}</ul>}
            {lostLead && <p className="pay-lead" data-pay-lead={lostLead.join(' ')}>Paying this gives up {leadsLost(lostLead, match.ties || [])}.</p>}
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
