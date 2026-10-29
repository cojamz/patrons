// The spare minions (Cory, 2026-10-29: "show like a little minion pool during the game, and have them fly to players
// as they're gained becoming an emoji minion"). Each round has as many as the board has spaces beyond everyone's
// minions; an extra minion or extra turn takes one (director.js flies it to the seat), and with none left the cards
// that give one say so. None in round I, so the pool shows from round II on.
import { memo } from 'react';
import { minionPool } from '../../engine/v4/index.js';
import { Minion, ROBE } from '../art/Leader.jsx';
import { Tip } from './Info.jsx';
import './pool.css';

const words = n => (n
  ? `${n} spare minion${n === 1 ? '' : 's'} this round. A card or space that gives a minion or an extra turn takes one from here.`
  : 'No spare minions left this round. A card or space that gives a minion or an extra turn gives nothing now.');

export const MinionPool = memo(function MinionPool({ state }) {
  if (!(state.round >= 2) || state.over) return null;
  const n = minionPool(state);
  return (
    <Tip as="div" className="lt-pool" data-pool={n} label={words(n)} content={<p className="pool-tip">{words(n)}</p>}>
      <span className="pool-men" aria-hidden="true">
        {Array.from({ length: n }, (_, k) => (
          <i key={k} className="pool-min" data-pool-min={k}><Minion color={ROBE} size={18} /></i>
        ))}
      </span>
      {/* the picture a spare minion flies as (director.js) */}
      <i className="pool-src" aria-hidden="true"><Minion color={ROBE} size={18} /></i>
      <small className="pool-cap">{n ? 'spare minions' : 'no spare minions'}</small>
    </Tip>
  );
});
