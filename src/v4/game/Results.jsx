// Final results: ranking with the followers breakdown, then Play again.
import { followers, memberCount, TIERS } from '../../engine/v4/index.js';
import { breakdown, playerColor, winSentence, plural, contestLines, finalWinners } from '../format.js';
import { Tip, NamedText } from './Info.jsx';
import { Who } from './Glyphs.jsx';
import { Follower } from '../art/Follower.jsx';

export default function Results({ state, onPlayAgain, onHome }) {
  const ranked = (state.ranking || state.players.map(p => p.id)).map(id => state.players[id]);
  const top = followers(state, ranked[0]);
  // Ranks with ties: same followers and members share a rank ("1="); members break follower ties.
  const key = p => `${followers(state, p)}|${memberCount(state, p)}`;
  const rankOf = ranked.map((p, k) => ranked.findIndex(o => key(o) === key(p)) + 1);
  const shared = r => rankOf.filter(x => x === r).length > 1;
  // the winners are the rule's (format.js finalWinners), the same call the game-over cults use, so the two never disagree
  const winners = finalWinners(state).map(id => state.players[id]);
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
            <tr><th>#</th><th>Player</th><th>Followers</th><th title="Followers your members are worth (the follower mark on each card)">From members <Follower /></th><th title={`The ${TIERS.map(t => `+${t.get}`).join(' / ')} follower buys`}>Bought</th><th title="Effects: followers from members' abilities during play (e.g. Proselytizer)">Effects</th><th title="Ring contests won at round end">Contests</th><th title="End-game member bonuses (e.g. Patriarch, Tycoon)">End-game bonuses</th><th title="You count as 1 follower">Yourself</th></tr>
          </thead>
          <tbody>
            {ranked.map((p, k) => {
              const b = breakdown(state, p);
              return (
                <tr key={p.id} className={k === 0 ? 'first' : ''}>
                  <td className="rank" data-label="#">{rankOf[k]}{shared(rankOf[k]) ? '=' : ''}</td>
                  <td className="who"><Who state={state} id={p.id} />{p.kind === 'bot' ? ' · bot' : ''}<small>{plural(memberCount(state, p), 'member')}</small></td>
                  <td className="tot" data-label="Followers" title={`${followers(state, p)} = 1 (yourself) + ${b.members} from members + ${b.bought} bought + ${b.effects} effects + ${b.contests} contests + ${b.endGame} end-game`}>{followers(state, p)}</td>
                  <td data-label="From members" title={`What ${p.name}'s ${plural(p.members.length, 'member')} are worth at the end`}>{b.members}</td>
                  <td data-label="Bought" title={`Follower buys: ${b.bought} followers bought with resources`}>{b.bought}</td>
                  <td data-label="Effects" title="Followers from members' abilities during play">{b.effects}</td>
                  <td data-label="Contests" data-contests={p.id}>
                    {/* each contest won, with its own followers (never the contests' total under one name) */}
                    <Tip label={`${p.name}'s contests`} content={() => {
                      const lines = contestLines(state, p);
                      return (
                        <div className="pop-card contest-sum">
                          <b>{p.name}’s contests: +{b.contests}</b>
                          {lines.length ? lines.map(l => <span key={l.rule} style={{ '--c': `var(--${l.qid})` }} data-contest-line={l.qid}>{l.text}</span>) : <span>No contests won.</span>}
                        </div>
                      );
                    }}>{b.contests}</Tip>
                  </td>
                  <td data-label="End-game bonuses">
                    <Tip label={`${p.name}'s end-game bonuses`} content={() => (
                      <div className="pop-card"><b>{p.name}’s end-game bonuses: {b.endGame >= 0 ? '+' : ''}{b.endGame}</b>
                        {b.parts.length ? <span><NamedText state={state} text={b.parts.join(', ')} /></span> : <span>No member scored at game end.</span>}</div>
                    )}>{b.endGame}</Tip>
                  </td>
                  <td data-label="Self" title="You count as 1 follower yourself">1</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="hint">Effects: followers from members’ abilities during play. End-game bonuses: members that score when the game ends.</p>
      {brokeTie && <p className="hint">Tied on followers: more members breaks the tie.</p>}
      {ranked.some(p => p.final && p.final.parts.length) && (
        <ul className="parts">
          {ranked.filter(p => p.final && p.final.parts.length).map(p => (
            <li key={p.id}><b style={{ color: playerColor(p.id) }}>{p.name}</b> <NamedText state={state} text={p.final.parts.join(' · ')} /></li>
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
