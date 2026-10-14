// The chronicle: the game log as a drawer (opened from the menu). Newest round first, every line in plain words,
// every member named in it opens its card.
import { useMemo } from 'react';
import { logSections, plainLine } from '../format.js';
import { useDialog } from './parts.jsx';
import { NamedText } from './Info.jsx';
import './lamp-b.css';

export default function Chronicle({ state, onClose }) {
  const box = useDialog(onClose);
  const sections = logSections(state);
  // names, colors and costs don't change in a game: one table object keeps the lines from re-rendering
  const table = useMemo(() => ({ seed: state.seed, quadrants: state.quadrants, resources: state.resources, cards: state.cards, players: state.players, shop: [] }), [state.seed, state.quadrants.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="lt-drawer-back" role="presentation" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="lt-drawer paper" role="dialog" aria-modal="true" aria-label="Chronicle" ref={box}>
        <header><h3>Chronicle</h3><button type="button" className="lt-btn" data-autofocus onClick={onClose}>Close</button></header>
        <div className="lt-chron">
          {sections.slice().reverse().map(s => (
            <section key={s.title}>
              <h4>{s.title}</h4>
              <ol>{s.lines.map((l, j) => <li key={j}><NamedText state={table} text={plainLine(state.log, s.start + j)} /></li>).reverse()}</ol>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}
