// Round end as a moment: each quadrant's winner with a +N chip, follower totals ticking up (contests split from
// everything else gained this round), then the button that starts the next round.
import { useEffect, useRef, useState } from 'react';
import { followers } from '../../engine/v4/index.js';
import { playerColor, roman, standings, scoredStandings, roundGains, membersParts, tiebreakNote, workersNote, firstPickWhy } from '../format.js';
import Tick from './Tick.jsx';
import { ruleWords } from '../shorts.js';
import { useDialog } from './parts.jsx';
import { Tip, ContestStandings, NamedText } from './Info.jsx';
import { Who } from './Glyphs.jsx';
import { Follower } from '../art/Follower.jsx';

export default function RoundEnd({ info, onNext, autoMs, meId = null }) {
  const { result, start, after, board } = info;
  const at = board || after; // the table at the moment of scoring
  // The contests exactly as the engine scored them (state.contests); an old save without the record re-reads the
  // engine's contest table on the scoring snapshot. Every number and winner below comes from one of those two.
  const roundNo = ['I', 'II', 'III'].indexOf(result.round) + 1;
  const counts = scoredStandings(after, roundNo) || standings(at).map(st => ({ ...st, leaders: result.rows.find(r => r.qid === st.qid)?.winners || [] }));
  const rows = counts.map(st => ({ ...st, rule: ruleWords(st.qid, st.rule), winners: st.leaders, v: st.prize ?? result.rows.find(r => r.qid === st.qid)?.v ?? 0 }));
  const box = useDialog(onNext);
  useEffect(() => {
    const onKey = e => { if (e.key === 'Enter' && !e.defaultPrevented) { e.preventDefault(); onNext(); } };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onNext]);
  // a body taller than the card scrolls, and says so with a fade at the bottom edge
  const body = useRef(null);
  const [more, setMore] = useState(false);
  useEffect(() => {
    const el = body.current;
    if (!el) return undefined;
    const check = () => setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
    check();
    el.addEventListener('scroll', check, { passive: true });
    addEventListener('resize', check);
    const t = setTimeout(check, 400);
    return () => { el.removeEventListener('scroll', check); removeEventListener('resize', check); clearTimeout(t); };
  }, []);
  useEffect(() => {
    if (!autoMs) return undefined;
    const t = setTimeout(onNext, autoMs);
    return () => clearTimeout(t);
  }, [autoMs, onNext]);

  const name = id => (id === meId ? 'You' : after.players[id].name); // you are "You", never your seat's name
  const contest = id => rows.reduce((s, r) => s + (r.winners.includes(id) ? r.v : 0), 0);
  // The totals: after the last round they're the game's final totals, end-game bonuses in, the same numbers the
  // results show (live panel r1: this card said 72 where the results said 73, a Kingpin's +1 "still to add"). Before
  // that, the table as scored (the next round's start income comes after this card).
  const tot = after.over ? after : at;
  const finalOf = p => (after.over && after.players[p.id].final ? after.players[p.id].final.total : 0);
  const shownTotal = p => followers(tot, tot.players[p.id]);
  // in the results' order once the game is over (members break a follower tie)
  const ranked = after.over && Array.isArray(after.ranking) ? after.ranking.map(id => after.players[id]) : [...after.players].sort((a, b) => shownTotal(b) - shownTotal(a));
  const finalParts = after.over ? after.players.filter(p => p.final && p.final.parts.length) : [];
  // members that score at game end and came to nothing ("Kingpin +0"): said, never "no end-game bonuses" over them
  const zeroOf = p => (p.final && p.final.zero ? p.final.zero.map(z => `${z.name} +0`) : []);
  const zeroParts = after.over && !finalParts.length ? after.players.filter(p => zeroOf(p).length) : [];
  const first = !after.over && after.order && after.order.length ? after.players[after.order[0]] : null;
  const why = first ? firstPickWhy(after, first.id) : null;
  const whyFirst = !why || why === 'fewest followers' ? why : `${first.id === meId ? 'you have' : 'they have'} ${why}, a member who always picks first`;
  return (
    <div className="overlay moment" role="dialog" aria-modal="true" aria-label={`Round ${result.round} scoring`}>
      <div className="dialog roundend" ref={box}>
        <h2>Round {result.round} scored</h2>
        <div className={`re-body${more ? ' more' : ''}`} ref={body}>
        {/* the last round: the end-game bonuses lead, so the lines that can decide a close game are never below the fold
            (RC1 panel: "More below ↓" hid them in a one-point game) */}
        {/* …and with none, a quiet line at the foot says the totals are final (w3a #49: "none this game" led the summary) */}
        {after.over && finalParts.length > 0 && (
          <p className="re-next re-final" data-final-bonuses={finalParts.length}>
            <b>End-game bonuses</b>, in these totals:{' '}
            {after.players.filter(p => p.final && (p.final.parts.length || zeroOf(p).length)).map((p, k) => <span key={p.id} data-final-bonus={p.id}>{k ? ' · ' : ''}<b>{name(p.id)}</b> <NamedText state={after} text={[...p.final.parts, ...zeroOf(p)].join(', ')} /></span>)}
          </p>
        )}
        <ul className="re-rows">
          {rows.map(r => (
            <li key={r.qid} style={{ '--c': `var(--${r.qid})` }} className={r.winners.length ? '' : 'none'} data-qid={r.qid} data-winners={r.winners.join(',')}>
              <span className="re-q"><i /><span>
                <Tip className="re-rule" label={`${r.rule}: what it counts and every count`} content={() => <ContestStandings state={at} st={r} scored />}>{r.rule}</Tip>
                {r.tiebreak && <small className="re-tb">{r.tiebreak.text}</small>}
                {/* "Most full sets" was never defined on screen (live panel r1) */}
                {/full sets?\b/i.test(r.rule) && <small className="re-tb" data-full-set>one of each color makes a set</small>}
              </span></span>
              <span className="re-w">
                <span className="re-win">
                  {r.winners.length
                    ? r.winners.map((id, k) => <b key={id}>{k ? ' & ' : ''}<Who state={after} id={id} meId={meId} /></b>)
                    : <em>no one scored</em>}
                </span>
                {/* "P2: 2", never "P2 2" (w3b: it read as "P22") */}
                <small className="re-counts num">
                  {r.rows.map(row => {
                    const tb = tiebreakNote(r, row);
                    return <span key={row.id} className={r.winners.includes(row.id) ? 'won' : ''} data-pid={row.id} data-count={row.shown}>{name(row.id)}: <b className="n">{row.shown}</b>{tb ? <small> ({tb})</small> : null}</span>;
                  })}
                </small>
              </span>
              <Tip className="re-chip num" label={`plus ${r.v} followers`} content={() => <div className="pop-card"><b>{r.rule}: +{r.v} followers</b><span>{r.winners.length ? `Round ${result.round}'s prize, to ${r.winners.map(id => (id === meId ? 'you' : after.players[id].name)).join(' and ')} (ties all score).` : `Round ${result.round}'s prize: nobody scored it.`}</span></div>}>+{r.v}<Follower size={11} title="followers" /></Tip>
            </li>
          ))}
        </ul>
        <div className="re-totals" role="table" aria-label="Followers after this round">
          <div className="re-head" role="row"><span role="columnheader">By followers</span><span role="columnheader" title="The rims' prizes this round (above)">Prizes</span><span role="columnheader" title="Followers gained this round otherwise: what new members are worth, followers bought, and followers won or lost during play (members' abilities, spaces, sales and raids), as the results count them">This round</span><span role="columnheader">Followers</span></div>
          {ranked.map(p => {
            const now = shownTotal(p);
            const was = start && start.players[p.id] ? followers(start, start.players[p.id]) : now;
            const c = contest(p.id);
            const fin = finalOf(p);
            const g0 = start ? roundGains(start, at, p, c) : null;
            const other = now - was - c;
            // (a save whose scoring snapshot can't be rebuilt reads the finished table: its end-game bonuses aren't "won")
            let g = g0 && at === tot && fin ? { ...g0, effects: g0.effects - fin } : g0;
            // followers bought: the engine's own count (p.bought), the number the results show, never re-read from the log
            // (round 3 skeptic: "+5 bought" here, "Bought 9" for 8 there)
            const eb = start && start.players[p.id] && typeof at.players[p.id].bought === 'number' ? at.players[p.id].bought - (start.players[p.id].bought || 0) : null;
            if (g && eb != null && eb !== g.bought) g = { ...g, effects: g.effects + g.bought - eb, bought: eb };
            // RC1 sweep 84: "+2 from members" (they hold 4) meant the members recruited this round; "+1 effects" had no source
            const play = g && g.effects ? `${g.effects > 0 ? '+' : '−'}${Math.abs(g.effects)}` : null;
            const endGame = fin ? `${fin > 0 ? '+' : '−'}${Math.abs(fin)}` : null;
            // short in the cell (w4b #30: it wrapped to three lines), whole in its hover, as the results' numbers open (w4b #10)
            // "+2 in play" was jargon (blind testers, 2026-10-15): won or lost, in plain words; the sources are in its hover
            // "+1 new members" read as a count of members (live panel r1): it's followers, so "from new members"
            const why = g ? [...membersParts(g).map(t => t.replace(/ that left$/, ' who left')), g.bought && `+${g.bought} bought`, play && `${play} ${g.effects > 0 ? 'won' : 'lost'}`, endGame && `${endGame} end-game`].filter(Boolean).join(' · ') : '';
            const whyLong = g ? [...membersParts(g).map(t => t.replace(/ that left$/, ' who left')), g.bought && `+${g.bought} followers bought`, play && `${play} won or lost during play (members' abilities, spaces)`, endGame && `${endGame} from end-game bonuses`].filter(Boolean) : [];
            return (
              <div key={p.id} className="re-p" role="row" style={{ '--pc': playerColor(p.id) }} data-total={`${p.id}:${now}`}>
                <span className="nm" role="cell"><Who state={after} id={p.id} meId={meId} /></span>
                <span className="re-d num" role="cell">{c ? `+${c}` : '—'}</span>
                {/* the parts whenever there are any, even when they cancel out (live panel r1: P4 recruited 3 and lost 3 to a
                    sale, and the cell said "—") */}
                <span className="re-d num" role="cell" data-this-round={p.id}>{other || whyLong.length ? (whyLong.length ? <Tip label={`${p.id === meId ? 'Your' : `${p.name}’s`} followers this round`} content={() => <div className="pop-card"><b>{p.id === meId ? 'Your' : `${p.name}’s`} followers this round, besides prizes: {other > 0 ? '+' : other < 0 ? '−' : ''}{Math.abs(other)}</b>{whyLong.map(t => <span key={t}>{t}</span>)}</div>}>{why}</Tip> : `${other > 0 ? '+' : '−'}${Math.abs(other)}`) : '—'}</span>
                <Tick value={now} from={was} color="var(--ink)" className="re-f num" dur={700} float={false} />
              </div>
            );
          })}
        </div>
        {after.over && !finalParts.length && (zeroParts.length
          ? <p className="hint re-final" data-final-bonuses="0">End-game bonuses came to nothing:{' '}
            {zeroParts.map((p, k) => <span key={p.id} data-final-zero={p.id}>{k ? ' · ' : ''}<b>{name(p.id)}</b> <NamedText state={after} text={zeroOf(p).join(', ')} /></span>)}. These totals are final.</p>
          : <p className="hint re-final" data-final-bonuses="0">No end-game bonuses: these totals are final.</p>)}
        {/* why they pick first, in words (live panel r1: "P3 picks first: Front-runner" never said what Front-runner was) */}
        {first && <p className="hint" data-first-pick>Round {roman(after.round)} · <span className="num">{workersNote(after)}</span> · {first.id === meId ? 'You pick' : `${first.name} picks`} first{whyFirst ? <>: <NamedText state={after} text={whyFirst} /></> : ''}</p>}
        {/* the spaces change with the round: say so as it happens (live panel r1: "faces change by round without saying so") */}
        {first && after.round >= 2 && <p className="hint" data-round-news>New this round: the {after.round === 2 ? 'middle' : 'inner'} ring opens, and spaces that say “more each round” pay more.</p>}
        </div>
        {more && <span className="re-more" aria-hidden="true">More below</span>}
        <div className="re-foot">
        <button type="button" className="btn pri" data-next-round data-autofocus onClick={onNext}>
          {after.over ? 'See results' : `Start round ${roman(after.round)}`}
        </button>
        </div>
      </div>
    </div>
  );
}
