// The Lamplit shop: eight cream cards (three rows beside the wheel, a swipe row on a phone) and three follower buys.
// The member deck (face down, its count) heads the strip (MemberDeck.jsx). A card: timing tag, pixel figure, name, cost as shapes, worth. While placing, cards you can't
// afford are dim, and the ones the space under your pointer would unlock brighten (engine dry run).
// While buying, the figure gives way to the card's text; hover shows what you'd pay. On touch a tap opens the card
// as a sheet with Recruit (reading a card never recruits it); with a mouse a click on an affordable card recruits.
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cardDef, paymentPlan, followerChoices, TIERS, tierLeft, quadrant, pileReach } from '../../engine/v4/index.js';
import { costParts } from '../format.js';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { realHover } from '../hover.js';
import { cardColor, cardGround, onTable, usePreview, Tip, CostDots, paidParts, discountWhy, RuleText } from './Info.jsx';
import { FollowerGlyph } from './Glyphs.jsx';
import { Pip } from './Rich.jsx';
import { timingOf, unlockedBy, surely } from './cards.js';
void timingOf;
import { useHoverSpace } from './HoverCards.jsx';
import { MemberDeck, useDeal } from './MemberDeck.jsx';
import './lamp-b.css';
import './member-pick.css';
import './shop.css'; // live panel r1 (G2): the deck, the struck price and the worth
import './card-header.css'; // the trading-card face (Cory, Oct 29)
import { breakable } from './hyphen.js'; // long names break at a seam on the narrow card (Doppel-ganger)

const sphereOf = (state, d) => { if (!onTable(state, d)) return 'colorless'; try { return quadrant(d.quadrant).resource; } catch { return 'colorless'; } };

// The face-up row's order (Cory, 2026-10-15): by cost, cheapest first, or by color (the table's color order, then
// cost). Remembered per viewer in this browser; a blocked storage just means the default.
export const SORT_KEY = 'patrons.v4.shopSort';
export const VIEW_KEY = 'patrons.v4.shopView';
// Fading what you can't afford (Cory, 2026-10-18: "a third shop toggle that fades unaffordable members"): off by default
export const FADE_KEY = 'patrons.v4.shopFade';
const readFade = () => { try { return localStorage.getItem(FADE_KEY) === 'on'; } catch { return false; } };
const readView = () => { try { const saved = localStorage.getItem(VIEW_KEY); return saved === 'details' || saved === 'compact' ? saved : null; } catch { return null; } };
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
 * turn, a card dealt to refill the row takes the place of the one that left, like a real market row, and nothing else
 * moves. The row re-sorts when the turn ends (and on a new round, the sort toggle or a reload), so the order you see
 * follows the sort (blind testers, 2026-10-15: "sort: cost" kept a refill in the vacated slot, and a reload
 * reshuffled). prev = { key, uids }.
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

// A card's handlers, made here and not in the render: a kept card element lives on across many renders, and a handler
// made inside one held that render's whole game state (leak pass, 2026-10-28). They read the latest props through refs.
const cardHandlers = (refs, uid, name, optId) => {
  const { live, pointer, waiting, arrived } = refs;
  const fresh = () => performance.now() - (arrived.current.get(uid) ?? -1e9) < 500;
  return {
    onPointerDown: e => { pointer.current = e.pointerType || 'mouse'; },
    onPointerEnter: e => { const { hover, detailed } = live.current; if (hover && !detailed && realHover(e)) { if (fresh()) waiting.current.add(uid); else hover.onCardHover(uid, e.currentTarget); } },
    onPointerMove: e => { const { hover, detailed } = live.current; if (waiting.current.has(uid) && hover && !detailed && realHover(e)) { waiting.current.delete(uid); hover.onCardHover(uid, e.currentTarget); } },
    onPointerLeave: e => { const { hover } = live.current; waiting.current.delete(uid); if (hover && e.pointerType === 'mouse') hover.onCardHover(uid, null); },
    onClick: e => {
      const { hover, onPick, onDenied } = live.current;
      if (fresh()) return; // just arrived under the pointer: not a deliberate click
      // touch: a tap reads the card (a sheet with Recruit); it never recruits by itself
      if (pointer.current === 'touch' && hover) { hover.onCardHover(uid, e.currentTarget, { pinned: true }); return; }
      if (optId) onPick(optId); else if (onDenied) onDenied({ type: 'card', uid, name }, e.currentTarget);
    },
  };
};
// a card's element as last built: the same element, no render (ShopCards' built cache)
const Kept = memo(function KeptCard({ el }) { return el; });

function ShopCards({ state, me, mySeats = [], optionFor = () => null, onPick, onDenied, phase, hover = null, onViewChange = null }) {
  const pend = state.pending;
  const viewer = me != null ? state.players[me] : null;
  const discount = viewer ? (viewer.discount || 0) + viewer.members.reduce((n, uid) => n + (cardDef(state, uid).costReduction || 0), 0) : 0;
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
  const [view, setView] = useState(readView);
  const [fade, setFadeState] = useState(readFade);
  const toggleFade = () => { const next = !fade; setFadeState(next); try { localStorage.setItem(FADE_KEY, next ? 'on' : 'off'); } catch { /* this visit only */ } };
  const setSort = v => { setSortState(v); try { localStorage.setItem(SORT_KEY, v); } catch { /* private window: this visit only */ } };
  useDeal(rowRef, deckRef, state); // a refill comes off the deck
  // a card that just arrived (a refill sliding under the pointer after an instant buy) ignores clicks for half a second
  // and opens its hover only once the pointer moves (wave-2 tester A #12: it invited a double buy)
  const arrived = useRef(new Map()), seenShop = useRef(null), waiting = useRef(new Set());
  useLayoutEffect(() => {
    const prev = seenShop.current, now = performance.now();
    if (prev) for (const u of state.shop) if (!prev.has(u)) arrived.current.set(u, now);
    seenShop.current = new Set(state.shop);
  }, [state.shop]);
  // the cards the space under the pointer would unlock brighten in ShopTicks (below): a hover never re-renders the shop
  // the top of the pile you can reach (Peek, Insider) joins the shop while you recruit, every card of it: one you can't
  // pay for recedes like a shop card, never hides (Cory, 2026-10-23: "should still be able to see Peek card they can't afford")
  // the choice can be a step older than the cards on show (mid-animation): a pile card it offers that has since been
  // dealt into the shop shows there, once (Cory's playtest, 2026-10-26: two Couriers, the copy stuck under one key)
  const pileOpts = buying ? pend.options.filter(o => o.kind === 'card' && o.fromPile && state.pile.includes(o.uid)).map(o => o.uid) : [];
  const pileTop = buying && viewer ? [...new Set([...state.pile.slice(0, pileReach(state, viewer)), ...pileOpts])] : [];
  // a pick from the top of the pile (Talent Scout): the strip becomes a tray of those 5, in pile order; what you can't
  // pay for recedes (dialogs pod, wave-2 tester: one text chip, the other four never shown)
  // Peek (Blue) puts the top 4 back in your order: those 4 join the shop rather than replace it, so the shop stays in
  // view while you order them (Cory, 2026-10-23: "with peek, player loses the ability to see the current shop")
  const peeking = picking && /^Peek: /.test(pend.prompt || '');
  const peekTop = peeking ? state.pile.slice(0, 4) : [];
  const tray = picking && !peeking && pend.options.some(o => o.kind === 'card' && state.pile.slice(0, 5).includes(o.value)) ? state.pile.slice(0, 5) : null;
  // your pick (a buy or a choice): if the shop offers any of it, the lit ones lead and everything else steps well back;
  // if it offers none, the whole shop steps back (Cory, live, Oct 27: "during churn and peek especially, things badly lit")
  const offers = (buying || picking) && pend.options.some(o => o.kind === 'card' || o.kind === 'tier' || /^(card|tier):/.test(String(o.id)));
  const choosing = buying || picking ? (offers ? 'shop' : 'elsewhere') : undefined;
  const steady = useRef(null);
  // a turn's own key: state.turns grows by one as each turn starts (the engine's record of this round's turns)
  const rowKey = `${sort}|${state.round}|${(state.turns || []).length}`;
  const row = steadyOrder(steady.current, rowKey, sortShop(state, state.shop, sort));
  steady.current = { key: rowKey, uids: row };
  // Peek's 4 (and what you may recruit off the pile after): their own row, "Top of the pile", numbered in the order
  // they'll be drawn, never mixed into the shop (Cory, playtest Oct 28: "Peek UI is unintuitive"; his yes to the row)
  const peekShow = peeking && pend.show && pend.show.peek ? pend.show.peek : null;
  const pileRow = peekShow ? { uids: [...peekShow.placed, ...peekShow.left], placed: peekShow.placed.length, ordering: true }
    : pileTop.length ? { uids: pileTop, placed: pileTop.length, ordering: false } : null;
  const uids = tray || (pileRow ? row : [...new Set([...row, ...pileTop, ...peekTop])]);
  const extra = !tray && !pileRow && (pileTop.length + peekTop.length) > 0;
  const memberPick = picking && uids.some(uid => optionFor(`card:${uid}`));
  // Show abilities for a first member choice, but a reader's explicit preference always wins, in every phase.
  const detailed = view === 'details' || (view === null && memberPick);
  const toggleView = () => { const next = detailed ? 'compact' : 'details'; setView(next); hover?.close?.(); try { localStorage.setItem(VIEW_KEY, next); } catch { /* this visit only */ } };
  useEffect(() => { onViewChange?.(detailed); }, [detailed, onViewChange]);
  // with details on, an ability that would run under the price sets one step tighter, so the card keeps its slot and
  // the whole rule stays readable (Straggler at 1270x700 ran under its footer; shop-sizing gate)
  const fitKey = detailed ? `${uids.join(',')}|${state.round}` : '';
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!fitKey || !row) return undefined;
    const fit = () => {
      for (const a of row.querySelectorAll('.lt-pick-ability')) {
        const card = a.closest('.lt-card'), ft = card && card.querySelector('.ft');
        if (!ft) continue;
        a.removeAttribute('data-fit');
        const over = () => a.getBoundingClientRect().bottom > ft.getBoundingClientRect().top + 0.5 || ft.getBoundingClientRect().bottom > card.getBoundingClientRect().bottom + 0.5;
        if (over()) a.setAttribute('data-fit', 'tight');
      }
    };
    fit();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
    ro?.observe(row);
    return () => ro?.disconnect();
  }, [fitKey]);
  const canPay = new Map(uids.map(u => [u, viewer ? !!paymentPlan(state, viewer, u) : false]));
  const affordable = viewer ? uids.filter(u => canPay.get(u)).length : 0;
  // each card's element is kept while what it shows is the same (lag pass 2026-10-21: a rival's step re-rendered every
  // card in the row, 5-35ms at 4x CPU, for no change on screen); its handlers read the latest props through a ref
  const live = useRef({});
  live.current = { onPick, onDenied, hover, detailed };
  const refs = { live, pointer, waiting, arrived };
  const built = useRef(new Map()); // uid → { sig, el }
  // only the cards on show: a card that left the row would keep its last element (and, through its handlers, the game
  // state it was drawn with) for the rest of the game (leak pass, 2026-10-28)
  for (const uid of built.current.keys()) if (!uids.includes(uid)) built.current.delete(uid);
  return (
    <section className="lt-shop-cards" data-phase={phase} data-sort={sort} data-member-pick={memberPick || undefined} data-view={detailed ? 'details' : 'compact'} data-tray={tray ? 'pile' : undefined} data-pile-extra={extra || undefined} data-fade={viewer && fade ? 'on' : undefined} data-peek={peeking || undefined} data-choosing={choosing} data-pile-row={pileRow ? '' : undefined} aria-label="Shop">
      <div className="lt-shop-main">
      {/* one header line: the members' title and the sort; the follower buys stand beside the cards, as findable */}
      <div className="lt-shop-head">
        {/* a discount is said once, here, beside the struck prices (w4 A#23: its sentence was on all ten hovers) */}
        <h3 className="lt-h">{tray ? 'Top of the pile' : 'Shop'}<small>{tray ? `${tray.filter(u => optionFor(`card:${u}`)).length} you can pay for` : peeking ? 'Pick the next pile card on top' : discount > 0 ? <Tip label="Discount sources" content={<p>{discountWhy(state, viewer)}.</p>}><span data-shop-discount>{viewer.discount ? 'your next one' : 'your members'} {discount} less</span></Tip> : buying && affordable ? `${affordable} members affordable` : `${state.shop.length} members`}</small></h3>
        <span className="lt-shop-controls">
          {viewer && <button type="button" className="lt-view-btn" aria-label="Fade members you can't afford" title="Fade members you can't afford right now" aria-pressed={fade} onClick={toggleFade}>affordable</button>}
          <button type="button" className="lt-view-btn" aria-label="Show member abilities" aria-pressed={detailed} onClick={toggleView}>details</button>
          <button type="button" className="lt-sort" role="switch" aria-label="Group members by color" aria-checked={sort === 'color'} title="Switch cost / color order" onClick={() => setSort(sort === 'cost' ? 'color' : 'cost')}>
            <span className={sort === 'cost' ? 'on' : ''}>cost</span><span className={sort === 'color' ? 'on' : ''}>color</span>
          </button>
        </span>
      </div>
      <div className="lt-shop-body">
      <div className="lt-cards" data-n={uids.length} ref={rowRef}>
      <MemberDeck state={state} deckRef={deckRef} />
      <FollowerRates state={state} me={me} optionFor={optionFor} onPick={onPick} onDenied={onDenied} buying={buying || picking} />
        {uids.map(uid => {
          const d = cardDef(state, uid);
          const opt = optionFor(`card:${uid}`);
          const optId = opt ? opt.id : null;
          const can = canPay.get(uid);
          // buying: the lamp lights only what you can recruit, the rest recede (Cory); placing: what you can't
          // afford yet is quieter, except a card the space under your pointer would unlock
          // ordering Peek's cards, the shop reads as it does while placing: there to look at, not to pick
          const looking = peeking && !opt;
          const dim = viewer && (((buying || picking) && !opt && !looking) || ((looking || (!buying && !picking)) && !can));
          const lit = (buying || picking) && !!opt;
          // the fade toggle: a member you can't pay for right now (and no choice offers) fades, in every phase
          const short = viewer && fade && !can && !opt;
          const parts = costParts(d, state.resources);
          // a discount on you: the price you'd pay, the list price small and struck beside it (decisions.md, 2026-10-15)
          const paid = paidParts(state, viewer, uid, d);
          const fromPile = !state.shop.includes(uid);
          const color = cardColor(state, d), ground = cardGround(state, d), sphere = sphereOf(state, d);
          const sig = [d.id, d.name, d.f, d.n, d.text, optId ?? '', dim ? 1 : 0, looking ? 1 : 0, lit ? 1 : 0, short ? 1 : 0, buying || picking ? 1 : 0, JSON.stringify(parts), JSON.stringify(paid), fromPile ? 1 : 0, tray ? 1 : 0, detailed ? 1 : 0, state.round, color, ground, sphere].join('|');
          const had = built.current.get(uid);
          if (had && had.sig === sig) return <Kept key={uid} el={had.el} />;
          const el = (
            <button
              key={uid} type="button" data-uid={uid} data-option={opt ? opt.id : undefined}
              className={`card lt-card paper${opt ? ' can' : ''}${dim ? ((buying || picking) && !looking ? ' recede' : ' dim') : ''}${lit ? ' lit' : ''}`}
              style={{ '--q': color }} data-ground={ground} aria-disabled={!opt} data-unaffordable={short || undefined}
              aria-label={`${d.name}, ${timingOf(d)}, worth ${d.f}, costs ${parts.map(c => `${c.n} ${c.color}`).join(' + ') || 'nothing'}`}
              data-hint={`${d.name} · worth ${d.f} · ${d.text}`}
              {...cardHandlers(refs, uid, d.name, optId)}
            >
              {/* a trading card (Cory, Oct 29: "Header is good"): the name on a bar in the color, the price you'd pay in a
                  dark disc at its left and the worth at its right; the picture; the price's colors along the foot. What
                  it does is the hover's (or Details') sentence. The price is what you'd pay, so it agrees with the dots. */}
              <span className="lt-hd">
                <span className="lt-corner-cost num" aria-hidden="true" data-corner-cost={(paid || parts).reduce((t, c) => t + c.n, 0)}>{(paid || parts).reduce((t, c) => t + c.n, 0)}</span>
                {/* the worth is what the member brings, not part of its price (live panel r1: "1 follower" read as a third cost) */}
                <span className="val" data-worth={d.f} title={`Worth ${d.f} follower${d.f === 1 ? '' : 's'}${d.n > 1 ? `; counts as ${d.n} members` : ''}`}>
                  <b className="num">{d.f}</b><FollowerGlyph size={14} title={`worth ${d.f}`} />
                </span>
                {/* a long single word sets tighter, so it fits its line whole before it ever breaks (w3a A26: "DOPPEL-/GANGER") */}
                <span className="nm" data-long={d.name.split(' ').some(w => w.length >= 10) || undefined}>{breakable(d.name)}</span>
              </span>
              <span className="art"><Sprite id={[d.id, spriteId(d.name)]} kind="member" sphere={sphere} size={48} />
                {/* no "need N" on the face (Cory: "the shouting 'need N' goes"): what you can't afford is the card fading */}
                {/* works from round II on (Cory, 2026-10-22: "a better way to denote round II/round III only"): a corner tag, not words */}
                {d.from > 1 && <span className="lt-round-tag" data-round-tag="" title="Works from round II on">II+</span>}
                {fromPile && !tray && <span className="need from-pile" title="From the top of the pile">pile</span>}
              </span>
              {/* a rule that grows by round reads by round, this round lit, as in every hover (RuleText; compact on the small card) */}
              {detailed && <span className="lt-pick-ability"><RuleText def={d} round={state.round} plain compact /></span>}
              <span className="ft" data-discount={paid ? '' : undefined}>
                {paid ? (
                  <span className="cost-now" data-paid={paid.reduce((t, c) => t + c.n, 0)}>
                    {/* the list price as one struck number, BEFORE the price you pay (a shop's "was 4, now 2") */}
                    <s className="cost-was num" title={`List price ${parts.map(c => `${c.n} ${c.color === 'any' ? 'any' : c.color}`).join(' + ')}`} aria-label={`list price ${parts.reduce((t, c) => t + c.n, 0)}`}>{parts.reduce((t, c) => t + c.n, 0)}</s>
                    <CostShapes parts={paid} />
                  </span>
                ) : <CostShapes parts={parts} />}
              </span>
            </button>
          );
          built.current.set(uid, { sig, el });
          return <Kept key={uid} el={el} />;
        })}
      </div>
      </div>
      </div>
      <ShopTicks state={state} viewer={viewer} placing={placing} hover={hover} rowRef={rowRef} />
      {pileRow && <PileRow state={state} viewer={viewer} row={pileRow} optionFor={optionFor} onPick={onPick} hover={hover} />}
    </section>
  );
}

const NTH = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
/**
 * The top of the pile as its own row over the shop: Peek's 4 while you order them (a click puts one next, its number
 * under it; "Keep this order" leaves the rest as they lie) and, after, what you may recruit off the pile this turn.
 * Snappy like the pay sheet: a click answers at once, nothing animates in between.
 */
function PileRow({ state, viewer, row, optionFor, onPick, hover }) {
  const keep = row.ordering ? optionFor('keep') : null;
  return (
    <div className="lt-pile-row" data-pile-row={row.ordering ? 'order' : 'recruit'} role="group" aria-label="Top of the pile">
      <div className="pr-head"><b>Top of the pile</b>
        {keep ? <button type="button" className="btn pr-keep" data-option={keep.id} onClick={() => onPick(keep.id)}>Keep this order</button>
          : <span>{row.ordering ? '' : 'Recruit one this turn'}</span>}
      </div>
      <div className="pr-cards">
        {row.uids.map((uid, k) => {
          const d = cardDef(state, uid);
          const opt = optionFor(`card:${uid}`);
          const parts = costParts(d, state.resources);
          const paid = paidParts(state, viewer, uid, d);
          const shown = paid || parts;
          const set = k < row.placed;
          return (
            <button key={uid} type="button" data-uid={uid} data-option={opt ? opt.id : undefined} aria-disabled={!opt}
              className={`card lt-card paper${opt ? ' can lit' : ' recede'}`} style={{ '--q': cardColor(state, d) }} data-ground={cardGround(state, d)}
              aria-label={`${d.name}, costs ${shown.map(c => `${c.n} ${c.color}`).join(' + ') || 'nothing'}${set ? `, ${NTH[k]} from the top` : ''}`}
              onPointerEnter={e => { if (hover && e.pointerType === 'mouse') hover.onCardHover(uid, e.currentTarget); }}
              onPointerLeave={e => { if (hover && e.pointerType === 'mouse') hover.onCardHover(uid, null); }}
              onClick={() => { if (opt) { hover?.close?.(); onPick(opt.id); } }}>
              <span className="lt-hd">
                <span className="lt-corner-cost num" aria-hidden="true">{shown.reduce((t, c) => t + c.n, 0)}</span>
                <span className="val" data-worth={d.f}><b className="num">{d.f}</b><FollowerGlyph size={14} title={`worth ${d.f}`} /></span>
                <span className="nm" data-long={d.name.split(' ').some(w => w.length >= 10) || undefined}>{breakable(d.name)}</span>
              </span>
              <span className="art"><Sprite id={[d.id, spriteId(d.name)]} kind="member" sphere={sphereOf(state, d)} size={48} />
                {set && <span className="pr-slot num" aria-hidden="true">{k + 1}</span>}</span>
              <span className="ft"><CostShapes parts={shown} /></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The cards the space under the pointer would unlock brighten (none a choice might not give). It subscribes to
 * the hover and that space's preview (the cache, or the worker's answer the moment it lands) and marks those cards in
 * the DOM, as useCopyTargets lights spaces: a hover renders this alone, never the shop (perf, 2026-10-15).
 */
function ShopTicks({ state, viewer, placing, hover, rowRef }) {
  const space = useHoverSpace(hover);
  const sp = space && viewer && !state.over ? space.split('-').map(Number) : null;
  const pv = usePreview(state, sp ? viewer.id : null, sp ? sp[0] : 0, sp ? sp[1] : 0, { now: true });
  const after = placing && sp && pv ? quadrant(state.quadrants[sp[0]]).actions[sp[1]].name : null;
  const unlocked = after ? unlockedBy(state, viewer, surely(pv)) : [];
  const sig = after && unlocked.length ? `${after}|${unlocked.join(',')}` : '';
  // the face-up members the space itself acts on light up with its hover and go with it (Cory, 2026-10-16: "hovering
  // over Free Recruit should highlight the cheapest recruit(s) in the shop"): the engine's own list (preview targets),
  // drawn as a data attribute only, so React's classes and the layout never move
  const aims = placing && sp && pv && pv.targets ? pv.targets.shop : [];
  const aimSig = aims.join(',');
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!aimSig || !row) return undefined;
    const els = aimSig.split(',').map(u => row.querySelector(`[data-uid="${u}"]`)).filter(Boolean);
    for (const el of els) el.setAttribute('data-aim', '');
    return () => { for (const el of els) el.removeAttribute('data-aim'); };
  }, [aimSig, state]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!sig || !row) return undefined;
    const done = [];
    for (const uid of unlocked) {
      const el = row.querySelector(`[data-uid="${uid}"]`);
      if (!el) continue;
      const was = el.className;
      // the card brightens, nothing more: an "after X" badge over its portrait hid the picture (w2a #37)
      el.classList.remove('dim');
      el.setAttribute('data-after', after);
      done.push({ el, was, now: el.className });
    }
    // put back only what React hasn't redrawn since (a card it re-rendered keeps React's own class)
    return () => { for (const d of done) { d.el.removeAttribute('data-after'); if (d.el.className === d.now) d.el.className = d.was; } };
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
  const done = optionFor('pass'); // offered only in your own buy step
  const when = (t, opt) => {
    // what a click does (wave-2 tester A): one way to pay buys at once and says what it pays; several open the sheet
    if (opt) {
      const ways = viewer ? followerChoices(state, viewer, t) : [];
      return ways.length === 1 ? <>Pays <CostDots parts={Object.entries(ways[0]).filter(([, n]) => n > 0).map(([color, n]) => ({ color, n }))} /></> : 'Choose how to pay';
    }
    if (viewer && held < t.cost) return `You hold ${held}: ${t.cost - held} short.`;
    if (state.pending && state.pending.kind === 'place' && viewer && state.pending.player === viewer.id) return 'You recruit followers after you place a minion.';
    if (tierLeft(state, t) <= 0) return 'None left.';
    return 'You recruit followers after placing a minion.';
  };
  return (
    <div className="lt-rates" role="group" aria-label="Recruit followers">
      <span className="lt-rates-grid">
      {TIERS.map(t => {
        const opt = optionFor(`tier:${t.key}`);
        const left = tierLeft(state, t);
        // the lamp lights what you can buy now; while you buy the rest recede; otherwise what you can't afford is quieter
        const afford = viewer ? held >= t.cost && left > 0 : true;
        const look = opt ? ' can lit' : buying ? ' recede' : afford ? '' : ' dim';
        return (
          <button key={t.key} type="button" className={`fb lt-rate lt-card card paper${look}`} style={{ '--q': 'var(--any)' }} data-option={opt ? opt.id : undefined} aria-disabled={!opt}
            aria-haspopup="dialog" data-rate={t.key}
            aria-label={`Recruit ${t.get} follower${t.get > 1 ? 's' : ''}: pay ${t.cost} resources of any colors${t.limited ? ` (${left} left in this game)` : ''}`}
            onClick={e => (opt ? onPick(opt.id) : onDenied && onDenied({ type: 'tier', tier: t }, e.currentTarget))}>
            {/* your buy closes it (keyed by what you hold): after a buy it stayed open and flipped to "You hold 0: 10 short"
                (w2b #47); a rival's step no longer remounts it (snappy pair Q4) */}
            <Tip key={`${held}:${viewer ? viewer.bonus : ''}`} className="fb-tip" beside=".lt-rate" hint={`Recruit ${t.get} follower${t.get > 1 ? 's' : ''}: pay ${t.cost} resources of any colors`} content={() => (
              <div className="pop-card rate-card" data-rate-card={t.key}>
                <b>Recruit {t.get} follower{t.get > 1 ? 's' : ''}</b>
                <span>Pay {t.cost} resources, any colors, any mix, as your one recruit.</span>
                {/* one buy per placement (the rule): "as many as you like" beside "your one buy" read as a contradiction (w4 A#25) */}
                {t.limited && <span>{left} left at this table (2 per player at the start).</span>}
                <small data-pays={opt ? 'tier' : undefined}>{when(t, opt)}</small>
              </div>
            )}><span className="art rt-art"><span className="rt-trade"><b className="num get">{t.get}</b><FollowerGlyph size={28} /></span></span>
              <span className="nm">Followers</span><span className="ft"><CostShapes parts={[{ color: 'any', n: t.cost }]} />{t.limited ? <small className="rt-left num">{left} left</small> : null}</span><span className="hitbox" aria-hidden="true" /></Tip>
          </button>
        );
      })}
      </span>
      {/* ending your turn without buying (Cory, 2026-10-16: "pass is hard to find"): right under the follower buys, where
          the eye already is while you shop. Its room is kept when it isn't offered, so the shop never shifts as your buy
          step starts or ends (it's hidden then, and on phones folded away). */}
      <button type="button" className={`btn lt-done${done ? '' : ' idle'}`} data-option={done ? 'pass' : undefined} data-done-no-buy={done ? 'on' : 'off'}
        disabled={!done} tabIndex={done ? 0 : -1} aria-hidden={done ? undefined : 'true'}
        title={done ? (state.pending?.afterPurchase ? 'Finish your turn' : 'End your turn without recruiting') : undefined} onClick={() => done && onPick('pass')}>{state.pending?.afterPurchase ? 'End turn' : 'Done, no recruit'}</button>
    </div>
  );
}
