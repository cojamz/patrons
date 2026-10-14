// Final results: ranking with the followers breakdown, then Play again.
import { followers, memberCount } from '../../engine/v4/index.js';
import { breakdown, playerColor, winSentence, plural } from '../format.js';

export default function Results({ state, onPlayAgain, onHome }) {
  const ranked = (state.ranking || state.players.map(p => p.id)).map(id => state.players[id]);
  const top = followers(state, ranked[0]);
  // Ranks with ties: same followers and members share a rank ("1="); members break follower ties.
  const key = p => `${followers(state, p)}|${memberCount(state, p)}`;
  const rankOf = ranked.map((p, k) => ranked.findIndex(o => key(o) === key(p)) + 1);
  const shared = r => rankOf.filter(x => x === r).length > 1;
  const winners = ranked.filter((p, k) => rankOf[k] === 1);
  const brokeTie = ranked.some((p, k) => k > 0 && followers(state, p) === followers(state, ranked[k - 1]) && key(p) !== key(ranked[k - 1]));
  return (
    <section className="results" aria-label="Final results">
      <h2 className="win" style={{ '--pc': playerColor(ranked[0].id) }}>
        <span>{winners.map(p => p.name).join(' & ')}</span> {winners.length > 1 ? 'tie' : 'wins'} with <span className="num big">{top}</span> followers
      </h2>
      <p className="why" data-why>{winSentence(state)}</p>
      <div className="table-scroll">
        <table className="res-t">
          <thead>
            <tr><th>#</th><th>Player</th><th>Followers</th><th title="Followers printed on your members (the ★ on each card)">From members ★</th><th title="The +1 / +3 / +6 follower buys">Bought</th><th title="Followers members' effects gave during play (e.g. Proselytizer)">Effects in play</th><th title="Ring contests won at round end">Contests</th><th title="End-game member bonuses (e.g. Patriarch, Tycoon)">End-game bonuses</th><th title="You count as 1 follower">Self (1)</th></tr>
          </thead>
          <tbody>
            {ranked.map((p, k) => {
              const b = breakdown(state, p);
              return (
                <tr key={p.id} className={k === 0 ? 'first' : ''}>
                  <td className="rank" data-label="#">{rankOf[k]}{shared(rankOf[k]) ? '=' : ''}</td>
                  <td className="who" style={{ color: playerColor(p.id) }}>{p.name}{p.kind === 'bot' ? ' · bot' : ''}<small>{plural(memberCount(state, p), 'member')}</small></td>
                  <td className="tot" data-label="Followers">{followers(state, p)}</td>
                  <td data-label="From members ★">{b.members}</td>
                  <td data-label="Bought">{b.bought}</td>
                  <td data-label="Effects in play">{b.effects}</td>
                  <td data-label="Contests">{b.contests}</td>
                  <td data-label="End-game bonuses" title={b.parts.join(', ')}>{b.endGame}</td>
                  <td data-label="Self">1</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {brokeTie && <p className="hint">Tied on followers: more members breaks the tie.</p>}
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
