// The gift card (Cory, 2026-10-16: the two-step pick on the seats was "very bad/confusing"). A choice that gives to a
// rival, or pairs two things (boardPick.js giftPick: Good Deed, Kickback, Benefactor, Even Swap, Swap Sides, Trade Seeds,
// Sweet Talk), or a color of yours asked by a space (Goody Bags, Cheap Seats: one row, your counts when you pay), is a small paper card beside the space just used: a plain heading ("A rival you pick gets 2"), then the first
// row (your colors, or your members), then the second (the rivals' faces, the color you get, how many, their members).
// The second row is there from the start, quiet, so the card never changes shape; it lights once a first is picked. The
// picked one stays pressed, and a click on another switches it. Every answer is the engine's own option id.
import { useEffect, useRef } from 'react';
import { cardDef, quadrant } from '../../engine/v4/index.js';
import { playerColor, seatEmoji } from '../format.js';
import { ResourceGlyph } from './Glyphs.jsx';
import { Pip } from './Rich.jsx';
import { Minion } from '../art/Leader.jsx';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { cardColor, onTable } from './Info.jsx';
import { realHover } from '../hover.js';
import { TurnOf } from './parts.jsx';
import { leadWarning } from './boardPick.js';
import './giftcard.css';

const LABELS = { color: [null, null], give: ['Color', 'To'], gift: [null, 'To'], colors: ['Give', 'Get'], amount: ['Get', 'How many'], trade: ['Yours', 'Theirs'] };
const sphereOf = (state, d) => { if (!onTable(state, d)) return 'colorless'; try { return quadrant(d.quadrant).resource; } catch { return 'colorless'; } };

/**
 * onFirst(a | null, el): lift a first (null puts it down); onAnswer(id, el, b): the engine's option. place: where
 * GameScreen puts the card beside the space ({ left, top, up }), as for any plain question.
 */
export default function GiftCard({ state, gift: g, onFirst, onAnswer, busy, place = null, turnOf = null, hover = null }) {
  const pend = state.pending;
  const me = state.players[g.actor];
  const box = useRef(null);
  const step = g.kind === 'gift' || g.kind === 'color' || g.chosen != null ? 2 : 1;
  // the row to act on takes the focus, so the keyboard starts where the mouse would
  useEffect(() => {
    const b = box.current && box.current.querySelector(`.gc-row[data-row="${step}"] button:not([disabled])`);
    if (b) b.focus({ preventScroll: true });
  }, [pend, step]);
  // a second row that scrolls inside the card (a swap in round III: many rivals' members) fades at the edge that has
  // more, so it never reads as cut off
  const more = useRef(null);
  const edge = () => {
    const el = more.current;
    if (!el) return;
    const up = el.scrollTop > 1, down = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    const v = up && down ? 'both' : up ? 'up' : down ? 'down' : '';
    if ((el.dataset.more || '') !== v) { if (v) el.dataset.more = v; else delete el.dataset.more; }
  };
  useEffect(edge);
  const [l1, l2] = LABELS[g.kind];
  const card = uid => cardDef(state, uid);
  const owner = uid => state.players.find(p => p.members.includes(uid));
  const from = g.kind === 'amount' ? (String(pend.prompt).match(/swap (\w+) for/i) || [])[1] : null;
  // the gift comes from the bank, never your own stack (blind testers read "Give 1 to a rival" as paying it, 2026-10-15)
  const head = g.kind === 'give' && g.chosen ? <>A rival you pick gets <b className="num">{g.n}</b><Pip color={g.chosen} /></>
    : g.kind === 'gift' ? <>A rival you pick gets <b className="num">{g.n}</b>{g.color ? <Pip color={g.color} /> : null}</>
      : g.kind === 'colors' && g.chosen ? <>Swap <b className="num">1</b><Pip color={g.chosen} /> for another color</>
        : g.kind === 'amount' && from ? <>Swap {g.chosen ? 'your' : ''}<Pip color={from} /> for {g.chosen ? <Pip color={g.chosen} /> : 'another color'}</>
          : g.kind === 'trade' && g.chosen != null ? <>Swap your {card(g.chosen).name} for…</>
            : g.head;
  // what the second row's items pair with, live or (before a first is picked) quiet
  const live = new Map(g.seconds.map(x => [x.b, x.o]));
  const color = g.kind === 'gift' ? g.color : g.chosen;
  const memberHover = uid => (hover ? {
    onPointerEnter: e => { if (realHover(e)) hover.onCardHover(uid, e.currentTarget); },
    onPointerLeave: e => { if (e.pointerType === 'mouse') hover.onCardHover(uid, null); },
  } : {});

  const firstItem = f => {
    const press = e => onFirst(f.chosen ? null : f.a, e.currentTarget);
    const common = { type: 'button', 'data-option': f.id, 'aria-pressed': f.chosen, disabled: busy, onClick: press, className: `gc-item${f.chosen ? ' chosen' : ''}` };
    if (g.kind === 'trade') {
      const d = card(f.a);
      return (
        <button key={f.a} {...common} className={`${common.className} gc-member`} data-uid={f.a} aria-label={`Your ${d.name}${f.chosen ? ' (picked)' : ''}`} style={{ '--q': cardColor(state, d) }} {...memberHover(f.a)}>
          <Sprite id={[d.id, spriteId(d.name)]} kind="member" sphere={sphereOf(state, d)} size={28} />
          <span className="gc-name">{d.name}</span>
        </button>
      );
    }
    const n = g.kind === 'colors' ? me.res[f.a] || 0 : null;
    return (
      <button key={f.a} {...common} className={`${common.className} gc-dot`} data-res={f.a} aria-label={`${n != null ? `Your ${f.a} (${n})` : f.a}${f.chosen ? ', picked' : ''}`} title={f.a}>
        <ResourceGlyph r={f.a} size={24} decorative />
        {n != null && <b className="num">{n}</b>}
      </button>
    );
  };

  const secondItem = b => {
    const o = live.get(b) || null;
    const press = e => o && onAnswer(o.id, e.currentTarget, b);
    const common = { type: 'button', 'data-option': o ? o.id : undefined, disabled: busy || !o, onClick: press, className: 'gc-item' };
    if (g.kind === 'give' || g.kind === 'gift') {
      const p = state.players[b];
      const has = color ? p.res[color] || 0 : null;
      return (
        <button key={b} {...common} className={`${common.className} gc-face`} data-pid={b} style={{ '--pc': playerColor(b) }}
          aria-label={o ? `Give ${g.n || ''} ${color || ''} to ${p.name}${has != null ? ` (has ${has})` : ''}`.replace(/\s+/g, ' ') : `${p.name}: pick a color first`}
          title={o ? `${p.name} has ${has} ${color}` : 'Pick a color first'}>
          <Minion color={playerColor(b)} emoji={seatEmoji(state, b)} size={28} />
          <span className="gc-name">{p.name}</span>
          {/* what they hold of the color (kept in its place, unseen, until a color is picked: the card never changes size) */}
          <span className="gc-has num" style={has == null ? { visibility: 'hidden' } : undefined}>{has ?? 0}<ResourceGlyph r={color || state.resources[0]} size={11} decorative /></span>
        </button>
      );
    }
    if (g.kind === 'color') {
      const n = me.res[b] || 0;
      return (
        <button key={b} {...common} className={`${common.className} gc-dot`} data-res={b} aria-label={g.pay ? `Pay 1 ${b} (you have ${n})` : `${b} (you have ${n})`} title={b}>
          <ResourceGlyph r={b} size={24} decorative />
          {g.pay && <b className="num">{n}</b>}
        </button>
      );
    }
    if (g.kind === 'colors') {
      return (
        <button key={b} {...common} className={`${common.className} gc-dot`} data-res={b} aria-label={o ? `Get 1 ${b}` : `${b}: pick what you give first`} title={b}>
          <ResourceGlyph r={b} size={24} decorative />
        </button>
      );
    }
    if (g.kind === 'amount') {
      return (
        <button key={b} {...common} className={`${common.className} gc-amt`} data-n={b} aria-label={o ? `Swap ${b} ${from || ''} for ${b} ${g.chosen}` : `${b}: pick a color first`}>
          <b className="num">{b}</b>
        </button>
      );
    }
    return null;
  };

  // a member swap's second row: each rival's members that can pair, beside their face
  const theirs = () => {
    const groups = new Map();
    for (const u of g.others) { const p = owner(u); if (!p) continue; if (!groups.has(p.id)) groups.set(p.id, []); groups.get(p.id).push(u); }
    return [...groups].map(([pid, uids]) => (
      <span key={pid} className="gc-group" data-pid={pid}>
        <span className="gc-who" title={state.players[pid].name}><Minion color={playerColor(pid)} emoji={seatEmoji(state, pid)} size={20} /></span>
        <span className="gc-group-items">{uids.map(u => {
          const o = live.get(u) || null, d = card(u);
          return (
            <button key={u} type="button" className="gc-item gc-member" data-uid={u} data-option={o ? o.id : undefined} disabled={busy || !o} style={{ '--q': cardColor(state, d) }}
              aria-label={o ? `${state.players[pid].name}’s ${d.name}` : `${state.players[pid].name}’s ${d.name}: pick yours first`} {...memberHover(u)}
              onClick={e => o && onAnswer(o.id, e.currentTarget, u)}>
              <Sprite id={[d.id, spriteId(d.name)]} kind="member" sphere={sphereOf(state, d)} size={28} />
              <span className="gc-name">{d.name}</span>
            </button>
          );
        })}</span>
      </span>
    ));
  };

  return (
    <section ref={box} className={`prompt choice plain gift-card${place ? ` at-space ${place.up ? 'below' : 'above'}` : ''}`} role="group" aria-label={pend.prompt}
      data-gift={g.kind} data-step={step} style={place ? { left: place.left, top: place.top } : undefined}>
      {turnOf && <TurnOf player={turnOf} />}
      <header className="gc-head">
        {g.title && <small className="gc-title">{g.title}{g.left != null ? <> · <span className="num">{g.left}</span> left</> : null}{g.done ? <> · <span className="num">{g.done}</span> swapped</> : null}</small>}
        <p className="gc-what">{head}</p>
        {g.sub && <p className="gc-sub">{g.sub}</p>}
      </header>
      {l1 && (
        <div className="gc-row" data-row="1" data-live={step === 1 ? '1' : undefined}>
          <span className="gc-lbl">{l1}</span>
          <div className="gc-items">{g.firsts.map(firstItem)}</div>
        </div>
      )}
      <div className="gc-row" data-row="2" data-live={step === 2 ? '1' : undefined}>
        {l2 && <span className="gc-lbl">{l2}</span>}
        <div ref={more} onScroll={edge} className={`gc-items${g.kind === 'trade' ? ' gc-theirs' : ''}`}>{g.kind === 'trade' ? theirs() : g.others.map(secondItem)}</div>
      </div>
      {leadWarning(pend.options) && <p className="pay-lead gc-lead" data-pay-lead>{leadWarning(pend.options)}</p>}
      {g.rest.length > 0 && (
        <div className="gc-rest">
          {g.rest.map(o => <button key={o.id} type="button" className="btn gc-rest-btn" data-option={o.id} disabled={busy} onClick={e => onAnswer(o.id, e.currentTarget, null)}>{o.label}</button>)}
        </div>
      )}
    </section>
  );
}
