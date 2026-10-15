// Final results: ranking with the followers breakdown, then Play again.
import { followers, memberCount, TIERS } from '../../engine/v4/index.js';
import { breakdown, playerColor, winSentence, plural, contestLines, finalWinners } from '../format.js';
import { Tip, NamedText, asYou } from './Info.jsx';
import { Who } from './Glyphs.jsx';
import { Follower } from '../art/Follower.jsx';

export default function Results({ state, onPlayAgain, onHome, meId = null }) {
  // you are "You" ("Your contests"), never your seat's name
  const nm = p => (p.id === meId ? 'You' : p.name);
  const poss = p => (p.id === meId ? 'Your' : `${p.name}’s`);
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
      <h2 className="win" style={{ '--pc': playerColor(ranked[0].id) }} data-winners={winners.map(p => p.id).join(',')} data-top={top}>
        <span>{winners.map(nm).join(' & ')}</span> {winners.length > 1 ? 'tie' : winners[0].id === meId ? 'win' : 'wins'} with <span className="num big">{top}</span> followers
      </h2>
      <p className="why" data-why>{meId != null ? asYou(winSentence(state), state.players[meId].name) : winSentence(state)}</p>
      <div className="table-scroll">
        <table className="res-t">
          <thead>
            <tr><th>#</th><th>Player</th><th>Followers</th><th title="Followers your members are worth (the follower mark on each card)">From members <Follower /></th><th title={`The ${TIERS.map(t => `+${t.get}`).join(' / ')} follower buys`}>Bought</th><th title="Followers from members' abilities during play (e.g. Proselytizer)">Abilities</th><th title="The rims' prizes won at round end">Prizes</th><th title="End-game member bonuses (e.g. Patriarch, Tycoon)">End-game</th></tr>
          </thead>
          <tbody>
            {ranked.map((p, k) => {
              const b = breakdown(state, p);
              return (
                <tr key={p.id} className={k === 0 ? 'first' : ''}>
                  <td className="rank" data-label="#">{rankOf[k]}{shared(rankOf[k]) ? '=' : ''}</td>
                  <td className="who"><Who state={state} id={p.id} meId={meId} />{p.kind === 'bot' ? ' · bot' : ''}<small>{plural(memberCount(state, p), 'member')}</small></td>
                  <td className="tot" data-label="Followers" title={`${followers(state, p)} = 1 (yourself) + ${b.members} from members + ${b.bought} bought + ${b.effects} from abilities + ${b.contests} from prizes + ${b.endGame} end-game`}>{followers(state, p)}</td>
                  <td data-label="From members" title={`What ${p.id === meId ? 'your' : `${p.name}'s`} ${plural(p.members.length, 'member')} are worth at the end`}>{b.members}</td>
                  <td data-label="Bought" title={`Follower buys: ${b.bought} followers bought with resources`}>{b.bought}</td>
                  <td data-label="Abilities" title="Followers from members' abilities during play">{b.effects}</td>
                  <td data-label="Prizes" data-contests={p.id}>
                    {/* each contest won, with its own followers (never the contests' total under one name) */}
                    <Tip label={`${poss(p)} prizes`} content={() => {
                      const lines = contestLines(state, p);
                      return (
                        <div className="pop-card contest-sum">
                          <b>{poss(p)} prizes: +{b.contests}</b>
                          {lines.length ? lines.map(l => <span key={l.rule} style={{ '--c': `var(--${l.qid})` }} data-contest-line={l.qid}>{l.text}</span>) : <span>No prizes won.</span>}
                        </div>
                      );
                    }}>{b.contests}</Tip>
                  </td>
                  <td data-label="End-game bonuses">
                    <Tip label={`${poss(p)} end-game bonuses`} content={() => (
                      <div className="pop-card"><b>{poss(p)} end-game bonuses: {b.endGame >= 0 ? '+' : ''}{b.endGame}</b>
                        {b.parts.length ? <span><NamedText state={state} text={b.parts.join(', ')} /></span> : <span>No member scored at game end.</span>}</div>
                    )}>{b.endGame}</Tip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* (no "Yourself" column: it was 1 on every row; the total's hover counts it) */}
      <p className="hint">Abilities: followers from members’ abilities during play. Prizes: the rims’ round-end prizes. End-game: members that score when the game ends.</p>
      {brokeTie && <p className="hint">Tied on followers: more members breaks the tie.</p>}
      {ranked.some(p => p.final && p.final.parts.length) && (
        <ul className="parts">
          {ranked.filter(p => p.final && p.final.parts.length).map(p => (
            <li key={p.id}><b style={{ color: playerColor(p.id) }}>{nm(p)}</b> <NamedText state={state} text={p.final.parts.join(' · ')} /></li>
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
