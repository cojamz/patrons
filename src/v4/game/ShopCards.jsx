// The Lamplit shop: ten cream cards (5×2 on a laptop, a swipe row on a phone) and one quiet follower-rate line.
// The member deck (face down, its count) heads the strip (MemberDeck.jsx). A card: timing tag, pixel figure, name, cost as shapes, worth. While placing, cards you can't
// afford are dim and a "✓ after X" tick marks the ones the space under your pointer would unlock (engine dry run).
// While buying, the figure gives way to the card's text; hover shows what you'd pay. On touch a tap opens the card
// as a sheet with Recruit (reading a card never recruits it); with a mouse a click on an affordable card recruits.
import { memo, useRef } from 'react';
import { cardDef, paymentPlan, TIERS, tierLeft, quadrant } from '../../engine/v4/index.js';
import { costParts } from '../format.js';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { realHover } from '../hover.js';
import { cardColor, onTable, usePreview, Tip } from './Info.jsx';
import { ResourceGlyph, FollowerGlyph } from './Glyphs.jsx';
import { timingOf, payBreakdown, unlockedBy, surely } from './cards.js';
void timingOf;
import { useHoverSpace } from './HoverCards.jsx';
import { MemberDeck, useDeal } from './MemberDeck.jsx';
import './lamp-b.css';

const sphereOf = (state, d) => { if (!onTable(state, d)) return 'colorless'; try { return quadrant(d.quadrant).resource; } catch { return 'colorless'; } };

/** A cost as shapes: "4 ● 2 ◍". */
export function CostShapes({ parts, size = 14 }) {
  if (!parts.length) return <span className="lt-cost free">free</span>;
  return (
    <span className="lt-cost" aria-label={parts.map(c => `${c.n} ${c.color === 'any' ? 'any' : c.color}`).join(' + ')}>
      {parts.map((c, k) => (
        <span key={k} className="lt-res"><b className="num">{c.n}</b>{c.color === 'any' ? <span className="pip wild" title={`${c.n} of any resources`} role="img" aria-label="any" /> : <ResourceGlyph r={c.color} n={c.n} size={size} />}</span>
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
  const pointer = useRef('mouse');
  const rowRef = useRef(null), deckRef = useRef(null);
  useDeal(rowRef, deckRef, state); // a refill comes off the deck
  const space = useHoverSpace(hover); // only the space under the pointer re-renders the shop (for its ticks)
  // the space under the pointer, and the cards its sure gains would unlock (no tick a choice might not give)
  // the preview comes from the cache (warmed in idle time, or the worker's answer): subscribed, so the ticks appear
  // the moment it lands, never computed on a hover
  const sp = placing && space && viewer ? space.split('-').map(Number) : null;
  const pv = usePreview(state, sp ? viewer.id : null, sp ? sp[0] : 0, sp ? sp[1] : 0);
  let after = null, unlocked = [];
  if (sp && pv) {
    after = quadrant(state.quadrants[sp[0]]).actions[sp[1]].name;
    unlocked = unlockedBy(state, viewer, surely(pv));
  }
  const pileOpts = buying ? pend.options.filter(o => o.kind === 'card' && o.fromPile).map(o => o.uid) : [];
  const uids = [...state.shop, ...pileOpts];
  const affordable = viewer ? uids.filter(u => paymentPlan(state, viewer, u)).length : 0;
  return (
    <section className="lt-shop-cards" data-phase={phase} aria-label="Shop">
      {/* one header line: the shop's title, then the follower rates (the strip's height is all cards) */}
      <div className="lt-shop-head">
        <h3 className="lt-h">Shop<small>{buying ? `${affordable} you can afford · hover to see the cost` : `${state.shop.length} face up`}</small></h3>
        <FollowerRates state={state} me={me} optionFor={optionFor} onPick={onPick} onDenied={onDenied} />
      </div>
      <div className="lt-shop-body">
      <MemberDeck state={state} hover={hover} deckRef={deckRef} />
      <div className="lt-cards" ref={rowRef}>
        {uids.map(uid => {
          const d = cardDef(state, uid);
          const opt = optionFor(`card:${uid}`);
          const can = viewer ? !!paymentPlan(state, viewer, uid) : false;
          const tick = unlocked.includes(uid);
          // buying: the lamp lights only what you can recruit, the rest recede (Cory); placing: what you can't
          // afford yet is quieter, except a card the space under your pointer would unlock
          const dim = viewer && ((buying && !opt) || (!buying && !can && !tick));
          const lit = buying && !!opt;
          const short = buying && !opt && viewer ? payBreakdown(state, viewer, uid).short : null;
          const parts = costParts(d, state.resources);
          const fromPile = !state.shop.includes(uid);
          return (
            <button
              key={uid} type="button" data-uid={uid} data-option={opt ? opt.id : undefined}
              className={`card lt-card paper${opt ? ' can' : ''}${dim ? (buying ? ' recede' : ' dim') : ''}${lit ? ' lit' : ''}`}
              style={{ '--q': cardColor(state, d) }} aria-disabled={!opt}
              aria-label={`${d.name}, ${timingOf(d)}, worth ${d.f}, costs ${parts.map(c => `${c.n} ${c.color}`).join(' + ') || 'nothing'}`}
              title={`${d.name} · worth ${d.f} · ${d.text}`}
              onPointerDown={e => { pointer.current = e.pointerType || 'mouse'; }}
              onPointerEnter={e => { if (hover && realHover(e)) hover.onCardHover(uid, e.currentTarget); }}
              onPointerLeave={e => { if (hover && e.pointerType === 'mouse') hover.onCardHover(uid, null); }}
              onClick={e => {
                // touch: a tap reads the card (a sheet with Recruit); it never recruits by itself
                if (pointer.current === 'touch' && hover) { hover.onCardHover(uid, e.currentTarget, { pinned: true }); return; }
                if (opt) onPick(opt.id); else if (onDenied) onDenied({ type: 'card', uid, name: d.name }, e.currentTarget);
              }}
            >
              {/* condensed (Cory): figure, name, cost, worth; the text and timing are on hover / tap */}
              <span className="band" aria-hidden="true" />
              <span className="art"><Sprite id={[d.id, spriteId(d.name)]} kind="member" sphere={sphereOf(state, d)} size={48} />
                {short && <span className="need" title={`You need ${short.text} more (after your discounts)`}>need {short.text}</span>}
                {fromPile && <span className="need from-pile" title="From the top of the pile (Insider)">pile</span>}
                {tick && <span className="tick" title={`You could afford it after ${after}`}>✓ {after}</span>}
              </span>
              <span className="nm">{d.name}</span>
              <span className="ft">
                <CostShapes parts={parts} />
                <span className="val" title={`Worth ${d.f} follower${d.f === 1 ? '' : 's'}${d.n > 1 ? `; counts as ${d.n} members` : ''}`}>
                  {d.f <= 3 ? Array.from({ length: d.f }, (_, k) => <FollowerGlyph key={k} size={11} title={`worth ${d.f}`} />) : <><FollowerGlyph size={11} title={`worth ${d.f}`} /><b className="num">×{d.f}</b></>}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      </div>
    </section>
  );
}

/** Memoized on its props: GameScreen passes the state and stable handlers, so the shop re-renders when the table
 *  changes, the space under the pointer changes (useHoverSpace) or that space's preview lands (usePreview). */
export default memo(ShopCards);

/** Followers for any resources: one quiet line of rates, each a button while you can buy it. */
export function FollowerRates({ state, me = null, optionFor = () => null, onPick, onDenied }) {
  // each rate explains itself on hover in any phase (RC1 panel: no hover while placing): the trade, what's left, and
  // when you can make it
  const viewer = me != null ? state.players[me] : null;
  const held = viewer ? Object.values(viewer.res).reduce((a, b) => a + (b || 0), 0) : null;
  const when = (t, opt) => {
    if (opt) return 'Yours to buy now: click it.';
    if (viewer && held < t.cost) return `You hold ${held}: ${t.cost - held} short.`;
    if (state.pending && state.pending.kind === 'place' && viewer && state.pending.player === viewer.id) return 'You buy after you place a minion, in your buy step.';
    if (tierLeft(state, t) <= 0) return 'None left.';
    return 'You buy in your buy step, after placing a minion.';
  };
  return (
    <div className="lt-rates" role="group" aria-label="Buy followers">
      <span className="lbl">Followers</span><small>for any resources</small>
      {TIERS.map(t => {
        const opt = optionFor(`tier:${t.key}`);
        const left = tierLeft(state, t);
        return (
          <button key={t.key} type="button" className={`fb lt-rate${opt ? ' can' : ''}`} data-option={opt ? opt.id : undefined} aria-disabled={!opt}
            aria-haspopup="dialog" data-rate={t.key}
            aria-label={`Pay ${t.cost} resources of any colors: +${t.get} follower${t.get > 1 ? 's' : ''}${t.limited ? ` (${left} left in this game)` : ''}`}
            onClick={e => (opt ? onPick(opt.id) : onDenied && onDenied({ type: 'tier', tier: t }, e.currentTarget))}>
            <Tip className="fb-tip" hint={`Pay ${t.cost} resources of any colors: +${t.get} follower${t.get > 1 ? 's' : ''}`} content={() => (
              <div className="pop-card rate-card" data-rate-card={t.key}>
                <b>{t.cost} resources → {t.get} follower{t.get > 1 ? 's' : ''}</b>
                <span>Any colors, any mix. It takes your one buy after a placement.</span>
                {t.limited ? <span>{left} left at this table (2 per player at the start).</span> : <span>Unlimited.</span>}
                <small>{when(t, opt)}</small>
              </div>
            )}><b className="num">{t.cost}</b> → <b className="num">{t.get}</b>{t.limited && <small className="num"> {left} left</small>}</Tip><span className="hitbox" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
