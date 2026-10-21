// The member deck at the head of the shop strip (Cory): a face-down stack of card backs with the cult mark and the
// count big on it, thinner as it empties, warm when low (≤ 10), an outline "empty" at 0. No hover (Cory, 2026-10-15:
// "the deck doesn't need a hover"): the count is the whole story. It sits in its own slot at the head of the strip, so
// a pile for released members can stand beside it later. (DeckCard, what's in it by color, stays for that day.)
// When the face-up row refills, each new card comes off the deck: a short flip at the deck, then a slide into its slot.
// Every number is the engine's: state.pile (top first; core.js refill() takes from the top, release() and
// buryFromShop() push to the bottom).
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DeckBrowser from './DeckBrowser.jsx';
import { cardDef, quadrant } from '../../engine/v4/index.js';
import Tick from './Tick.jsx';
import { CultMark } from '../art/CultMark.jsx';
import { onTable } from './Info.jsx';
import { ResourceGlyph } from './Glyphs.jsx';
import { motionOK } from './flight.js';
import { MO } from '../motion.js';
import { dealAfter } from './director.js';

/** At or below this many cards the count warms. */
export const DECK_LOW = 10;

/** The deck by color: every color on the table (in table order), then colorless (members of spheres not on it). */
export function deckColors(state) {
  const rows = state.quadrants.map(qid => ({ key: qid, name: quadrant(qid).name, res: quadrant(qid).resource, n: 0 }));
  const colorless = { key: 'colorless', name: 'Colorless', res: null, n: 0 };
  for (const uid of state.pile) {
    const d = cardDef(state, uid);
    const row = onTable(state, d) ? rows.find(r => r.key === d.quadrant) : null;
    (row || colorless).n++;
  }
  return [...rows, colorless];
}

/** Offset edges under the top card: the pile gets thinner as it empties. */
export const deckEdges = n => (n >= 30 ? 3 : n >= 12 ? 2 : n >= 4 ? 1 : 0);

export function MemberDeck({ state, deckRef = null }) {
  const [browsing, setBrowsing] = useState(false);
  const n = state.pile.length;
  const edges = deckEdges(n);
  const label = n ? `${n} member${n === 1 ? '' : 's'} left in the deck` : 'The deck is empty';
  return (
    <>
    <button type="button" onClick={() => setBrowsing(true)}
      ref={deckRef} data-deck="" data-left={n} aria-haspopup="dialog"
      className={`lt-deck${n === 0 ? ' empty' : n <= 3 ? ' low last' : n <= DECK_LOW ? ' low' : ''}`}
      aria-label={`Browse member deck: ${label}`}
    >
      {/* a pile, not a card (live panel r1: at member size in the first slot it read as a member to buy): smaller than a
          card, its edges showing, named underneath */}
      <span className="pile">
        {Array.from({ length: edges }, (_, k) => <span key={k} className="edge" style={{ '--k': edges - k }} aria-hidden="true" />)}
        <span className="back" aria-hidden="true">
          {n > 0 && <CultMark size={28} />}
          <span className="n num">{n > 0 ? <Tick value={n} float={false} /> : 'empty'}</span>
        </span>
      </span>
      {n > 0 && <span className="cap" aria-hidden="true">deck</span>}
    </button>
    {browsing && createPortal(<DeckBrowser state={state} onClose={() => setBrowsing(false)} />, document.body)}
    </>
  );
}

/** The deck's hover card: cards left, each color's count, and the rule for its bottom. */
export function DeckCard({ state }) {
  const n = state.pile.length;
  const rows = deckColors(state);
  return (
    <div className="lt-card-body lt-deck-card" data-deck-card="" data-left={n}>
      <div className="t">
        <span className="lt-deck-mini" aria-hidden="true"><CultMark size={32} /></span>
        <h4>Member deck<small><b className="num">{n}</b> card{n === 1 ? '' : 's'} left, face down</small></h4>
      </div>
      <ul className="lt-deck-colors">
        {rows.map(r => (
          <li key={r.key} data-color={r.key} data-n={r.n} className={r.n ? '' : 'none'}>
            {r.res ? <ResourceGlyph r={r.res} size={14} /> : <span className="lt-colorless-dot" role="img" aria-label="colorless" title="Members of no color" />}
            <span className="k">{r.name}</span><b className="num">{r.n}</b>
          </li>
        ))}
      </ul>
      <p>When a face-up member leaves, the next one comes off the top. Swept members go to the bottom. The market refreshes between rounds.</p>
    </div>
  );
}

/**
 * Deals the row: a card that wasn't face up a moment ago came off the top of the deck, so a picture of it flips there
 * and slides to its slot, and the real card shows once it lands. The real card never moves (its layout box stays in
 * its slot), so the table's own shop snapshot (GameScreen: recruited cards flying, the row sliding) stays true.
 * Only forward moves animate (never on the first paint, an undo or a new game); reduced motion: no motion.
 */
export function useDeal(rowRef, deckRef, state) {
  const prev = useRef(null);
  useLayoutEffect(() => {
    const was = prev.current;
    prev.current = { shop: state.shop.slice(), moves: state.moves, seed: state.seed };
    if (!was || was.seed !== state.seed || !(state.moves > was.moves) || !motionOK()) return;
    const row = rowRef.current, deck = deckRef.current;
    if (!row || !deck) return;
    const dealt = state.shop.filter(u => !was.shop.includes(u));
    if (!dealt.length) return;
    const top = deck.querySelector('.back') || deck;
    // every rect read first, then the writes (perf, 2026-10-15: a read after each ghost was appended laid the page out
    // again, once per dealt card)
    const a = top.getBoundingClientRect();
    if (!a.width) return;
    const cards = dealt.map(uid => { const el = row.querySelector(`.lt-card[data-uid="${uid}"]`); return el ? { el, b: el.getBoundingClientRect() } : null; });
    cards.forEach((c, k) => {
      if (!c) return;
      const { el, b } = c;
      if (!b.width) return;
      const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
      const s = `scale(${(a.width / b.width).toFixed(3)},${(a.height / b.height).toFixed(3)})`;
      const ghost = el.cloneNode(true);
      ghost.removeAttribute('data-option');
      ghost.removeAttribute('data-uid');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.setAttribute('tabindex', '-1');
      ghost.classList.add('lt-deal', 'ghost-layer');
      ghost.dataset.born = String(Date.now());
      Object.assign(ghost.style, { position: 'fixed', left: `${b.left}px`, top: `${b.top}px`, width: `${b.width}px`, height: `${b.height}px`, margin: '0', zIndex: '13', pointerEvents: 'none' });
      document.body.appendChild(ghost);
      const duration = MO.deal, delay = dealAfter(state) + k * MO.dealStagger; // after the bought card has left its slot (director.js)
      const anim = ghost.animate([
        { transform: `translate(${dx}px,${dy}px) ${s} perspective(500px) rotateY(88deg)` },
        { transform: `translate(${dx}px,${dy}px) ${s} perspective(500px) rotateY(0deg)`, offset: 0.32 },
        { transform: 'translate(0,0) scale(1,1) perspective(500px) rotateY(0deg)' },
      ], { duration, delay, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'both' });
      const done = () => ghost.remove();
      anim.onfinish = done;
      anim.oncancel = done;
      setTimeout(done, duration + delay + 400);
      // the card itself waits in its slot, unseen, until the picture lands on it
      el.animate([{ opacity: 0 }, { opacity: 0, offset: 0.97 }, { opacity: 1 }], { duration: duration + delay + 20 });
      if (typeof window !== 'undefined') window.__patronsDeals = (window.__patronsDeals || 0) + 1;
    });
  }, [state.shop]); // eslint-disable-line react-hooks/exhaustive-deps
}
