// Final results: ranking with the followers breakdown, then Play again.
import { followers, memberCount } from '../../engine/v4/index.js';
import { breakdown, playerColor } from '../format.js';

export default function Results({ state, onPlayAgain, onHome }) {
  const ranked = (state.ranking || state.players.map(p => p.id)).map(id => state.players[id]);
  const top = followers(state, ranked[0]);
  return (
    <section className="results" aria-label="Final results">
      <h2 className="win" style={{ '--pc': playerColor(ranked[0].id) }}>
        <span>{ranked.filter(p => followers(state, p) === top).map(p => p.name).join(' & ')}</span> wins with {top} followers
      </h2>
      <div className="table-scroll">
        <table className="res-t">
          <thead>
            <tr><th>#</th><th>Player</th><th>Followers</th><th title="Followers printed on members">From members</th><th title="Ring contests won at round end">Contests</th><th title="Followers bought, plus followers members gave during play">Bought</th><th title="End-game member bonuses">End game</th><th>Self</th></tr>
          </thead>
          <tbody>
            {ranked.map((p, k) => {
              const b = breakdown(state, p);
              return (
                <tr key={p.id} className={k === 0 ? 'first' : ''}>
                  <td>{k + 1}</td>
                  <td style={{ color: playerColor(p.id) }}>{p.name}{p.kind === 'bot' ? ' · bot' : ''}<small>{memberCount(state, p)} members</small></td>
                  <td className="tot">{followers(state, p)}</td>
                  <td>{b.members}</td>
                  <td>{b.contests}</td>
                  <td>{b.bought}</td>
                  <td title={b.parts.join(', ')}>{b.endGame}</td>
                  <td>1</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {ranked.some(p => p.final && p.final.parts.length) && (
        <ul className="parts">
          {ranked.filter(p => p.final && p.final.parts.length).map(p => (
            <li key={p.id}><b style={{ color: playerColor(p.id) }}>{p.name}</b> {p.final.parts.join(' · ')}</li>
          ))}
        </ul>
      )}
      <div className="row-btns">
        {onPlayAgain && <button type="button" className="btn pri" onClick={onPlayAgain} data-play-again>Play again</button>}
        {onHome && <button type="button" className="btn" onClick={onHome}>Home</button>}
      </div>
    </section>
  );
}
