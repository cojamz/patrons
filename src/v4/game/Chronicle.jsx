// The chronicle: the game log as a drawer (opened from the menu or the "since your last turn" strip). Newest round
// first, every line in plain words, every space and member named in it opens its card on the board's hover layer.
import { useMemo } from 'react';
import { logSections, plainLine } from '../format.js';
import { useDialog } from './parts.jsx';
import { NamedText, asYou } from './Info.jsx';
import { HoverNames } from './HoverNames.jsx';
import './lamp-b.css';

export default function Chronicle({ state, onClose, meId = null, hover = null }) {
  const box = useDialog(onClose);
  const sections = logSections(state);
  const me = meId != null && state.players[meId] ? state.players[meId].name : null; // your lines read "You took…"
  // names, colors and costs don't change in a game: one table object keeps the lines from re-rendering
  const table = useMemo(() => ({ seed: state.seed, quadrants: state.quadrants, resources: state.resources, cards: state.cards, players: state.players, shop: [] }), [state.seed, state.quadrants.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="lt-drawer-back" role="presentation" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="lt-drawer paper" role="dialog" aria-modal="true" aria-label="The log" ref={box}>
        <header><h3>The log</h3><button type="button" className="lt-btn" data-autofocus onClick={onClose}>Close</button></header>
        <div className="lt-chron">
          {sections.slice().reverse().map(s => (
            <section key={s.title}>
              <h4>{s.title}</h4>
              <ol>{s.lines.map((l, j) => <li key={j}>{hover ? <HoverNames state={table} hover={hover} text={asYou(plainLine(state.log, s.start + j), me)} /> : <NamedText state={table} text={asYou(plainLine(state.log, s.start + j), me)} />}</li>).reverse()}</ol>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}
