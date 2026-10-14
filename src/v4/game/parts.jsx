// Small game-screen pieces: the choice prompt, the log, the hot-seat handoff, a confirm dialog and a popover.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { quadrant, cardDef } from '../../engine/v4/index.js';
import { logSections, playerColor } from '../format.js';

/** Escape closes; focus moves in on open and back to where it was on close. */
export function useDialog(onClose) {
  const box = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const back = document.activeElement;
    const first = box.current && box.current.querySelector('[autofocus], [data-autofocus], button:not([disabled]), [href], input');
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
    if (d) return { name: d.name, text: d.text, f: d.f, color: d.quadrant };
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
  return (
    <section className="prompt choice" aria-live="polite" ref={box} role="group" aria-label={setup ? 'Pick a starting resource' : pend.prompt}>
      <p>{setup ? 'Pick a starting resource' : pend.prompt}</p>
      <div className="opts">
        {pend.options.map(o => {
          const color = setup || o.kind === 'color' ? o.value : null;
          const q = color && state.quadrants.includes(color) ? quadrant(color) : null;
          const det = optionDetail(state, o);
          return (
            <button
              key={o.id} type="button" className={`btn${color ? ' color' : ''}${det ? ' rich' : ''}`} data-option={o.id} disabled={busy}
              style={color ? { '--c': `var(--${color})` } : det && det.color ? { '--c': `var(--${det.color})` } : undefined}
              onClick={() => onPick(o.id)}
            >
              {color && <i />}
              {det ? (
                <span className="rich-body">
                  <b>{det.name}{det.f != null && <span className="num star"> {det.f}★</span>}</b>
                  <small>{det.text}</small>
                </span>
              ) : (q ? q.name : withUnits(o.label, pend.prompt))}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function Log({ state }) {
  const sections = logSections(state);
  return (
    <div className="log" aria-label="Game log">
      {sections.slice().reverse().map((s, k) => (
        <details key={s.title} open={k === 0}>
          <summary>{s.title}<small> · {s.lines.length}</small></summary>
          <div className="lines">{s.lines.slice().reverse().map((l, j) => <div key={j}>{l}</div>)}</div>
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
export function Popover({ anchor, onClose, children }) {
  const box = useRef(null);
  const [pos, setPos] = useState(null);
  useLayoutEffect(() => {
    if (!anchor) return;
    const a = anchor.getBoundingClientRect();
    const w = Math.min(280, innerWidth - 24);
    const left = Math.max(12, Math.min(innerWidth - w - 12, a.left + a.width / 2 - w / 2));
    const below = a.bottom + 8 + 120 < innerHeight;
    setPos({ left, width: w, top: below ? a.bottom + 8 : undefined, bottom: below ? undefined : innerHeight - a.top + 8 });
  }, [anchor]);
  useEffect(() => {
    const close = e => { if (box.current && !box.current.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) onClose(); };
    const key = e => { if (e.key === 'Escape') onClose(); };
    const scroll = () => onClose();
    addEventListener('pointerdown', close, true);
    addEventListener('keydown', key);
    addEventListener('scroll', scroll, true);
    return () => { removeEventListener('pointerdown', close, true); removeEventListener('keydown', key); removeEventListener('scroll', scroll, true); };
  }, [anchor, onClose]);
  if (!pos) return null;
  return <div className="popover" ref={box} role="dialog" style={pos}>{children}</div>;
}
