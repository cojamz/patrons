// "Since your last turn": one short line per rival placement since your own last one, always on the board (RC1 panel:
// bot turns blurred past, "why does P4 suddenly have five gold?"). The player's name opens that placement's full card
// on hover (a tap on the line pins it); every space and member named opens its own card, like on the board. The whole
// log is one tap away (the Log button), not buried in the menu. Self-contained: the layout places the box.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playerColor, seatEmoji } from '../format.js';
import { Minion } from '../art/Leader.jsx';
import { Tip } from './Info.jsx';
import { HoverName, HoverNames } from './HoverNames.jsx';
import { Rich } from './Rich.jsx';
import { quadrant } from '../../engine/v4/index.js';
import { panelWords } from './panelText.js';
import './since.css';

const MAX = 6;
/** The words the board prints on a space ("+3 gold, +1 to anyone"), for this round: the panel's own lines. */
const words = (state, key) => {
  if (!key) return '';
  try { const [q, i] = key.split('-').map(Number); const qid = state.quadrants[q]; return panelWords(qid, quadrant(qid).actions[i], Math.max(1, state.round)) || ''; } catch { return ''; }
};

/** One placement's full card (the same lines as the turn card by the cult), its names hover targets. */
export function StoryCard({ story, color, state, hover }) {
  return (
    <div className="since-card" data-since-card style={{ '--pc': color }}>
      <b className="sc-head"><HoverNames state={state} hover={hover} text={story.head} uids={story.uids} /></b>
      {story.lines.length ? story.lines.map((l, k) => <span key={`${k}:${l}`} className="sc-line"><HoverNames state={state} hover={hover} text={l} uids={story.uids} /></span>)
        : <span className="sc-line quiet">Nothing else changed.</span>}
    </div>
  );
}

/**
 * props: state, entries (stories, oldest first: { actor, head, space, spaceKey, short, lines, uids, hit, n }), me (your
 * id or null), yours (it's your move now), hover (the board's hover layer), onLog (opens the full log).
 */
export default function SinceStrip({ state, entries, me, yours, hover = null, onLog }) {
  // whole lines only (design pod): when the strip's room can't hold every line, the oldest go into "N earlier…" instead
  // of showing half a line at the top. `drop` only grows while the list overflows; it starts over when the lines change or
  // the strip's room (its max-height, set by the layout from the chairs and the turn card, never by these lines) grows.
  // Nothing here sizes the strip, so measuring it can't feed back (the TurnCard lesson, 2026-10-15).
  const listRef = useRef(null), secRef = useRef(null), roomRef = useRef(0);
  // The turn card coming or going changes the strip's room (layout.css :has(> .turn-card)) without resizing anything the
  // ResizeObserver watches: when a card is drawn or leaves the table, the fold starts over. Watched on the DOM, where the
  // layout reads it (the card is drawn after the animation chain, not when its state changes). The strip never adds or
  // removes a card, so this can't feed back.
  const [cardKey, setCardKey] = useState(0);
  useEffect(() => {
    const host = secRef.current && secRef.current.parentElement;
    if (!host || typeof MutationObserver !== 'function') return undefined;
    let had = !!host.querySelector(':scope > .turn-card');
    const mo = new MutationObserver(() => { const has = !!host.querySelector(':scope > .turn-card'); if (has !== had) { had = has; setCardKey(k => k + 1); } });
    mo.observe(host, { childList: true });
    return () => mo.disconnect();
  }, []);
  const sig = `${entries.map(e => e.n).join(',')}|${cardKey}`;
  // how many of the oldest lines are folded, for these lines: new lines start it over at 0 (worked out here, not by a
  // second commit)
  const [dropState, setDrop] = useState({ sig: '', n: 0 });
  const drop = dropState.sig === sig ? dropState.n : 0;
  const base = entries.slice(-MAX);
  const cut = Math.min(drop, Math.max(0, base.length - 1));
  // Overflow is checked when the layout has settled, from a ResizeObserver on the list and its own lines (perf,
  // 2026-10-15: reading the computed style and scrollHeight in a layout effect forced a page layout every step). The
  // check only folds lines: it never sets anything the strip's room depends on, and the room's growth is read from its
  // max-height (set by the layout), never from a size this changes.
  const live = useRef({ sig, len: base.length });
  live.current = { sig, len: base.length };
  const ro = useRef(null), watched = useRef(new Set());
  // the list and each line on it are watched (observing is not a layout read; a newly watched line reports once)
  useLayoutEffect(() => {
    if (typeof ResizeObserver !== 'function') return;
    if (!ro.current) {
      ro.current = new ResizeObserver(() => {
        const sec = secRef.current, l = listRef.current;
        if (!sec || !l) return;
        const { sig: s0, len } = live.current;
        const room = parseFloat(getComputedStyle(sec).maxHeight) || 1e6;
        if (room > roomRef.current + 1 && roomRef.current) { roomRef.current = room; setDrop(d => (d.sig === s0 && d.n ? { sig: s0, n: 0 } : d)); return; }
        roomRef.current = room;
        // (the list stacks from its foot: lines that don't fit spill above its top, where scrollHeight can't see them;
        // design pod 08:50) — in a ResizeObserver callback the layout is settled, so these reads are free
        const first = l.firstElementChild;
        // one more line at a time, and only once the last fold is on screen (several callbacks can land before React
        // commits a fold: each would fold another line and leave the strip half empty)
        if (first && first.getBoundingClientRect().top < l.getBoundingClientRect().top - 1) setDrop(d => { const n = d.sig === s0 ? d.n : 0; return n < len - 1 && n === onScreen.current ? { sig: s0, n: n + 1 } : d; });
      });
    }
    const r = ro.current, l = listRef.current, w = watched.current;
    for (const el of [...w]) if (!el.isConnected) { r.unobserve(el); w.delete(el); }
    if (!l) return;
    for (const el of [l, ...l.children]) if (!w.has(el)) { r.observe(el); w.add(el); }
  });
  useEffect(() => () => { if (ro.current) ro.current.disconnect(); ro.current = null; watched.current.clear(); }, []);
  const onScreen = useRef(0); // the fold the DOM shows now
  useLayoutEffect(() => { onScreen.current = cut; });
  const shown = base.slice(cut);
  const more = entries.length - shown.length;
  const name = id => (id === me ? 'You' : state.players[id].name);
  // a tap anywhere on a line that isn't a name pins its card (the name's own tap opens the name's card)
  const pinLine = e => { const t = e.currentTarget.querySelector('[data-since-line]'); if (t && !e.target.closest('[data-hover-name], [data-since-line]')) t.click(); };
  return (
    <section ref={secRef} className={`lt-since${yours ? ' yours' : ''}`} data-since data-folded={cut || undefined} aria-label="Since your last turn">
      <header className="since-head">
        <span className="since-title">Since your last turn</span>
        <button type="button" className="since-log" data-open-log onClick={onLog} title="The whole game, move by move">Log</button>
      </header>
      {shown.length ? (
        <ol className="since-list" ref={listRef}>
          {more > 0 && <li className="since-more"><button type="button" onClick={onLog}>{more} earlier… open the log</button></li>}
          {shown.map(e => (
            <li key={e.n} className={`since-row${e.hit ? ' hit' : ''}`} style={{ '--pc': playerColor(e.actor) }} onClick={pinLine}>
              <Tip className="since-line" data-since-line={e.n} label={`${e.head}: show what happened`}
                content={() => <StoryCard story={e} color={playerColor(e.actor)} state={state} hover={hover} />}>
                <Minion color={playerColor(e.actor)} emoji={seatEmoji(state, e.actor)} size={14} /><b className="who">{name(e.actor)}</b>
              </Tip>{' '}
              {e.spaceKey && hover ? <HoverName hover={hover} target={{ kind: 'space', key: e.spaceKey }}><span className="sp">{e.space}</span></HoverName>
                : <span className="sp">{e.space || 'turn'}</span>}
              {/* the space's own words from the board, so the name needs no lookup */}
              {words(state, e.spaceKey) ? <span className="sp-words"> (<Rich text={words(state, e.spaceKey)} />)</span> : null}
              {e.short ? <span className="big">: <HoverNames state={state} hover={hover} text={e.short} uids={e.uids} /></span> : null}
            </li>
          ))}
        </ol>
      ) : <p className="since-none">{state.round >= 1 ? 'No moves since yours yet.' : 'Moves will show here.'}</p>}
    </section>
  );
}
