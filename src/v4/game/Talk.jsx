// Table talk (Cory, 2026-10-28 playtest: "there needs to be ability to emote or a chat to shittalk"): a Say button beside the
// menu opens a small card of quick lines and a box to type in; Enter anywhere on the board opens it ready to type. What
// anyone says pops up as a speech bubble beside their seat for a few seconds and stays in the log.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { QUICK_LINES, TALK_MAX } from '../session/talk.js';
import './talk.css';

const BUBBLE_MS = 4200;
const NO_TALK = [];

/** Every line said at this table (oldest first) and the newest one, re-rendered as lines arrive. */
export function useTalk(session) {
  const [talk, setTalk] = useState(() => (session.talk ? [...session.talk] : NO_TALK));
  useEffect(() => {
    if (!session.onTalk) return undefined;
    setTalk([...session.talk]);
    return session.onTalk(() => setTalk([...session.talk]));
  }, [session]);
  return talk;
}

/** The newest line from this seat, while it's fresh: a bubble beside the seat. */
export function TalkBubble({ talk, pid }) {
  const last = findLast(talk, t => t.seat === pid);
  const [gone, setGone] = useState(null);
  const born = useRef(new Map()); // id -> when this screen first saw it (a rejoin's old lines never pop)
  const first = useRef(true);
  if (last && !born.current.has(last.id)) born.current.set(last.id, first.current ? 0 : performance.now());
  first.current = false;
  const fresh = last && born.current.get(last.id) > 0 && gone !== last.id;
  useEffect(() => {
    if (!fresh) return undefined;
    const t = setTimeout(() => setGone(last.id), BUBBLE_MS);
    return () => clearTimeout(t);
  }, [fresh, last?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!fresh) return null;
  return <div key={last.id} className="seat-say" role="status" data-say-seat={pid}>{last.text}</div>;
}

/** The Say card: quick lines (one click says it) and a box to type in (focused, so Enter, type, Enter says it). */
export function TalkPicker({ onSay, onClose, anchor }) {
  const box = useRef(null);
  const input = useRef(null);
  const [text, setText] = useState('');
  const [at, setAt] = useState(null);
  useLayoutEffect(() => {
    const r = anchor?.getBoundingClientRect?.();
    if (r) setAt({ left: Math.max(8, r.right - 300), top: r.bottom + 8 });
  }, [anchor]);
  // the box is ready to type in at once; a click on a line says it instead
  useEffect(() => { if (at) input.current?.focus(); }, [!!at]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const away = e => { if (box.current && !box.current.contains(e.target) && !anchor?.contains?.(e.target)) onClose(); };
    const key = e => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    addEventListener('pointerdown', away, true);
    addEventListener('keydown', key, true);
    return () => { removeEventListener('pointerdown', away, true); removeEventListener('keydown', key, true); };
  }, [onClose, anchor]);
  const say = t => { if (onSay(t)) onClose(); };
  return (
    <div ref={box} className="talk-card" role="dialog" aria-label="Say something" data-talk style={at ? { left: at.left, top: at.top } : { visibility: 'hidden' }}>
      <div className="talk-lines">
        {QUICK_LINES.map(l => <button key={l} type="button" className="talk-line" data-talk-line={l} onClick={() => say(l)}>{l}</button>)}
      </div>
      <form className="talk-type" onSubmit={e => { e.preventDefault(); say(text); }}>
        <input ref={input} type="text" value={text} maxLength={TALK_MAX} placeholder="Say something" aria-label="Say something"
          onChange={e => setText(e.target.value)} onKeyDown={e => e.stopPropagation()} data-talk-input />
      </form>
    </div>
  );
}

/** Enter on the board (not in a box, no card open) opens the Say card ready to type. */
export function useEnterToTalk(open, enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    const key = e => {
      if (e.key !== 'Enter' || e.defaultPrevented || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target;
      if (t && t.closest?.('input, textarea, select, [role="dialog"], [contenteditable="true"]')) return;
      if (t && t.closest?.('button, a, [role="button"], [tabindex]')) return; // Enter works a focused control (Say included)
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      e.preventDefault();
      open();
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [open, enabled]);
}

function findLast(list, fn) {
  for (let i = list.length - 1; i >= 0; i--) if (fn(list[i])) return list[i];
  return null;
}
