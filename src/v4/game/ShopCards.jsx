// The Lamplit shop: ten cream cards (5×2 on a laptop, a swipe row on a phone) and one quiet follower-rate line.
// A card: timing tag, pixel figure, name (◆ when badged), cost as shapes, worth. While placing, cards you can't
// afford are dim and a "✓ after X" tick marks the ones the space under your pointer would unlock (engine dry run).
// While buying, the figure gives way to the card's text; hover shows what you'd pay. On touch a tap opens the card
// as a sheet with Recruit (reading a card never recruits it); with a mouse a click on an affordable card recruits.
import { useRef } from 'react';
import { cardDef, paymentPlan, TIERS, tierLeft, quadrant } from '../../engine/v4/index.js';
import { costParts } from '../format.js';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { realHover } from '../hover.js';
import { BadgeMark, cardColor, onTable, peekPreview } from './Info.jsx';
import { ResourceGlyph, FollowerGlyph } from './Glyphs.jsx';
import { timingOf, payBreakdown, unlockedBy, surely } from './cards.js';
void timingOf;
import { useHoverSpace } from './HoverCards.jsx';
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

export default function ShopCards({ state, me, mySeats = [], optionFor = () => null, onPick, onDenied, phase, hover = null }) {
  const pend = state.pending;
  const viewer = me != null ? state.players[me] : null;
  const mine = !!(pend && mySeats.includes(pend.player));
  const buying = mine && pend.kind === 'buy';
  const placing = mine && pend.kind === 'place';
  const pointer = useRef('mouse');
  const space = useHoverSpace(hover); // only the space under the pointer re-renders the shop (for its ticks)
  // the space under the pointer, and the cards its sure gains would unlock (no tick a choice might not give)
  let after = null, unlocked = [];
  if (placing && space && viewer) {
    const [q, i] = space.split('-').map(Number);
    const a = quadrant(state.quadrants[q]).actions[i];
    let pv = null;
    pv = peekPreview(state, viewer.id, q, i) || null; // cached (warmed in idle time); a hover never computes
    if (pv) { after = a.name; unlocked = unlockedBy(state, viewer, surely(pv)); }
  }
  const pileOpts = buying ? pend.options.filter(o => o.kind === 'card' && o.fromPile).map(o => o.uid) : [];
  const uids = [...state.shop, ...pileOpts];
  const affordable = viewer ? uids.filter(u => paymentPlan(state, viewer, u)).length : 0;
  return (
    <section className="lt-shop-cards" data-phase={phase} aria-label="Shop">
      <h3 className="lt-h">Shop<small>{buying ? `${affordable} you can afford · hover to see the cost` : `${state.shop.length} face up · ${state.pile.length} in the pile`}</small></h3>
      <div className="lt-cards">
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
                {short && <span className="need" title={`You need ${short.total} more`}>need {short.total}</span>}
                {fromPile && <span className="need from-pile" title="From the top of the pile (Insider)">pile</span>}
                {tick && <span className="tick" title={`You could afford it after ${after}`}>✓ {after}</span>}
              </span>
              <span className="nm">{d.name}<BadgeMark state={state} def={d} /></span>
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
      <FollowerRates state={state} optionFor={optionFor} onPick={onPick} onDenied={onDenied} />
    </section>
  );
}

/** Followers for any resources: one quiet line of rates, each a button while you can buy it. */
export function FollowerRates({ state, optionFor = () => null, onPick, onDenied }) {
  return (
    <div className="lt-rates" role="group" aria-label="Buy followers">
      <span className="lbl">Followers</span><small>for any resources</small>
      {TIERS.map(t => {
        const opt = optionFor(`tier:${t.key}`);
        const left = tierLeft(state, t);
        return (
          <button key={t.key} type="button" className={`fb lt-rate${opt ? ' can' : ''}`} data-option={opt ? opt.id : undefined} aria-disabled={!opt}
            title={`Pay ${t.cost} resources of any colors: +${t.get} follower${t.get > 1 ? 's' : ''}${t.limited ? ` (${left} left in this game${t.clock ? '; the last one ends the game after that round' : ''})` : ''}`}
            onClick={e => (opt ? onPick(opt.id) : onDenied && onDenied({ type: 'tier', tier: t }, e.currentTarget))}>
            <b className="num">{t.cost}</b> → <b className="num">{t.get}</b>{t.limited && <small className="num"> {left} left</small>}
          </button>
        );
      })}
    </div>
  );
}
