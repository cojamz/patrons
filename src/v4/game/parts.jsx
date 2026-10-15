// Small game-screen pieces: the choice prompt, the log, the hot-seat handoff, a confirm dialog and a popover.
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { quadrant, cardDef } from '../../engine/v4/index.js';
import { logSections, playerColor, costParts, plainLine } from '../format.js';
import { Rich, CostPips } from './Rich.jsx';
import { MemberCard, NamedText, CardText, cardColor } from './Info.jsx';
import { Follower } from '../art/Follower.jsx';
import { CoinMark } from './Glyphs.jsx';
import { pickCaption, pickHow, pickName } from './boardPick.js';
import './boardpick.css';

/** Escape closes; focus moves in on open and back to where it was on close. */
export function useDialog(onClose) {
  const box = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const back = document.activeElement;
    const first = box.current && (box.current.querySelector('[autofocus]:not([disabled]), [data-autofocus]:not([disabled])') || box.current.querySelector('button:not([disabled]), [href], input'));
    if (first) first.focus({ preventScroll: true });
    const onKey = e => {
      if (e.key === 'Escape' && close.current) { e.preventDefault(); e.stopPropagation(); close.current(); }
      if (e.key === 'Tab' && box.current) { // keep Tab inside the dialog
        const f = [...box.current.querySelectorAll('button:not([disabled]), [href], input, [tabindex="0"]')];
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    addEventListener('keydown', onKey, true);
    return () => {
      removeEventListener('keydown', onKey, true);
      if (back && back.isConnected && back.focus) back.focus({ preventScroll: true });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return box;
}

/** What a choice option is about: the member's effect and worth when it names a card. */
function optionDetail(state, o) {
  const cardOf = uid => (state.cards && state.cards[uid] ? cardDef(state, uid) : null);
  if ((o.kind === 'card' || o.kind === 'member') && typeof o.value === 'number') {
    const d = cardOf(o.value);
    if (d) {
      const cost = costParts(d, state.resources).map(c => `${c.n} ${c.color}`).join(' + ') || 'free';
      // whose it is (Ransom, Heist, Trade pick a rival's member) and what it costs, on every member option
      const owner = state.players.find(p => p.members.includes(o.value)) || null;
      return { name: d.name, text: d.text, f: d.f, color: d.quadrant, id: d.id, def: d, cost, owner: owner ? owner.id : null };
    }
  }
  if (o.kind === 'trade' && Array.isArray(o.value)) {
    const [a, b] = o.value.map(cardOf);
    if (a && b) return { name: o.label, text: `Give ${a.name} (worth ${a.f}) · get ${b.name} (worth ${b.f}): ${b.text}`, f: null, color: b.quadrant };
  }
  return null;
}

/** "P4 (34)" from an engine label reads as "P4 · 34 gold" when the question is about gold. */
function withUnits(label, prompt, colors = ['gold', 'red', 'blue', 'green']) {
  const m = label.match(/^(.*) \((\d+)\)$/);
  if (!m) return label;
  const unit = (prompt.match(new RegExp(`\\b(${colors.join('|')})\\b`, 'i')) || [])[1];
  return `${m[1]} · ${m[2]}${unit ? ` ${unit.toLowerCase()}` : ''}`;
}

/** "Ana's turn": the hand-over, folded into the header of the choice that opens the turn. */
export function TurnOf({ player }) {
  return <p className="turn-of" style={{ '--pc': playerColor(player.id) }}><i />{player.name}’s turn<span> · pass the device</span></p>;
}

export function ChoicePrompt({ state, onPick, busy, turnOf = null, seatPick = null }) {
  const pend = state.pending;
  const setup = pend.kind === 'setup';
  const box = useRef(null);
  useEffect(() => {
    const b = box.current && box.current.querySelector('button:not([disabled])');
    if (b) b.focus({ preventScroll: true });
  }, [pend]);
  const trade = pend.options.length > 0 && pend.options.every(o => o.kind === 'trade');
  // counted picks ("Steal: take 1 gold from… (2 left)") show how many are already taken
  const total = useRef(null);
  const left = (pend.prompt.match(/\((\d+) left\)/) || [])[1];
  if (left == null) total.current = null; else if (total.current == null || Number(left) > total.current) total.current = Number(left);
  // the seats are the selector (seatPick.js): the panel shrinks to a caption (after every hook above)
  if (seatPick) return <SeatPickCaption state={state} pk={seatPick} onPick={onPick} busy={busy} turnOf={turnOf} box={box} />;
  // the engine's own count when the choice carries one (it survives a reload); else counted from the first prompt seen
  const tally = pend.count ? `${pend.count.of - pend.count.left} of ${pend.count.of} taken`
    : left != null && total.current ? `${total.current - Number(left)} of ${total.current} taken` : null;
  const pick = (id, mode) => onPick(id, mode); // step changes are guarded by the table's input lock
  return (
    <section className={`prompt choice${setup ? ' setup' : ''}`} aria-live="polite" ref={box} role="group" aria-label={setup ? 'Pick a starting resource' : pend.prompt}>
      {turnOf && <TurnOf player={turnOf} />}
      <p>{!setup && tally ? <span className="tally">{tally} · </span> : null}{setup ? `Pick a starting resource${(pend.prompt.match(/\((\d) of 2\)/) || [])[1] ? ` (${pend.prompt.match(/\((\d) of 2\)/)[1]} of 2)` : ''}` : pend.prompt}</p>
      {setup ? <><SetupTokens state={state} pend={pend} onPick={pick} busy={busy} /><ForSale state={state} /></>
        : trade ? <TradePicker state={state} pend={pend} onPick={pick} busy={busy} />
          : <MergedOptions state={state} pend={pend} onPick={pick} busy={busy} />}
      {!setup && !trade && left != null && Number(left) > 1 && (
        // a counted pick: one button per target that can cover all of what's left ("Take all 3 from P3")
        <div className="take-alls">
          {/* the label says what a click really takes: all of what's left, or all a lone target holds ("Take P3's 1") */}
          {pend.options.map(o => [o, holds(o) ? Math.min(Number(left), holds(o)) : Number(left)])
            .filter(([o, k]) => k > 1 && (k === Number(left) || pend.options.length === 1)).map(([o, k]) => (
              <button key={o.id} type="button" className="btn pri take-all" disabled={busy} onClick={() => pick(o.id, 'all')}>
                {k === Number(left) ? `Take all ${k} from ${withUnits(o.label, pend.prompt, state.resources).split(' · ')[0]}`
                  : `Take ${k} from ${withUnits(o.label, pend.prompt, state.resources).split(' · ')[0]} (all they have)`}
              </button>
            ))}
        </div>
      )}
    </section>
  );
}

/**
 * The seat selector's caption (the seats are the selector, seatPick.js): what's asking, how many, how many left, and
 * a compact list of the same picks for the keyboard (Tab, Enter), named from each option's target.
 */
function SeatPickCaption({ state, pk, onPick, busy, turnOf, box }) {
  const pend = state.pending;
  const cap = pickCaption(state, pk);
  return (
    <section className="prompt choice seat-pick" aria-live="polite" ref={box} role="group" aria-label={pend.prompt} data-board-pick={[...pk.kinds].join(' ')}>
      {turnOf && <TurnOf player={turnOf} />}
      <p className="pick-cap" title={pend.prompt}>
        {cap.title ? <><b>{cap.title}</b>: {cap.what}{cap.left != null && <> · <span className="num pick-left" data-left={cap.left}>{cap.left}</span> left</>}</> : cap.what}
      </p>
      <p className="pick-how">{pickHow(pk)}{pk.rest.length ? ', or' : ''} <span className="pick-keys-hint">· Tab for a list</span></p>
      {/* what has no place on the board (Pass, "All 3 as green") stays a button here */}
      {pk.rest.length > 0 && (
        <div className="pick-rest">
          {pk.rest.map(o => <button key={o.id} type="button" className="btn pick-rest-btn" data-option={o.id} disabled={busy} onClick={() => onPick(o.id)}>{o.label}</button>)}
        </div>
      )}
      <div className="pick-keys" role="group" aria-label="Or pick from a list">
        {[...pk.where.values()].map(o => (
          <button key={o.id} type="button" className="pick-key" data-option={o.id} disabled={busy} onClick={() => onPick(o.id)}>{pickName(state, o)}</button>
        ))}
      </div>
    </section>
  );
}

// how many a counted-pick target holds: "P3 · 5 gold" or "P3 (5)"
const holds = o => Number((String(o.label).match(/· (\d+)\b/) || String(o.label).match(/\((\d+)\)$/) || [])[1] || 0);

/**
 * Setup: what's for sale decides what to pick, so the six face-up members ride along in the setup tray, read-only.
 * Phones show it here (the shop is far down the page); laptops hide it and keep the compact shop on screen instead.
 * A tap opens the card in full.
 */
function ForSale({ state }) {
  const [open, setOpen] = useState(null); // { uid, el }
  if (!state.shop || !state.shop.length) return null;
  return (
    <div className="for-sale" role="group" aria-label="For sale: the face-up members">
      <span className="fs-lbl">For sale <small><span className="num">{state.shop.length}</span> members · swipe for more, tap to read</small></span>
      <div className="fs-strip">
        {state.shop.map(uid => {
          const d = cardDef(state, uid);
          const parts = costParts(d, state.resources);
          return (
            <button key={uid} type="button" className="fs-card" data-sale={uid} style={{ '--c': cardColor(state, d) }}
              aria-label={`${d.name}, ${d.f} followers, costs ${parts.map(c => `${c.n} ${c.color}`).join(' + ') || 'nothing'}. Show the card.`}
              onClick={e => setOpen({ uid, el: e.currentTarget })}>
              <span className="row"><b>{d.name}</b><Follower n={d.f} /></span>
              <span className="fs-cost"><CostPips parts={parts} /></span>
            </button>
          );
        })}
      </div>
      {open && <Popover anchor={open.el} onClose={() => setOpen(null)}><CardFace state={state} uid={open.uid} /></Popover>}
    </div>
  );
}

function SetupTokens({ state, pend, onPick, busy }) {
  return (
    <div className="tokens">
      {pend.options.map(o => {
        const q = state.quadrants.includes(o.value) ? quadrant(o.value) : null;
        const res = q ? q.resource : o.value;
        return (
          <button key={o.id} type="button" className="token" data-option={o.id} disabled={busy} style={{ '--c': `var(--${o.value})` }} onClick={() => onPick(o.id)} aria-label={`Take 1 ${res}`}>
            <i className="coin-big"><CoinMark r={res} size={18} /><span className="num">+1</span></i>
            <span>{res}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Options that name the same card merge into one button with ×N (any of them is the same pick). */
function MergedOptions({ state, pend, onPick, busy }) {
  const groups = [];
  const byKey = new Map();
  for (const o of pend.options) {
    const det = optionDetail(state, o);
    const key = det ? `${o.kind}|${det.name}|${det.owner ?? ''}` : o.id;
    if (byKey.has(key)) { byKey.get(key).n += 1; continue; }
    const g = { key, o, det, n: 1 };
    byKey.set(key, g);
    groups.push(g);
  }
  return (
    <div className="opts">
      {groups.map(({ key, o, det, n }) => {
        const color = o.kind === 'color' ? o.value : null;
        return (
          <button
            key={key} type="button" className={`btn${color ? ' color' : ''}${det ? ' rich' : ''}`} data-option={o.id} disabled={busy}
            style={color ? { '--c': `var(--${color})` } : det && det.def ? { '--c': cardColor(state, det.def) } : det && det.color ? { '--c': `var(--${det.color})` } : undefined}
            onClick={() => onPick(o.id)}
          >
            {color && <i />}
            {det ? (
              <span className="rich-body">
                <b>{det.owner != null && <span className="from" style={{ color: playerColor(det.owner) }}>{state.players[det.owner].name}’s </span>}{det.name}{n > 1 && <span className="num copies"> {state.shop && state.shop.includes(o.value) ? `· ${n} in the shop` : `· ${n} of them`}</span>}{det.f != null && <> <Follower n={det.f} className="star" /></>}</b>
                <small>{det.def ? <CardText text={det.text} /> : <Rich text={det.text} />}</small>
                {det.cost && <small className="cost-line">Costs <span className="num">{det.cost}</span></small>}
              </span>
            ) : withUnits(o.label, pend.prompt, state.resources) /* the engine's label, always: "+2 gold", never a bare "Gold" */}
          </button>
        );
      })}
    </div>
  );
}

/** Trade in two steps: give one of yours, then take one of theirs that's legal for it. */
/** One member in the trade picker. Defined once, outside the picker: a component made inside render is a new type
 *  every render, so React rebuilt every button on each table update (about every 2s, even idle) and a slow click
 *  landing mid-rebuild was lost. */
const TradeCard = memo(function TradeCard({ state, g, busy, onClick, extra }) {
  return (
    <button type="button" className="btn rich" style={{ '--c': cardColor(state, g.d) }} disabled={busy} onClick={onClick} data-option={extra}>
      <span className="rich-body">
        <b>{g.d.name}{g.uids.length > 1 && <span className="num"> ×{g.uids.length}</span>}{' '}<Follower n={g.d.f} className="star" />{g.o && <span className="from"> · {g.o.name}</span>}</b>
        <small><CardText text={g.d.text} /></small>
      </span>
    </button>
  );
});

function TradePicker({ state, pend, onPick, busy }) {
  const [give, setGive] = useState(null);
  const owner = uid => state.players.find(p => p.members.includes(uid));
  const group = (uids, withOwner) => {
    const out = new Map();
    for (const u of uids) {
      const d = cardDef(state, u);
      const o = withOwner ? owner(u) : null;
      const k = `${d.id}|${o ? o.id : ''}`;
      if (!out.has(k)) out.set(k, { k, d, o, uids: [] });
      out.get(k).uids.push(u);
    }
    return [...out.values()];
  };
  const mine = group([...new Set(pend.options.map(o => o.value[0]))], false);
  const chosen = give && mine.find(g => g.k === give);
  const theirs = chosen ? group([...new Set(pend.options.filter(o => chosen.uids.includes(o.value[0])).map(o => o.value[1]))], true) : [];
  const take = g => {
    const opt = pend.options.find(o => chosen.uids.includes(o.value[0]) && g.uids.includes(o.value[1]));
    if (opt) onPick(opt.id);
  };
  if (!chosen) {
    return (
      <div className="trade">
        <span className="step">1 · Give one of yours</span>
        <div className="opts">{mine.map(g => <TradeCard key={g.k} state={state} busy={busy} g={g} onClick={() => setGive(g.k)} extra={pend.options.find(o => g.uids.includes(o.value[0]))?.id} />)}</div>
      </div>
    );
  }
  return (
    <div className="trade">
      <span className="step">2 · Take one of theirs for your {chosen.d.name} <button type="button" className="btn ghost" onClick={() => setGive(null)}>Change</button></span>
      <div className="opts">
        {theirs.map(g => {
          const opt = pend.options.find(o => chosen.uids.includes(o.value[0]) && g.uids.includes(o.value[1]));
          return <TradeCard key={g.k} state={state} busy={busy} g={g} onClick={() => take(g)} extra={opt && opt.id} />;
        })}
      </div>
    </div>
  );
}

// One log line; member names in it open their cards. `table` stays the same object for a whole game (names, colors,
// costs don't change), so a line re-renders only when its text does.
const LogLine = memo(function LogLine({ table, text }) { return <div><NamedText state={table} text={text} /></div>; });
export function Log({ state }) {
  const sections = logSections(state);
  const table = useMemo(() => ({ seed: state.seed, quadrants: state.quadrants, resources: state.resources, cards: state.cards, players: state.players, shop: [] }), [state.seed, state.quadrants.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="log" aria-label="Game log">
      {sections.slice().reverse().map((s, k) => (
        <details key={s.title} open={k === 0}>
          <summary>{s.title}<small> · {s.lines.length}</small></summary>
          <div className="lines">{s.lines.map((l, j) => <LogLine key={j} table={table} text={plainLine(state.log, s.start + j)} />)}</div>
        </details>
      ))}
    </div>
  );
}

export function Handoff({ player, onReady }) {
  const box = useDialog(null);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={`${player.name}'s turn`}>
      <div className="dialog handoff" style={{ '--pc': playerColor(player.id) }} ref={box}>
        <div className="big-dot" />
        <h2>{player.name}’s turn</h2>
        <p className="hint">Pass the device to {player.name}.</p>
        <button type="button" className="btn pri" data-autofocus autoFocus onClick={onReady} data-handoff>I’m {player.name} — go</button>
      </div>
    </div>
  );
}

export function Confirm({ title, text, yes, no = 'Stay', onYes, onNo }) {
  const box = useDialog(onNo);
  return (
    <div className="overlay top" role="alertdialog" aria-modal="true" aria-label={title} onClick={e => { if (e.target === e.currentTarget) onNo(); }}>
      <div className="dialog confirm" ref={box}>
        <h2>{title}</h2>
        {text && <p className="hint">{text}</p>}
        <div className="row-btns">
          <button type="button" className="btn" data-autofocus onClick={onNo}>{no}</button>
          <button type="button" className="btn pri" onClick={onYes} data-confirm>{yes}</button>
        </div>
      </div>
    </div>
  );
}

/** A small card anchored to an element (member chips on touch). */
export const sheetMode = () => typeof matchMedia === 'function' && (matchMedia('(pointer: coarse)').matches || matchMedia('(max-width: 520px)').matches);

export function Popover({ anchor, onClose, children, float = false }) {
  const box = useRef(null);
  const [pos, setPos] = useState(null);
  // float: a hover card stays beside what it explains, even on a narrow window (a sheet is for taps)
  const sheet = !float && sheetMode();
  useLayoutEffect(() => {
    if (!anchor) return;
    if (sheet) { setPos({}); return; }
    const a = anchor.getBoundingClientRect();
    const w = Math.min(280, innerWidth - 24);
    const left = Math.max(12, Math.min(innerWidth - w - 12, a.left + a.width / 2 - w / 2));
    const below = a.bottom + 8 + 120 < innerHeight;
    fitted.current = false;
    setPos({ left, width: w, top: below ? a.bottom + 8 : undefined, bottom: below ? undefined : innerHeight - a.top + 8 });
  }, [anchor]);
  // once it's drawn, a card that would run off the top or the bottom of the window slides back on (RC1 saboteur: a
  // member card from the bottom seats measured y=609–791 on a 700px window)
  const fitted = useRef(false);
  useLayoutEffect(() => {
    if (sheet || !pos || !box.current || fitted.current) return;
    fitted.current = true;
    const b = box.current.getBoundingClientRect();
    const top = Math.max(8, Math.min(b.top, innerHeight - 8 - b.height));
    if (Math.abs(top - b.top) > 0.5) setPos(p => ({ ...p, top, bottom: undefined }));
  }, [pos]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const close = e => { if (box.current && !box.current.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) onClose(); };
    const key = e => { if (e.key === 'Escape') onClose(); };
    const scroll = () => { if (!sheet) onClose(); };
    addEventListener('pointerdown', close, true);
    addEventListener('keydown', key);
    addEventListener('scroll', scroll, true);
    return () => { removeEventListener('pointerdown', close, true); removeEventListener('keydown', key); removeEventListener('scroll', scroll, true); };
  }, [anchor, onClose]);
  if (!pos) return null;
  // drawn at the page's top level, so no strip, zoomed chair or clipped box around its anchor can cover or shift it
  const out = node => (typeof document !== 'undefined' ? createPortal(node, document.body) : node);
  if (sheet) {
    // a sheet blocks the board until it's closed (the backdrop takes stray taps), and always has a Close
    return out(
      <>
        <div className="sheet-backdrop" onPointerDown={e => { e.preventDefault(); e.stopPropagation(); onClose(); }} />
        <div className="popover sheet-pop" ref={box} role="dialog">
          <button type="button" className="btn ghost sheet-close" onClick={onClose}>Close</button>
          {children}
        </div>
      </>,
    );
  }
  return out(<div className="popover" ref={box} role="dialog" style={pos}>{children}</div>);
}

/** A member card face: color band, sphere glyph, name, worth, ability and list cost. */
export function CardFace({ state, uid }) {
  // one card face everywhere: color (or colorless), keywords, cost and owner (Info.jsx)
  return <MemberCard state={state} uid={uid} />;
}
