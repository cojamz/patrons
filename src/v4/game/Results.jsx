// Final results: ranking with the followers breakdown, then Play again.
import { followers, memberCount, TIERS } from '../../engine/v4/index.js';
import { breakdown, playerColor, winSentence, plural, contestLines, finalWinners } from '../format.js';
import { Tip, NamedText, asYou } from './Info.jsx';
import { Who } from './Glyphs.jsx';

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
  const endCol = ranked.some(p => breakdown(state, p).endGame !== 0);
  const brokeTie = ranked.some((p, k) => k > 0 && followers(state, p) === followers(state, ranked[k - 1]) && key(p) !== key(ranked[k - 1]));
  return (
    <section className="results" aria-label="Final results">
      <h2 className="win" style={{ '--pc': playerColor(ranked[0].id) }} data-winners={winners.map(p => p.id).join(',')} data-top={top}>
        <span>{winners.map(nm).join(' & ')}</span> {winners.length > 1 ? 'tie' : winners[0].id === meId ? 'win' : 'wins'} with <span className="num big">{top}</span> followers
      </h2>
      <p className="why" data-why>{meId != null ? asYou(winSentence(state), state.players[meId].name) : winSentence(state)}</p>
      <div className="table-scroll">
        {/* every number opens what it's made of (w3b #52); a column that's the same for everyone folds away: "Yourself"
            (1 each) joins the members, and End-game shows only when some member scored at game end (w3a #40) */}
        <table className="res-t">
          <thead>
            <tr><th>#</th><th>Player</th><th>Followers</th><th>You &amp; members</th><th>Bought</th><th>During play</th><th>Prizes</th>{endCol && <th>End-game</th>}</tr>
          </thead>
          <tbody>
            {ranked.map((p, k) => {
              const b = breakdown(state, p);
              const n = plural(p.members.length, 'member');
              const sign = v => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}`;
              return (
                <tr key={p.id} className={k === 0 ? 'first' : ''}>
                  <td className="rank" data-label="#">{rankOf[k]}{shared(rankOf[k]) ? '=' : ''}</td>
                  <td className="who"><Who state={state} id={p.id} meId={meId} />{p.kind === 'bot' ? ' · bot' : ''}<small>{plural(memberCount(state, p), 'member')}</small></td>
                  <td className="tot" data-label="Followers">
                    <Tip label={`${poss(p)} followers`} content={() => (
                      <div className="pop-card"><b>{poss(p)} {followers(state, p)} followers</b>
                        <span>{b.self} for {p.id === meId ? 'yourself' : 'their leader'}, {b.members} from members, {b.bought} bought, {sign(b.effects)} during play, {b.contests} from prizes{endCol ? `, ${sign(b.endGame)} at game end` : ''}</span></div>
                    )}>{followers(state, p)}</Tip>
                  </td>
                  <td data-label="You & members" data-cult={p.id}>
                    <Tip label={`${poss(p)} leader and members`} content={() => (
                      <div className="pop-card"><b>{poss(p)} cult: {b.self + b.members}</b>
                        <span>{b.self} for {p.id === meId ? 'yourself' : 'the leader'} (everyone counts as 1), {b.members} from {p.id === meId ? 'your' : 'their'} {n} (the follower mark on each card)</span></div>
                    )}>{b.self + b.members}</Tip>
                  </td>
                  <td data-label="Bought">
                    <Tip label={`${poss(p)} follower buys`} content={() => (
                      <div className="pop-card"><b>{poss(p)} follower buys: {b.bought}</b>
                        <span>{b.bought ? `${b.bought} followers bought with resources (the ${TIERS.map(t => `${t.cost}→${t.get}`).join(', ')} trades)` : 'No followers bought.'}</span></div>
                    )}>{b.bought}</Tip>
                  </td>
                  <td data-label="During play" data-play={p.id}>
                    {/* each cause on its own line, losses negative: "Robin Hood +2 · P2's Raider −3 · Your Call +4" */}
                    <Tip label={`${poss(p)} followers during play`} content={() => (
                      <div className="pop-card"><b>{poss(p)} followers during play: {sign(b.effects)}</b>
                        {b.play.length ? b.play.map(l => <span key={l.label} data-play-line>{l.label} {l.n > 0 ? '+' : '−'}{Math.abs(l.n)}</span>) : <span>None won or lost during play.</span>}</div>
                    )}>{sign(b.effects)}</Tip>
                  </td>
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
                  {endCol && <td data-label="End-game">
                    <Tip label={`${poss(p)} end-game bonuses`} content={() => (
                      <div className="pop-card"><b>{poss(p)} end-game bonuses: {sign(b.endGame)}</b>
                        {b.parts.length ? <span><NamedText state={state} text={b.parts.join(', ')} /></span> : <span>No member scored at game end.</span>}</div>
                    )}>{sign(b.endGame)}</Tip>
                  </td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* the columns add up to the total; a word the rulebook doesn't use never explains one ("raids", w3a #40) */}
      <p className="hint">Point at any number to see what it's made of. During play: followers won or lost through members’ abilities and spaces. Prizes: the rims’ round-end prizes.{endCol ? ' End-game: members that score when the game ends.' : ''}</p>
      {brokeTie && <p className="hint">Tied on followers: more members breaks the tie.</p>}
      {ranked.some(p => p.final && p.final.parts.length) && (
        <ul className="parts">
          {ranked.filter(p => p.final && p.final.parts.length).map(p => (
            <li key={p.id}><b>{nm(p)}</b> <NamedText state={state} text={p.final.parts.join(' · ')} /></li>
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
