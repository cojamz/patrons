import { Fragment, useMemo, useState } from 'react';
import { cardDef, quadrant, allQuadrantIds, roman } from '../../engine/v4/index.js';
import { CUT } from '../../engine/v4/content/cull.js';
import { costParts } from '../format.js';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { useDialog } from './parts.jsx';
import { cardColor, cardGround, onTable, MemberCard } from './Info.jsx';
import { CostShapes, WorthTag, nameFit } from './ShopCards.jsx';
import './deck-browser.css';

// A reference to the game's card types, grouped independently of the hidden draw order.
// Round decks: a member still waiting to be shuffled in carries `later` (the round it joins) and shows greyed.
export function deckCatalog(state) {
  const entries = new Map();
  const waitRound = new Map(Object.entries(state.waiting || {}).flatMap(([r, w]) => w.map(u => [u, Number(r)])));
  for (const card of Object.values(state.cards)) {
    const def = cardDef(state, card.uid);
    if (def.artifact || Object.values(state.artifacts || {}).includes(card.uid)) continue; // artifacts are not members
    if (entries.has(def.id)) { entries.get(def.id).copies++; continue; }
    const parts = costParts(def, state.resources);
    entries.set(def.id, { def, parts, copies: 1, cost: parts.reduce((n, p) => n + p.n, 0), color: onTable(state, def) ? def.quadrant : 'colorless', ...(waitRound.has(card.uid) ? { later: waitRound.get(card.uid) } : {}) });
  }
  const cards = [...entries.values()].sort((a, b) => a.cost - b.cost || a.def.name.localeCompare(b.def.name));
  const rows = [...state.quadrants.map(q => ({ key: q, name: quadrant(q).name, color: `var(--${q})` })), { key: 'colorless', name: 'Colorless', color: 'var(--any)' }].filter(r => cards.some(c => c.color === r.key))
    .sort((a, b) => cards.find(c => c.color === a.key).cost - cards.find(c => c.color === b.key).cost);
  return { cards, rows, prices: [...new Set(cards.map(c => c.cost))].sort((a, b) => a - b), ...otherColors(state) };
}
// The other colors' members, not in this game (Cory, 2026-10-23: "stuff not in the deck should still show up… a visual
// indicator what's on the board and what's not"): shown after this game's rows, dimmed, each row saying so.
function otherColors(state) {
  const ids = allQuadrantIds().filter(id => !state.quadrants.includes(id) && !quadrant(id).standIn);
  const others = [], otherRows = [];
  for (const id of ids) {
    const q = quadrant(id), defs = q.members.filter(d => !CUT.has(d.id) && !d.artifact);
    if (!defs.length) continue;
    for (const def of defs) {
      const parts = costParts(def, [...state.resources, q.resource]);
      others.push({ def, parts, copies: def.copies || 1, cost: parts.reduce((n, p) => n + p.n, 0), color: id, out: true });
    }
    otherRows.push({ key: id, name: q.name, color: `var(--${id})`, out: true });
  }
  others.sort((a, b) => a.cost - b.cost || a.def.name.localeCompare(b.def.name));
  return { others, otherRows };
}

export default function DeckBrowser({ state, onClose }) {
  const dialog = useDialog(onClose);
  const { cards: here, rows: hereRows, others, otherRows } = useMemo(() => deckCatalog(state), [state]);
  const cards = [...here, ...others], rows = [...hereRows, ...otherRows];
  const prices = [...new Set(cards.map(c => c.cost))].sort((a, b) => a - b);
  const [selectedId, select] = useState(null);
  const selected = cards.find(c => c.def.id === selectedId) || cards.find(c => c.color === rows[0]?.key);
  // a member of a color not in this game keeps its own color, so you can see what it would be
  const outIds = new Set(others.map(o => o.def.id));
  const tint = d => (outIds.has(d.id) ? `var(--${d.quadrant})` : cardColor(state, d));
  const art = d => <Sprite id={[d.id, spriteId(d.name)]} kind="member" sphere={onTable(state, d) || outIds.has(d.id) ? quadrant(d.quadrant).resource : 'colorless'} size={40} />;
  return <div className="overlay top deck-browser-overlay" role="dialog" aria-modal="true" aria-label="Browse members" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="dialog deck-browser" ref={dialog}>
      <header className="deck-browser-head"><div><h2>Members</h2><p>Every member type in this game · color down, price across · dimmed rows are colors not in this game{Object.keys(state.waiting || {}).length > 0 && ' · greyed members join the deck in a later round'}</p></div><button type="button" className="btn ghost" data-autofocus onClick={onClose} aria-label="Close member browser">Close</button></header>
      {selected && <article className={`db-selected${selected.out ? ' out' : ''}${selected.later ? ' later' : ''}`} data-deck-selected={selected.def.id} style={{ '--q': tint(selected.def) }}>
        {/* the same card as everywhere (Cory, Oct 29: "why are the member cards in mixed style") */}
        <MemberCard state={state} def={selected.def} />
        {(selected.out || selected.later || selected.copies > 1) && <p className="db-out-note">{selected.out ? 'Not in this game' : selected.later ? `Joins the deck in round ${roman(selected.later)}` : `${selected.copies} copies in the deck`}</p>}
      </article>}
      <div className="deck-browser-scroll" tabIndex={0} role="region" aria-label="Member cards by color and price">
        <div className="deck-browser-grid" style={{ gridTemplateColumns: `90px repeat(${prices.length}, minmax(114px, 1fr))` }}>
          <div className="db-corner">Price</div>
          {prices.map(price => <div className="db-price num" key={price} data-price={price}>{price === 0 ? 'Free' : price}</div>)}
          {rows.map((row, i) => <Fragment key={row.key}>
            {row.out && !rows[i - 1]?.out && <div className="db-divider" style={{ gridColumn: '1 / -1' }}>Not in this game</div>}
            <h3 className={`db-color${row.out ? ' out' : ''}`} style={{ '--row-color': row.color }}>{row.name}</h3>
            {prices.map(price => <div className={`db-cell${row.out ? ' out' : ''}`} key={price} data-deck-color={row.key} data-deck-price={price} {...(row.out ? { 'data-deck-out': '' } : {})}>
              {cards.filter(c => c.color === row.key && c.cost === price).map(({ def: d, later }) => <button type="button" className={`db-card card lt-card paper${later ? ' later' : ''}`} data-ground={outIds.has(d.id) ? undefined : cardGround(state, d)} key={d.id} {...(later ? { 'data-deck-later': later, title: `Joins the deck in round ${roman(later)}` } : {})} style={{ '--q': tint(d) }} data-deck-member={d.id} aria-pressed={selected?.def.id === d.id} onClick={() => select(d.id)}>
                <span className="lt-hd"><span className="lt-corner-cost num" aria-hidden="true">{costParts(d, state.resources).reduce((t, c) => t + c.n, 0)}</span><WorthTag d={d} sphere={onTable(state, d) || outIds.has(d.id) ? quadrant(d.quadrant).resource : 'colorless'} /><span className="nm" {...nameFit(d.name)}>{d.name}</span></span>
                <span className="art">{art(d)}</span><span className="ft"><CostShapes parts={costParts(d, state.resources)} /></span>
              </button>)}
            </div>)}
          </Fragment>)}
        </div>
      </div>
    </section>
  </div>;
}
