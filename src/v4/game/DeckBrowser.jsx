import { Fragment, useMemo, useState } from 'react';
import { cardDef, quadrant } from '../../engine/v4/index.js';
import { costParts } from '../format.js';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { useDialog } from './parts.jsx';
import { cardColor, onTable, CostDots } from './Info.jsx';
import { Rich } from './Rich.jsx';
import { FollowerGlyph } from './Glyphs.jsx';
import { memberTimingWords } from './memberTiming.js';
import './deck-browser.css';

// A reference to the game's card types, grouped independently of the hidden draw order.
export function deckCatalog(state) {
  const entries = new Map();
  for (const card of Object.values(state.cards)) {
    const def = cardDef(state, card.uid);
    if (entries.has(def.id)) { entries.get(def.id).copies++; continue; }
    const parts = costParts(def, state.resources);
    entries.set(def.id, { def, parts, copies: 1, cost: parts.reduce((n, p) => n + p.n, 0), color: onTable(state, def) ? def.quadrant : 'colorless' });
  }
  const cards = [...entries.values()].sort((a, b) => a.cost - b.cost || a.def.name.localeCompare(b.def.name));
  const rows = [...state.quadrants.map(q => ({ key: q, name: quadrant(q).name, color: `var(--${q})` })), { key: 'colorless', name: 'Colorless', color: 'var(--any)' }].filter(r => cards.some(c => c.color === r.key))
    .sort((a, b) => cards.find(c => c.color === a.key).cost - cards.find(c => c.color === b.key).cost);
  return { cards, rows, prices: [...new Set(cards.map(c => c.cost))].sort((a, b) => a - b) };
}

export default function DeckBrowser({ state, onClose }) {
  const dialog = useDialog(onClose);
  const { cards, rows, prices } = useMemo(() => deckCatalog(state), [state]);
  const [selectedId, select] = useState(null);
  const selected = cards.find(c => c.def.id === selectedId) || cards.find(c => c.color === rows[0]?.key);
  const art = d => <Sprite id={[d.id, spriteId(d.name)]} kind="member" sphere={onTable(state, d) ? quadrant(d.quadrant).resource : 'colorless'} size={40} />;
  return <div className="overlay top deck-browser-overlay" role="dialog" aria-modal="true" aria-label="Browse members" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="dialog deck-browser" ref={dialog}>
      <header className="deck-browser-head"><div><h2>Members</h2><p>Every member type in this game · color down, price across</p></div><button type="button" className="btn ghost" data-autofocus onClick={onClose} aria-label="Close member browser">Close</button></header>
      {selected && <article className="db-selected" data-deck-selected={selected.def.id} style={{ '--q': cardColor(state, selected.def) }}>
        <div className="db-selected-art">{art(selected.def)}</div>
        <div className="db-selected-words"><h3>{selected.def.name}</h3><p><Rich text={memberTimingWords(selected.def.text)} /></p>
          <footer><CostDots parts={selected.parts} /><span className="db-worth num">{selected.def.f}<FollowerGlyph size={13} /></span>{selected.copies > 1 && <small>{selected.copies} copies</small>}</footer>
        </div>
      </article>}
      <div className="deck-browser-scroll" tabIndex={0} role="region" aria-label="Member cards by color and price">
        <div className="deck-browser-grid" style={{ gridTemplateColumns: `90px repeat(${prices.length}, minmax(162px, 1fr))` }}>
          <div className="db-corner">Price</div>
          {prices.map(price => <div className="db-price num" key={price} data-price={price}>{price === 0 ? 'Free' : price}</div>)}
          {rows.map(row => <Fragment key={row.key}>
            <h3 className="db-color" style={{ '--row-color': row.color }}>{row.name}</h3>
            {prices.map(price => <div className="db-cell" key={price} data-deck-color={row.key} data-deck-price={price}>
              {cards.filter(c => c.color === row.key && c.cost === price).map(({ def: d }) => <button type="button" className="db-card" key={d.id} style={{ '--q': cardColor(state, d) }} data-deck-member={d.id} aria-pressed={selected?.def.id === d.id} onClick={() => select(d.id)}>
                <span className="db-art">{art(d)}</span><span className="db-card-name">{d.name}</span>
              </button>)}
            </div>)}
          </Fragment>)}
        </div>
      </div>
    </section>
  </div>;
}
