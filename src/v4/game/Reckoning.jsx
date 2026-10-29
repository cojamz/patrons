// The Reckoning (Cory, 2026-10-14: "a little animation showing which cult wins each round prize"; 2026-10-15: "way too
// fast and confusing"). At round end the quadrants pay one at a time, slow enough to follow (~2.9s each): the lamp
// moves to that quadrant's rim plaque and the caption says what is counted; each player's count ticks up beside their
// leader; then the caption names the winner, their count pulses, and "+N" followers arc from the plaque to the
// winner's total, which climbs as it lands (not before: the chairs leave every unpaid prize out, GameScreen
// seatState). Ties pay every tied leader; "no one scores" passes quickly. A tap anywhere, Skip, Space, Enter or
// Escape goes straight to the summary.
// Every number is the engine's: the contests as scored (state.contests via scoredStandings), or the contest table on
// the scoring snapshot for an old save.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { scoredStandings, standings, playerColor, seatEmoji } from '../format.js';
import { Minion } from '../art/Leader.jsx';
import { stageClear } from './stage.js';
import { seatOrder } from './seats.js';
import { playerAnchor, motionOK, flyToken, expectArrival, pulse, track } from './flight.js';
import { MO, flightMs, slowed } from '../motion.js';
import { chainRunning, onChainEnd, onChainLanded } from './director.js';
import Tick from './Tick.jsx';
import { ruleWords } from '../shorts.js';
import { play } from '../sound.js';
import { cardDef } from '../../engine/v4/index.js';
import { finalGrants } from './finalScore.js';

// The pace (the motion language's B6, grammar.md; Cory: "readable, one quadrant at a time", then Oct 29: "a bit
// smoother, a bit quicker"): about 1.4s a rim at Steady, 0.55s Quick, 3.2s Relaxed, every step
// moving. The rim lights; the counts stamp in seat by seat and tick up (no still "counting…"); the leader's count and its emoji on the rim hop; the prize arcs off the rim's engraving to the winner's count, which
// rolls the moment it lands; a short rest; the next rim. A rim nobody scores pulses once, dim, and moves on.
// Every duration scales with the viewer's animation speed (src/v4/motion.js).

/** The round's contests as scored: [{ qid, rule, prize, rows:[{ id, shown }], winners:[ids] }]. */
export function reckonRows(info) {
  const { result, after, board } = info;
  const roundNo = ['I', 'II', 'III'].indexOf(result.round) + 1;
  const scored = scoredStandings(after, roundNo);
  const base = scored || standings(board || after).map(st => ({ ...st, leaders: result.rows.find(r => r.qid === st.qid)?.winners || [] }));
  return base.map(st => ({ qid: st.qid, rule: ruleWords(st.qid, st.rule), counts: st.counts || null, tiebreak: st.tiebreak || null, prize: st.prize ?? result.rows.find(r => r.qid === st.qid)?.v ?? 0, rows: st.rows, winners: st.leaders || [] }));
}

/** End-game member bonuses follow the contests, each credited to its member on the table. */
export function reckonSteps(info) {
  const contests = reckonRows(info);
  if (!info.after.over) return contests;
  const bonuses = info.after.players.flatMap(p => finalGrants(info.after, p).filter(g => g.n).map(g => ({
    key: `bonus:${p.id}:${g.uid ?? g.name}`, kind: 'bonus', uid: g.uid, pid: p.id,
    qid: g.uid != null ? cardDef(info.after, g.uid).quadrant : null,
    rule: g.name, counts: g.uid != null ? cardDef(info.after, g.uid).text : null,
    prize: g.n, rows: [{ id: p.id, shown: g.n }], winners: [p.id],
  })));
  return [...contests, ...bonuses];
}

/** Totals still to arrive, shared by the animation and seat display. */
export function unpaidFollowers(info, paid = 0) {
  return reckonSteps(info).slice(paid).reduce((out, r) => {
    for (const id of r.winners) {
      const p = out[id] ||= { bonus: 0, contest: 0 };
      p.bonus += r.prize;
      if (r.kind !== 'bonus') p.contest += r.prize;
    }
    return out;
  }, {});
}

/** Keep the scored board's positions, with final bonuses withheld until their animation lands. */
export function scoringSeatState(board, info, paid) {
  const owed = unpaidFollowers(info, paid);
  const out = { ...board, players: board.players.map(p => {
    const scored = info.after.over ? info.after.players[p.id] : p;
    return { ...p, bonus: scored.bonus - (owed[p.id]?.bonus || 0), contest: (scored.contest || 0) - (owed[p.id]?.contest || 0) };
  }) };
  // the closing move's effect stream (non-enumerable, so a spread drops it) stays with the state the table plays:
  // without it the director falls back to the state diff (Cory, 2026-10-17: followers flew out of the follower rates)
  // (only the scored board's own stream: the next round's state carries its round-start income too)
  if (board !== info.after && Array.isArray(board.effects)) Object.defineProperty(out, 'effects', { value: board.effects, enumerable: false, configurable: true, writable: true });
  return out;
}

export default function Reckoning({ info, root, onDone, onLamp, onPaid, meId = null }) {
  const [rows] = useState(() => reckonSteps(info));
  const [step, setStep] = useState(0); // which quadrant is paying (rows.length = finished)
  const [beat, setBeat] = useState(0); // within it: 0 counting, 1 the verdict (the prize in the air), 2 landed
  const [seen, setSeen] = useState(0); // how many seats' counts have stamped in so far
  const [atTop, setAtTop] = useState(false); // the card sits on the far side of the wheel from the rim it scores
  // laptop: the card stands still at the wheel's centre, inside every rim, so it never covers the rim being scored and the
  // eye doesn't chase it from top to bottom (w3b #51); phones keep the top/bottom flip
  const [mid, setMid] = useState(null);
  useLayoutEffect(() => {
    const stage = root && root.querySelector('.lt-wheel .stage');
    const b = stage && stage.getBoundingClientRect();
    if (!b || !b.width || typeof matchMedia !== 'function' || !matchMedia('(min-width:861px) and (min-height:500px)').matches) { setMid(null); return; }
    setMid({ left: Math.round(b.left + b.width / 2), top: Math.round(b.top + b.height / 2), w: Math.round(b.width * 0.78) });
  }, [root, info]);
  // Start the first competition as soon as the last action lands. Its own caption carries
  // the round cue; there is no separate pre-screen or fixed delay before scoring.
  const [ready, setReady] = useState(() => !chainRunning());
  useEffect(() => {
    if (ready) return undefined;
    const start = () => setReady(true);
    // at the last landing, not only the chain's end: a chain that starts during the settle adopts it and the old end
    // never fires, which left round end waiting forever on a slow laptop (v0.9.807); and a look every half second for
    // a table gone quiet with no word (a running show is still never cut short)
    const offEnd = onChainEnd(start), offLanded = onChainLanded(start);
    const net = setInterval(() => { if (!chainRunning()) start(); }, 500);
    if (!chainRunning()) start(); // close the subscription race
    return () => { offEnd(); offLanded(); clearInterval(net); };
  }, [ready]);
  useLayoutEffect(() => { if (ready) stageClear(); }, [ready]);
  const [spots, setSpots] = useState({}); // pid -> { left, top } of that player's chair, for the count chips
  const done = useRef(false);
  const finish = () => { if (!done.current) { done.current = true; onLamp && onLamp(null); onDone(); } };
  const reduced = !motionOK();

  // where each chair is, so a count can sit beside it
  useLayoutEffect(() => {
    if (!root) return;
    const out = {};
    for (const p of info.after.players) {
      // beside the chair, in the gap between the column and the wheel (the column of chairs, laptop), else beside
      // the leader; never over the chair's own name or numbers
      const seat = root.querySelector(`.lt > .lt-seat[data-pid="${p.id}"]`);
      const sr = seat && seat.getBoundingClientRect();
      // (in the rail's gutter at the chair's left: the turn order means nothing once the round is scored, and the wheel
      // now fills the gap on the chair's right; layout.css hides the order marks meanwhile)
      if (sr && sr.width && root.querySelector('.lt > .lt-snake')) { out[p.id] = { left: Math.max(4, sr.left - 46), top: sr.top + 24 }; continue; }
      const a = playerAnchor(root, p.id);
      if (!a) continue;
      const r = a.getBoundingClientRect();
      out[p.id] = { left: r.right + 6, top: r.top + r.height / 2 };
    }
    setSpots(out);
  }, [root, info]);

  // one quadrant at a time: light its plaque and count, name the winner, fly the prize, and only then pay the total
  useEffect(() => {
    if (!ready) return undefined;
    if (step >= rows.length) { finish(); return undefined; }
    const row = rows[step];
    setBeat(0);
    setSeen(0);
    if (onLamp) onLamp(row.kind === 'bonus' ? null : row.qid);
    if (typeof window !== 'undefined') window.__patronsReckon = (window.__patronsReckon || 0) + 1;
    const won = row.winners.length > 0;
    const member = row.kind === 'bonus' && root && [...root.querySelectorAll(`.lt-seat[data-pid="${row.pid}"] .cs-member[data-uids]`)].find(el => el.dataset.uids.split(' ').includes(String(row.uid)));
    const plaque = row.kind === 'bonus' ? member || (root && playerAnchor(root, row.pid)) : root && root.querySelector(`[data-plaque="${row.qid}"]`);
    // the card never covers the rim it scores: a rim in the wheel's lower half sends it to the top
    if (root && plaque) {
      const stage = root.querySelector('.lt-wheel .stage') || root.querySelector('.stage');
      const pr = plaque.getBoundingClientRect(), sr = stage ? stage.getBoundingClientRect() : null;
      setAtTop(!!(sr && pr.top + pr.height / 2 > sr.top + sr.height / 2));
    }
    const timers = [];
    let cancelled = false;
    // the next rim comes in one update with its beat and counts reset: stepping first showed the next rim's verdict
    // for a frame before its counting began (round-end smoothing, Oct 29)
    const advance = () => { setBeat(0); setSeen(0); setStep(s => s + 1); };
    if (reduced) {
      setSeen(row.rows.length); setBeat(1);
      timers.push(setTimeout(() => { if (onPaid) onPaid(step + 1); setBeat(2); }, 200), setTimeout(advance, 400));
      return () => timers.forEach(clearTimeout);
    }
    if (!won && !row.rows.some(r => r.shown > 0)) {
      // nobody scores and nobody counts: the rim pulses once, dim, and the Reckoning moves on
      if (plaque) pulse(plaque, MO.reckonQuiet);
      timers.push(setTimeout(() => setBeat(1), 60), setTimeout(advance, MO.reckonQuiet));
      return () => timers.forEach(clearTimeout);
    }
    // the counts stamp in seat by seat and tick up (the counting is the motion)
    row.rows.forEach((r, k) => timers.push(setTimeout(() => setSeen(n => Math.max(n, k + 1)), k * MO.reckonStagger)));
    const counted = (row.rows.length - 1) * MO.reckonStagger + MO.reckonTick;
    // the verdict: the leader's count and its emoji on the rim hop
    timers.push(setTimeout(() => {
      setBeat(1);
      // the winner cheers (Cory, 2026-10-15: "have the winning one cheer/jiggle and get the followers added to them"):
      // their column on the card jiggles (CSS), and in their chair the leader celebrates and the members hop
      for (const id of row.winners) cheer(root, id);
      for (const id of row.winners) {
        const e = root && root.querySelector(`[data-rim-leader="${id}"]`);
        if (e && e.animate) track(e.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-5px)', offset: 0.4 }, { transform: 'translateY(0)' }], { duration: MO.hop, easing: 'cubic-bezier(.3,1.4,.5,1)', composite: 'add' }));
      }
      if (won) play('fanfare'); // the winner's little flourish (sound.js)
      if (!won) timers.push(setTimeout(advance, MO.hop + MO.reckonRest));
    }, counted));
    if (won) timers.push(setTimeout(() => {
      // the prize lifts off the rim's engraving and arcs to the number it raises: the winner's total on their chair,
      // which rolls the moment it lands
      let landed = 0, longest = 0;
      const land = () => {
        if (cancelled || ++landed < row.winners.length) return;
        play('follower', { n: row.prize });
        for (const id of row.winners) {
          const home = root && root.querySelector(`.lt-cult-seat[data-seat="${id}"] .cs-total`);
          if (home) expectArrival(home, performance.now(), 0, true);
        }
        if (onPaid) onPaid(step + 1);
        setBeat(2);
        // the next rim lights while the total rolls on its chair (a still hold of roll + rest read as a stall, Oct 29)
        timers.push(setTimeout(advance, MO.reckonRest));
      };
      row.winners.forEach((id, k) => {
        const home = root && (root.querySelector(`.lt-cult-seat[data-seat="${id}"] .cs-total`) || playerAnchor(root, id));
        // the followers leave the winner's column on the card (their score), else the rim's engraving
        const col = document.querySelector(`.lt-reckon [data-reckon-col="${id}"] .rc-n`);
        const src = row.kind === 'bonus' ? plaque : col && col.getBoundingClientRect().width ? col : plaque;
        if (!src || !home) { land(); return; }
        const a = src.getBoundingClientRect(), b = home.getBoundingClientRect();
        // a little quicker than an ordinary flight of its length: it's the fourth of four, and its source is lit (Oct 29)
        const d = Math.round(flightMs(Math.hypot(b.left - a.left, b.top - a.top)) * 0.8);
        longest = Math.max(longest, d);
        const go = () => {
          const anim = flyToken(src, home, `<b class="reckon-token" style="--pc:${playerColor(id)}">${row.prize < 0 ? '−' : '+'}${Math.abs(row.prize)}</b>`, { tag: 'reckon', duration: d });
          // (round-end smoothing) the total starts to roll as the token reaches it, while it fades onto it: on the token's
          // finish the table's re-render landed the first number a beat after the token had gone (frame by frame, ~0.2s)
          if (anim && anim.finished) { let once = false; const go1 = () => { if (!once) { once = true; land(); } }; timers.push(setTimeout(go1, Math.round(d * 0.8))); anim.finished.then(go1, go1); } else land();
        };
        if (k) timers.push(setTimeout(go, k * MO.fan)); else go();
      });
      void longest;
    }, counted + MO.reckonVerdict));
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [step, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const key = e => { if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') { e.preventDefault(); finish(); } };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const row = rows[Math.min(step, rows.length - 1)];
  const order = seatOrder(info.board || info.after);
  const name = id => (id === meId ? 'You' : info.after.players[id].name);
  const fol = n => `${n} follower${n === 1 ? '' : 's'}`;
  // the verdict, once the counts are up: who wins what
  // a sole winner whose count someone else matched won on the tie-break; say so, or the verdict reads wrong (tester)
  const broke = r => {
    const w = r.rows.find(x => x.id === r.winners[0]);
    const level = w && r.rows.some(x => x.id !== w.id && x.shown === w.shown);
    return level && r.tiebreak && r.tiebreak.unit ? ` (more ${r.tiebreak.unit})` : '';
  };
  const verdict = !row ? '' : row.kind === 'bonus' ? `${name(row.pid)}: ${row.prize < 0 ? '−' : '+'}${fol(Math.abs(row.prize))} from ${row.rule}` : !row.winners.length ? 'no one scores'
    : row.winners.length > 1 ? `${row.winners.map(name).join(' and ')} tie: +${fol(row.prize)} each`
    : `${name(row.winners[0])} ${row.winners[0] === meId ? 'win' : 'wins'} +${fol(row.prize)}${broke(row)}`;
  const shownBeat = step < rows.length ? beat : 2;
  return (
    <div className={`lt-reckon${ready ? '' : ' waiting'}`} role="dialog" aria-modal="true" aria-label={`Round ${info.result.round} reckoning`} data-reckon={row ? row.qid : ''} data-bonus-member={row?.kind === 'bonus' ? row.uid : undefined} onClick={finish}>
      <div className={`reckon-head${mid ? ' at-mid' : atTop ? ' at-top' : ''}`} style={{ '--c': row && ready ? `var(--${row.qid})` : undefined, ...(mid ? { left: mid.left, top: mid.top, '--mid-w': `${mid.w}px` } : null) }} aria-live="polite">
        {ready && (
          <>
          <small>{row?.kind === 'bonus' ? 'End-game bonuses' : `Round ${info.result.round} scoring`} · {Math.min(step + 1, rows.length)} of {rows.length}</small>
          {/* (keyed by the rim: the next rim's words fade in rather than swap in one frame, round-end smoothing) */}
          {row && <b key={`r${step}`} className="reckon-rule">{row.rule}</b>}
          {row && row.counts && <span key={`c${step}`} className="reckon-counts">{row.kind === 'bonus' ? '' : 'Counts '}{row.counts.replace(/\.\s*$/, '')}{row.tiebreak && row.tiebreak.text ? `; ${row.tiebreak.text}` : ''}.</span>}
          {/* the four scores side by side (Cory, 2026-10-15: "show the 4 players' scores for the various competitions"):
              each player's count stamps in and ticks up under their minion; the winner's column jiggles */}
          {row && mid && step < rows.length && (
            <span className="reckon-board" style={{ '--n': row.rows.length }}>
              {/* (in the chairs' order, the same every rim, so each player's column stays put while the rims change) */}
              {[...row.rows].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)).map(r => {
                const k = row.rows.indexOf(r);
                const won = shownBeat > 0 && row.winners.includes(r.id), lost = shownBeat > 0 && row.winners.length > 0 && !won;
                return (
                  <span key={`${row.qid}-${r.id}`} className={`rc${k < seen ? ' in' : ''}${won ? ' won' : ''}${lost ? ' lost' : ''}`} data-reckon-col={r.id} style={{ '--pc': playerColor(r.id) }}>
                    <span className="rc-who"><Minion emoji={seatEmoji(info.after, r.id)} color={playerColor(r.id)} size={22} /><span>{name(r.id)}</span></span>
                    <b className="rc-n">{k < seen ? <Tick value={r.shown} from={0} className="num" float={false} dur={reduced ? 0 : MO.reckonTick} /> : <span className="num">0</span>}</b>
                  </span>
                );
              })}
            </span>
          )}
          <b data-reckon-head className={`reckon-verdict${shownBeat ? ' on' : ''}${row && !row.winners.length ? ' none' : ''}`}>{shownBeat ? verdict : '\u00a0'}</b>
          </>
        )}
        <span className="reckon-dots" aria-hidden="true">{rows.map((r, k) => <i key={r.key || r.qid} className={k < step ? 'done' : ready && k === step ? 'on' : ''} style={{ '--c': `var(--${r.qid})` }} />)}</span>
        {/* skip on the card the player is reading (the skeptic, w4 #16: the Skip pill sat far away, bottom right) */}
        <button type="button" className="btn ghost reckon-skip in-card" data-reckon-skip onClick={e => { e.stopPropagation(); finish(); }}>Skip</button>
      </div>
      {row && !mid && step < rows.length && row.rows.map((r, k) => {
        const at = spots[r.id];
        // a chair that counts nothing gets no chip: a lone "0" in the gutter read as a stray bubble (blind panel)
        if (!at || k >= seen || (!r.shown && !row.winners.includes(r.id))) return null;
        const won = shownBeat > 0 && row.winners.includes(r.id);
        return (
          <span key={`${row.qid}-${r.id}`} className={`reckon-count${won ? ' won' : ''}`} data-reckon-count={r.id} style={{ left: at.left, top: at.top, '--pc': playerColor(r.id), '--c': `var(--${row.qid})` }}>
            <Tick value={r.shown} from={0} className="num" float={false} dur={reduced ? 0 : MO.reckonTick} />
          </span>
        );
      })}

    </div>
  );
}

/** A winner cheers in their chair: the leader celebrates, the members hop (CultSeat's reaction classes). */
function cheer(root, id) {
  const seat = root && root.querySelector(`.lt-cult-seat[data-seat="${id}"]`);
  if (!seat) return;
  // Animate the sprite directly: restarting a CSS class with offsetWidth forced a synchronous
  // layout for each winner/member while the scoring card was counting.
  const parts = [[seat.querySelector('.cs-leader .lead'), [0, -6, 0, -4, 0], 800],
    ...[...seat.querySelectorAll('.cs-member .fig')].slice(0, 6).map(m => [m, [0, -4, -6, -2, 0], 500])];
  parts.forEach(([el, heights, duration], k) => {
    if (!el?.animate) return;
    track(el.animate(heights.map(y => ({ transform: `translateY(${y}px)` })), {
      duration: slowed(duration), delay: slowed(k * 70), easing: 'steps(5,end)', composite: 'add',
    }));
  });
}
