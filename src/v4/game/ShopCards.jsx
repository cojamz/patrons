// The Lamplit shop: ten cream cards (5×2 on a laptop, a swipe row on a phone) and one quiet follower-rate line.
// The member deck (face down, its count) heads the strip (MemberDeck.jsx). A card: timing tag, pixel figure, name, cost as shapes, worth. While placing, cards you can't
// afford are dim and a "✓ after X" tick marks the ones the space under your pointer would unlock (engine dry run).
// While buying, the figure gives way to the card's text; hover shows what you'd pay. On touch a tap opens the card
// as a sheet with Recruit (reading a card never recruits it); with a mouse a click on an affordable card recruits.
import { memo, useLayoutEffect, useRef, useState } from 'react';
import { cardDef, paymentPlan, TIERS, tierLeft, quadrant } from '../../engine/v4/index.js';
import { costParts } from '../format.js';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { realHover } from '../hover.js';
import { cardColor, onTable, usePreview, Tip } from './Info.jsx';
import { FollowerGlyph } from './Glyphs.jsx';
import { Pip } from './Rich.jsx';
import { timingOf, unlockedBy, surely } from './cards.js';
void timingOf;
import { useHoverSpace } from './HoverCards.jsx';
import { MemberDeck, useDeal } from './MemberDeck.jsx';
import './lamp-b.css';
import { breakable } from './hyphen.js'; // long names break at a seam on the narrow card (Doppel-ganger)

const sphereOf = (state, d) => { if (!onTable(state, d)) return 'colorless'; try { return quadrant(d.quadrant).resource; } catch { return 'colorless'; } };

// The face-up row's order (Cory, 2026-10-15): by cost, cheapest first, or by color (the table's color order, then
// cost). Remembered per viewer in this browser; a blocked storage just means the default.
export const SORT_KEY = 'patrons.v4.shopSort';
const readSort = () => { try { return localStorage.getItem(SORT_KEY) === 'color' ? 'color' : 'cost'; } catch { return 'cost'; } };
/** The printed cost as one number (every part, colored and any). */
export const costTotal = (state, d) => costParts(d, state.resources).reduce((t, c) => t + c.n, 0);
/** uids in shop order: 'cost' (cheapest first; then color, name) or 'color' (table color order, colorless last; then cost). */
export function sortShop(state, uids, by = 'cost') {
  const rows = uids.map(uid => {
    const d = cardDef(state, uid);
    const q = onTable(state, d) ? state.quadrants.indexOf(d.quadrant) : state.quadrants.length;
    return { uid, d, cost: costTotal(state, d), q };
  });
  const byCost = (a, b) => a.cost - b.cost || a.q - b.q || a.d.name.localeCompare(b.d.name) || a.uid - b.uid;
  const byColor = (a, b) => a.q - b.q || a.cost - b.cost || a.d.name.localeCompare(b.d.name) || a.uid - b.uid;
  return rows.sort(by === 'color' ? byColor : byCost).map(r => r.uid);
}
/**
 * The row as it stands (w2b #40: "the shop re-sorts after every recruit, so cards jump under the pointer"): within a
 * round, a card dealt to refill the row takes the place of the one that left, like a real market row, and nothing else
 * moves. The row re-sorts at a calm moment: a new round (behind its summary) or the sort toggle. prev = { key, uids }.
 */
export function steadyOrder(prev, key, sorted) {
  if (!prev || prev.key !== key) return sorted;
  const fresh = sorted.filter(u => !prev.uids.includes(u));
  const out = prev.uids.map(u => (sorted.includes(u) ? u : fresh.shift() ?? null)).filter(u => u != null);
  return [...out, ...fresh];
}

/** A cost as the plate prints it: "4● 2◐", the number before its dot, colored part first, then any (no color names). */
export function CostShapes({ parts }) {
  if (!parts.length) return <span className="lt-cost free">free</span>;
  return (
    <span className="lt-cost" aria-label={parts.map(c => `${c.n} ${c.color === 'any' ? 'any' : c.color}`).join(' + ')}>
      {parts.map((c, k) => (
        <span key={k} className="lt-res"><b className="num">{c.n}</b><Pip color={c.color} n={c.n} /></span>
      ))}
    </span>
  );
}

function ShopCards({ state, me, mySeats = [], optionFor = () => null, onPick, onDenied, phase, hover = null }) {
  const pend = state.pending;
  const viewer = me != null ? state.players[me] : null;
  const mine = !!(pend && mySeats.includes(pend.player));
  const buying = mine && pend.kind === 'buy';
  const placing = mine && pend.kind === 'place';
  // the board picker (boardPick.js): a choice that names face-up members lights them like a buy, the rest recede
  // any choice (a steal, a gift, a copy, a recruit from the row): only what it offers here stays bright; the rest of the
  // shop steps back, so the lit stacks or spaces you're choosing from are the brightest thing (design pod)
  const picking = mine && pend.kind === 'choose';
  const pointer = useRef('mouse');
  const rowRef = useRef(null), deckRef = useRef(null);
  const [sort, setSortState] = useState(readSort);
  const setSort = v => { setSortState(v); try { localStorage.setItem(SORT_KEY, v); } catch { /* private window: this visit only */ } };
  useDeal(rowRef, deckRef, state); // a refill comes off the deck
  // the "✓ after X" ticks for the space under the pointer are ShopTicks' (below): a hover never re-renders the shop
  const after = null, unlocked = [];
  const pileOpts = buying ? pend.options.filter(o => o.kind === 'card' && o.fromPile).map(o => o.uid) : [];
  // a pick from the top of the pile (Talent Scout): the strip becomes a tray of those 5, in pile order; what you can't
  // pay for recedes (dialogs pod, wave-2 tester: one text chip, the other four never shown)
  const tray = picking && pend.options.some(o => o.kind === 'card' && state.pile.slice(0, 5).includes(o.value)) ? state.pile.slice(0, 5) : null;
  const steady = useRef(null);
  const rowKey = `${sort}|${state.round}`;
  const row = steadyOrder(steady.current, rowKey, sortShop(state, state.shop, sort));
  steady.current = { key: rowKey, uids: row };
  const uids = tray || [...row, ...pileOpts];
  const affordable = viewer ? uids.filter(u => paymentPlan(state, viewer, u)).length : 0;
  return (
    <section className="lt-shop-cards" data-phase={phase} data-sort={sort} data-tray={tray ? 'pile' : undefined} aria-label="Shop">
      <div className="lt-shop-main">
      {/* one header line: the members' title and the sort; the follower buys stand beside the cards, as findable */}
      <div className="lt-shop-head">
        <h3 className="lt-h">{tray ? 'Top of the pile' : 'Members'}<small>{tray ? `${tray.filter(u => optionFor(`card:${u}`)).length} you can pay for` : buying ? `${affordable} you can afford` : `${state.shop.length} face up`}</small></h3>
        <span className="lt-sort" role="group" aria-label="Sort the members">
          <span className="lbl" aria-hidden="true">sort</span>
          {[['cost', 'Cheapest first'], ['color', 'Grouped by color, then cheapest']].map(([k, t]) => (
            <button key={k} type="button" className={`lt-sort-btn${sort === k ? ' on' : ''}`} data-sort-by={k} aria-pressed={sort === k} title={`Sort the members: ${t.toLowerCase()}`} onClick={() => setSort(k)}>{k}</button>
          ))}
        </span>
      </div>
      <div className="lt-shop-body">
      <MemberDeck state={state} deckRef={deckRef} />
      <div className="lt-cards" ref={rowRef}>
        {uids.map(uid => {
          const d = cardDef(state, uid);
          const opt = optionFor(`card:${uid}`);
          const can = viewer ? !!paymentPlan(state, viewer, uid) : false;
          const tick = unlocked.includes(uid);
          // buying: the lamp lights only what you can recruit, the rest recede (Cory); placing: what you can't
          // afford yet is quieter, except a card the space under your pointer would unlock
          const dim = viewer && (((buying || picking) && !opt) || (!buying && !picking && !can && !tick));
          const lit = (buying || picking) && !!opt;
          const parts = costParts(d, state.resources);
          const fromPile = !state.shop.includes(uid);
          return (
            <button
              key={uid} type="button" data-uid={uid} data-option={opt ? opt.id : undefined}
              className={`card lt-card paper${opt ? ' can' : ''}${dim ? (buying || picking ? ' recede' : ' dim') : ''}${lit ? ' lit' : ''}`}
              style={{ '--q': cardColor(state, d) }} aria-disabled={!opt}
              aria-label={`${d.name}, ${timingOf(d)}, worth ${d.f}, costs ${parts.map(c => `${c.n} ${c.color}`).join(' + ') || 'nothing'}`}
              data-hint={`${d.name} · worth ${d.f} · ${d.text}`}
              onPointerDown={e => { pointer.current = e.pointerType || 'mouse'; }}
              onPointerEnter={e => { if (hover && realHover(e)) hover.onCardHover(uid, e.currentTarget); }}
              onPointerLeave={e => { if (hover && e.pointerType === 'mouse') hover.onCardHover(uid, null); }}
              onClick={e => {
                // touch: a tap reads the card (a sheet with Recruit); it never recruits by itself
                if (pointer.current === 'touch' && hover) { hover.onCardHover(uid, e.currentTarget, { pinned: true }); return; }
                if (opt) onPick(opt.id); else if (onDenied) onDenied({ type: 'card', uid, name: d.name }, e.currentTarget);
              }}
            >
              {/* identity and price (Cory, 2026-10-15: "members can't be translated to shorthand"): the picture on its
                  tinted field, the name, the cost in dots and the worth; what it does is the hover's one plain sentence */}
              <span className="band" aria-hidden="true" />
              <span className="art"><Sprite id={[d.id, spriteId(d.name)]} kind="member" sphere={sphereOf(state, d)} size={48} />
                {/* no "need N" on the face (Cory: "the shouting 'need N' goes"; grammar: what you can't afford is the card
                    fading, not text). What you're short of is the hover's one quiet line. */}
                {fromPile && !tray && <span className="need from-pile" title="From the top of the pile (Insider)">pile</span>}
                {tick && <span className="tick" title={`You could afford it after ${after}`}>after {after}</span>}
              </span>
              <span className="nm">{breakable(d.name)}</span>
              <span className="ft">
                <CostShapes parts={parts} />
                <span className="val" title={`Worth ${d.f} follower${d.f === 1 ? '' : 's'}${d.n > 1 ? `; counts as ${d.n} members` : ''}`}>
                  <b className="num">{d.f}</b><FollowerGlyph size={11} title={`worth ${d.f}`} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      </div>
      </div>
      <FollowerRates state={state} me={me} optionFor={optionFor} onPick={onPick} onDenied={onDenied} buying={buying || picking} />
      <ShopTicks state={state} viewer={viewer} placing={placing} hover={hover} rowRef={rowRef} />
    </section>
  );
}

/**
 * "✓ after X" on the cards the space under the pointer would unlock (no tick a choice might not give). It subscribes to
 * the hover and that space's preview (the cache, or the worker's answer the moment it lands) and marks those cards in
 * the DOM, as useCopyTargets lights spaces: a hover renders this alone, never the shop (perf, 2026-10-15). The tag is
 * the tick the card itself used to render, and a card it would unlock isn't quiet.
 */
function ShopTicks({ state, viewer, placing, hover, rowRef }) {
  const space = useHoverSpace(hover);
  const sp = placing && space && viewer ? space.split('-').map(Number) : null;
  const pv = usePreview(state, sp ? viewer.id : null, sp ? sp[0] : 0, sp ? sp[1] : 0);
  const after = sp && pv ? quadrant(state.quadrants[sp[0]]).actions[sp[1]].name : null;
  const unlocked = after ? unlockedBy(state, viewer, surely(pv)) : [];
  const sig = after && unlocked.length ? `${after}|${unlocked.join(',')}` : '';
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!sig || !row) return undefined;
    const done = [];
    for (const uid of unlocked) {
      const el = row.querySelector(`[data-uid="${uid}"]`);
      if (!el) continue;
      const was = el.className;
      el.classList.remove('dim');
      const art = el.querySelector('.art');
      let tag = null;
      if (art) {
        tag = document.createElement('span');
        tag.className = 'tick';
        tag.title = `You could afford it after ${after}`;
        tag.textContent = `after ${after}`; // words, not a ✓ (grammar: two marks only)
        art.appendChild(tag);
      }
      done.push({ el, was, now: el.className, tag });
    }
    // put back only what React hasn't redrawn since (a card it re-rendered keeps React's own class)
    return () => { for (const d of done) { if (d.tag) d.tag.remove(); if (d.el.className === d.now) d.el.className = d.was; } };
  }, [sig, state]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Memoized on its props: GameScreen passes the state and stable handlers, so the shop re-renders only when the table
 *  changes (a hover renders ShopTicks alone). */
export default memo(ShopCards);

/** Followers for any resources (Cory, 2026-10-15: "too hidden"): four tiles beside the member cards, read like them
 *  (cost on the left, followers on the right), lit when you can buy one, receding when you can't. */
export function FollowerRates({ state, me = null, optionFor = () => null, onPick, onDenied, buying = false }) {
  // each rate explains itself on hover in any phase (RC1 panel: no hover while placing): the trade, what's left, and
  // when you can make it
  const viewer = me != null ? state.players[me] : null;
  const held = viewer ? Object.values(viewer.res).reduce((a, b) => a + (b || 0), 0) : null;
  const when = (t, opt) => {
    if (opt) return 'You can buy it now.';
    if (viewer && held < t.cost) return `You hold ${held}: ${t.cost - held} short.`;
    if (state.pending && state.pending.kind === 'place' && viewer && state.pending.player === viewer.id) return 'You buy after you place a minion, in your buy step.';
    if (tierLeft(state, t) <= 0) return 'None left.';
    return 'You buy in your buy step, after placing a minion.';
  };
  return (
    <div className="lt-rates" role="group" aria-label="Buy followers">
      <span className="lt-rates-head"><span className="lbl">Followers</span><small>any resources</small></span>
      <span className="lt-rates-grid">
      {TIERS.map(t => {
        const opt = optionFor(`tier:${t.key}`);
        const left = tierLeft(state, t);
        // the lamp lights what you can buy now; while you buy the rest recede; otherwise what you can't afford is quieter
        const afford = viewer ? held >= t.cost && left > 0 : true;
        const look = opt ? ' can lit' : buying ? ' recede' : afford ? '' : ' dim';
        return (
          <button key={t.key} type="button" className={`fb lt-rate${look}`} data-option={opt ? opt.id : undefined} aria-disabled={!opt}
            aria-haspopup="dialog" data-rate={t.key}
            aria-label={`Pay ${t.cost} resources of any colors: +${t.get} follower${t.get > 1 ? 's' : ''}${t.limited ? ` (${left} left in this game)` : ''}`}
            onClick={e => (opt ? onPick(opt.id) : onDenied && onDenied({ type: 'tier', tier: t }, e.currentTarget))}>
            {/* a move closes it (keyed by the move): after a buy it stayed open and flipped to "You hold 0: 10 short" (w2b #47) */}
            <Tip key={state.moves} className="fb-tip" hint={`Pay ${t.cost} resources of any colors: +${t.get} follower${t.get > 1 ? 's' : ''}`} content={() => (
              <div className="pop-card rate-card" data-rate-card={t.key}>
                <b>{t.cost} resources → {t.get} follower{t.get > 1 ? 's' : ''}</b>
                <span>Any colors, any mix, as your one buy.</span>
                {t.limited ? <span>{left} left at this table (2 per player at the start).</span> : <span>Unlimited.</span>}
                <small>{when(t, opt)}</small>
              </div>
            )}><span className="rt-trade"><b className="num">{t.cost}</b><Pip color="any" n={t.cost} /><span className="to" aria-hidden="true">→</span><b className="num">{t.get}</b><FollowerGlyph size={14} /></span>{t.limited && <small className="rt-left num">{left} left</small>}<span className="hitbox" aria-hidden="true" /></Tip>
          </button>
        );
      })}
      </span>
    </div>
  );
}
