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
import { chainRunning, onChainEnd } from './director.js';
import Tick from './Tick.jsx';

// The pace (the motion language's B6, grammar.md; Cory: "readable, one quadrant at a time"): about 1.6s a rim at
// Steady, every step moving. The rim lights; the counts stamp in seat by seat and tick up (no still "counting…"); the
// leader's count and its emoji on the rim hop; the prize arcs off the rim's engraving to the winner's count, which
// rolls the moment it lands; a short rest; the next rim. A rim nobody scores pulses once, dim, and moves on.
// Every duration scales with the viewer's animation speed (src/v4/motion.js).

/** The round's contests as scored: [{ qid, rule, prize, rows:[{ id, shown }], winners:[ids] }]. */
export function reckonRows(info) {
  const { result, after, board } = info;
  const roundNo = ['I', 'II', 'III'].indexOf(result.round) + 1;
  const scored = scoredStandings(after, roundNo);
  const base = scored || standings(board || after).map(st => ({ ...st, leaders: result.rows.find(r => r.qid === st.qid)?.winners || [] }));
  return base.map(st => ({ qid: st.qid, rule: st.rule, counts: st.counts || null, tiebreak: st.tiebreak || null, prize: st.prize ?? result.rows.find(r => r.qid === st.qid)?.v ?? 0, rows: st.rows, winners: st.leaders || [] }));
}

export default function Reckoning({ info, root, onDone, onLamp, onPaid, meId = null }) {
  const rows = useRef(reckonRows(info)).current;
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
  // a beat after the round's last move (its "Turn passes." note) before the first rim lights (tester B #23)
  const [ready, setReady] = useState(() => !motionOK());
  // (wave 4 tester A #29, #54: the scoring ran under the round's last move, still playing on the table, so a player who
  // watched that move found the Reckoning on its last quadrant, and the seats ticked both at once. The round's end
  // waits for the table's chains to land, then has its own beat.)
  useEffect(() => {
    if (ready) return undefined;
    let t = null;
    const lead = () => { if (t == null) t = setTimeout(() => setReady(true), MO.reckonLead); };
    if (!chainRunning()) lead();
    const off = onChainEnd(lead);
    const net = setTimeout(lead, 6000); // (a safety net: a chain that never reports its end)
    return () => { clearTimeout(t); clearTimeout(net); off(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // the action stage's last card leaves the hub to the scoring card
  useLayoutEffect(() => { stageClear(); }, []);
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
    if (step >= rows.length) { const t = setTimeout(finish, reduced ? 0 : slowed(400)); return () => clearTimeout(t); }
    const row = rows[step];
    setBeat(0);
    setSeen(0);
    if (onLamp) onLamp(row.qid);
    if (typeof window !== 'undefined') window.__patronsReckon = (window.__patronsReckon || 0) + 1;
    const won = row.winners.length > 0;
    const plaque = root && root.querySelector(`[data-plaque="${row.qid}"]`);
    // the card never covers the rim it scores: a rim in the wheel's lower half sends it to the top
    if (root && plaque) {
      const stage = root.querySelector('.lt-wheel .stage') || root.querySelector('.stage');
      const pr = plaque.getBoundingClientRect(), sr = stage ? stage.getBoundingClientRect() : null;
      setAtTop(!!(sr && pr.top + pr.height / 2 > sr.top + sr.height / 2));
    }
    const timers = [];
    let cancelled = false;
    if (reduced) {
      setSeen(row.rows.length); setBeat(1);
      timers.push(setTimeout(() => { if (onPaid) onPaid(step + 1); setBeat(2); }, 200), setTimeout(() => setStep(s => s + 1), 400));
      return () => timers.forEach(clearTimeout);
    }
    if (!won && !row.rows.some(r => r.shown > 0)) {
      // nobody scores and nobody counts: the rim pulses once, dim, and the Reckoning moves on
      if (plaque) pulse(plaque, MO.reckonQuiet);
      timers.push(setTimeout(() => setBeat(1), 60), setTimeout(() => setStep(s => s + 1), MO.reckonQuiet));
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
      if (!won) timers.push(setTimeout(() => setStep(s => s + 1), MO.hop + MO.reckonRest));
    }, counted));
    if (won) timers.push(setTimeout(() => {
      // the prize lifts off the rim's engraving and arcs to the number it raises: the winner's total on their chair,
      // which rolls the moment it lands
      let landed = 0, longest = 0;
      const land = () => {
        if (cancelled || ++landed < row.winners.length) return;
        for (const id of row.winners) {
          const home = root && root.querySelector(`.lt-cult-seat[data-seat="${id}"] .cs-total`);
          if (home) expectArrival(home, performance.now(), 0, true);
        }
        if (onPaid) onPaid(step + 1);
        setBeat(2);
        timers.push(setTimeout(() => setStep(s => s + 1), MO.roll + MO.reckonRest));
      };
      row.winners.forEach((id, k) => {
        const home = root && (root.querySelector(`.lt-cult-seat[data-seat="${id}"] .cs-total`) || playerAnchor(root, id));
        // the followers leave the winner's column on the card (their score), else the rim's engraving
        const col = document.querySelector(`.lt-reckon [data-reckon-col="${id}"] .rc-n`);
        const src = col && col.getBoundingClientRect().width ? col : plaque;
        if (!src || !home) { land(); return; }
        const a = src.getBoundingClientRect(), b = home.getBoundingClientRect();
        const d = flightMs(Math.hypot(b.left - a.left, b.top - a.top));
        longest = Math.max(longest, d);
        const go = () => {
          const anim = flyToken(src, home, `<b class="reckon-token" style="--pc:${playerColor(id)}">+${row.prize}</b>`, { tag: 'reckon', duration: d });
          if (anim && anim.finished) anim.finished.then(land, land); else land();
        };
        if (k) timers.push(setTimeout(go, k * MO.fan)); else go();
      });
      void longest;
    }, counted + MO.hop));
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
  const verdict = !row ? '' : !row.winners.length ? 'no one scores'
    : row.winners.length > 1 ? `${row.winners.map(name).join(' and ')} tie: +${fol(row.prize)} each`
    : `${name(row.winners[0])} ${row.winners[0] === meId ? 'win' : 'wins'} +${fol(row.prize)}${broke(row)}`;
  const shownBeat = step < rows.length ? beat : 2;
  return (
    <div className="lt-reckon" role="dialog" aria-modal="true" aria-label={`Round ${info.result.round} reckoning`} data-reckon={row ? row.qid : ''} onClick={finish}>
      <div className={`reckon-head${mid ? ' at-mid' : atTop ? ' at-top' : ''}${!ready ? ' opening' : ''}`} style={{ '--c': row && ready ? `var(--${row.qid})` : undefined, ...(mid ? { left: mid.left, top: mid.top, '--mid-w': `${mid.w}px` } : null) }} aria-live="polite">
        {/* the round's end, as a beat of its own before the first rim lights (wave 4 #6: the scoring began while the player
            looked away): "Round II ends" stamps in at the wheel's centre, with the quadrants still to score */}
        {!ready ? <b className="reckon-rule reckon-ends">Round {info.result.round} ends</b> : (
          <>
          <small>Round {info.result.round} scoring · {Math.min(step + 1, rows.length)} of {rows.length}</small>
          {row && <b className="reckon-rule">{row.rule}</b>}
          {row && row.counts && <span className="reckon-counts">Counts {row.counts}{row.tiebreak && row.tiebreak.text ? `; ${row.tiebreak.text}` : ''}.</span>}
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
        <span className="reckon-dots" aria-hidden="true">{rows.map((r, k) => <i key={r.qid} className={k < step ? 'done' : ready && k === step ? 'on' : ''} style={{ '--c': `var(--${r.qid})` }} />)}</span>
        {/* skip on the card the player is reading (the skeptic, w4 #16: the Skip pill sat far away, bottom right) */}
        <button type="button" className="btn ghost reckon-skip in-card" data-reckon-skip onClick={e => { e.stopPropagation(); finish(); }}>Skip</button>
      </div>
      {row && !mid && step < rows.length && row.rows.map((r, k) => {
        const at = spots[r.id];
        if (!at || k >= seen) return null;
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
  const parts = [[seat.querySelector('.cs-leader'), 'react-celebrate'], ...[...seat.querySelectorAll('.cs-member')].slice(0, 6).map(m => [m, 'react-hop'])];
  parts.forEach(([el, cls], k) => {
    if (!el) return;
    setTimeout(() => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 900); }, k * 70);
  });
}
