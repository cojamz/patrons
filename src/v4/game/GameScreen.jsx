// The game table. Renders engine state from a session and turns clicks into { player, option } moves.
// What's clickable is exactly state.pending.options, and only for seats this client controls.
import { memo, startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { tierLeft, quadrant } from '../../engine/v4/index.js';
import { useAnyDot } from './Glyphs.jsx';
import { isRoundEnd, newLogLines, parseRoundEnd, playerColor, promptFor, roman, tierCostText, scoringSnapshot, explainLine, plainLine, latestRivalMove, movesSinceYourTurn } from '../format.js';
import { TouchTips, useIdleSpaces } from './Info.jsx';
import Wheel from './Wheel.jsx';
import ShopCards from './ShopCards.jsx';
import CultSeatRaw from './CultSeat.jsx';
// a chair re-renders only when something it shows changed (seatMemo.js): a rival's step no longer redraws all four
const CultSeat = memo(CultSeatRaw, sameSeat);
const NO_OPTS = new Map();
const NO_FLASH = new Set();
// ?trace=1 only: one record per table step, kept on the page for the perf harness (design/eval/perf/turn-wait.md)
const tracePace = r => { if (typeof window === 'undefined') return null; (window.__patronsPace || (window.__patronsPace = [])).push(r); return r; };
let userMove = false; // set while your own click is being submitted (useTable.show reads it)
const NO_SLOTS = new Map();
const NOOP = () => {};
const NO_SEATS = [];
const NO_OPTIONS = () => null;
import { useHoverCards, HoverCardLayer, usePreviewWarmup } from './HoverCards.jsx';
import { replayIntro } from '../Intro.jsx';
import Chronicle from './Chronicle.jsx';
import SinceStrip from './SinceStrip.jsx';
import { createTrail, feed, liveStory, sinceYourTurn } from './trail.js';
import { cardDef } from '../../engine/v4/index.js';
import Results from './Results.jsx';
import FinalScore from './FinalScore.jsx';
import RoundEnd from './RoundEnd.jsx';
import Reckoning, { scoringSeatState } from './Reckoning.jsx';
import { snakeOrder, tableView, snakeWords, setupOrder } from './order.js';
import { ChoicePrompt, Confirm, Handoff, Log, useDialog, Popover, CardFace } from './parts.jsx';
import PayPicker, { payChoice, PayReceipt, receiptFor } from './PayPicker.jsx';
import { Rich } from './Rich.jsx';
import HowToPlay from '../HowToPlay.jsx';
import { flyCards, flyWorker, motionOK, snapshotShop, clearFlights, slideShop, snapshotMinions, flyMinionsHome, flyToken, flyGains, snapshotChips } from './flight.js';
import { playChain, planChain, holdAfter, holdCap, installChainSkip, skipChain, onChainSkip, onChainEnd, chainRunning, noteTable, foldBuys, foldWait, notePick } from './director.js';
import { gainsBetween } from './gains.js';
import { soundOn, onSound, setSound } from '../sound.js';
import { MO, BOT, SPEEDS, SPEED_NAMES, motionSpeed, setMotionSpeed, onMotionSpeed, speedScale, slowed } from '../motion.js';
import { PERF_ON } from '../perf.js';
import { boardPicker, giftPick, seatPart, shopLookup, pickCaption } from './boardPick.js';
import GiftCard from './GiftCard.jsx';
import ActionStage from './ActionStage.jsx';
import { stageClear, stageRelease } from './stage.js';
import { sameSeat } from './seatMemo.js';
import { holdFlag } from './bodyFlag.js';
import { friendlyError, isNetworkError } from '../errors.js';
import { ROUND_START, ownsLocal } from '../saved.js';
import { restoredMoment } from '../session/moment.js';
import { gameRecord, recordText } from '../session/record.js';
import { copyText } from '../Recovery.jsx';
import './layout.css'; // the laptop composition from 1200px up (design pod)

// (BOT.catchUp, read when used: the pace when catching up on moves that happened behind the round-end card)
const RIVAL_DWELL_MS = BOT.pace.steady; // each visible bot step holds this long (src/v4/motion.js; App passes the speed's)

/** Desktop and laptop frame (the side column is a fixed frame) vs phones and tablets (stacked). */
function useMedia(q) {
  const get = () => typeof matchMedia === 'function' && matchMedia(q).matches;
  const [wide, setWide] = useState(get);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return undefined;
    const m = matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener ? m.addEventListener('change', on) : m.addListener(on);
    return () => (m.removeEventListener ? m.removeEventListener('change', on) : m.removeListener(on));
  }, []);
  return wide;
}
const useWide = () => useMedia('(min-width: 861px) and (min-height: 500px)');
const useShort = () => useMedia('(max-height: 640px)');

export function useSessionState(session) {
  const [state, setState] = useState(() => session.getState());
  useEffect(() => {
    setState(session.getState());
    return session.subscribe(s => setState(s));
  }, [session]);
  return state;
}

/**
 * What the table shows. Normally the latest state. When a round ends, the table holds on that moment
 * (the round-end card) and queues whatever happens next; dismissing it replays the queue at a readable pace,
 * so the first move of the new round happens in front of you.
 */
// The table at the start of the current round (the round card's "Other" column measures from it). Kept with the game
// so a reload mid-round doesn't move the baseline to the reload moment.
// Local games keep it under ROUND_START (also the fallback Resume); online games under their own key.
const rsKey = online => (online ? `${ROUND_START}.online` : ROUND_START);
export function saveRoundStart(st, online = false) {
  // a finished game needs no baseline; a tab that lost the local game to another tab never writes it
  if (!st || st.over || (!online && !ownsLocal())) return;
  try { localStorage.setItem(rsKey(online), JSON.stringify({ seed: st.seed, round: st.round, names: st.players.map(p => p.name).join('|'), state: st })); } catch { /* ignore */ }
}
export function loadRoundStart(st, online = false) {
  try {
    const v = JSON.parse(localStorage.getItem(rsKey(online)) || 'null');
    if (v && v.seed === st.seed && v.round === st.round && v.names === st.players.map(p => p.name).join('|') && v.state.moves <= st.moves) return v.state;
  } catch { /* ignore */ }
  saveRoundStart(st, online);
  return null;
}

export function useTable(session, rivalDwell = RIVAL_DWELL_MS, beforeShow = null) {
  const first = session.getState();
  // a local game reloaded while its round summary was up reopens it (session/moment.js; the session holds its bots)
  const [table, setTable] = useState(() => ({ shown: first, interaction: first, moment: restoredMoment(session, first) }));
  const tableRef = useRef(table);
  tableRef.current = table;
  const queue = useRef([]);
  const waiting = useRef(null); // physical state whose animation must finish before interaction advances
  const pumpRef = useRef(() => {});
  const paced = useRef(false);
  const held = useRef(!!table.moment);
  const timer = useRef(null);
  const foldSince = useRef(null); // when the table began holding for a rival's next buy (director.js foldBuys)
  const dwellNext = useRef(0); // the hold the step being committed asks for (started once it's on screen)
  const remeasure = useRef(null); // how this step's hold follows from its chain's plan (retime: the measured plan)
  const timerAt = useRef(null);
  const pace = useRef(null); // ?trace=1: this step's pacing record (perf.js summary().pace)
  const handedAt = useRef(null); // when the step now being drawn was handed to React
  const shownRef = useRef(first);
  const online = session.info?.mode === 'online';
  // read (and, if missing, written) once: as a plain useRef argument this ran on every render, re-saving the
  // round-start snapshot after the results had cleared it (a finished game kept a "Resume")
  const [rs0] = useState(() => loadRoundStart(first, online) || first);
  const roundStart = useRef(rs0);

  const show = useCallback((next, animate = false) => {
    const prev = shownRef.current;
    shownRef.current = next;
    const fresh = prev === next ? [] : newLogLines(prev, next);
    const end = fresh.filter(isRoundEnd).pop();
    // the DOM still shows `prev` here: whatever must be measured before it changes is measured now (a card leaving)
    if (beforeShow && beforeShow.current && prev !== next) beforeShow.current(prev, next);
    // Every table step is a transition (perf fix 1; table speed pass, 2026-10-15): React draws it in slices of a few ms,
    // so a hover or a click that lands while a bot's step is being drawn answers at once instead of waiting out one
    // 100–300ms task (4× CPU). (A bot's step was a plain update while every ticking number re-rendered once a frame and
    // restarted it, turn-wait.md; Tick now writes its digits straight to the DOM, so nothing restarts it each frame.)
    void userMove;
    const paint = startTransition;
    if (end) {
      held.current = true;
      const start = roundStart.current;
      roundStart.current = next;
      saveRoundStart(next, online);
      // Keep the board as it was when the round was scored until the card is dismissed.
      const board = scoringSnapshot(prev, next);
      paint(() => setTable(t => ({ shown: next, interaction: animate ? t.interaction : next, moment: { result: parseRoundEnd(next, end), start, after: next, board } })));
    } else {
      if (next.round !== prev.round) { roundStart.current = next; saveRoundStart(next, online); }
      paint(() => setTable(t => ({ ...t, shown: next, interaction: animate ? t.interaction : next })));
    }
  }, []);

  const pump = useCallback(() => {
    // Show queued states in order. A rival's placement holds on screen long enough to read (the worker travels,
    // the card shows its delta); after the round-end card, the backlog replays at a readable pace too.
    while (!held.current && !timer.current && !waiting.current && queue.current.length) {
      let next = queue.current.shift();
      const prev = shownRef.current;
      // a rival's run of follower buys plays as one beat (director.js foldBuys); when the bot's next buy is still on its
      // way, the table holds a moment for it (never longer than foldWait), then folds what has come
      const fold = foldBuys(prev, next, queue.current, session.mySeats || [], foldSince.current != null && performance.now() - foldSince.current >= foldWait());
      if (fold.wait) {
        if (foldSince.current == null) foldSince.current = performance.now();
        queue.current.unshift(next);
        timer.current = setTimeout(() => { timer.current = null; pump(); }, 40);
        return;
      }
      foldSince.current = null;
      if (fold.used) next = queue.current.splice(0, fold.used).pop();
      const mine = session.mySeats || [];
      const rivalPlaced = Object.keys(next.slots).some(k => prev.slots[k] === undefined && !mine.includes(next.slots[k]));
      // a rival's recruit or follower buy is a visible step too; a pass or a hidden bookkeeping step isn't
      const actor = prev.pending && !mine.includes(prev.pending.player) ? prev.pending.player : null;
      const pa = actor != null ? prev.players[actor] : null, na = actor != null ? next.players[actor] : null;
      const rivalBought = !!(pa && na && (na.members.length !== pa.members.length || na.bonus !== pa.bonus));
      const rivalSetup = !!(prev.pending && prev.pending.kind === 'setup' && actor != null);
      const meActed = prev.pending && mine.includes(prev.pending.player) ? prev.pending.player : null;
      const myRecruitThenGone = meActed != null && next.players[meActed].members.length > prev.players[meActed].members.length
        && !(next.pending && next.pending.player === meActed);
      // every bot step during a round holds the pace (≥600ms at Normal): placing, buying, choosing, passing
      const rivalStep = actor != null && next.round >= 1 && !rivalSetup;
      // a rival's recruit holds a beat longer: the card's flight to their row is the thing to see
      const base = myRecruitThenGone ? BOT.myRecruitHold : rivalStep ? Math.max(rivalDwell, rivalDwell >= 600 ? 600 : 0) + (rivalBought ? Math.min(BOT.recruitExtra, rivalDwell * 0.5) : 0) : rivalSetup ? rivalDwell : paced.current && queue.current.length ? BOT.catchUp : 0;
      // the step's chain of animations sets the pace (director.js; grammar.md §4): the next step shows once it has
      // played (a click or Space skips it). The bot pace is the floor only for a step with nothing to show (a pass).
      // the same player's next step shows when this chain's last piece is two-thirds along (its handoff); a turn that
      // passes waits for the whole chain and a breath. A bot step with nothing to show doesn't wait, except a turn-ending
      // pass, which holds a moment (MO.passHold).
      const plan = planChain(prev, next, { mine });
      waiting.current = motionOK() && plan.total > 0 ? next : null;
      show(next, !!waiting.current);
      const sameNext = !!(next.pending && prev.pending && next.pending.player === prev.pending.player);
      // (a rival's step that shows something stays on screen at least 400ms before the same bot's next step: motion.mjs m4)
      const dwellOf = pl => holdAfter(pl, { sameNext, rivalStep, floor: Math.min(rivalDwell, MO.stepFloor), base, nextPlaces: !!(next.pending && next.pending.kind === 'place'), placing: !!(prev.pending && prev.pending.kind === 'place') });
      // reduced motion (grammar §6, H14): nothing travels, so a step shows its end state and the next follows a beat later
      const still = !motionOK();
      const dwell = still ? (plan.total || rivalStep ? (sameNext && !plan.total ? 0 : Math.min(150, plan.total || 150)) : base) : dwellOf(plan);
      // the screen measures the real distances once this step is drawn: the pace follows that plan (retime below)
      remeasure.current = still ? null : dwellOf;
      if (typeof window !== 'undefined') window.__patronsDwellSum = (window.__patronsDwellSum || 0) + dwell; // (the pacing gate reads it)
      handedAt.current = performance.now();
      if (PERF_ON) pace.current = tracePace({ moves: next.moves, actor: prev.pending ? prev.pending.player : null, kind: prev.pending ? prev.pending.kind : null, plan: plan.total, handoff: plan.handoff, dwell, handed: performance.now() });
      if (!queue.current.length) paced.current = false;
      // every step gets its own commit, even one that doesn't wait, so each chain plays from the step right before it
      // (the engine's effect stream is per step: two steps drawn in one render would lose the first one's)
      if (dwell || queue.current.length) {
        // the hold counts from when this step is on screen (its commit), not from when it was handed to React: under
        // load a commit can land late, and a timer started here would shorten the next step's time on screen
        timer.current = 'commit';
        dwellNext.current = dwell;
        return;
      }
    }
  }, [show, session, rivalDwell]);
  pumpRef.current = pump;
  const finishPresentation = useCallback(() => {
    const completed = waiting.current;
    if (!completed) return;
    waiting.current = null;
    // Actual completion supersedes the estimated viewing timer; never wait twice for one sequence.
    if (timer.current !== 'commit') { clearTimeout(timer.current); timer.current = null; timerAt.current = null; }
    setTable(t => t.shown === completed ? { ...t, interaction: completed } : t);
    // The transport can be ahead; reveal its queued snapshots only after this sequence lands.
    if (!timer.current) startTransition(() => pumpRef.current());
  }, []);
  useEffect(() => onChainEnd(finishPresentation), [finishPresentation]);
  useLayoutEffect(() => {
    if (timer.current !== 'commit') return;
    const d = dwellNext.current;
    dwellNext.current = 0;
    // Timers retain the chosen viewing pace; only the actual completion event releases interaction.
    // Never render a later snapshot ahead of this sequence to compensate for rendering cost.
    const now = performance.now(), lead = 0;
    handedAt.current = null;
    timer.current = setTimeout(() => { timer.current = null; if (pace.current) pace.current.fired = performance.now(); pump(); }, d - lead);
    timerAt.current = { t0: now - lead, d };
    if (pace.current) { pace.current.committed = now; pace.current.lead = Math.round(lead); }
  }, [table.shown, pump]);
  // the board comes into view before any rival moves (panel r1: two rivals picked their starting resources before the
  // board was on screen); a rival's starting pick holds the bots' pace, like any other rival step
  // When the table opens on your own decision (a resumed game at your turn), no rival can move before you, so there is
  // nothing to hold: the lead would only hold back your own first click (up to 3s at Relaxed) while its space is lit.
  useEffect(() => {
    if (!motionOK()) return undefined;
    if (first && first.pending && (session.mySeats || []).includes(first.pending.player)) return undefined;
    timer.current = setTimeout(() => { timer.current = null; pump(); }, MO.reckonLead);
    return () => { clearTimeout(timer.current); timer.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // the director measured this step's chain on screen (real distances): hold the next step for that, not the estimate
  const retime = useCallback(played => {
    if (!chainRunning()) finishPresentation();
    const f = remeasure.current;
    remeasure.current = null;
    if (!f || typeof timer.current !== 'number' || !timerAt.current) return;
    // the measured chain sets the hold, sooner or later than the estimate (never past the cap)
    const d = Math.min(f(played), holdCap()), left = d - (performance.now() - timerAt.current.t0);
    if (d === timerAt.current.d) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = null; if (pace.current) pace.current.fired = performance.now(); pump(); }, Math.max(0, left));
    timerAt.current = { t0: timerAt.current.t0, d };
    if (pace.current) pace.current.retimed = d;
  }, [pump, finishPresentation]);

  // a skipped chain (a click, Space) lets the next step show at once
  useEffect(() => onChainSkip(() => {
    if (typeof timer.current !== 'number' && typeof timer.current !== 'object') return;
    if (timer.current == null || timer.current === 'commit') return;
    // (a transition: the skip comes from your press, whose own frame paints first; the next step's table follows)
    clearTimeout(timer.current); timer.current = null; startTransition(() => pump());
  }), [pump]);
  useEffect(() => {
    const off = session.subscribe(s => {
      if (s === shownRef.current || queue.current.includes(s)) return;
      // Authoritative transport remains current; every client presents complete sequences in order.
      queue.current.push(s);
      pump();
    });
    // A pace change replaces pump and cancels the old timer. The latest state may already be queued,
    // so subscribe's duplicate guard must not leave that queue without a timer to drain it.
    pump();
    return () => { off(); clearTimeout(timer.current); timer.current = null; };
  }, [session, pump, online, show]);

  // the round card's button: the card closes in the click's own frame (GameScreen hides it at once), and the table that
  // follows (the new round, every minion going home) is drawn as a transition behind it (it took the click ~1s at 4×)
  const dismiss = useCallback(() => {
    held.current = false;
    paced.current = true;
    const current = tableRef.current;
    const board = current.moment?.board;
    const opening = board && motionOK() && planChain(board, current.shown, { mine: session.mySeats || [] }).total > 0;
    if (opening) waiting.current = current.shown;
    startTransition(() => setTable(t => ({ ...t, moment: null, interaction: opening ? board : t.shown })));
    pump();
  }, [pump, session]);

  return [table.shown, table.interaction === table.shown ? table.moment : null, dismiss, rs0, retime, table.interaction, table.moment?.board || table.shown, table.moment];
}

/**
 * Shows `value` as it was before the chain now playing, and the new one when the chain has landed (or was skipped):
 * a move's summary is its closing beat (motion review #7, #27). Re-renders only itself when the chain ends.
 */
function AfterChain({ value, hold, step = null, children }) {
  const shown = useRef(value);
  const latest = useRef({ value, step });
  const [, bump] = useState(0);
  if (!hold) shown.current = value;
  // Physical commits do not advance a held caption; only completion does.
  latest.current = { value, step };
  useEffect(() => onChainEnd(() => { if (shown.current !== latest.current.value) { shown.current = latest.current.value; bump(n => n + 1); } }), []);
  return children(shown.current);
}

/** The game's one speed (Cory: a setting in the menu; Steady by default; the same as setup's Speed): the bots' pace and
 *  how moves play out, kept in this browser. */
function SpeedSetting() {
  const [sp, setSp] = useState(motionSpeed);
  useEffect(() => onMotionSpeed(setSp), []);
  // the pick shows in the click's own frame; the speed itself is set a frame later (blind testers: 490–819ms to answer at
  // 4×): setMotionSpeed writes --mo-scale on the page's root, which re-styles every element, and re-renders the table
  const pending = useRef(null);
  // (closed before then: the speed is set at once, never lost)
  useEffect(() => () => { const p = pending.current; if (p) { cancelAnimationFrame(p.raf); clearTimeout(p.t); pending.current = null; setMotionSpeed(p.k); } }, []);
  const pick = k => {
    setSp(k);
    if (pending.current) { cancelAnimationFrame(pending.current.raf); clearTimeout(pending.current.t); }
    const p = pending.current = { raf: 0, t: 0, k };
    p.raf = requestAnimationFrame(() => { p.t = setTimeout(() => { pending.current = null; setMotionSpeed(k); }, 0); });
  };
  return (
    <div className="menu-speed" role="radiogroup" aria-label="Speed" title="How fast the bots move and moves play out on the table. Your own clicks always answer at once.">
      <span className="menu-speed-label">Speed</span>
      {Object.keys(SPEEDS).map(k => (
        <button key={k} type="button" role="radio" aria-checked={sp === k} className={`btn ghost menu-speed-opt${sp === k ? ' on' : ''}`} data-speed={k} onClick={() => pick(k)}>{SPEED_NAMES[k]}</button>
      ))}
    </div>
  );
}

/** Sound on or off (sound.js), kept in this browser. */
function SoundSetting() {
  const [on, setOn] = useState(soundOn);
  useEffect(() => onSound(setOn), []);
  return (
    <button type="button" role="menuitemcheckbox" aria-checked={on} className="btn ghost sound-btn" data-sound={on ? 'on' : 'off'}
      onClick={() => setSound(!on)} title="The click of a minion, coins landing, the winner's fanfare and the followers' chatter">
      {on ? 'Sound on' : 'Sound off'}
    </button>
  );
}

/** One glyph for the rest (How to play, the log, Leave): the table carries no header buttons. */
function Menu({ onRules, onLog, onLeave, getState }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(null); // null | 'copied' | the record text, when the clipboard refused
  useEffect(() => { if (!open) setCopied(null); }, [open]);
  const copyRecord = async () => {
    const st = getState && getState();
    const text = recordText(st ? gameRecord(st) : { empty: true });
    setCopied((await copyText(text)) ? 'copied' : text);
  };
  const box = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const away = e => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const key = e => { if (e.key === 'Escape') setOpen(false); };
    addEventListener('pointerdown', away, true);
    addEventListener('keydown', key);
    return () => { removeEventListener('pointerdown', away, true); removeEventListener('keydown', key); };
  }, [open]);
  const pick = fn => () => { setOpen(false); fn(); };
  return (
    <div className="lt-menu" ref={box}>
      <button type="button" className="menu-glyph" aria-label="Menu" aria-haspopup="menu" aria-expanded={open} title="How to play, the log, leave" onClick={() => setOpen(o => !o)}><i /></button>
      {open && (
        <div className="menu-list" role="menu">
          <button type="button" role="menuitem" className="btn ghost rules-btn" onClick={pick(onRules)}>How to play</button>
          <button type="button" role="menuitem" className="btn ghost intro-btn" onClick={pick(replayIntro)}>How it works</button>
          <button type="button" role="menuitem" className="btn ghost log-btn" onClick={pick(onLog)}>The log</button>
          <SpeedSetting />
          <SoundSetting />
          <button type="button" role="menuitem" className="btn ghost record-btn" data-copy-record onClick={copyRecord}
            title="Copies this game, move by move, so a problem can be replayed exactly">{copied === 'copied' ? 'Copied' : 'Copy game record'}</button>
          {copied && copied !== 'copied' && (
            <textarea className="record-text" readOnly value={copied} aria-label="Game record (copy it by hand)" onFocus={e => e.target.select()} autoFocus />
          )}
          {onLeave && <button type="button" role="menuitem" className="btn ghost leave-btn" onClick={pick(onLeave)}>Leave</button>}
        </div>
      )}
    </div>
  );
}

/**
 * The turn card: one turn, told where its cult sits, a line per beat (placed, gained, bought). It folds into the
 * chair when the turn has passed and had its moment.
 */
function TurnCard({ card, root, state }) {
  // a card whose player isn't acting any more folds after its moment (wave-4 B #19: "You took X" stayed up ~10s through
  // the bots' whole sequence, stale, under the strip that already lists it): 2.6s after its last line, it folds, and at
  // 3.1s it's gone and gives the story its room back
  const acting = !!(state && state.pending && state.pending.player === card.pid && !state.over);
  // (kept per card: a new card, or new lines on this one, start it up again in the same render)
  const lifeKey = `${card.n}|${card.text}|${acting ? 1 : 0}`;
  const [lifeOf, setLife] = useState({ key: '', v: 'up' });
  const life = lifeOf.key === lifeKey ? lifeOf.v : 'up'; // 'up' | 'folding' | 'gone'
  useEffect(() => {
    if (acting) return undefined;
    const t = [setTimeout(() => setLife({ key: lifeKey, v: 'folding' }), MO.turnCardHold), setTimeout(() => setLife({ key: lifeKey, v: 'gone' }), MO.turnCardHold + MO.turnCardFold)];
    return () => t.forEach(clearTimeout);
  }, [lifeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const gone = life === 'gone';
  // docked under the story, the card leaves the story's heading and Log in view: a card too tall for the room under
  // them sums up its last lines ("+N more") one at a time until it fits (four seats at 1270x700: a five-line card
  // covered the heading; turndock d2). Kept per card text, so a new card starts at the full count again.
  const fitKey = `${card.n}|${card.text}`;
  const [fitOf, setFit] = useState({ key: '', max: 5 });
  const MAXL = fitOf.key === fitKey ? fitOf.max : 5;
  // Where the card sits, written straight to its style in one layout effect (perf, 2026-10-15): as React state its place
  // and its lift cost every step one or two more commits of their own, each reading the layout again
  const box = useRef(null);
  // the story above leaves the card exactly its own height (layout.css --turn-h), written only when the whole-pixel value
  // changes (the card's height depends on its text and width only)
  const turnH = useRef(null), turnHOn = useRef(null);
  // the table says a card is up (data-turn-card: layout.css gives the story room), in place of a
  // `.app.game.lt:has(> .turn-card)` that re-styled the whole page on every change of the table's children
  // (the table is the card's own parent: the `root` prop is read at render time and can still be null on the first
  // render after a resume, which left the flag and --turn-h unset until the next step, seconds later, so the story and
  // the card overlapped; design pod, 2026-10-15)
  const tableOf = () => root || (box.current && box.current.parentElement);
  useLayoutEffect(() => (gone ? undefined : holdFlag(tableOf(), 'turnCard')), [root, gone]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const table = tableOf();
    const pos = turnCardDock(card, table);
    if (!pos) { el.style.display = 'none'; return; }
    // a large screen zooms the card with the columns (layout.css --gz): its place is measured on screen, so it's written
    // in the card's own (zoomed) pixels
    const z = parseFloat(getComputedStyle(el).zoom) || 1;
    const px = v => (v == null ? '' : `${z === 1 ? v : Math.round((v / z) * 10) / 10}px`);
    Object.assign(el.style, { display: '', left: px(pos.left), right: px(pos.right), top: px(pos.top), bottom: px(pos.bottom), width: px(pos.width), maxWidth: px(pos.width), transformOrigin: `${pos.ox} ${pos.oy}` });
    // the card always fits on screen (wave-2: a bot's card ran off the bottom): slid back up if it reaches past the bottom
    if (pos.top != null) {
      const b = el.getBoundingClientRect();
      if (b.bottom > innerHeight - 8) el.style.top = px(pos.top - Math.min(b.top - 8, b.bottom - (innerHeight - 8)));
    }
    // (only the dock under the story uses it: layout.css)
    if (!pos.since) return;
    const story = table && table.querySelector(':scope > .lt-since');
    // the story's heading sits where the chairs end, never where the card is, so this read can't feed back
    // (the card's resting top, from its dock: its rise from 4px higher is not where it stays)
    const head = story && story.querySelector(':scope > .since-head');
    if (head && MAXL > 1 && card.text.split(' · ').length - 1 > 1 && innerHeight - pos.bottom - el.getBoundingClientRect().height < head.getBoundingClientRect().bottom + 4) {
      setFit({ key: fitKey, max: Math.min(MAXL, card.text.split(' · ').length - 1) - 1 });
      return;
    }
    const h = Math.ceil(el.offsetHeight) + 8;
    // written on the story itself, its only reader (layout.css): on the table, an inherited custom property re-styled all
    // ~5,000 elements of the page every time it changed (perf, 2026-10-15)
    if (story && (h !== turnH.current || turnHOn.current !== story)) { turnH.current = h; turnHOn.current = story; story.style.setProperty('--turn-h', `${h}px`); }
  }, [card.pid, card.n, card.text, root, gone, MAXL]); // eslint-disable-line react-hooks/exhaustive-deps
  if (gone) return null;
  // at most a few lines, the rest summed up (every line stays in the strip's card and the log)
  const [head, ...all] = card.text.split(' · ');
  const rest = all.length > MAXL ? [...all.slice(0, MAXL - 1), `+${all.length - MAXL + 1} more`] : all;
  return (
    <div ref={box} className={`turn-card${card.live ? ' live' : ''}${card.folding || life === 'folding' ? ' folding' : ''}`} data-turn-story={card.text} role="status" aria-live="polite"
      style={{ '--pc': playerColor(card.pid) }}>
      <b className="tc-head">{head}</b>
      {rest.map((l, k) => <span key={`${k}:${l}`} className="tc-line"><Rich text={l} /></span>)}
    </div>
  );
}
// The card's dock is worked out once per layout change (a window resize, the chair column or the story strip mounting,
// the card's chair in the seat layout) and kept here: reading it on every step forced a page layout mid-commit (perf,
// 2026-10-15). Nothing observes the strip or the card.
let dockCache = null, dockStale = true;
if (typeof addEventListener === 'function') addEventListener('resize', () => { dockStale = true; }, { passive: true });
function turnCardDock(card, root) {
  const key = root ? `${!!root.querySelector(':scope > .lt-snake')}|${!!root.querySelector(':scope > .lt-since')}` : '';
  // (only the seat layout depends on whose card it is: there a new turn's chair moves it)
  if (dockStale || !dockCache || dockCache.root !== root || dockCache.key !== key || (dockCache.seat && dockCache.pid !== card.pid)) {
    const pos = turnCardPlace(card, root);
    dockCache = { root, key, pid: card.pid, seat: !!(pos && pos.seat), pos };
    dockStale = false;
  }
  return dockCache.pos;
}
/** Where the turn card goes: { left, right, top, bottom, width, ox, oy, since } in px, or null (no chair to sit by). */
function turnCardPlace(card, root) {
  // the chairs in one ordered column (laptop): the card tells the turn in the right column, just above the shop,
  // under the story of the turns since yours (it would cover the next chair beside its own)
  const column = root && root.querySelector('.lt > .lt-snake');
  // a layout that docks the turn under the story of the turns since yours (layout.css sets --turn-dock: since): the
  // newest turn reads last, under the ones before it
  const dock = root && getComputedStyle(root).getPropertyValue('--turn-dock').trim();
  const since = dock === 'since' && root.querySelector('.lt > .lt-since');
  if (since && since.getBoundingClientRect().width) {
    // docked at a foot that never depends on the story or on the card itself: the column's foot (from 1200px), or just
    // above the follower buys when they share the story's column (861–1199px). The story above leaves the card its
    // room (--turn-h): one way only. (A ResizeObserver that moved the card with the story fed back on itself:
    // "Maximum update depth exceeded", 2026-10-15.)
    const b = since.getBoundingClientRect();
    const rates = root.querySelector('.lt-rates');
    const rb = rates && rates.getBoundingClientRect();
    const overRates = !!(rb && rb.width && Math.abs(rb.left - b.left) < 4);
    return { left: Math.round(b.left), right: null, top: null, bottom: overRates ? Math.round(innerHeight - rb.top + 12) : 8, width: Math.round(b.width), ox: '0%', oy: '100%', since: true };
  }
  if (column && column.getBoundingClientRect().width) {
    const shop = root.querySelector('.lt > .lt-shop');
    const top = shop ? shop.getBoundingClientRect().top : innerHeight;
    return { left: null, right: 18, top: null, bottom: Math.max(8, innerHeight - top + 10), width: null, ox: '100%', oy: '100%' };
  }
  // the card sits in the open space beside its cult: under a top chair, over a bottom one (never over the prompt)
  const region = root && root.querySelector(`.lt-seat[data-pid="${card.pid}"]`);
  const seat = region && (region.querySelector('.lt-cult-seat') || region);
  if (!seat) return null;
  const r = seat.getBoundingClientRect();
  const left = r.left + r.width / 2 < innerWidth / 2;
  const top = r.top + r.height / 2 < innerHeight / 2;
  return {
    left: left ? Math.max(10, r.left) : null,
    right: left ? null : Math.max(10, innerWidth - r.right),
    top: top ? r.bottom + 10 : null,
    bottom: top ? null : Math.max(8, innerHeight - r.top + 10),
    width: null, ox: left ? '0%' : '100%', oy: top ? '0%' : '100%', seat: true,
  };
}

/** Which player sits in each corner chair: you bottom left (0), then clockwise from you (1 top left, 2 top right,
 *  3 bottom right; 4 and 5 at five and six players). Empty chairs (2–3 players) stay empty. */
function seatCorners(state, me) {
  const n = state.players.length, base = me != null ? me : 0;
  return Array.from({ length: Math.max(4, n) }, (_, k) => (k < n ? (base + k) % n : null)); // five and six: chairs 4 and 5
}

/** On phones the buy step's other answer also lives with the question (the shop and its "Done, no buy" are a scroll
 *  away). On a laptop it lives only in the shop column, under the follower buys (Cory, 2026-10-16: "pass is hard to
 *  find"; ShopCards FollowerRates). Release is a seat action (MemberUse.jsx ReleaseButton). */
function PromptActions({ optionFor, onPick, afterPurchase = false }) {
  const pass = optionFor('pass');
  return (
    <span className="pr-actions">
      <button type="button" className={`btn pass${pass ? '' : ' idle'}`} title={afterPurchase ? "Finish your turn" : "End your turn without recruiting"} data-option={pass ? 'pass' : undefined} aria-disabled={!pass} onClick={() => pass && onPick('pass')}>{afterPurchase ? 'End turn' : 'Done, no recruit'}</button>
    </span>
  );
}

const verbFor = kind => ({ setup: 'drafting a resource', place: 'placing a minion', buy: 'shopping', pay: 'paying', choose: 'deciding' }[kind] || 'deciding');

function SetupOrderCue({ state, me }) {
  const order = setupOrder(state);
  if (!order) return null;
  const name = id => id === me ? 'You' : state.players[id].name;
  const row = (kind, label, ids) => (
    <div className="setup-order-row" role="group" data-order={kind} aria-label={`${label}: ${ids.map(name).join(', ')}${kind === 'place' ? ', and back again' : ''}`}>
      <span className="setup-order-label">{label}</span>
      <span className="setup-order-names" aria-hidden="true">{(kind === 'place' ? ids.slice(0, state.players.length) : ids).map((id, i) => (
        <span className="setup-order-step" data-pid={id} data-self={id === me || undefined} key={`${i}-${id}`}>
          {i > 0 && <span className="setup-order-arrow">→</span>}
          <span className="setup-order-name" title={name(id)} data-current={kind === 'draft' && i === 0 || undefined}>{name(id)}</span>
        </span>
      ))}{kind === 'place' && <span className="setup-order-tail" title="Then back in reverse order">↩</span>}</span>
    </div>
  );
  return <div className="setup-order" data-setup-order>{row('draft', 'Draft', order.draft)}{row('place', 'Place · snake', order.place)}</div>;
}

export default function GameScreen({ session, onPlayAgain, onHome, leaveText, pace, onResults, askLeave = 0 }) {
  const beforeShow = useRef(null);
  const [live0, moment, dismissMoment, roundStart0, retimeTable, settled0, physical0, scoringMoment] = useTable(session, pace ?? RIVAL_DWELL_MS, beforeShow);
  const physicalState = physical0;
  const interactionState = moment && moment.board ? moment.board : settled0;
  // Counters and flying targets use physical state; ownership/options/order share one settled boundary.
  const state = useMemo(() => tableView(physicalState, interactionState), [physicalState, interactionState]);
  useAnyDot((state.quadrants || []).map(q => quadrant(q).resource)); // the "any" dot's four colors, where their quadrants sit
  const mySeats = session.mySeats || NO_SEATS;
  const pend = state.pending;
  const mine = !!(pend && !state.over && !moment && mySeats.includes(pend.player));
  const [facing, setFacing] = useState(0);

  // nothing on screen reads these two any more (the chairs and the turn card tell gifts and thefts): refs, so setting
  // them never costs the table a second render per step (perf, 2026-10-15)
  const giftsRef = useRef([]); // short-lived "+1 gold from P2" floaters on player cards
  const setGifts = useCallback(f => { giftsRef.current = typeof f === 'function' ? f(giftsRef.current) : f; }, []);
  const [toast, setToast] = useState(null);
  const [stolen, setStolen] = useState([]); // [{ pid, text, n }]: "P2 took 2 gold" on the robbed seat (laptop)
  const robbedRef = useRef(null); // { pid, n }: flash that player's resources
  const setRobbed = useCallback(f => { robbedRef.current = typeof f === 'function' ? f(robbedRef.current) : f; }, []);
  const [cardDetail, setCardDetail] = useState(null); // { el, uid, hover? } a shop card's details (tap on phones, hover on desktop)
  const hoverTimer = useRef(null);
  const onHoverCard = useCallback((uid, el) => {
    clearTimeout(hoverTimer.current);
    if (uid == null) { hoverTimer.current = setTimeout(() => setCardDetail(c => (c && c.hover ? null : c)), 120); return; }
    hoverTimer.current = setTimeout(() => setCardDetail(c => (c && !c.hover ? c : { uid, el, hover: true })), 160);
  }, []);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);
  const hover = useHoverCards(); // UI-B's one hover layer: spaces, plaques, seats, shop cards
  // a press anywhere, or Space, lands the chain of animations playing on the table (director.js)
  useEffect(() => { const off = installChainSkip(); return () => { off(); skipChain(); }; }, []);
  useEffect(() => stageClear, []);
  // your turn: whatever the last move left on the stage goes home now, off the open spaces (panel r1 skeptic: leftover
  // cards sat over the wheel's centre a second into your turn)
  useEffect(() => { if (mine && !chainRunning()) stageRelease(0); }, [mine, state.moves]);
  const [reckoned, setReckoned] = useState(null); // the round-end moment whose Reckoning has played (then: the summary)
  // the round card closes in the click's own frame: this commit only unmounts it, and the new round's table follows as a
  // transition (useTable dismiss), so the button answers at once instead of after the whole table has redrawn
  const [closedMoment, setClosedMoment] = useState(null);
  // the wheel's minions leave for home in the press's own frame (lag pass 2026-10-21: at 4x CPU the old round's table
  // held ~0.3s, dimmed, while the new round rendered): the first beat of the new round's chain (director.js 'home', at 0)
  // starts here, its ghosts on the compositor's clock, and the chain then only times the seats' columns to their landings
  const homeEarly = useRef(null); // { at, snap, els }
  // the old row is measured as the card closes (it still stands there): the new round sends it to the deck (director.js)
  const nextRound = useCallback(() => {
    { const snap = snapshotShop(root.current); if (snap.size) shopSnap.current = snap; }
    const mins = minionSnap.current;
    if (root.current && moment && !moment.after?.over && !state.over && motionOK() && mins && mins.length) {
      const r = root.current;
      // they leave in the press's own frame, as the card closes (the new round renders meanwhile); waiting a frame lost
      // them to the new round's render on a slow laptop
      const els = [...r.querySelectorAll('.lt-wheel [data-slot] .worker[data-seat]')];
      flyMinionsHome(r, mins);
      for (const el of els) el.style.visibility = 'hidden';
      const early = { at: performance.now(), snap: mins, els };
      homeEarly.current = early;
      // (a round that never came: they stand again)
      setTimeout(() => { if (homeEarly.current === early) { homeEarly.current = null; for (const el of early.els) if (el.isConnected) el.style.visibility = ''; } }, 3000);
    }
    setClosedMoment(moment); dismissMoment();
  }, [moment, dismissMoment, state.over]); // eslint-disable-line react-hooks/exhaustive-deps
  const [lampQid, setLampQid] = useState(null); // the quadrant the Reckoning is paying right now
  // how many of the Reckoning's quadrants have landed: until a prize reaches its chair, that chair's total leaves it
  // out, so the totals climb as each prize lands (RC1 saboteur: the seats showed the final numbers at step 1 of 4)
  const [paid, setPaid] = useState({ moment: null, n: 0 });
  const snake = useMemo(() => snakeOrder(state), [state]);
  // the column of chairs (laptop): each chair keeps its own height (compact to its content, like the plate's panels)
  // and they stack in turn order, centred in the column; a new order re-sorts them (they slide, lamp.css). Positions
  // are set straight on the elements after each commit, so nothing re-renders for it, and again when the window
  // changes size (a resize renders nothing: the chairs kept the other size's places, or the 108px fallback when the
  // column had been hidden, overlapping until the next move; QA, 2026-10-15).
  const layColumn = () => {
    const r = root.current;
    if (!r) return;
    const rail = r.querySelector(':scope > .lt-snake');
    const seats = [...r.querySelectorAll(':scope > .lt-seat')].filter(e => e.dataset.pid != null);
    if (!rail || !rail.offsetHeight) { seats.forEach(e => { e.style.removeProperty('--y'); e.style.removeProperty('--seat-h'); }); return; }
    const GAP = seats.length >= 5 ? 4 : 8; // five and six chairs stand closer (seat.css, 2026-10-22)
    // every chair has one height (mockup A, Cory 2026-10-21: "a little bigger so there's more room to show members"):
    // an equal share of the column, less what stands under the chairs there (layout.css --seats-reserve: the story and
    // the turn card), between --seat-min and --seat-max. It comes from the window, never from what a chair holds, so no
    // chair changes height during a turn (hotseat region gate); a member arriving only changes what folds into "+N".
    const cs = getComputedStyle(rail);
    const hi = parseFloat(cs.getPropertyValue('--seat-max')) || 0;
    if (hi) {
      const lo = parseFloat(cs.getPropertyValue('--seat-min')) || 0, reserve = parseFloat(cs.getPropertyValue('--seats-reserve')) || 0;
      const h = `${Math.max(lo, Math.min(hi, Math.floor((rail.offsetHeight - reserve - GAP * Math.max(0, seats.length - 1)) / Math.max(1, seats.length))))}px`;
      for (const e of seats) if (e.style.getPropertyValue('--seat-h') !== h) e.style.setProperty('--seat-h', h);
    } else seats.forEach(e => e.style.removeProperty('--seat-h'));
    // round I's order waits for its own beat: a chair resizing meanwhile (your chair loses its starting-pick row, ~36px)
    // is re-stacked in the old order, so the chairs under it close up now. Returning early here left them standing
    // under the taller chair until the sort beat, then sliding up mid-turn (hotseat region gate, 2026-10-21).
    const held = sortOwed.current;
    if (held && !seats.every(e => e.style.getPropertyValue('--y'))) return;
    const rows = seats.map(e => ({ e, slot: held ? parseFloat(e.style.getPropertyValue('--y')) : Number(e.dataset.slot) || 0, h: e.offsetHeight })).sort((a, b) => a.slot - b.slot);
    const total = rows.reduce((t, x) => t + x.h, 0) + GAP * Math.max(0, rows.length - 1);
    const fromTop = getComputedStyle(rail).getPropertyValue('--seats-align').trim() === 'start';
    let y = fromTop ? 0 : Math.max(0, Math.round((rail.offsetHeight - total) / 2));
    const top = y;
    // whatever sits under the chairs in their column (the story of the turns, in some layouts) starts below the last one
    // (on the story, its only reader: on the table this inherited property re-styled the whole page each time it moved)
    const story = r.querySelector(':scope > .lt-since');
    if (story) story.style.setProperty('--seats-end', `${top + total}px`);
    // a chair placed for the first time (the screen just mounted, as after a hot-seat handoff, or back from a phone size)
    // stands at its place at once: its first style was the fallback (slot × 108px), and sliding from there read as the
    // chairs moving 8–24px between setup and the first turn (hotseat region gate, 2026-10-15). Only a new order slides.
    // A chair that only changed size (the same order) closes the column up in the same frame, with no slide: sliding
    // there read as the chairs under it moving mid-turn (hotseat region gate, 2026-10-21).
    const was = rows.map(x => x.e.style.getPropertyValue('--y'));
    const sameOrder = was.every(Boolean) && rows.every((x, i) => i === 0 || parseFloat(was[i]) > parseFloat(was[i - 1]));
    const fresh = sameOrder ? rows.filter((x, i) => was[i] !== `${y + rows.slice(0, i).reduce((t, z) => t + z.h + GAP, 0)}px`) : rows.filter(x => !x.e.style.getPropertyValue('--y'));
    for (const x of fresh) x.e.style.transition = 'none';
    for (const x of rows) { x.e.style.setProperty('--y', `${y}px`); y += x.h + GAP; }
    if (fresh.length) {
      for (const x of fresh) void getComputedStyle(x.e).transform; // the place lands with no transition
      requestAnimationFrame(() => { for (const x of fresh) x.e.style.transition = ''; });
    }
  };
  // laid out when the seat order changes (the pid order), and by a ResizeObserver when a chair or the column changes size
  // (it reports after layout, so its reads are free; the writes move the chairs by transform, never their size). Not
  // after every commit: reading every chair's height there forced a page layout every step (perf, 2026-10-15).
  const seatOrderKey = snake.order.join(',');
  // round I's order (wave 4 #3): the chairs re-sort as the chain's own beat (director.js 'sort'), once the last starting
  // pick has landed on them and before the first placement; with no chain to play (reduced motion) they re-sort at once
  const sortOwed = useRef(false);
  useLayoutEffect(() => {
    const before = prevState.current;
    if (motionOK() && before && before !== state && before.seed === state.seed && before.round === 0 && state.round === 1) {
      sortOwed.current = true;
      const t = setTimeout(() => dispatchEvent(new Event('patrons:seat-sort')), 4000); // (a safety net: never left unsorted)
      return () => clearTimeout(t);
    }
    sortOwed.current = false;
    layColumn();
    return undefined;
  }, [seatOrderKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const sortNow = () => { if (sortOwed.current) { sortOwed.current = false; layColumnNow.current(); } };
    addEventListener('patrons:seat-sort', sortNow);
    const off = onChainEnd(sortNow); // (a chain that never sorted, as one cut short)
    return () => { removeEventListener('patrons:seat-sort', sortNow); off(); };
  }, []);
  const layColumnNow = useRef(layColumn);
  layColumnNow.current = layColumn;
  // your chair drops its starting-pick row when the last pick lands (~36px shorter): the column closes up in that same
  // commit, not a frame later in the ResizeObserver, so nothing ever sees the chairs under it standing in the old place
  const draftShown = !!(state.pending && state.pending.kind === 'setup' && !state.over);
  useLayoutEffect(() => { layColumn(); }, [draftShown]); // eslint-disable-line react-hooks/exhaustive-deps
  const colRO = useRef(null), colWatched = useRef(new Set());
  useLayoutEffect(() => {
    const r = root.current;
    if (!r || typeof ResizeObserver !== 'function') return;
    if (!colRO.current) colRO.current = new ResizeObserver(() => layColumnNow.current());
    const w = colWatched.current;
    for (const el of [...w]) if (!el.isConnected) { colRO.current.unobserve(el); w.delete(el); }
    // (the story too: when it mounts, the chairs' foot is written on it)
    for (const el of [r.querySelector(':scope > .lt-snake'), r.querySelector(':scope > .lt-since'), ...r.querySelectorAll(':scope > .lt-seat')]) if (el && !w.has(el)) { colRO.current.observe(el); w.add(el); }
  });
  useEffect(() => () => { if (colRO.current) colRO.current.disconnect(); colRO.current = null; colWatched.current.clear(); }, []);
  useEffect(() => {
    const again = () => layColumnNow.current();
    addEventListener('resize', again);
    return () => removeEventListener('resize', again);
  }, []);
  const seatState = useMemo(() => {
    // The engine has already awarded prizes while the last action is still playing.
    // Withhold them from the very first scoring-board commit, before the Reckoning is visible.
    if (!scoringMoment) return state;
    return scoringSeatState(state, scoringMoment, reckoned === scoringMoment ? Infinity : paid.moment === scoringMoment ? paid.n : 0);
  }, [state, scoringMoment, reckoned, paid]);
  const [spacePeek, setSpacePeek] = useState(null); // a space selected from the panel list (one sheet, shared with the wheel)
  // re-render when undo comes or goes, so Undo disappears the moment control passes even while the table catches up
  // (perf fix 2: only then, not on every session change, a held bot step included)
  const undoSig = () => (typeof session.canUndo === 'function' && session.canUndo() ? `${session.undoKind}:${session.undoSeat}` : '');
  const [, setUndoSeen] = useState(undoSig);
  const undoSeen = useRef(null);
  useEffect(() => session.subscribe(() => { const u = undoSig(); if (u !== undoSeen.current) { undoSeen.current = u; if (userMove) startTransition(() => setUndoSeen(u)); else setUndoSeen(u); } }), [session]); // eslint-disable-line react-hooks/exhaustive-deps
  // A local game's bots wait at a round end (session roundHold) until its summary is gone; they go on once the table
  // shows that state with no summary up (dismissed, or never detected: never a stalled table).
  useEffect(() => { if (!moment && live0 === settled0 && session.roundHold && live0 === session.getState() && session.continueRound) session.continueRound(); }, [moment, live0, settled0, session]);
  // results open at the top, on the winner
  // The results are on screen: only now may the app forget the saved game.
  useEffect(() => { if (live0.over && live0 === settled0 && !moment && onResults) onResults(); }, [live0.over, settled0, moment]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (live0.over && live0 === settled0 && !moment && typeof window !== 'undefined' && window.scrollTo) { try { window.scrollTo(0, 0); } catch { /* jsdom */ } } }, [live0.over, settled0, moment]);
  const [turnCard, setTurnCard] = useState(null); // { pid, text, live, n, folding }: the current turn, told by its cult
  const turnTimer = useRef([]);
  useEffect(() => () => turnTimer.current.forEach(clearTimeout), []);
  // every placement's story, one per turn (trail.js): the turn card tells the latest, the strip the rivals' since yours
  const trail = useRef(null);
  if (!trail.current) trail.current = createTrail(mySeats.length === 1 ? mySeats[0] : null);
  // the strip and the live turn card are read off the trail while the table renders (perf, 2026-10-15: set from a layout
  // effect, they cost every step a second render); feed() is idempotent for a state it has seen
  const toldUpTo = useRef(0); // the newest story the table has committed (told)
  const lastTold = useRef(null); // the turn card of the turn that just passed, while it holds and folds
  const story = useMemo(() => {
    const t = trail.current;
    feed(t, live0, roundStart0);
    const now = live0.round >= 1 && !live0.over ? liveStory(t) : null;
    const fresh = t.stories.filter(st => st.n > toldUpTo.current);
    const tl = fresh[fresh.length - 1];
    return {
      since: sinceYourTurn(t, mySeats),
      live: now ? { pid: now.actor, text: now.text, live: true, n: `c${t.cur.key}` } : null,
      told: tl && tl.round === live0.round && !live0.over ? { pid: tl.actor, text: tl.text, live: false, n: `t${tl.n}` } : null,
      touched: [...new Set(fresh.flatMap(st => st.touched))],
    };
  }, [live0]); // eslint-disable-line react-hooks/exhaustive-deps
  // the card on screen: this turn's, as it builds; else the one that just passed, until it has held and folded
  const toldShown = story.live ? null : story.told || lastTold.current;
  const toldCard = !toldShown ? null : turnCard && turnCard.n === toldShown.n ? (turnCard.gone ? null : turnCard) : toldShown;
  const cardNow = story.live || toldCard;
  const since = story.since;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const prevState = useRef(physicalState); // the state the table last committed (the flight effect moves it on)
  // the spaces just taken (a new minion lands): worked out while rendering, kept until the next placement
  const lastFlash = useRef(NO_FLASH);
  const freshFlash = useMemo(() => {
    const before = prevState.current;
    if (!before || before === state) return null;
    const fresh = state.round !== before.round ? Object.keys(state.slots) : Object.keys(state.slots).filter(k => before.slots[k] === undefined);
    return fresh.length ? new Set(fresh) : null;
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
  const flashSet = freshFlash || lastFlash.current;
  const flash = flashSet;
  const [ready, setReady] = useState(null); // hot-seat: which human seat has been handed the device
  const [rules, setRules] = useState(false);
  const wide = useWide();
  const short = useShort();
  void short;
  const [logOpen, setLogOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // the browser's Back (an edge swipe on a phone) asks first, like the Leave button (App re-pushes the history entry)
  const askSeen = useRef(askLeave);
  useEffect(() => { if (askLeave !== askSeen.current) { askSeen.current = askLeave; setLeaving(true); } }, [askLeave]);
  const [note, setNote] = useState(null); // { text, tone, n } — a gentle answer in the status pill
  const facingRef = useRef(facing);
  facingRef.current = facing;
  const sendToken = useRef(0);
  const root = useRef(null);
  // the table element as state too, so children that need it (the turn card, the Reckoning) get it on the render after
  // it mounts; root.current read during render is null on the first render after a resume (2026-10-15)
  const [rootEl, setRootEl] = useState(null);
  const rootRef = useCallback(el => { root.current = el; setRootEl(el); }, []);
  const shopSnap = useRef(new Map());
  const chipSnap = useRef(new Map()); // member chips as they stood before a member left its cult (snapshotChips)
  const lastSetupMoves = useRef(null); // the last step of the starting picks (its row stays up until that pick has landed)
  const minionSnap = useRef([]);
  const noteTimer = useRef(null);
  const toastTimer = useRef(null);
  const robBase = useRef(null); // your resources when the rival now moving placed (the robbed toast counts from there)
  const showToast = useCallback((text, ms = 2200) => {
    clearTimeout(toastTimer.current);
    setToast({ text, n: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), ms);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const say = useCallback((text, tone = 'nudge', ms = 1900) => {
    clearTimeout(noteTimer.current);
    const at = session.getState()?.moves ?? null; // the step it's about (after an undo: the restored one)
    setNote(n => ({ text, tone, at, n: (n ? n.n : 0) + 1 }));
    noteTimer.current = setTimeout(() => setNote(null), ms);
  }, []);
  useEffect(() => () => clearTimeout(noteTimer.current), []);
  // an answer clears the nudge at once (it never lingers past the question it was about)
  const stepKey = state.pending ? `${state.moves}` : 'none';
  // any note (a nudge, "Placement undone") lasts only until the table moves on from the step it was about
  useEffect(() => { setNote(n => { if (n && n.at !== (state.pending ? state.moves : null) && n.at !== state.moves) { clearTimeout(noteTimer.current); return null; } return n; }); }, [stepKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // A fresh state means our move (or someone's) landed: the table is live again.
  useEffect(() => { sendToken.current += 1; busyNow.current = false; setBusy(false); }, [interactionState]);

  // not yours: one shared empty map, so your chair's optionFor holds through rivals' steps
  const options = useMemo(() => (mine ? new Map(pend.options.map(o => [o.id, o])) : NO_OPTS), [mine, pend]);
  const optionFor = useCallback(id => options.get(id) || null, [options]);
  const legalSlots = useMemo(() => {
    const m = new Map();
    // board spaces only: a choice that names spaces by label (Straggler's from/to) has no q/i and stays a list
    for (const o of options.values()) if (o.kind === 'slot' && o.q != null && o.i != null) m.set(`${o.q}-${o.i}`, o.id);
    return m;
  }, [options]);

  // Hot-seat with several people on one device: hand the device over before showing a new person's options.
  const humansHere = mySeats.length > 1;
  const needHandoff = humansHere && mine && ready !== pend.player;
  // Whose strip sits in the header: the person at the device.
  const me = mine ? pend.player : humansHere ? (ready ?? mySeats[0]) : mySeats[0];
  // the spaces you could point at, worked out in the background after each step, so a hover never waits on one (the
  // space card's "You'd get", the shop's "✓ after X"): yours as soon as it's your move, a rival's once it settles
  usePreviewWarmup(state, needHandoff ? null : me);
  // the spaces you can take that would give you nothing right now step back (Wheel: .idle), still placeable
  const legalKeys = useMemo(() => [...legalSlots.keys()], [legalSlots]);
  const idleSlots = useIdleSpaces(interactionState, mine && pend.kind === 'place' && !needHandoff ? me : null, legalKeys);

  // What just happened, made physical: a rival's move turns the wheel to face it, a worker travels from its
  // owner to the space, a recruited card flies from the shop to its new owner.
  // The shop is measured only when a card is about to leave it (perf fix 2: it measured every card, every state), with
  // the DOM still showing the table before the step; your own recruit was measured in onPick already.
  beforeShow.current = (prev, next) => {
    // a member leaving a cult (released, swapped, taken) flies from where its chip stood: measured now, while it stands
    if (prev.players && next.players && prev.players.some((p, i) => p.members.some(u => !next.players[i].members.includes(u)))) chipSnap.current = snapshotChips(root.current);
    if (prev.shop && next.shop && prev.shop.some(u => !next.shop.includes(u))) {
      const snap = snapshotShop(root.current);
      if (snap.size) shopSnap.current = snap;
    }
  };
  useLayoutEffect(() => {
    const state = physicalState;
    const before = prevState.current;
    prevState.current = state;
    clearFlights(1200); // nothing from earlier moves lingers
    // the minions on the wheel a moment ago: when a new round clears the wheel, they fly home to their leaders. Measured
    // only once every minion is out (the round can end next), not on every state.
    const wasOnWheel = minionSnap.current;
    if (state.round >= 1 && state.players.every(p => !p.left)) minionSnap.current = snapshotMinions(root.current);
    else if (state.round !== before.round) minionSnap.current = [];
    if (before === state) { if (!shopSnap.current.size) shopSnap.current = snapshotShop(root.current); noteTable(root.current); return undefined; }
    // the move plays as a chain (director.js, the motion language in design/prototypes/motion/grammar.md): the
    // selection, then each cause's effects from the engine's stream, in order, every count ticking as pieces land
    // Contest and final bonuses belong exclusively to the Reckoning's landing callbacks.
    // The fallback diff must not turn those already-scored followers into a closing-action payout/tag.
    const animationState = scoringMoment ? scoringSeatState(state, scoringMoment, 0) : state;
    const newRound = state.round !== before.round && before.round >= 1;
    const early = newRound && homeEarly.current && homeEarly.current.at != null ? homeEarly.current : null;
    if (newRound) homeEarly.current = null;
    const played = playChain(root.current, before, animationState, { snap: shopSnap.current, minionsBefore: newRound ? (early ? early.snap : wasOnWheel) : null, homeFlownAt: early ? early.at : null, mine: mySeats, chips: chipSnap.current });
    retimeTable(played);

    const lines = newLogLines(before, state);
    // Gifts float onto the receiver's card, worded as what they are: the receiver gains (nobody loses).
    const got = [];
    const startAt = state.log.length - lines.length;
    lines.forEach((l, k) => {
      const g = explainLine(state.log, startAt + k).gift;
      const to = g && state.players.find(p => p.name === g.to);
      if (to) got.push({ pid: to.id, text: g.text, color: g.color, n: Date.now() + got.length });
    });
    if (got.length) { setGifts(gg => [...gg, ...got]); setTimeout(() => setGifts(gg => gg.filter(x => !got.includes(x))), slowed(2400)); }
    // Your own recruit that ends your turn (Hire, Take…) gets its moment before the turn moves on.
    const actor = before.pending ? before.pending.player : null;
    if (actor != null && mySeats.includes(actor) && !(state.pending && state.pending.player === actor)) {
      const rec = lines.map(l => l.match(new RegExp(`^${state.players[actor].name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} recruited (.+?) \\((.*)\\)\\.$`))).filter(Boolean).pop();
      if (rec) {
        // just the name: the cost is in the log (a long line here ran out of the card's one-line lane)
        const g = { pid: actor, text: `Recruited ${rec[1].replace(/ from the pile$/, '')}`, color: null, n: Date.now() + 7 };
        setGifts(gg => [...gg, g]);
        setTimeout(() => setGifts(gg => gg.filter(x => x !== g)), slowed(2400));
      }
    }
    // Getting robbed is never silent: a rival's move that took your resources says so. Counted from where the rival's
    // placement began, as the strip counts it: a steal taken one pick at a time (Redistribute, 2 per rival in round III)
    // read "took 1 green" in the toast and "took 2" in the strip (skeptic round 2)
    const an = actor != null ? state.players[actor].name : null;
    if (actor != null && (!robBase.current || robBase.current.actor !== actor || robBase.current.round !== state.round || lines.some(l => l.startsWith(`${an} took `) || l.startsWith(`${an} joined `)))) {
      robBase.current = { actor, round: state.round, res: before.players.map(p => ({ ...p.res })) };
    }
    if (actor != null && !mySeats.includes(actor)) {
      for (const id of mySeats) {
        const lost = state.resources.map(r => [r, (robBase.current.res[id][r] || 0) - (state.players[id].res[r] || 0)]).filter(([, d]) => d > 0);
        if (lost.length) {
          // on a laptop it's said on the robbed seat, short (Cory, 2026-10-18: "shorter, near your player card"): the
          // seat says whose it is, the dots say what; a phone has no chair beside the wheel, so it keeps the toast
          if (wide) {
            const note = { pid: id, text: `${state.players[actor].name} took ${lost.map(([r, d]) => `${d} ${r}`).join(' ')}`, n: Date.now() };
            setStolen(ss => [...ss.filter(x => x.pid !== id), note]);
            setTimeout(() => setStolen(ss => ss.filter(x => x !== note)), slowed(2400));
          } else showToast(`${state.players[actor].name} took ${lost.map(([r, d]) => `${d} ${r}`).join(', ')} from ${humansHere ? state.players[id].name : 'you'}`, slowed(2400));
          setRobbed({ pid: id, n: Date.now() });
          setTimeout(() => setRobbed(r => (r && r.pid === id ? null : r)), slowed(1600));
        }
      }
    }
    // Nothing to afford: say so in a readable toast — after anything you just got has landed.
    const skipped = lines.find(l => mySeats.some(id => l === `${state.players[id].name} couldn't afford anything.`));
    if (skipped) {
      const msg = humansHere ? skipped.replace("couldn't afford anything.", 'can’t afford anything. Turn passes.') : 'Nothing you can afford. Turn passes.';
      setTimeout(() => showToast(msg, 2000), motionOK() ? played.total : 0);
    }

    // A new minion travels from its leader to the space. The board never turns itself: a rival's move is marked
    // where it happened (a dashed ring) and told in the turn's story.
    if (!freshFlash) return undefined;
    const fresh = [...freshFlash];
    const key = fresh[fresh.length - 1];
    const owner = state.slots[key];
    lastFlash.current = freshFlash;
    void owner; // (the minion's flight is the chain's first step: director.js)
    // the flash is a one-shot landing animation: it stays on that space until the next placement replaces it (fading it
    // after 2s re-rendered the whole table and the wheel mid-chain, once per placement, for no visible change)
    return undefined;
  }, [physicalState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Every turn is told in one place (Cory): a turn card by the acting cult builds line by line as the turn goes
  // (placed → gained → bought), the players it touched pulse, and when the turn passes the card holds a beat, then
  // folds into that cult's chair. One card per placement: a snake turnaround or an extra turn is a turn of its own
  // (RC1 panel). A turn that ends the round is left to the Reckoning.
  // The cards are worked out while rendering (story, above: one commit per step); this only starts the passed turn's
  // hold-and-fold timers and moves the told mark on.
  useLayoutEffect(() => {
    const t = trail.current;
    toldUpTo.current = t.stories.length ? t.stories[t.stories.length - 1].n : 0;
    if (story.live) { turnTimer.current.forEach(clearTimeout); turnTimer.current = []; lastTold.current = null; }
    else if (story.told) {
      const told = story.told;
      lastTold.current = told;
      turnTimer.current.forEach(clearTimeout);
      turnTimer.current = [setTimeout(() => setTurnCard({ ...told, folding: true }), MO.turnCardHold), setTimeout(() => setTurnCard({ n: told.n, gone: true }), MO.turnCardHold + MO.turnCardFold)];
    }
    if (story.told) {
      const pids = story.touched;
      if (pids.length) {
        const n = Date.now();
        setRobbed(r => ({ ...(r || {}), pids, n }));
        setTimeout(() => setRobbed(r => (r && r.n === n ? null : r)), slowed(1800));
      }
    }
  }, [live0]); // eslint-disable-line react-hooks/exhaustive-deps

  // When a choice prompt goes away, keep focus on the table (the status line) rather than the page body: checked when the
  // step's kind changes, and only when focus is truly lost (perf, 2026-10-15: a focus() on every state forced a layout)
  const kindKey = pend ? `${pend.player}:${pend.kind}` : 'none';
  useEffect(() => {
    if (document.hasFocus && !document.hasFocus()) return;
    const a = document.activeElement;
    if ((!a || a === document.body) && root.current) {
      const pill = root.current.querySelector('[data-prompt]');
      if (pill) pill.focus({ preventScroll: true });
    }
  }, [kindKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus goes to the next sensible control when it becomes your move (not into the void).
  useEffect(() => {
    if (!mine || needHandoff || !root.current || (document.hasFocus && !document.hasFocus())) return;
    if (pend.kind !== 'place' && pend.kind !== 'buy') return; // choices and paying focus themselves
    const a = document.activeElement;
    const free = !a || a === document.body || !a.isConnected || (a.matches && a.matches('[data-prompt]')) || (a.closest && a.closest('.side, .stage, .players, .fbuy') && (a.disabled || a.getAttribute('aria-disabled') === 'true' || !a.matches('[data-option]')));
    if (!free) return;
    const pick = pend.kind === 'place'
      ? root.current.querySelector('.act.can') || root.current.querySelector('.slot.can')
      : root.current.querySelector('.card.can') || root.current.querySelector('.fb.can') || root.current.querySelector('.fbuy .pass[data-option]');
    if (pick) pick.focus({ preventScroll: true });
  }, [pend, mine, needHandoff]);

  // Hot-seat: a choice or payment that opens a turn takes the hand-over into its own header ("Ana's turn"),
  // instead of a hand-over screen and then the choice: one step, not two.
  const [handedIn, setHandedIn] = useState(null); // seat whose choice header says it's their turn
  useEffect(() => {
    if (needHandoff && !moment && pend && ['choose', 'setup', 'pay'].includes(pend.kind)) { setReady(pend.player); setHandedIn(pend.player); }
    else if (pend && handedIn != null && pend.player !== handedIn) setHandedIn(null);
  }, [needHandoff, moment, pend]); // eslint-disable-line react-hooks/exhaustive-deps
  // After a hand-over, focus lands on the first thing to do: a glowing space, the first choice, or the buy row.
  useEffect(() => {
    if (ready == null || !root.current) return undefined;
    const t = setTimeout(() => {
      const r = root.current;
      if (!r || (document.hasFocus && !document.hasFocus())) return;
      const pick = r.querySelector('.prompt.choice button:not([disabled])') || r.querySelector('.dialog.pay .btn.pri') || r.querySelector('.slot.can') || r.querySelector('.act.can') || r.querySelector('.card.can') || r.querySelector('.fb.can') || r.querySelector('.fbuy .pass[data-option]');
      if (pick) pick.focus({ preventScroll: true });
    }, 80);
    return () => clearTimeout(t);
  }, [ready]);

  // Clicks during an in-flight move are kept and replayed if they're still legal next; "take all" repeats a
  // counted pick (Steal: 1 gold at a time) while that's still the only choice.
  const queuedClick = useRef([]); // clicks made while a move is in flight, replayed in order if still legal
  const busyNow = useRef(false); // in flight since the click itself (busy, the state, lands with the table's transition)
  const repeat = useRef(null);
  const lastPick = useRef({ id: null, t: 0, x: null, y: null });
  // where the last press landed: the step lock below only eats a second press near the first one (a double tap),
  // never a deliberate press somewhere else (testers felt those as dropped clicks)
  const lastDown = useRef({ x: null, y: null, t: 0 });
  useEffect(() => {
    const down = e => { lastDown.current = { x: e.clientX, y: e.clientY, t: Date.now() }; };
    addEventListener('pointerdown', down, true);
    return () => removeEventListener('pointerdown', down, true);
  }, []);
  // A new kind of step (place → buy, choose → buy…) ignores taps for 400ms, so a double tap on one step's
  // button can't land on the next step's button in the same spot. Repeated steps (setup picks) don't lock.
  const lockUntil = useRef(0);
  const noLock = useRef(false); // an undo is deliberate: the step it returns to isn't locked
  const lastStep = useRef(null);
  useEffect(() => {
    const step = pend && mine ? `${pend.player}:${pend.kind}` : null;
    if (step && lastStep.current && step !== lastStep.current && !noLock.current) lockUntil.current = Date.now() + MO.stepLock;
    noLock.current = false;
    lastStep.current = step;
  }, [pend, mine]);
  const onPick = useCallback((optionId, mode) => {
    // A still-lit old option is presentation only, never a stale command to a newer authoritative state.
    if (interactionState !== physicalState || session.getState() !== physicalState) return;
    // a double-click is one choice: the same option again within 350ms is ignored (replays are exempt)
    const now = Date.now();
    // counted picks ("take 1 gold… (2 left)") are meant to be clicked fast and repeatedly: every click counts
    const counted = !!(pend && /\(\d+ left\)/.test(pend.prompt || ''));
    // the starting picks repeat one kind of step with the same buttons, so no step lock covers them: a slow double-click
    // on one color spent both picks (w4 skeptic #9); there the same color again within 700ms is one pick
    const twin = pend && pend.kind === 'setup' ? Math.max(700, MO.doubleClick) : MO.doubleClick;
    // Automatic copy answers aren't pointer events: they must not be swallowed by
    // the place→choose double-tap guard (350 ms auto-copy versus a 400 ms lock).
    const inputGuard = mode !== 'replay' && mode !== 'automatic';
    if (inputGuard && !counted && lastPick.current.id === optionId && now - lastPick.current.t < twin) return;
    const d = lastDown.current, p0 = lastPick.current;
    // a fresh pointer press far from the last pick is deliberate; anything else (near it, or a key) waits out the lock
    const farFromLast = d.x != null && p0.x != null && now - d.t < 600 && Math.hypot(d.x - p0.x, d.y - p0.y) >= 48;
    if (inputGuard && !counted && now < lockUntil.current && !farFromLast) return;
    lastPick.current = { id: optionId, t: now, x: now - d.t < 600 ? d.x : null, y: now - d.t < 600 ? d.y : null };
    if (mode === 'all') repeat.current = optionId;
    if ((busy || busyNow.current) && mine) { queuedClick.current = counted ? [...queuedClick.current, optionId].slice(-4) : [optionId]; return; }
    if (!mine || needHandoff || !options.has(optionId)) return;
    // a commit closes any open hover (wave-2 tester A #40: a 2→1 buy's hover stayed up while the bots played); a
    // placement keeps the space's card, which shows what you just took
    if (!String(optionId).startsWith('slot:')) hover.close();
    busyNow.current = true;
    startTransition(() => setBusy(true));
    // the shop as you see it right now (a row you may have scrolled, on a phone): a recruit flies from where you saw it
    { const snap = snapshotShop(root.current); if (snap.size) shopSnap.current = snap; }
    setError('');
    const token = ++sendToken.current;
    let sent;
    userMove = true; // the table's update for this move is a transition (useTable.show): the click's frame paints first
    try { sent = session.submit({ player: pend.player, option: optionId }); } catch (e) { sent = Promise.reject(e); } finally { userMove = false; }
    // Don't lock the table forever if an answer never comes (online): give up waiting after a while.
    const timer = setTimeout(() => { if (sendToken.current === token) { busyNow.current = false; setBusy(false); setError('No answer yet. Try again.'); } }, 8000);
    Promise.resolve(sent)
      .catch(e => { if (sendToken.current === token) setError(friendlyError(e)); })
      // a move whose new state the table hasn't drawn yet stays in flight until it has (the [state] effect below): a
      // second click on the old picture can't send a stale move; otherwise settle with the table's transition
      .finally(() => {
        clearTimeout(timer);
        if (sendToken.current !== token) return;
        if (session.getState() !== prevState.current) return;
        busyNow.current = false;
        startTransition(() => setBusy(false));
      });
    // the table took it (the Wheel stands your minion on its space in this same frame, before the table redraws)
    return session.getState() !== physicalState;
  }, [mine, busy, needHandoff, options, session, pend, interactionState, physicalState]);
  useEffect(() => {
    if (busy) return;
    const q = queuedClick.current.shift();
    if (q && mine && options.has(q)) { onPick(q, 'replay'); return; }
    if (q) queuedClick.current = []; // the table moved on: the rest of the queue no longer applies
    const r = repeat.current;
    if (r && mine && pend.kind === 'choose' && /\(\d+ left\)/.test(pend.prompt || '') && options.has(r)) { onPick(r, 'replay'); return; }
    if (r && !(mine && pend.kind === 'choose' && options.has(r))) repeat.current = null;
  }, [busy, state]); // eslint-disable-line react-hooks/exhaustive-deps

  // A question whose answers are all the same member (Hire with two identical cheapest cards) isn't a question:
  // take it, and the recruit gets its moment in the toast.
  useEffect(() => {
    if (!mine || needHandoff || busy || !pend || pend.kind !== 'choose' || pend.options.length < 2) return;
    const defs = pend.options.map(o => (o.kind === 'card' && typeof o.value === 'number' && state.cards[o.value] ? state.cards[o.value].def : null));
    if (defs.some(d => !d) || new Set(defs).size !== 1) return;
    const t = setTimeout(() => onPick(pend.options[0].id, 'replay'), 0);
    return () => clearTimeout(t);
  }, [pend, mine, needHandoff, busy]); // eslint-disable-line react-hooks/exhaustive-deps

  // Only one way to pay isn't a question (dialogs pod, gut call 2026-10-15): pay it at once. The coins still fly from
  // your stacks to what you bought (flyGains), and Undo takes the buy back. Except when that one way gives up a lead you
  // hold (the engine marks it: breaks): then the sheet asks, saying so, with Cancel (wave-2 testers A#4, B#2: a single
  // click spent the gold that led Most gold, and the round ended before Undo could take it back)
  const onePay = pend && pend.kind === 'pay' ? pend.options.filter(o => o.kind === 'pay') : [];
  const onlyPay = mine && !needHandoff && onePay.length === 1 && !(onePay[0].breaks && onePay[0].breaks.length) ? onePay[0].id : null;
  // ...and it never pays silently (live panel r1: "the 8 for 8 skips the dialog, 2 for 1 opens it: I can't predict
  // which"): a "Paid 4● 4●" receipt stands at the card or follower tile you clicked for a moment, so the rule shows
  // itself (one way pays at once and says so; several ways ask)
  const [receipt, setReceipt] = useState(null);
  useEffect(() => {
    if (!onlyPay || busy) return undefined;
    const t = setTimeout(() => { setReceipt(receiptFor(state, pend, onePay[0])); onPick(onlyPay, 'replay'); }, 0);
    return () => clearTimeout(t);
  }, [onlyPay, pend, busy]); // eslint-disable-line react-hooks/exhaustive-deps

  // A tap on something you can't use right now gets a short answer and a small shake, never silence.
  const onDenied = useCallback((info, el) => {
    if (state.over || !pend) return;
    const who = state.players[pend.player];
    // phones: a shop card you can't buy right now opens its details instead (you can't hover there)
    if (info.type === 'card' && (!wide || (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches)) && el && !(pend.kind === 'buy' && mySeats.includes(pend.player) && !needHandoff)) {
      setCardDetail({ el, uid: info.uid });
      return;
    }
    let text;
    if (moment) text = 'Start the round first';
    else if (!mySeats.includes(pend.player)) text = `${who.name} is ${verbFor(pend.kind)} — your turn comes`;
    else if (needHandoff) text = `Hand the device to ${who.name}`;
    else if (pend.kind === 'setup') text = state.artifacts && Object.keys(state.artifacts).length ? 'Pick your artifact first' : 'Draft your resource first';
    else if (pend.kind === 'choose' || pend.kind === 'pay') text = 'Answer the question first';
    else if (info.type === 'slot') {
      // A taken or unopened space explains itself on its own card (wheel) or row (panel); the prompt stays put.
      const owner = state.slots[info.key];
      text = owner !== undefined ? null : pend.kind === 'buy' ? 'You’ve placed this turn — recruit a member or followers, or end your turn: Done, no recruit' : 'You can’t take this space right now';
    } else if (pend.kind === 'place') text = info.type === 'card' || info.type === 'tier' ? 'Place a minion first, then recruit' : 'Place a minion first';
    else if (info.type === 'card') text = `You can’t afford ${info.name} yet`;
    // what you have beside what it needs (w4 skeptic #20: "Need 8, you have 4")
    else if (info.type === 'tier') text = tierLeft(state, info.tier) <= 0 ? `No +${info.tier.get} follower recruits left` : `+${info.tier.get} needs ${tierCostText(info.tier)}; you have ${Object.values(who.res || {}).reduce((a, b) => a + b, 0)}`;
    else text = 'Not right now';
    if (text) say(text);
    // the translate property, so the element's own transform (a socket's centring, a card's lift) stays put
    if (el && el.animate && motionOK()) el.animate([{ translate: '0 0' }, { translate: '-4px 0' }, { translate: '4px 0' }, { translate: '-2px 0' }, { translate: '0 0' }], { duration: 260, easing: 'ease-out' });
  }, [state, pend, moment, mySeats, needHandoff, say, wide]);

  const live = needHandoff ? NO_OPTIONS : optionFor;
  // the shop is memoized (UI-B): stable handlers that always call the latest onPick / onDenied
  const handlers = useRef(null);
  handlers.current = { onPick, onDenied };
  const shopPick = useCallback((...a) => handlers.current.onPick(...a), []);
  const shopDenied = useCallback((...a) => handlers.current.onDenied(...a), []);
  // A modal takes the stage: sweep any flying ghosts so nothing floats over it.
  const modalOpen = !!(moment || rules || leaving || logOpen || (needHandoff && !moment) || (mine && pend && pend.kind === 'pay' && !onlyPay) || (mine && !needHandoff && payChoice(pend)));
  useEffect(() => { if (modalOpen) clearFlights(0); }, [modalOpen]);
  // and the page behind a modal doesn't scroll
  useEffect(() => {
    if (!modalOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [modalOpen]);
  const prForMe = mine || (!!pend && mySeats.includes(pend.player) && !state.over);
  const pr = { ...promptFor(interactionState, prForMe), forMe: prForMe };
  if (pend?.afterPurchase && prForMe) { pr.text = 'Use a member ability, or finish your turn'; pr.sub = ''; }
  // your turn just ended (the table moved from a step of yours to someone else's): for a beat the header says so, then
  // the next player's line (w3b #58: after the second Pass the next frame was already a bot's line). It lasts until the
  // next step lands or the beat runs out, whichever is first.
  const [overBeat, setOverBeat] = useState(null); // { who, moves }
  const lastAsk = useRef({ forMe: false, who: null, moves: null });
  const overTimer = useRef(null);
  useEffect(() => {
    const was = lastAsk.current;
    lastAsk.current = { forMe: prForMe, who: pend ? state.players[pend.player] : null, moves: state.moves };
    if (was.forMe && !prForMe && !state.over && was.who && state.moves === was.moves + 1 && pend && pend.player !== was.who.id) {
      clearTimeout(overTimer.current);
      setOverBeat({ who: was.who, moves: state.moves });
      overTimer.current = setTimeout(() => setOverBeat(null), Math.round(800 * speedScale()));
    }
  }, [state.moves]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearTimeout(overTimer.current), []);
  const turnOver = overBeat && overBeat.moves === state.moves && !prForMe ? overBeat.who : null;
  // the summary comes last (motion review #7, #27): while a move's chain plays (or this state is about to play one),
  // the turn card and a rival's headline keep telling what was already on the table, and change when the chain has
  // landed or is skipped (AfterChain re-renders only itself then)
  // whose move is playing on the table: your "Your turn" line waits for a rival's pieces to land (panel r1: it was
  // announced while their cards were still flying), never for your own
  const chainActor = useRef(null);
  if (prevState.current !== state) chainActor.current = prevState.current.pending ? prevState.current.pending.player : null;
  const rivalPlaying = chainActor.current != null && !mySeats.includes(chainActor.current);
  const holdStory = !state.over && motionOK() && (chainRunning() || (prevState.current !== state && prevState.current.seed === state.seed && planChain(prevState.current, state, { mine: mySeats }).total > 0));
  const showChoice = mine && !needHandoff && (pend.kind === 'choose' || pend.kind === 'setup');
  // the starting picks' row (and the step right after the last pick, while its chain lands): see the AfterChain below
  const setupNow = pend && pend.kind === 'setup' && !state.over ? state : null;
  if (setupNow) lastSetupMoves.current = state.moves;
  const setupHeld = !setupNow && holdStory && lastSetupMoves.current != null && state.moves === lastSetupMoves.current + 1;
  // The board picker: a choice whose options name things on the board (spaces, members, cults, resource stacks) is
  // answered there (boardPick.js); the choice panel shrinks to a caption docked under the headline, the leftover
  // buttons and a list for the keyboard. A gift or a choice of pairs (Good Deed, Kickback, the swaps…) is the gift card
  // beside the space instead; its first part picked is kept here, for this question only.
  const [shopDetails, setShopDetails] = useState(false);
  const [pickFirst, setPickFirst] = useState({ pend: null, v: null });
  const first = pickFirst.pend === pend ? pickFirst.v : null;
  // a gift or a pair is picked on the gift card beside the space (GiftCard.jsx), not on the board
  const gift = useMemo(() => (showChoice && pend.kind === 'choose' ? giftPick(state, pend, first) : null), [showChoice, state, pend, first]);
  if (gift && pr.forMe && mine) pr.text = `${gift.title ? `${gift.title}: ` : ''}${gift.kind === 'gift' ? `a rival you pick gets ${gift.n}${gift.color ? ` ${gift.color}` : ''}` : gift.head[0].toLowerCase() + gift.head.slice(1)}`;
  // (a steal, a recruit from the row, a minion's move: the card asks and the board stays lit, gift.board)
  const picker = useMemo(() => (showChoice && pend.kind === 'choose' && (!gift || gift.board) ? boardPicker(state, pend) : null), [showChoice, state, pend, gift]);
  const shopRecruit = !!(picker && gift?.kind === 'recruit');
  const wheelMove = !!(picker && gift?.kind === 'move');
  const pickSpaces = picker && picker.spaces.size ? picker.spaces : null;
  // what a copy would give, on the space itself while you hover it (the engine's own words for the option)
  const pickNotes = useMemo(() => (pickSpaces ? new Map([...picker.where].filter(([k]) => k.startsWith('space:')).map(([k, o]) => [k.slice(6), o.label])) : null), [picker, pickSpaces]);
  const shopFor = useMemo(() => (picker ? shopLookup(picker) : null), [picker]);
  // A plain question (Your Call's "+2 followers or +4 white") opens at the decision point: beside the space you just
  // took, below it in the wheel's top half and above it in the bottom half, never off the wheel's area.
  const [plainAt, setPlainAt] = useState(null);
  const plainKey = showChoice && (!picker || (gift && !shopRecruit && !wheelMove)) && pend.kind === 'choose' && !payChoice(pend) ? pend : null;
  useLayoutEffect(() => {
    const p = plainKey && state.players[pend.player];
    const key = p && p.lastSlot && state.slots[p.lastSlot.key] === p.id ? p.lastSlot.key : null;
    const w = key && root.current && root.current.querySelector('.lt-wheel');
    const slot = w && w.querySelector(`[data-slot="${key}"]`);
    const cap = w && w.querySelector('.prompt.choice.plain');
    if (!slot || !cap) { setPlainAt(null); return; }
    const W = w.getBoundingClientRect(), S = slot.getBoundingClientRect(), C = cap.getBoundingClientRect();
    // beside the space just taken, on the rim's side of it, never centred on the wheel (w4b #4: a space on the wheel's
    // right put the card mid-wheel). The wheel's centre is the stage's; a space left or right of it gets the card outside
    // it when there's room, else just above or below it, flush with its outer edge; a space at the top or bottom, below or
    // above it.
    const st = w.querySelector('.stage') || w;
    const R = st.getBoundingClientRect();
    const sx = S.left + S.width / 2, sy = S.top + S.height / 2, dx = sx - (R.left + R.width / 2), dy = sy - (R.top + R.height / 2);
    const clampX = x => Math.round(Math.max(8, Math.min(W.width - C.width - 8, x)));
    const clampY = y => Math.round(Math.max(8, Math.min(W.height - C.height - 8, y)));
    const up = sy - W.top < W.height / 2; // the card goes below a space in the top half, above one in the bottom half
    const below = clampY(S.bottom - W.top + 12), above = clampY(S.top - W.top - C.height - 12);
    let left, top;
    if (Math.abs(dx) > Math.abs(dy)) {
      const out = dx > 0 ? S.right - W.left + 12 : S.left - W.left - C.width - 12;
      if (out >= 8 && out + C.width <= W.width - 8) { left = Math.round(out); top = clampY(sy - W.top - C.height / 2); }
      else { left = clampX(dx > 0 ? S.right - W.left - C.width : S.left - W.left); top = up ? below : above; }
    } else { left = clampX(sx - W.left - C.width / 2); top = up ? below : above; }
    setPlainAt(at => (at && at.left === left && at.top === top && at.up === up ? at : { left, top, up }));
  }, [plainKey, gift && gift.chosen]); // eslint-disable-line react-hooks/exhaustive-deps
  const pickerRef = useRef(null);
  pickerRef.current = picker;
  const [seatPicks, setSeatPicks] = useState({ key: null, map: {} }); // this steal's picks so far, for the "−1" on each stack
  const pickKey = picker && picker.count ? `${picker.actor}|${picker.title}|${picker.count.of}|${state.round}` : null;
  const [pickDone, setPickDone] = useState(null); // the last pick's caption ("· 0 left") stays while its resource flies
  useEffect(() => { if (!pickDone) return undefined; const t = setTimeout(() => setPickDone(null), 900); return () => clearTimeout(t); }, [pickDone]);
  const onSeatPick = useCallback((id, el) => {
    if (interactionState !== physicalState || session.getState() !== physicalState) return;
    const pk = pickerRef.current;
    const o = pk && pk.options.find(x => x.id === id);
    if (!o) return;
    if (!options.has(id)) return;
    const t = o.target || {};
    const take = Number.isInteger(t.pid) && t.res && !t.give && t.pid !== pk.actor;
    if (take && pk.count && pk.count.left === 1 && pk.title) setPickDone({ title: pk.title, what: `take ${pk.count.of}${pk.only ? ` ${pk.only}` : ''}`, n: Date.now() });
    const root0 = root.current;
    const home = root0 && (root0.querySelector(`.lt-seat[data-pid="${pk.actor}"] .cs-res`) || root0.querySelector(`.lt-seat[data-pid="${pk.actor}"]`));
    const coin = el && el.querySelector('svg') ? `<span class="pick-coin">${el.querySelector('svg').outerHTML}</span>` : '<span class="pick-coin dot"></span>';
    // each pick moves: a resource from their seat to yours (a gift: from yours to theirs); a picked seat nods
    if (take) { flyToken(el, home, coin, { tag: 'pick-flight', duration: 560 }); notePick(el, 1); } // (its stack drops at once)
    else if (t.give) flyToken(home, el, coin, { tag: 'pick-flight', duration: 560 });
    else if (el && el.animate && motionOK()) el.animate([{ boxShadow: '0 0 0 0 rgba(255,220,140,.9)' }, { boxShadow: '0 0 0 10px rgba(255,220,140,0)' }], { duration: 520, easing: 'ease-out' });
    if (take && pickKey) {
      setSeatPicks(sp => {
        const map = sp.key === pickKey ? { ...sp.map } : {};
        const t = o.target;
        map[t.pid] = { ...(map[t.pid] || {}), [t.res]: ((map[t.pid] || {})[t.res] || 0) + 1 };
        return { key: pickKey, map };
      });
    }
    onPick(id);
  }, [options, onPick, pickKey, interactionState, physicalState, session]);
  // the gift card: a first lifts (or is put back); nothing goes to the engine until the second
  const onGiftFirst = useCallback(a => setPickFirst({ pend, v: a }), [pend]);
  const onGiftAnswer = useCallback((id, el, b) => {
    if (interactionState !== physicalState || session.getState() !== physicalState) return;
    const g = gift;
    if (!g || !options.has(id)) return;
    // a gift: its coins fly from the card to the rival's stack of that color, as many as they get (up to 3)
    const color = g.kind === 'gift' ? g.color : g.kind === 'give' ? g.chosen : null;
    if (color && Number.isInteger(b) && el && root.current) {
      const to = root.current.querySelector(`.lt-seat[data-pid="${b}"] .cs-stack[data-res="${color}"]`) || root.current.querySelector(`.lt-seat[data-pid="${b}"]`);
      const from = root.current.querySelector(g.kind === 'gift' ? '.gift-card .gc-what .pip' : '.gift-card .gc-item.chosen') || el;
      const html = `<span class="pick-coin">${(from.querySelector('svg') || { outerHTML: '' }).outerHTML}</span>`;
      if (to) for (let k = 0; k < Math.max(1, Math.min(3, g.n || 1)); k++) setTimeout(() => flyToken(from, to, html, { tag: 'pick-flight', duration: 460 }), k * 70);
    }
    onPick(id);
  }, [gift, options, onPick, interactionState, physicalState, session]);
  const onSeatDenied = useCallback((why, el) => {
    if (why) say(why);
    if (el && el.animate && motionOK()) el.animate([{ translate: '0 0' }, { translate: '-3px 0' }, { translate: '3px 0' }, { translate: '0 0' }], { duration: 220, easing: 'ease-out' });
  }, [say]);
  // a copy with one space to copy answers itself: the outlined space is the only answer (w4 skeptic #30: Echo with one
  // target still asked for a second click); once per question, a beat after it's asked
  const autoCopied = useRef(null);
  useEffect(() => {
    if (!picker || !mine || needHandoff || !pend || pend.kind !== 'choose' || autoCopied.current === pend) return undefined;
    const only = pend.options.length === 1 ? pend.options[0] : null;
    if (!only || only.kind !== 'space' || !(only.target && only.target.space) || picker.rest.length) return undefined;
    autoCopied.current = pend;
    // not cleared on a re-render (the guard above would then never fire it): it checks the question is still up instead
    setTimeout(() => { if (session.getState().pending === pend) handlers.current.onPick(only.id, 'automatic'); }, 350);
    return undefined;
  }, [picker, pend, mine, needHandoff]); // eslint-disable-line react-hooks/exhaustive-deps
  const pickParts = useMemo(() => {
    // a gift with its color known (Good Deed once picked, Kickback at once): the rivals' seats light too, on the stack
    // the gift lands on, and a click anywhere on a lit seat gives the same answer as that rival's face on the card
    const giftColor = gift && (gift.kind === 'give' ? gift.chosen : gift.kind === 'gift' ? gift.color : null);
    if (gift && giftColor) {
      const out = {};
      for (const { o, b } of gift.seconds) {
        if (!Number.isInteger(b)) continue;
        out[b] = { lit: true, dim: false, give: true, seatMode: true, seat: o, giftSeat: true, picked: {}, members: null,
          stacks: { [giftColor]: { option: o, why: null } }, title: gift.title, onPick: (id, el) => onGiftAnswer(id, el, b), onDenied: onSeatDenied };
      }
      return out;
    }
    if (!picker) return {};
    // the "−1"s show only while they add up to the engine's own count (a reload mid-steal starts them over)
    const picked = seatPicks.key === pickKey && picker.count
      && Object.values(seatPicks.map).reduce((t, m) => t + Object.values(m).reduce((a, b) => a + b, 0), 0) === picker.count.of - picker.count.left ? seatPicks.map : {};
    const out = {};
    for (const p of state.players) {
      const part = seatPart(state, picker, p.id, picked[p.id] || {});
      if (part) out[p.id] = { ...part, title: picker.title, onPick: onSeatPick, onDenied: onSeatDenied };
    }
    return out;
  }, [gift, onGiftAnswer, picker, seatPicks, pickKey, state, onSeatPick, onSeatDenied]);
  const roundText = state.over ? 'Final' : state.round ? <>Round {roman(state.round)} of 3</> : 'Setup';
  const someoneHere = mySeats.length > 0;
  const lastLine = state.log.length ? plainLine(state.log, state.log.length - 1) : '';
  // The latest rival placement, marked on the wheel; read from the state so it survives a reload.
  const lastMove = useMemo(() => (state.over ? null : latestRivalMove(state, mySeats)), [state]); // eslint-disable-line react-hooks/exhaustive-deps
  const recentMoves = useMemo(() => (state.over ? [] : movesSinceYourTurn(state, mySeats)), [state]); // eslint-disable-line react-hooks/exhaustive-deps
  const openLog = () => {
    const log = root.current && root.current.querySelector('.log');
    // inline log (phones, results) scrolls into view; on the desktop table it opens in a drawer
    if (log && log.offsetParent) {
      const d = log.querySelector('details');
      if (d) d.open = true;
      log.scrollIntoView({ behavior: motionOK() ? 'smooth' : 'auto', block: 'start' });
    } else setLogOpen(true);
  };
  const meP = me != null ? state.players[me] : null;
  const buyingNow = mine && !needHandoff && pend.kind === 'buy';
  // Undo is offered only to the seat that made the move (in hot-seat, the person holding the device)
  const holder = humansHere ? (needHandoff ? null : ready ?? (pend && mySeats.includes(pend.player) ? pend.player : null)) : mySeats[0];
  const undoKind = !needHandoff && !busy && typeof session.canUndo === 'function' && session.canUndo()
    // only while the seat to act (on screen) is the person who made the move
    && pend && session.undoSeat != null && pend.player === session.undoSeat && session.undoSeat === holder ? (session.undoKind || 'place') : null;
  const canUndo = !!undoKind && !state.over;
  const undo = () => {
    const k = undoKind;
    if (!session.undo || !session.undo()) return;
    // Undo starts a new deliberate decision: retaking the same space or member is
    // valid immediately, even inside the previous choice's double-click window.
    noLock.current = true;
    lockUntil.current = 0;
    lastPick.current = { id: null, t: 0, x: null, y: null };
    lastDown.current = { x: null, y: null, t: 0 };
    say(k === 'buy' ? 'Recruit undone — choose again' : k === 'setup' ? 'Pick undone — pick again' : 'Placement undone — place again', 'info', 1800);
  };
  const undoWord = undoKind === 'buy' ? 'recruit' : undoKind === 'setup' ? 'pick' : 'placement';

  // The lamp follows the decision; the furniture never moves (fixed regions, phase only re-lights them).
  const memberPicking = mine && !needHandoff && pend?.kind === 'choose' && pend.options.some(o => o.kind === 'card');
  const phase = state.over && !moment ? 'over' : moment ? 'reckon' : !pend ? 'wait' : pend.kind === 'pay' ? 'pay' : pend.kind === 'buy' ? 'buy' : pend.kind === 'place' ? 'place' : pend.kind === 'setup' ? 'setup' : 'choose';
  const yours = mine && !needHandoff;
  // which of the turn's two steps a choice belongs to: the one before it (a recruit's or a release's choice is the buy
  // step, a space's is the placement; RC1 sweep 93: a buy-step choice lit "Place")
  const stepRef = useRef('place');
  if (phase === 'place') stepRef.current = 'place'; else if (phase === 'buy' || phase === 'pay') stepRef.current = 'buy';
  const step = phase === 'choose' ? stepRef.current : phase === 'pay' ? 'buy' : phase;
  return (
    <div className={`app game lt${showChoice ? ' choosing' : ''}${buyingNow ? ' buying' : ''}${setupNow || setupHeld ? ' in-setup' : ''}`} ref={rootRef} data-member-pick={memberPicking || undefined} data-shop-details={shopDetails || undefined} data-phase={phase} data-seats={state.players.length} data-round={state.round} data-yours={yours ? '1' : '0'} data-moves={state.moves} data-presentation-moves={interactionState.moves} data-animating={physicalState !== interactionState || undefined} data-actor={pend ? pend.player : ''} data-bot={pend && state.players[pend.player].kind === 'bot' ? '1' : '0'}>
      <header className="bar lt-prompt" data-region="prompt">
        <div className="bar-row status" aria-live="polite">
          {/* a choice picked on the board: its caption takes the headline's place (never over the wheel) */}
          {picker && (!gift || shopRecruit || wheelMove) ? (
            <ChoicePrompt state={state} onPick={onSeatPick} busy={busy} seatPick={picker} turnOf={!wheelMove && humansHere && handedIn === pend.player ? state.players[pend.player] : null} />
          ) : note ? (
            <span key={note.n} className={`say ${note.tone}`} data-prompt tabIndex={-1} role="status">{note.text}</span>
          ) : pr.text ? (
            <AfterChain value={pr} hold={false} step={state.moves}>{held => {
              // a held line addressed to someone else is never shown in this one's voice (w3b: your "Choose how to
              // pay" stayed up, dotted like a rival's, while the bots moved): it gives way to the current line
              const p = turnOver ? { who: turnOver, text: humansHere ? `${turnOver.name}’s turn is over` : 'Your turn is over', over: true }
                : held.forMe === pr.forMe || (!held.forMe && rivalPlaying) ? held : pr;
              // a rival's line held while their pieces land is said in their voice, never as "Your turn — p4 is paying"
              const voice = mine && (p === pr || !!p.forMe);
              return (
              <span className={`say${voice ? ' mine' : ''}`} data-prompt tabIndex={-1}>
                {p.who && <i style={{ background: playerColor(p.who.id) }} />}
                <span className="say-text">
                  {voice && humansHere && p.who ? <b>{p.who.name}: </b> : null}
                  {voice ? <><span className="lead">{p.lead ?? 'Your turn — '}</span><em>{p.text && !p.keepCase ? p.text[0].toLowerCase() + p.text.slice(1) : p.text}</em></> : state.over || p.over ? <span data-turn-over={p.over ? '' : undefined}>{p.text}</span> : <>{p.text}<span className="dots" aria-hidden="true"> ···</span></>}
                </span>
              </span>
              );
            }}</AfterChain>
          ) : <span className="say" data-prompt tabIndex={-1} />}
          {buyingNow && !wide && <PromptActions optionFor={live} onPick={onPick} afterPurchase={pend.afterPurchase} />}
          <span className="undo-slot">
            {canUndo && <button type="button" className="btn ghost undo" onClick={undo} aria-label={`Undo ${undoWord}`} title={undoKind === 'buy' ? 'Take back your purchase until the next player moves' : undoKind === 'setup' ? 'Take back your draft pick' : 'Take back your minion until you recruit or pass'}>Undo<span className="undo-word"> {undoWord}</span></button>}
          </span>
        </div>
        <div className="bar-row steps-row">
          {/* the round only: "5 minions each · Bo has 6" was trivia, the seats show their own minions (blind testers,
              2026-10-15); the round's start card still says it */}
          {/* the round's snake in names, on hover (round II and III say it on their start card too) */}
          {setupOrder(state) ? <SetupOrderCue state={state} me={me} /> : <span className="round" title={snakeWords(state, me) || undefined}>{roundText}</span>}
          {/* your turn's details sit under the headline (it stays one short line); otherwise the turn's two steps */}
          {picker && (!gift || shopRecruit || wheelMove) ? <span className="say-sub pick-how" data-prompt-sub title={!note ? pickCaption(state, picker).rule : undefined}>{note ? note.text : pickCaption(state, picker).how}</span>
            : pickDone ? <span className="say-sub seat-pick-done" aria-hidden="true"><span className="pick-cap">{pickDone.title}: {pickDone.what} · <span className="num pick-left" data-left="0">0</span> left</span></span>
              : mine && !needHandoff && !note && pr.sub ? <span className="say-sub" data-prompt-sub>{pr.sub}</span>
                : mine && !needHandoff && buyingNow ? null : state.round > 0 && !state.over && (
            <span className="steps" aria-hidden="true">
              <span className={step === 'place' ? 'on' : ''}>Place</span>
              <span className={step === 'buy' ? 'on' : ''}>Recruit</span>
            </span>
          )}
        </div>
        {/* who's winning lives on the chairs (each total, its place, the margin on hover): no score row (Cory, 2026-10-15) */}
        <Menu onRules={() => setRules(true)} onLog={openLog} getState={() => session.getState()} onLeave={onHome ? () => (state.over ? onHome() : setLeaving(true)) : null} />
      </header>
      {session.info && session.info.mode === 'online' && session.info.roomCode && (
        <div className="hint room">Room {session.info.roomCode}</div>
      )}
      {error && (
        <div className="error" role="alert">{error}{' '}
          {isNetworkError(error) || /Check your connection/.test(error)
            ? <button type="button" className="btn ghost" onClick={() => location.reload()}>Retry</button>
            : <button type="button" className="btn ghost" onClick={() => setError('')}>OK</button>}
        </div>
      )}
      {state.over && !moment ? (
        <div className="main over">
          <Results state={state} onPlayAgain={onPlayAgain} onHome={onHome} meId={mySeats.length === 1 ? mySeats[0] : null} />
          {/* the cults at the end, with their final totals already in place: round III's Reckoning has scored the
              end-game bonuses, so the results never count up a second time (Cory, 2026-10-21) */}
          <FinalScore animate={false} state={state} me={me} hover={hover} onPick={onPick} CultSeat={CultSeat}>
            <Log state={state} meId={mySeats.length === 1 ? mySeats[0] : null} hover={hover} />
          </FinalScore>
        </div>
      ) : (
        <>
          {/* (data-step: after you've placed, the wheel steps back so only your buys are bright; final panel S#27) */}
          <section className="lt-wheel" data-region="wheel" data-step={buyingNow ? 'buy' : undefined}>
            <Wheel state={state} interactionState={interactionState} hover={hover} lampQid={lampQid} legal={needHandoff ? NO_SLOTS : pickSpaces || legalSlots} idle={pickSpaces ? null : idleSlots} pickNotes={pickNotes} onPick={onPick} onDenied={onDenied} confirmPlace={!wide} flash={flash} lastMove={lastMove} recentMoves={recentMoves} spacePeek={spacePeek} onSpacePeek={setSpacePeek} meId={mySeats.length === 1 ? mySeats[0] : null} facing={facing} onFacing={setFacing} />
            {showChoice && (!picker || (gift && !shopRecruit && !wheelMove)) && !payChoice(pend) && pend.kind !== 'setup' && (gift
              ? <GiftCard state={state} gift={gift} onFirst={onGiftFirst} onAnswer={gift.board === 'seats' ? onSeatPick : onGiftAnswer} onBack={canUndo ? undo : null} busy={busy} place={plainAt} hover={hover} turnOf={humansHere && handedIn === pend.player ? state.players[pend.player] : null} />
              : <ChoicePrompt state={state} onPick={onPick} busy={busy} place={plainAt} turnOf={humansHere && handedIn === pend.player ? state.players[pend.player] : null} />)}
            {/* the starting picks (motion gaps 1): the row stays on the table while the others pick (read-only), and until the
                last pick has landed, so each rival's pick lights its coin and flies from it to their seat (director.js) */}
            {/* your own starting pick lives in your seat on a laptop (CultSeat .cs-setup); only phones keep it here */}
            <AfterChain value={setupNow} hold={holdStory && !(setupNow && showChoice)} step={state.moves}>{v => v && !(wide && v === state && showChoice) && (
              <ChoicePrompt state={v} onPick={v === state && showChoice ? onPick : NOOP} busy={busy || !(v === state && showChoice)} watching={v === state && showChoice ? null : v.players[v.pending.player]} turnOf={v === state && humansHere && handedIn === pend.player ? state.players[pend.player] : null} />
            )}</AfterChain>
          </section>
          {/* every cult sits around the wheel like chairs at a table: yours bottom left (a little larger), then the
              others clockwise. UI-B fills each chair (CultSeat); the chairs never move. */}
          {/* the chairs stand in this round's turn order, one column (Cory, 2026-10-15: "position IS order"); each chair
              says its turn in words ("your turn in 3", yours only; CultSeat). The rail beside them is gone (Cory, 2026-10-16:
              "the turn-order rail is confusing"): this empty column only measures where the chairs stack (layColumn),
              and its gutter holds the round's counts while a round is scored (Reckoning). */}
          <div className="lt-snake" aria-hidden="true" style={{ '--n': state.players.length }} />
          {seatCorners(state, me).map((pid, k) => (
            <section key={k} className={`lt-seat lt-seat-${k}${pid === me ? ' mine' : ''}${pid != null && pend && pend.player === pid && !state.over ? ' now' : ''}`} data-region={`seat-${k}`} data-pid={pid ?? undefined} data-slot={pid == null ? undefined : snake.slot[pid]}
              style={{ '--slot': pid == null ? k : snake.slot[pid] ?? k }} aria-label={pid == null ? undefined : pid === me ? 'Your cult' : `${state.players[pid].name}’s cult`}>
              {pid == null ? null : (
                <CultSeat state={seatState} pid={pid} me={me} mine={pid === me} now={!!(pend && pend.player === pid && !state.over)} hover={hover} optionFor={pid === me ? live : undefined} onPick={shopPick} pick={pickParts[pid] || null} />
              )}
              {pid != null && stolen.filter(x => x.pid === pid).map(x => <div key={x.n} className="seat-stolen" role="status" data-stolen={pid}><Rich text={x.text} /></div>)}
            </section>
          ))}
          <section className="lt-shop" data-region="shop" aria-label="Shop">
            <ShopCards state={state} me={me} mySeats={yours ? mySeats : NO_SEATS} optionFor={shopFor || live} onPick={shopPick} onDenied={shopDenied} phase={phase} hover={hover} onViewChange={setShopDetails} />
          </section>
          {/* what the rivals did since your own last placement, one line each, always on the board (RC1 panel) */}
          {state.round >= 1 && <SinceStrip state={state} entries={since} me={mySeats.length === 1 ? mySeats[0] : null} yours={yours} hover={hover} onLog={openLog} />}
        </>
      )}
      <AfterChain value={cardNow} hold={holdStory}>{c => (c && !moment && !(state.over && !moment) ? <TurnCard card={c} root={rootEl} state={state} /> : null)}</AfterChain>
      {toast && <div key={toast.n} className="toast" role="status">{toast.text}</div>}
      <TouchTips />
      {cardDetail && state.cards[cardDetail.uid] && (
        <Popover anchor={cardDetail.el} onClose={() => setCardDetail(null)}>
          <CardFace state={state} uid={cardDetail.uid} />
        </Popover>
      )}
      {receipt && <PayReceipt key={receipt.key} receipt={receipt} onDone={() => setReceipt(r => (r && r.key === receipt.key ? null : r))} />}
      {mine && !needHandoff && ((pend.kind === 'pay' && !onlyPay) || payChoice(pend)) && <PayPicker key={pend.uid ?? pend.tier} state={state} onPick={onPick} busy={busy} turnOf={humansHere && handedIn === pend.player ? state.players[pend.player] : null} />}
      {moment && reckoned !== moment && <Reckoning key={moment.result.round + moment.after.moves} info={moment} root={rootEl} meId={mySeats.length === 1 ? mySeats[0] : null} onLamp={setLampQid} onPaid={n => setPaid({ moment, n })} onDone={() => setReckoned(moment)} />}
      {moment && reckoned === moment && closedMoment !== moment && <RoundEnd info={moment} meId={mySeats.length === 1 ? mySeats[0] : null} onNext={nextRound} autoMs={someoneHere ? 0 : 4000} />}
      {rules && <HowToPlay onClose={() => setRules(false)} />}
      {logOpen && <Chronicle state={state} meId={mySeats.length === 1 ? mySeats[0] : null} hover={hover} onClose={() => setLogOpen(false)} />}
      {!state.over && <ActionStage />}
      <HoverCardLayer hover={hover} state={state} me={me} optionFor={live} onPick={onPick} />
      {leaving && (
        <Confirm
          title="Leave this game?" text={leaveText || 'You can resume it from the home screen.'}
          yes="Leave" no="Keep playing" onYes={() => { setLeaving(false); onHome(); }} onNo={() => setLeaving(false)}
        />
      )}
      {needHandoff && !moment && <Handoff player={state.players[pend.player]} onReady={() => setReady(pend.player)} />}
    </div>
  );
}
