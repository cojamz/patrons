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
import { holdFlag } from './bodyFlag.js';

const MAX = 6;
/** The words the board prints on a space ("+3 gold, +1 to anyone"), for this round: the panel's own lines. */
const words = (state, key) => {
  if (!key) return '';
  try { const [q, i] = key.split('-').map(Number); const qid = state.quadrants[q]; return panelWords(qid, quadrant(qid).actions[i], Math.max(1, state.round)) || ''; } catch { return ''; }
};

/** One placement's full card (the same lines as the turn card by the cult), its names hover targets. */
export function StoryCard({ story, color, state, hover }) {
  // open in a tip: body[data-since-tip] (since.css), in place of a body:has() that re-styled the whole page
  const ref = useRef(null);
  useLayoutEffect(() => (ref.current && ref.current.closest('.tip-body') ? holdFlag(document.body, 'sinceTip') : undefined), []);
  return (
    <div ref={ref} className="since-card" data-since-card style={{ '--pc': color }}>
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
  // of showing part of a line at the top. The fold is worked out in one step from where the lines stand (the list stacks
  // from its foot, so dropping the oldest leaves the rest where they are), and lines that won't stay are hidden before the
  // frame paints, so no part of a line is ever drawn. Nothing here sizes the strip: its room is set by the layout from the
  // chairs and the turn card, never by these lines, so measuring can't feed back (the TurnCard lesson, 2026-10-15).
  const listRef = useRef(null), secRef = useRef(null);
  // The strip's room changes without resizing anything the ResizeObserver watches when the turn card comes or goes
  // (layout.css [data-turn-card]), when the card's height or the chairs' end moves (--turn-h, --seats-end, on the strip)
  // or the window resizes. Any of these starts the fold over, so a strip with more room shows more lines again. Watched on
  // the DOM, where the layout reads them; the strip writes none of them, so this can't feed back.
  const [roomKey, setRoomKey] = useState(0);
  useEffect(() => {
    const host = secRef.current && secRef.current.parentElement;
    if (!host || typeof MutationObserver !== 'function') return undefined;
    // (--turn-h and --seats-end are written on the strip itself, their only reader: perf, 2026-10-15)
    const sec = secRef.current;
    const room = () => `${!!host.querySelector(':scope > .turn-card')}|${sec.style.getPropertyValue('--turn-h')}|${sec.style.getPropertyValue('--seats-end')}|${innerWidth}x${innerHeight}`;
    let was = room();
    const check = () => { const now = room(); if (now !== was) { was = now; setRoomKey(k => k + 1); } };
    const mo = new MutationObserver(check);
    mo.observe(host, { childList: true });
    mo.observe(sec, { attributes: true, attributeFilter: ['style'] });
    addEventListener('resize', check);
    return () => { mo.disconnect(); removeEventListener('resize', check); };
  }, []);
  const sig = `${entries.map(e => e.n).join(',')}|${roomKey}`;
  // how many of the oldest lines are folded, for these lines in this room: anything new starts it over at 0 (worked out
  // here, not by a second commit)
  const [dropState, setDrop] = useState({ sig: '', n: 0, bare: false });
  const drop = dropState.sig === sig ? dropState.n : 0;
  // too little room for even the newest line and the "N earlier" line: the newest shows alone, whole (the Log button
  // above still opens the rest)
  const bare = dropState.sig === sig && dropState.bare;
  // and when even the newest line doesn't fit whole on its two lines, it sets on one (1); if not even that, the strip
  // shows only its header and the count (2): a cut line never shows (wave 4: the chairs' figures grew to 40px)
  const lvl = dropState.sig === sig ? (dropState.lvl || 0) : 0;
  const base = entries.slice(-MAX);
  const cut = Math.min(drop, Math.max(0, base.length - 1));
  // Checked when the layout has settled, from a ResizeObserver on the list and its own lines (perf, 2026-10-15: reading
  // the computed style and scrollHeight in a layout effect forced a page layout every step). A ResizeObserver runs after
  // layout and before paint, so the lines it hides are never drawn in part.
  const committed = useRef({ sig, cut, len: base.length, lvl });
  const asked = useRef(null); // the fold the observer asked for and hid lines for, until React draws it
  const ro = useRef(null), watched = useRef(new Set());
  // the list and each line on it are watched (observing is not a layout read; a newly watched line reports once)
  useLayoutEffect(() => {
    const was = committed.current.sig;
    committed.current = { sig, cut, len: base.length, lvl };
    // the fold asked for is drawn (or these are new lines, or a new room): lines hidden while it was on its way show again
    const l = listRef.current;
    if (asked.current && (asked.current.sig !== sig || (cut >= asked.current.n && (bare || !asked.current.bare) && lvl >= (asked.current.lvl || 0)))) {
      asked.current = null;
      if (l) for (const el of l.querySelectorAll(':scope > [data-fold-hide]')) { el.removeAttribute('data-fold-hide'); el.style.visibility = ''; }
    }
    // new lines or a new room: measure again before this frame paints, even when nothing the observer watches changed
    // size (the same lines in a room that moved: a fold asked for the old room was dropped above). A list watched anew
    // reports once.
    if (was !== sig && l && ro.current && watched.current.has(l)) { ro.current.unobserve(l); ro.current.observe(l); }
    if (typeof ResizeObserver !== 'function') return;
    if (!ro.current) {
      ro.current = new ResizeObserver(() => {
        const list = listRef.current;
        if (!list) return;
        const { sig: s0, cut: c0, len, lvl: l0 } = committed.current;
        if (l0 >= 2) return;
        const kids = [...list.children];
        const moreEl = kids[0] && kids[0].classList.contains('since-more') ? kids[0] : null;
        const rows = moreEl ? kids.slice(1) : kids;
        if (!rows.length) return;
        // in a ResizeObserver callback the layout is settled, so these reads are free
        const top = list.getBoundingClientRect().top;
        const gap = parseFloat(getComputedStyle(list).rowGap) || 0;
        // the "N earlier" line's height when it stands above the kept lines (its own, or a one-line guess before it exists)
        const moreH = (moreEl ? moreEl.getBoundingClientRect().height : 18) + gap;
        const fits = k => rows[k].getBoundingClientRect().top - (c0 + k > 0 ? moreH : 0) >= top - 1;
        let k = 0;
        while (k < rows.length - 1 && !fits(k)) k++;
        // the newest line fits, but not with the "earlier" line above it; or it doesn't fit even alone (a level down)
        const alone = rows[k].getBoundingClientRect().top >= top - 1;
        const bareNow = c0 + k > 0 && !fits(k);
        // a line shows whole or not at all, never cut mid-word (blind panel: "took your Tax…"): a newest line too tall
        // for the room first drops the space's board words in brackets (its name still opens its card), which changes
        // its size so this runs again; if it still doesn't fit, or had none to drop, the strip shows only the count
        // rival turns since yours are the strip's whole point (panel r3: the fold hid three of them): before any line
        // folds into "N earlier", every line drops its board words in brackets, and the fold is measured again
        if (l0 === 0 && k > 0 && rows.some(r => r.querySelector('.sp-words'))) {
          for (const el of rows.slice(0, k)) { el.setAttribute('data-fold-hide', ''); el.style.visibility = 'hidden'; }
          asked.current = { sig: s0, n: c0, bare: false, lvl: 1 };
          setDrop(d => (d.sig === s0 && (d.lvl || 0) >= 1 ? d : { sig: s0, n: c0, bare: false, lvl: 1 }));
          return;
        }
        const brief = l0 === 0 && !!rows[k].querySelector('.sp-words');
        const lvlNow = !fits(k) && !alone ? (brief ? 1 : 2) : l0;
        if ((!k && !bareNow && lvlNow === l0) || c0 + k > len - 1) return;
        const n = c0 + k;
        // hide what goes (and the "earlier" line, which moves down when React draws the fold; and the newest, when it
        // sets smaller) before this frame paints
        for (const el of [...(moreEl ? [moreEl] : []), ...rows.slice(0, lvlNow > l0 ? k + 1 : k)]) { el.setAttribute('data-fold-hide', ''); el.style.visibility = 'hidden'; }
        asked.current = { sig: s0, n, bare: bareNow, lvl: lvlNow };
        setDrop(d => (d.sig === s0 && d.n >= n && (d.bare || !bareNow) && (d.lvl || 0) >= lvlNow ? d : { sig: s0, n, bare: bareNow || (d.sig === s0 && d.bare), lvl: lvlNow }));
      });
    }
    const r = ro.current, w = watched.current;
    for (const el of [...w]) if (!el.isConnected) { r.unobserve(el); w.delete(el); }
    if (!l) return;
    for (const el of [l, ...l.children]) if (!w.has(el)) { r.observe(el); w.add(el); }
  });
  useEffect(() => () => { if (ro.current) ro.current.disconnect(); ro.current = null; watched.current.clear(); }, []);
  const shown = base.slice(cut);
  const more = entries.length - shown.length;
  const name = id => (id === me ? 'You' : state.players[id].name);
  // a tap anywhere on a line that isn't a name pins its card (the name's own tap opens the name's card)
  const pinLine = e => { const t = e.currentTarget.querySelector('[data-since-line]'); if (t && !e.target.closest('[data-hover-name], [data-since-line]')) t.click(); };
  // nothing to tell (before your first turn, or your second turn in a row): the strip says nothing at all, only the Log
  // stays (blind panel: "No moves since yours yet." narrated nothing)
  const empty = !entries.length;
  return (
    <section ref={secRef} className={`lt-since${yours ? ' yours' : ''}${empty ? ' empty' : ''}`} data-since data-empty={empty || undefined} data-folded={cut || undefined} aria-label="Since your last turn">
      <header className="since-head">
        {!empty && <span className="since-title">Since your last turn</span>}
        {/* the newest line alone: the earlier ones are counted up here, beside the Log, taking no line of their own */}
        {(bare || lvl >= 2) && more + (lvl >= 2 ? shown.length : 0) > 0 && (
          <button type="button" className="since-more in-head" onClick={onLog} title="Open the log">{lvl >= 2 ? `${more + shown.length} ${more + shown.length === 1 ? 'move' : 'moves'}` : `${more} earlier`}</button>
        )}
        <button type="button" className="since-log" data-open-log onClick={onLog} title="The whole game, move by move">Log</button>
      </header>
      {shown.length ? (
        <ol className="since-list" ref={listRef}>
          {more > 0 && !bare && <li className="since-more"><button type="button" onClick={onLog}>{more} earlier… open the log</button></li>}
          {shown.map(e => (
            <li key={e.n} className={`since-row${e.hit ? ' hit' : ''}${lvl === 1 ? ' brief' : ''}`} hidden={lvl >= 2 || undefined} style={{ '--pc': playerColor(e.actor) }} onClick={pinLine}>
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
      ) : null}
    </section>
  );
}
