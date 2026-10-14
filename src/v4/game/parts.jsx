// Small game-screen pieces: the choice prompt, the log, the hot-seat handoff, a confirm dialog and a popover.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { quadrant, cardDef } from '../../engine/v4/index.js';
import { logSections, playerColor, costParts, plainLine } from '../format.js';

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

/** What a choice option is about: the member's effect and ★ when it names a card. */
function optionDetail(state, o) {
  const cardOf = uid => (state.cards && state.cards[uid] ? cardDef(state, uid) : null);
  if ((o.kind === 'card' || o.kind === 'member') && typeof o.value === 'number') {
    const d = cardOf(o.value);
    if (d) {
      const cost = costParts(d).map(c => `${c.n} ${c.color}`).join(' + ') || 'free';
      return { name: d.name, text: d.text, f: d.f, color: d.quadrant, id: d.id, cost: o.kind === 'card' ? cost : null };
    }
  }
  if (o.kind === 'trade' && Array.isArray(o.value)) {
    const [a, b] = o.value.map(cardOf);
    if (a && b) return { name: o.label, text: `Give ${a.name} (${a.f}★) · get ${b.name} (${b.f}★): ${b.text}`, f: null, color: b.quadrant };
  }
  return null;
}

/** "P4 (34)" from an engine label reads as "P4 · 34 gold" when the question is about gold. */
function withUnits(label, prompt) {
  const m = label.match(/^(.*) \((\d+)\)$/);
  if (!m) return label;
  const unit = (prompt.match(/\b(gold|red|blue|green)\b/i) || [])[1];
  return `${m[1]} · ${m[2]}${unit ? ` ${unit.toLowerCase()}` : ''}`;
}

export function ChoicePrompt({ state, onPick, busy }) {
  const pend = state.pending;
  const setup = pend.kind === 'setup';
  const box = useRef(null);
  useEffect(() => {
    const b = box.current && box.current.querySelector('button:not([disabled])');
    if (b) b.focus({ preventScroll: true });
  }, [pend]);
  const trade = pend.options.length > 0 && pend.options.every(o => o.kind === 'trade');
  const [settled, setSettled] = useState(false);
  useEffect(() => { setSettled(false); const t = setTimeout(() => setSettled(true), 320); return () => clearTimeout(t); }, [pend]);
  // On touch the sheet slides up; a tap that lands mid-slide could hit the wrong row, so wait until it has settled.
  const pick = (id, mode) => { if (settled || !sheetMode()) onPick(id, mode); };
  return (
    <section className={`prompt choice${setup ? ' setup' : ''}`} aria-live="polite" ref={box} role="group" aria-label={setup ? 'Pick a starting resource' : pend.prompt}>
      <p>{setup ? `Pick a starting resource${(pend.prompt.match(/\((\d) of 2\)/) || [])[1] ? ` (${pend.prompt.match(/\((\d) of 2\)/)[1]} of 2)` : ''}` : pend.prompt}</p>
      {setup ? <SetupTokens state={state} pend={pend} onPick={pick} busy={busy} />
        : trade ? <TradePicker state={state} pend={pend} onPick={pick} busy={busy} />
          : <MergedOptions state={state} pend={pend} onPick={pick} busy={busy} />}
      {!setup && !trade && pend.options.length === 1 && /\((\d+) left\)/.test(pend.prompt) && (
        <button type="button" className="btn pri take-all" onClick={() => pick(pend.options[0].id, 'all')}>
          {`Take all ${pend.prompt.match(/\((\d+) left\)/)[1]} from ${withUnits(pend.options[0].label, pend.prompt).split(' · ')[0]}`}
        </button>
      )}
    </section>
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
            <i className="coin-big"><span className="num">+1</span></i>
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
        const q = color && state.quadrants.includes(color) ? quadrant(color) : null;
        return (
          <button
            key={key} type="button" className={`btn${color ? ' color' : ''}${det ? ' rich' : ''}`} data-option={o.id} disabled={busy}
            style={color ? { '--c': `var(--${color})` } : det && det.color ? { '--c': `var(--${det.color})` } : undefined}
            onClick={() => onPick(o.id)}
          >
            {color && <i />}
            {det ? (
              <span className="rich-body">
                <b>{det.name}{n > 1 && <span className="num"> ×{n}</span>}{det.f != null && <span className="num star"> {det.f}★</span>}</b>
                <small>{det.text}</small>
                {det.cost && <small className="cost-line">Costs <span className="num">{det.cost}</span></small>}
              </span>
            ) : (q ? q.name : withUnits(o.label, pend.prompt))}
          </button>
        );
      })}
    </div>
  );
}

/** Trade in two steps: give one of yours, then take one of theirs that's legal for it. */
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
  const Card = ({ g, onClick, extra }) => (
    <button type="button" className="btn rich" style={{ '--c': `var(--${g.d.quadrant})` }} disabled={busy} onClick={onClick} data-option={extra}>
      <span className="rich-body">
        <b>{g.d.name}{g.uids.length > 1 && <span className="num"> ×{g.uids.length}</span>}<span className="num star"> {g.d.f}★</span>{g.o && <span className="from"> · {g.o.name}</span>}</b>
        <small>{g.d.text}</small>
      </span>
    </button>
  );
  if (!chosen) {
    return (
      <div className="trade">
        <span className="step">1 · Give one of yours</span>
        <div className="opts">{mine.map(g => <Card key={g.k} g={g} onClick={() => setGive(g.k)} extra={pend.options.find(o => g.uids.includes(o.value[0]))?.id} />)}</div>
      </div>
    );
  }
  return (
    <div className="trade">
      <span className="step">2 · Take one of theirs for your {chosen.d.name} <button type="button" className="btn ghost" onClick={() => setGive(null)}>Change</button></span>
      <div className="opts">
        {theirs.map(g => {
          const opt = pend.options.find(o => chosen.uids.includes(o.value[0]) && g.uids.includes(o.value[1]));
          return <Card key={g.k} g={g} onClick={() => take(g)} extra={opt && opt.id} />;
        })}
      </div>
    </div>
  );
}

export function Log({ state }) {
  const sections = logSections(state);
  return (
    <div className="log" aria-label="Game log">
      {sections.slice().reverse().map((s, k) => (
        <details key={s.title} open={k === 0}>
          <summary>{s.title}<small> · {s.lines.length}</small></summary>
          <div className="lines">{s.lines.map((l, j) => <div key={j}>{plainLine(state.log, s.start + j)}</div>)}</div>
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
        <button type="button" className="btn pri" data-autofocus onClick={onReady} data-handoff>I’m {player.name} — go</button>
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

export function Popover({ anchor, onClose, children }) {
  const box = useRef(null);
  const [pos, setPos] = useState(null);
  const sheet = sheetMode();
  useLayoutEffect(() => {
    if (!anchor) return;
    if (sheet) { setPos({}); return; }
    const a = anchor.getBoundingClientRect();
    const w = Math.min(280, innerWidth - 24);
    const left = Math.max(12, Math.min(innerWidth - w - 12, a.left + a.width / 2 - w / 2));
    const below = a.bottom + 8 + 120 < innerHeight;
    setPos({ left, width: w, top: below ? a.bottom + 8 : undefined, bottom: below ? undefined : innerHeight - a.top + 8 });
  }, [anchor]);
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
  if (sheet) return <div className="popover sheet-pop" ref={box} role="dialog">{children}</div>;
  return <div className="popover" ref={box} role="dialog" style={pos}>{children}</div>;
}
