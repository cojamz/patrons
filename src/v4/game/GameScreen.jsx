// The game table. Renders engine state from a session and turns clicks into { player, option } moves.
// What's clickable is exactly state.pending.options, and only for seats this client controls.
import { memo, startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { followers, tierLeft, quadrant } from '../../engine/v4/index.js';
import { useAnyDot } from './Glyphs.jsx';
import { finalWinners, isRoundEnd, newLogLines, parseRoundEnd, playerColor, promptFor, roman, tierCostText, scoringSnapshot, explainLine, plainLine, latestRivalMove, movesSinceYourTurn, workersNote } from '../format.js';
import { TouchTips } from './Info.jsx';
import Wheel from './Wheel.jsx';
import ShopCards from './ShopCards.jsx';
import CultSeatRaw from './CultSeat.jsx';
// a chair re-renders only when something it shows changed (seatMemo.js): a rival's step no longer redraws all four
const CultSeat = memo(CultSeatRaw, sameSeat);
const NO_OPTS = new Map();
const NO_FLASH = new Set();
const NO_SLOTS = new Map();
const NO_SEATS = [];
const NO_OPTIONS = () => null;
import { useHoverCards, HoverCardLayer, usePreviewWarmup } from './HoverCards.jsx';
import { replayIntro } from '../Intro.jsx';
import Chronicle from './Chronicle.jsx';
import SinceStrip from './SinceStrip.jsx';
import { createTrail, feed, liveStory, sinceYourTurn } from './trail.js';
import { cardDef } from '../../engine/v4/index.js';
import Results from './Results.jsx';
import RoundEnd from './RoundEnd.jsx';
import Reckoning, { reckonRows } from './Reckoning.jsx';
import { snakeOrder } from './order.js';
import { ChoicePrompt, Confirm, Handoff, Log, useDialog, Popover, CardFace } from './parts.jsx';
import PayPicker from './PayPicker.jsx';
import { Rich, Pip } from './Rich.jsx';
import HowToPlay from '../HowToPlay.jsx';
import { flyCards, flyWorker, motionOK, snapshotShop, clearFlights, slideShop, snapshotMinions, flyMinionsHome, flyToken, flyGains } from './flight.js';
import { playChain, planChain, installChainSkip, onChainSkip, onChainEnd, chainRunning, noteTable } from './director.js';
import { gainsBetween } from './gains.js';
import { MO, BOT, SPEEDS, SPEED_NAMES, motionSpeed, setMotionSpeed, onMotionSpeed } from '../motion.js';
import { boardPicker, seatPart, shopLookup, pickCaption } from './boardPick.js';
import { sameSeat } from './seatMemo.js';
import { friendlyError, isNetworkError } from '../errors.js';
import { ROUND_START, ownsLocal } from '../saved.js';
import { restoredMoment } from '../session/moment.js';
import { gameRecord, recordText } from '../session/record.js';
import { copyText } from '../Recovery.jsx';
import './layout.css'; // the laptop composition from 1200px up (design pod)

const STEP_MS = BOT.catchUp;      // pace when catching up on moves that happened behind the round-end card
const RIVAL_DWELL_MS = BOT.pace.normal; // each visible bot step holds this long (src/v4/motion.js)

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

function useTable(session, rivalDwell = RIVAL_DWELL_MS, beforeShow = null) {
  const first = session.getState();
  // a local game reloaded while its round summary was up reopens it (session/moment.js; the session holds its bots)
  const [table, setTable] = useState(() => ({ shown: first, moment: restoredMoment(session, first) }));
  const queue = useRef([]);
  const paced = useRef(false);
  const held = useRef(!!table.moment);
  const timer = useRef(null);
  const dwellNext = useRef(0); // the hold the step being committed asks for (started once it's on screen)
  const shownRef = useRef(first);
  const online = session.info?.mode === 'online';
  // read (and, if missing, written) once: as a plain useRef argument this ran on every render, re-saving the
  // round-start snapshot after the results had cleared it (a finished game kept a "Resume")
  const [rs0] = useState(() => loadRoundStart(first, online) || first);
  const roundStart = useRef(rs0);

  const show = useCallback(next => {
    const prev = shownRef.current;
    shownRef.current = next;
    const fresh = prev === next ? [] : newLogLines(prev, next);
    const end = fresh.filter(isRoundEnd).pop();
    // the DOM still shows `prev` here: whatever must be measured before it changes is measured now (a card leaving)
    if (beforeShow && beforeShow.current && prev !== next) beforeShow.current(prev, next);
    // The table's update is a transition (perf fix 1): a click's own frame (the press, the focus) paints first, and the
    // re-render of the table follows without blocking input. The engine has already run; only the picture waits.
    if (end) {
      held.current = true;
      const start = roundStart.current;
      roundStart.current = next;
      saveRoundStart(next, online);
      // Keep the board as it was when the round was scored until the card is dismissed.
      const board = scoringSnapshot(prev, next);
      startTransition(() => setTable({ shown: next, moment: { result: parseRoundEnd(next, end), start, after: next, board } }));
    } else {
      if (next.round !== prev.round) { roundStart.current = next; saveRoundStart(next, online); }
      startTransition(() => setTable(t => ({ ...t, shown: next })));
    }
  }, []);

  const pump = useCallback(() => {
    // Show queued states in order. A rival's placement holds on screen long enough to read (the worker travels,
    // the card shows its delta); after the round-end card, the backlog replays at a readable pace too.
    while (!held.current && !timer.current && queue.current.length) {
      const next = queue.current.shift();
      const prev = shownRef.current;
      show(next);
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
      const base = myRecruitThenGone ? BOT.myRecruitHold : rivalStep ? Math.max(rivalDwell, rivalDwell >= 600 ? 600 : 0) + (rivalBought ? Math.min(BOT.recruitExtra, rivalDwell * 0.5) : 0) : rivalSetup ? Math.min(250, rivalDwell) : paced.current && queue.current.length ? STEP_MS : 0;
      // the step's chain of animations sets the pace (director.js; grammar.md §4): the next step shows once it has
      // played (a click or Space skips it). The bot pace is the floor only for a step with nothing to show (a pass).
      // the same player's next step shows when this chain's last piece is two-thirds along (its handoff); a turn that
      // passes waits for the whole chain and a breath. A bot step with nothing to show doesn't wait, except a turn-ending
      // pass, which holds a moment (MO.passHold).
      const plan = planChain(prev, next, { mine });
      const sameNext = !!(next.pending && prev.pending && next.pending.player === prev.pending.player);
      // (a rival's step that shows something stays on screen at least the bot pace's floor, 600ms at Normal: motion.mjs m4)
      const dwell = plan.total ? (sameNext ? Math.max(plan.handoff, rivalStep ? Math.min(rivalDwell, 600) : 0) : plan.total) : rivalStep ? (sameNext ? 0 : MO.passHold) : base;
      if (typeof window !== 'undefined') window.__patronsDwellSum = (window.__patronsDwellSum || 0) + dwell; // (the pacing gate reads it)
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
  useLayoutEffect(() => {
    if (timer.current !== 'commit') return;
    const d = dwellNext.current;
    dwellNext.current = 0;
    timer.current = setTimeout(() => { timer.current = null; pump(); }, d);
  }, [table.shown, pump]);

  // a skipped chain (a click, Space) lets the next step show at once
  useEffect(() => onChainSkip(() => {
    if (typeof timer.current !== 'number' && typeof timer.current !== 'object') return;
    if (timer.current == null || timer.current === 'commit') return;
    clearTimeout(timer.current); timer.current = null; pump();
  }), [pump]);
  useEffect(() => {
    const off = session.subscribe(s => {
      if (s === shownRef.current || queue.current.includes(s)) return;
      queue.current.push(s);
      pump();
    });
    return () => { off(); clearTimeout(timer.current); timer.current = null; };
  }, [session, pump]);

  const dismiss = useCallback(() => {
    held.current = false;
    paced.current = true;
    setTable(t => ({ ...t, moment: null }));
    pump();
  }, [pump]);

  return [table.shown, table.moment, dismiss, rs0];
}

/** The viewer's animation speed (Cory: a setting in the menu; Steady by default), kept in this browser. */
function SpeedSetting() {
  const [sp, setSp] = useState(motionSpeed);
  useEffect(() => onMotionSpeed(setSp), []);
  return (
    <div className="menu-speed" role="radiogroup" aria-label="Animation speed" title="How fast moves play out on the table. Your own clicks always answer at once.">
      <span className="menu-speed-label">Animations</span>
      {Object.keys(SPEEDS).map(k => (
        <button key={k} type="button" role="radio" aria-checked={sp === k} className={`btn ghost menu-speed-opt${sp === k ? ' on' : ''}`} data-speed={k} onClick={() => setMotionSpeed(k)}>{SPEED_NAMES[k]}</button>
      ))}
    </div>
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
          <button type="button" role="menuitem" className="btn ghost intro-btn" onClick={pick(replayIntro)}>How it works (20s)</button>
          <button type="button" role="menuitem" className="btn ghost log-btn" onClick={pick(onLog)}>The log</button>
          <SpeedSetting />
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
  const [pos, setPos] = useState(null);
  useLayoutEffect(() => {
    // the chairs in one ordered column (laptop): the card tells the turn in the right column, just above the shop,
    // under the story of the turns since yours (it would cover the next chair beside its own)
    const column = root && root.querySelector('.lt > .lt-snake');
    // a layout that docks the turn under the story of the turns since yours (layout.css sets --turn-dock: since): the
    // newest turn reads last, under the ones before it
    const dock = root && getComputedStyle(root).getPropertyValue('--turn-dock').trim();
    const since = dock === 'since' && root.querySelector('.lt > .lt-since');
    if (since && since.getBoundingClientRect().width) {
      const b = since.getBoundingClientRect();
      setPos({ left: b.left, right: undefined, top: b.bottom + 8, bottom: undefined, width: b.width, ox: '0%', oy: '0%' });
      return;
    }
    if (column && column.getBoundingClientRect().width) {
      const shop = root.querySelector('.lt > .lt-shop');
      const top = shop ? shop.getBoundingClientRect().top : innerHeight;
      setPos({ left: undefined, right: 18, top: undefined, bottom: Math.max(8, innerHeight - top + 10), ox: '100%', oy: '100%' });
      return;
    }
    // the card sits in the open space beside its cult: under a top chair, over a bottom one (never over the prompt)
    const region = root && root.querySelector(`.lt-seat[data-pid="${card.pid}"]`);
    const seat = region && (region.querySelector('.lt-cult-seat') || region);
    if (!seat) { setPos(null); return; }
    const r = seat.getBoundingClientRect();
    const left = r.left + r.width / 2 < innerWidth / 2;
    const top = r.top + r.height / 2 < innerHeight / 2;
    setPos({
      left: left ? Math.max(10, r.left) : undefined,
      right: left ? undefined : Math.max(10, innerWidth - r.right),
      top: top ? r.bottom + 10 : undefined,
      bottom: top ? undefined : Math.max(8, innerHeight - r.top + 10),
      ox: left ? '0%' : '100%', oy: top ? '0%' : '100%',
    });
  }, [card.pid, card.n, root]);
  if (!pos) return null;
  const [head, ...rest] = card.text.split(' · ');
  return (
    <div className={`turn-card${card.live ? ' live' : ''}${card.folding ? ' folding' : ''}`} data-turn-story={card.text} role="status" aria-live="polite"
      style={{ left: pos.left, right: pos.right, top: pos.top, bottom: pos.bottom, width: pos.width, maxWidth: pos.width, transformOrigin: `${pos.ox} ${pos.oy}`, '--pc': playerColor(card.pid) }}>
      <b className="tc-head">{head}</b>
      {rest.map((l, k) => <span key={`${k}:${l}`} className="tc-line"><Rich text={l} /></span>)}
    </div>
  );
}

/** Which player sits in each corner chair: you bottom left (0), then clockwise from you (1 top left, 2 top right,
 *  3 bottom right). Empty chairs (2–3 players) stay empty. */
function seatCorners(state, me) {
  const n = state.players.length, base = me != null ? me : 0;
  return [0, 1, 2, 3].map(k => (k < n ? (base + k) % n : null));
}

const RELEASE_TEXT = 'Once per round: put one of your members at the bottom of the pile and take back the colored part of its cost, in its own color.';
/** The buy step's other answers live with the question: Pass, and (once a round) Release a member. */
function PromptActions({ state, optionFor, onPick }) {
  const pend = state.pending;
  const releases = pend.options.filter(o => o.kind === 'release');
  const [open, setOpen] = useState(false);
  const turn = `${state.round}:${pend.player}`;
  useEffect(() => { setOpen(false); }, [turn]);
  // an open list closes on Escape or a click anywhere else (RC1 sweep 71: Esc left it open)
  const rowRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const key = e => { if (e.key === 'Escape') setOpen(false); };
    const away = e => { if (rowRef.current && !rowRef.current.contains(e.target)) setOpen(false); };
    addEventListener('keydown', key);
    addEventListener('pointerdown', away, true);
    return () => { removeEventListener('keydown', key); removeEventListener('pointerdown', away, true); };
  }, [open]);
  const pass = optionFor('pass');
  return (
    <span className="pr-actions">
      {releases.length > 0 && (
        <span ref={rowRef} className={`release-row${open ? ' open' : ''}`}>
          <button type="button" className="btn ghost rel-toggle" aria-expanded={open} onClick={() => setOpen(o => !o)}
            title={RELEASE_TEXT}>Release…</button>
          {open && (
            <span className="rel-list" role="group" aria-label={`Release which member? ${RELEASE_TEXT}`}>
              {releases.map(o => {
                const d = state.cards[o.uid] ? cardDef(state, o.uid) : null;
                const n = o.refund ?? 0, color = o.color || 'any';
                return (
                  <button key={o.id} type="button" className="btn ghost rel" data-option={o.id} onClick={() => onPick(o.id)} style={d ? { '--c': `var(--${d.quadrant})` } : undefined}
                    title={o.label}>{d ? d.name : o.label} <span className="num">+{n}</span> <Pip color={color} n={n} /></button>
                );
              })}
            </span>
          )}
        </span>
      )}
      <button type="button" className={`btn pass${pass ? '' : ' idle'}`} title="End your turn without buying" data-option={pass ? 'pass' : undefined} aria-disabled={!pass} onClick={() => pass && onPick('pass')}>Pass</button>
    </span>
  );
}

const verbFor = kind => ({ setup: 'picking a starting resource', place: 'placing a minion', buy: 'shopping', pay: 'paying', choose: 'deciding' }[kind] || 'deciding');

export default function GameScreen({ session, onPlayAgain, onHome, leaveText, pace, onResults, askLeave = 0 }) {
  const beforeShow = useRef(null);
  const [live0, moment, dismissMoment, roundStart0] = useTable(session, pace ?? RIVAL_DWELL_MS, beforeShow);
  const state = moment && moment.board ? moment.board : live0;
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
  useEffect(() => installChainSkip(), []);
  const [reckoned, setReckoned] = useState(null); // the round-end moment whose Reckoning has played (then: the summary)
  const [lampQid, setLampQid] = useState(null); // the quadrant the Reckoning is paying right now
  // how many of the Reckoning's quadrants have landed: until a prize reaches its chair, that chair's total leaves it
  // out, so the totals climb as each prize lands (RC1 saboteur: the seats showed the final numbers at step 1 of 4)
  const [paid, setPaid] = useState({ moment: null, n: 0 });
  const snake = useMemo(() => snakeOrder(state), [state]);
  // the column of chairs (laptop): each chair keeps its own height (compact to its content, like the plate's panels)
  // and they stack in turn order, centred in the column; a new order re-sorts them (they slide, lamp.css). Positions
  // are set straight on the elements after each commit, so nothing re-renders for it.
  useLayoutEffect(() => {
    const r = root.current;
    if (!r) return;
    const rail = r.querySelector(':scope > .lt-snake');
    const seats = [...r.querySelectorAll(':scope > .lt-seat')].filter(e => e.dataset.pid != null);
    if (!rail || !rail.offsetHeight) { seats.forEach(e => e.style.removeProperty('--y')); return; }
    const GAP = 8;
    const rows = seats.map(e => ({ e, slot: Number(e.dataset.slot) || 0, h: e.offsetHeight })).sort((a, b) => a.slot - b.slot);
    const total = rows.reduce((t, x) => t + x.h, 0) + GAP * Math.max(0, rows.length - 1);
    const fromTop = getComputedStyle(rail).getPropertyValue('--seats-align').trim() === 'start';
    let y = fromTop ? 0 : Math.max(0, Math.round((rail.offsetHeight - total) / 2));
    const top = y;
    // whatever sits under the chairs in their column (the story of the turns, in some layouts) starts below the last one
    r.style.setProperty('--seats-end', `${top + total}px`);
    for (const x of rows) { x.e.style.setProperty('--y', `${y}px`); y += x.h + GAP; }
    if (rows.length) {
      rail.style.setProperty('--rail-top', `${top + rows[0].h / 2}px`);
      rail.style.setProperty('--rail-bottom', `${rail.offsetHeight - (top + total - rows[rows.length - 1].h / 2)}px`);
    }
  });
  const seatState = useMemo(() => {
    if (!moment || reckoned === moment) return state;
    let unpaid;
    try { unpaid = reckonRows(moment).slice(paid.moment === moment ? paid.n : 0); } catch { return state; }
    const owed = id => unpaid.reduce((n, r) => n + (r.winners.includes(id) ? r.prize : 0), 0);
    if (!state.players.some(p => owed(p.id))) return state;
    return { ...state, players: state.players.map(p => (owed(p.id) ? { ...p, bonus: p.bonus - owed(p.id), contest: (p.contest || 0) - owed(p.id) } : p)) };
  }, [state, moment, reckoned, paid]);
  const [spacePeek, setSpacePeek] = useState(null); // a space selected from the panel list (one sheet, shared with the wheel)
  // re-render when undo comes or goes, so Undo disappears the moment control passes even while the table catches up
  // (perf fix 2: only then, not on every session change, a held bot step included)
  const undoSig = () => (typeof session.canUndo === 'function' && session.canUndo() ? `${session.undoKind}:${session.undoSeat}` : '');
  const [, setUndoSeen] = useState(undoSig);
  const undoSeen = useRef(null);
  useEffect(() => session.subscribe(() => { const u = undoSig(); if (u !== undoSeen.current) { undoSeen.current = u; startTransition(() => setUndoSeen(u)); } }), [session]); // eslint-disable-line react-hooks/exhaustive-deps
  // A local game's bots wait at a round end (session roundHold) until its summary is gone; they go on once the table
  // shows that state with no summary up (dismissed, or never detected: never a stalled table).
  useEffect(() => { if (!moment && session.roundHold && live0 === session.getState() && session.continueRound) session.continueRound(); }, [moment, live0, session]);
  // results open at the top, on the winner
  // The results are on screen: only now may the app forget the saved game.
  useEffect(() => { if (live0.over && !moment && onResults) onResults(); }, [live0.over, moment]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (live0.over && !moment && typeof window !== 'undefined' && window.scrollTo) { try { window.scrollTo(0, 0); } catch { /* jsdom */ } } }, [live0.over, moment]);
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
  // the summary comes last (motion review #7, #27): while a move's chain plays, the turn card and a rival's headline
  // keep telling what was already on the table; they change when the chain has landed (or is skipped)
  const [settled, setSettled] = useState(live0);
  const latest = useRef(live0);
  latest.current = live0;
  useEffect(() => onChainEnd(() => startTransition(() => setSettled(latest.current))), []);
  useEffect(() => { if (!chainRunning()) setSettled(live0); }, [live0]);
  const lagging = settled !== live0 && settled.seed === live0.seed && !live0.over;
  const shownCard = useRef(null);
  const cardLive = story.live || toldCard;
  if (!lagging) shownCard.current = cardLive;
  const cardNow = lagging ? shownCard.current : cardLive;
  const since = story.since;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const prevState = useRef(state); // the state the table last committed (the flight effect moves it on)
  // the spaces just taken (a new minion lands): worked out while rendering, kept until the next placement, faded after 2s
  const lastFlash = useRef(NO_FLASH);
  const [flashOff, setFlashOff] = useState(null);
  const freshFlash = useMemo(() => {
    const before = prevState.current;
    if (!before || before === state) return null;
    const fresh = state.round !== before.round ? Object.keys(state.slots) : Object.keys(state.slots).filter(k => before.slots[k] === undefined);
    return fresh.length ? new Set(fresh) : null;
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
  const flashSet = freshFlash || lastFlash.current;
  const flash = flashSet === flashOff ? NO_FLASH : flashSet;
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
  const shopSnap = useRef(new Map());
  const minionSnap = useRef([]);
  const noteTimer = useRef(null);
  const toastTimer = useRef(null);
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
  useEffect(() => { sendToken.current += 1; busyNow.current = false; setBusy(false); }, [state]);

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
  // the spaces you could take, worked out in the background as soon as it's your move (the shop's "✓ after X")
  usePreviewWarmup(state, mine && !needHandoff ? pend.player : null);

  // What just happened, made physical: a rival's move turns the wheel to face it, a worker travels from its
  // owner to the space, a recruited card flies from the shop to its new owner.
  // The shop is measured only when a card is about to leave it (perf fix 2: it measured every card, every state), with
  // the DOM still showing the table before the step; your own recruit was measured in onPick already.
  beforeShow.current = (prev, next) => {
    if (!prev.shop || !next.shop || !prev.shop.some(u => !next.shop.includes(u))) return;
    const snap = snapshotShop(root.current);
    if (snap.size) shopSnap.current = snap;
  };
  useLayoutEffect(() => {
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
    const played = playChain(root.current, before, state, { snap: shopSnap.current, minionsBefore: state.round !== before.round && before.round >= 1 ? wasOnWheel : null, mine: mySeats });

    const lines = newLogLines(before, state);
    // Gifts float onto the receiver's card, worded as what they are: the receiver gains (nobody loses).
    const got = [];
    const startAt = state.log.length - lines.length;
    lines.forEach((l, k) => {
      const g = explainLine(state.log, startAt + k).gift;
      const to = g && state.players.find(p => p.name === g.to);
      if (to) got.push({ pid: to.id, text: g.text, color: g.color, n: Date.now() + got.length });
    });
    if (got.length) { setGifts(gg => [...gg, ...got]); setTimeout(() => setGifts(gg => gg.filter(x => !got.includes(x))), 2400); }
    // Your own recruit that ends your turn (Hire, Take…) gets its moment before the turn moves on.
    const actor = before.pending ? before.pending.player : null;
    if (actor != null && mySeats.includes(actor) && !(state.pending && state.pending.player === actor)) {
      const rec = lines.map(l => l.match(new RegExp(`^${state.players[actor].name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} recruited (.+?) \\((.*)\\)\\.$`))).filter(Boolean).pop();
      if (rec) {
        // just the name: the cost is in the log (a long line here ran out of the card's one-line lane)
        const g = { pid: actor, text: `Recruited ${rec[1].replace(/ from the pile$/, '')}`, color: null, n: Date.now() + 7 };
        setGifts(gg => [...gg, g]);
        setTimeout(() => setGifts(gg => gg.filter(x => x !== g)), 2400);
      }
    }
    // Getting robbed is never silent: a rival's move that took your resources says so.
    if (actor != null && !mySeats.includes(actor)) {
      for (const id of mySeats) {
        const lost = state.resources.map(r => [r, before.players[id].res[r] - state.players[id].res[r]]).filter(([, d]) => d > 0);
        if (lost.length) {
          showToast(`${state.players[actor].name} took ${lost.map(([r, d]) => `${d} ${r}`).join(', ')} from ${humansHere ? state.players[id].name : 'you'}`, 2400);
          setRobbed({ pid: id, n: Date.now() });
          setTimeout(() => setRobbed(r => (r && r.pid === id ? null : r)), 1600);
        }
      }
    }
    // Nothing to afford: say so in a readable toast — after anything you just got has landed.
    const skipped = lines.find(l => mySeats.some(id => l === `${state.players[id].name} couldn't buy anything.`));
    if (skipped) {
      const msg = humansHere ? skipped.replace("couldn't buy anything.", 'can’t afford anything. Turn passes.') : 'Nothing you can afford. Turn passes.';
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
    const t = setTimeout(() => setFlashOff(freshFlash), 2000);
    return () => clearTimeout(t);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

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
      turnTimer.current = [setTimeout(() => setTurnCard({ ...told, folding: true }), 2600), setTimeout(() => setTurnCard({ n: told.n, gone: true }), 3100)];
    }
    if (story.told) {
      const pids = story.touched;
      if (pids.length) {
        const n = Date.now();
        setRobbed(r => ({ ...(r || {}), pids, n }));
        setTimeout(() => setRobbed(r => (r && r.n === n ? null : r)), 1800);
      }
    }
  }, [live0]); // eslint-disable-line react-hooks/exhaustive-deps

  // When a choice prompt goes away, keep focus on the table (the status line) rather than the page body.
  useEffect(() => {
    const a = document.activeElement;
    if ((!a || a === document.body) && root.current) {
      const pill = root.current.querySelector('[data-prompt]');
      if (pill) pill.focus({ preventScroll: true });
    }
  }, [state]);

  // Focus goes to the next sensible control when it becomes your move (not into the void).
  useEffect(() => {
    if (!mine || needHandoff || !root.current) return;
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
      if (!r) return;
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
    // a double-click is one choice: the same option again within 350ms is ignored (replays are exempt)
    const now = Date.now();
    // counted picks ("take 1 gold… (2 left)") are meant to be clicked fast and repeatedly: every click counts
    const counted = !!(pend && /\(\d+ left\)/.test(pend.prompt || ''));
    if (mode !== 'replay' && !counted && lastPick.current.id === optionId && now - lastPick.current.t < MO.doubleClick) return;
    const d = lastDown.current, p0 = lastPick.current;
    // a fresh pointer press far from the last pick is deliberate; anything else (near it, or a key) waits out the lock
    const farFromLast = d.x != null && p0.x != null && now - d.t < 600 && Math.hypot(d.x - p0.x, d.y - p0.y) >= 48;
    if (mode !== 'replay' && !counted && now < lockUntil.current && !farFromLast) return;
    lastPick.current = { id: optionId, t: now, x: now - d.t < 600 ? d.x : null, y: now - d.t < 600 ? d.y : null };
    if (mode === 'all') repeat.current = optionId;
    if ((busy || busyNow.current) && mine) { queuedClick.current = counted ? [...queuedClick.current, optionId].slice(-4) : [optionId]; return; }
    if (!mine || needHandoff || !options.has(optionId)) return;
    busyNow.current = true;
    startTransition(() => setBusy(true));
    // the shop as you see it right now (a row you may have scrolled, on a phone): a recruit flies from where you saw it
    { const snap = snapshotShop(root.current); if (snap.size) shopSnap.current = snap; }
    setError('');
    const token = ++sendToken.current;
    let sent;
    try { sent = session.submit({ player: pend.player, option: optionId }); } catch (e) { sent = Promise.reject(e); }
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
  }, [mine, busy, needHandoff, options, session, pend]);
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
  // your stacks to what you bought (flyGains), and Undo takes the buy back.
  const onlyPay = mine && !needHandoff && pend && pend.kind === 'pay' && pend.options.filter(o => o.kind === 'pay').length === 1
    ? pend.options.find(o => o.kind === 'pay').id : null;
  useEffect(() => {
    if (!onlyPay || busy) return undefined;
    const t = setTimeout(() => onPick(onlyPay, 'replay'), 0);
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
    else if (pend.kind === 'setup') text = 'Pick your starting resources first';
    else if (pend.kind === 'choose' || pend.kind === 'pay') text = 'Answer the question first';
    else if (info.type === 'slot') {
      // A taken or unopened space explains itself on its own card (wheel) or row (panel); the prompt stays put.
      const owner = state.slots[info.key];
      text = owner !== undefined ? null : pend.kind === 'buy' ? 'You’ve placed this turn — recruit, buy followers or pass' : 'You can’t take this space right now';
    } else if (pend.kind === 'place') text = info.type === 'card' || info.type === 'tier' ? 'Place a minion first, then recruit' : 'Place a minion first';
    else if (info.type === 'card') text = `You can’t afford ${info.name} yet`;
    else if (info.type === 'tier') text = tierLeft(state, info.tier) <= 0 ? `No +${info.tier.get} buys left` : `+${info.tier.get} needs ${tierCostText(info.tier)}`;
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
  const modalOpen = !!(moment || rules || leaving || logOpen || (needHandoff && !moment) || (mine && pend && pend.kind === 'pay' && !onlyPay));
  useEffect(() => { if (modalOpen) clearFlights(0); }, [modalOpen]);
  // and the page behind a modal doesn't scroll
  useEffect(() => {
    if (!modalOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [modalOpen]);
  const prLive = promptFor(state, mine || (!!pend && mySeats.includes(pend.player) && !state.over));
  const prShown = useRef(prLive);
  if (!lagging || mine) prShown.current = prLive;
  const pr = mine ? prLive : prShown.current;
  const showChoice = mine && !needHandoff && (pend.kind === 'choose' || pend.kind === 'setup');
  // The board picker: a choice whose options name things on the board (spaces, members, cults, resource stacks) is
  // answered there (boardPick.js); the choice panel shrinks to a caption docked under the headline, the leftover
  // buttons and a list for the keyboard. A choice of pairs (Good Deed, the swaps…) takes two steps: the first part
  // picked is kept here, for this question only.
  const [pickFirst, setPickFirst] = useState({ pend: null, v: null });
  const first = pickFirst.pend === pend ? pickFirst.v : null;
  const picker = useMemo(() => (showChoice && pend.kind === 'choose' ? boardPicker(state, pend, first) : null), [showChoice, state, pend, first]);
  const pickSpaces = picker && picker.spaces.size ? picker.spaces : null;
  // what a copy would give, on the space itself while you hover it (the engine's own words for the option)
  const pickNotes = useMemo(() => (pickSpaces ? new Map([...picker.where].filter(([k]) => k.startsWith('space:')).map(([k, o]) => [k.slice(6), o.label])) : null), [picker, pickSpaces]);
  const shopFor = useMemo(() => (picker ? shopLookup(picker) : null), [picker]);
  const pickerRef = useRef(null);
  pickerRef.current = picker;
  const [seatPicks, setSeatPicks] = useState({ key: null, map: {} }); // this steal's picks so far, for the "−1" on each stack
  const pickKey = picker && picker.count ? `${picker.actor}|${picker.title}|${picker.count.of}|${state.round}` : null;
  const [pickDone, setPickDone] = useState(null); // the last pick's caption ("· 0 left") stays while its resource flies
  useEffect(() => { if (!pickDone) return undefined; const t = setTimeout(() => setPickDone(null), 900); return () => clearTimeout(t); }, [pickDone]);
  const onSeatPick = useCallback((id, el) => {
    const pk = pickerRef.current;
    const o = pk && pk.options.find(x => x.id === id);
    if (!o) return;
    // a pair's first step: lift it (or put it back down); nothing goes to the engine yet
    if (o.kind === 'first') {
      setPickFirst({ pend: pk.pend, v: o.chosen ? null : o.first });
      if (el && el.animate && motionOK()) el.animate([{ translate: '0 0' }, { translate: '0 -3px' }, { translate: '0 0' }], { duration: 160, easing: 'ease-out' });
      return;
    }
    if (!options.has(id)) return;
    const t = o.target || {};
    // a gift picked on the rival's seat: its coins fly there from your stack of that color
    if (t.fly != null && el) {
      const from = root.current && root.current.querySelector(`.lt-seat[data-pid="${pk.actor}"] .cs-stack[data-res="${t.fly}"]`);
      const g = from && from.querySelector('svg');
      const html = g ? `<span class="pick-coin">${g.outerHTML}</span>` : '<span class="pick-coin dot"></span>';
      for (let k = 0; k < Math.max(1, Math.min(3, pk.combo && pk.combo.n || 1)); k++) setTimeout(() => flyToken(from, el, html, { tag: 'pick-flight', duration: 420 }), k * 70);
      onPick(id);
      return;
    }
    const take = Number.isInteger(t.pid) && t.res && !t.give && t.pid !== pk.actor;
    if (take && pk.count && pk.count.left === 1 && pk.title) setPickDone({ title: pk.title, what: `take ${pk.count.of}${pk.only ? ` ${pk.only}` : ''}`, n: Date.now() });
    const root0 = root.current;
    const home = root0 && (root0.querySelector(`.lt-seat[data-pid="${pk.actor}"] .cs-res`) || root0.querySelector(`.lt-seat[data-pid="${pk.actor}"]`));
    const coin = el && el.querySelector('svg') ? `<span class="pick-coin">${el.querySelector('svg').outerHTML}</span>` : '<span class="pick-coin dot"></span>';
    // each pick moves: a resource from their seat to yours (a gift: from yours to theirs); a picked seat nods
    if (take) flyToken(el, home, coin, { tag: 'pick-flight', duration: 560 });
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
  }, [options, onPick, pickKey]);
  const onSeatDenied = useCallback((why, el) => {
    if (why) say(why);
    if (el && el.animate && motionOK()) el.animate([{ translate: '0 0' }, { translate: '-3px 0' }, { translate: '3px 0' }, { translate: '0 0' }], { duration: 220, easing: 'ease-out' });
  }, [say]);
  const pickParts = useMemo(() => {
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
  }, [picker, seatPicks, pickKey, state, onSeatPick, onSeatDenied]);
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
  const undo = () => { const k = undoKind; noLock.current = true; lockUntil.current = 0; if (session.undo && session.undo()) say(k === 'buy' ? 'Buy undone — choose again' : k === 'setup' ? 'Pick undone — pick again' : 'Placement undone — place again', 'info', 1800); };
  const undoWord = undoKind === 'buy' ? 'buy' : undoKind === 'setup' ? 'pick' : 'placement';

  // The lamp follows the decision; the furniture never moves (fixed regions, phase only re-lights them).
  const phase = state.over && !moment ? 'over' : moment ? 'reckon' : !pend ? 'wait' : pend.kind === 'pay' ? 'pay' : pend.kind === 'buy' ? 'buy' : pend.kind === 'place' ? 'place' : pend.kind === 'setup' ? 'setup' : 'choose';
  const yours = mine && !needHandoff;
  return (
    <div className={`app game lt${showChoice ? ' choosing' : ''}${buyingNow ? ' buying' : ''}${pend && pend.kind === 'setup' && !state.over ? ' in-setup' : ''}`} ref={root} data-phase={phase} data-round={state.round} data-yours={yours ? '1' : '0'} data-moves={state.moves} data-actor={pend ? pend.player : ''} data-bot={pend && state.players[pend.player].kind === 'bot' ? '1' : '0'}>
      <header className="bar lt-prompt" data-region="prompt">
        <div className="bar-row status" aria-live="polite">
          {/* a choice picked on the board: its caption takes the headline's place (never over the wheel) */}
          {picker ? (
            <ChoicePrompt state={state} onPick={onSeatPick} busy={busy} seatPick={picker} turnOf={humansHere && handedIn === pend.player ? state.players[pend.player] : null} />
          ) : note ? (
            <span key={note.n} className={`say ${note.tone}`} data-prompt tabIndex={-1} role="status">{note.text}</span>
          ) : pr.text ? (
            <span className={`say${mine ? ' mine' : ''}`} data-prompt tabIndex={-1}>
              {pr.who && <i style={{ background: playerColor(pr.who.id) }} />}
              <span className="say-text">
                {mine && humansHere && pr.who ? <b style={{ color: playerColor(pr.who.id) }}>{pr.who.name}: </b> : null}
                {mine ? <><span className="lead">{pr.lead ?? 'Your turn — '}</span><em>{pr.text && !pr.keepCase ? pr.text[0].toLowerCase() + pr.text.slice(1) : pr.text}</em></> : state.over ? pr.text : <>{pr.text}<span className="dots" aria-hidden="true"> ···</span></>}
              </span>
            </span>
          ) : <span className="say" data-prompt tabIndex={-1} />}
          {buyingNow && <PromptActions state={state} optionFor={live} onPick={onPick} />}
          <span className="undo-slot">
            {canUndo && <button type="button" className="btn ghost undo" onClick={undo} aria-label={`Undo ${undoWord}`} title={undoKind === 'buy' ? 'Take back your purchase until the next player moves' : undoKind === 'setup' ? 'Take back your first pick' : 'Take back your minion until you buy or pass'}>Undo<span className="undo-word"> {undoWord}</span></button>}
          </span>
        </div>
        <div className="bar-row steps-row">
          <span className="round">{roundText}{state.round && !state.over ? <small title="Minions this round: one per turn. Extra Hand and similar members add one."> · <span className="num">{workersNote(state)}</span></small> : null}</span>
          {/* your turn's details sit under the headline (it stays one short line); otherwise the turn's two steps */}
          {picker ? <span className="say-sub pick-how" data-prompt-sub>{note ? note.text : pickCaption(state, picker).how}</span>
            : pickDone ? <span className="say-sub seat-pick-done" aria-hidden="true"><span className="pick-cap">{pickDone.title}: {pickDone.what} · <span className="num pick-left" data-left="0">0</span> left</span></span>
              : mine && !needHandoff && pr.sub && !note ? <span className="say-sub" data-prompt-sub>{pr.sub}</span> : state.round > 0 && !state.over && (
            <span className="steps" aria-hidden="true">
              <span className={phase === 'place' || phase === 'choose' ? 'on' : ''}>Place</span>
              <span className={phase === 'buy' || phase === 'pay' ? 'on' : ''}>Recruit or buy</span>
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
          <div className="side over-cults" aria-label="The cults at the end">
            {(state.ranking || state.players.map(p => p.id)).map((pid, k) => {
              const won = finalWinners(state).includes(pid); // the rule: most followers, members break a tie
              return (
                <div key={pid} className={`over-seat${won ? ' won' : ''}`} data-pid={pid}>
                  <span className="rank num" aria-hidden="true">{k + 1}</span>
                  <CultSeat state={state} pid={pid} me={me} mine={pid === me} now={won} hover={hover} onPick={onPick} />
                  <b className="final num" title="Followers at the end">{followers(state, state.players[pid])}</b>
                </div>
              );
            })}
            <Log state={state} meId={mySeats.length === 1 ? mySeats[0] : null} />
          </div>
        </div>
      ) : (
        <>
          <section className="lt-wheel" data-region="wheel">
            <Wheel state={state} hover={hover} lampQid={lampQid} legal={needHandoff ? NO_SLOTS : pickSpaces || legalSlots} pickNotes={pickNotes} onPick={onPick} onDenied={onDenied} confirmPlace={session.info?.mode === 'online'} flash={flash} lastMove={lastMove} recentMoves={recentMoves} spacePeek={spacePeek} onSpacePeek={setSpacePeek} meId={mySeats.length === 1 ? mySeats[0] : null} facing={facing} onFacing={setFacing} />
            {showChoice && !picker && <ChoicePrompt state={state} onPick={onPick} busy={busy} turnOf={humansHere && handedIn === pend.player ? state.players[pend.player] : null} />}
          </section>
          {/* every cult sits around the wheel like chairs at a table: yours bottom left (a little larger), then the
              others clockwise. UI-B fills each chair (CultSeat); the chairs never move. */}
          {/* the chairs stand in this round's turn order, one column (Cory, 2026-10-15: "position IS order"); the snake
              rail beside them shows which way the turns are walking. A new round's order re-sorts them (they slide). */}
          {(
            <div className={`lt-snake ${state.round >= 1 ? `dir-${snake.dir}` : 'dir-none'}`} data-snake={snake.dir} data-pass={snake.pass + 1} style={{ '--n': state.players.length }}
              title={state.round < 1 ? 'Setup: everyone picks their starting resources, top to bottom.' : `Turn order this round, top to bottom: ${snake.order.map(id => (id === me ? 'You' : state.players[id].name)).join(', ')}. The snake goes down, then back up${snake.passes ? ` (pass ${snake.pass + 1} of ${snake.passes}, going ${snake.dir})` : ''}: whoever ends a pass starts the next.`}>
              <span className="sn-line" aria-hidden="true" />
            </div>
          )}
          {seatCorners(state, me).map((pid, k) => (
            <section key={k} className={`lt-seat lt-seat-${k}${pid === me ? ' mine' : ''}${pid != null && pend && pend.player === pid && !state.over ? ' now' : ''}`} data-region={`seat-${k}`} data-pid={pid ?? undefined} data-slot={pid == null ? undefined : snake.slot[pid]}
              style={{ '--slot': pid == null ? k : snake.slot[pid] ?? k }} aria-label={pid == null ? undefined : pid === me ? 'Your cult' : `${state.players[pid].name}’s cult`}>
              {pid == null ? null : (
                <CultSeat state={seatState} pid={pid} me={me} mine={pid === me} now={!!(pend && pend.player === pid && !state.over)} hover={hover} optionFor={pid === me ? live : undefined} onPick={shopPick} pick={pickParts[pid] || null} />
              )}
            </section>
          ))}
          <section className="lt-shop" data-region="shop" aria-label="Shop">
            <ShopCards state={state} me={me} mySeats={yours ? mySeats : NO_SEATS} optionFor={shopFor || live} onPick={shopPick} onDenied={shopDenied} phase={phase} hover={hover} />
          </section>
          {/* what the rivals did since your own last placement, one line each, always on the board (RC1 panel) */}
          {state.round >= 1 && <SinceStrip state={state} entries={since} me={mySeats.length === 1 ? mySeats[0] : null} yours={yours} hover={hover} onLog={openLog} />}
        </>
      )}
      {cardNow && !moment && !(state.over && !moment) && <TurnCard card={cardNow} root={root.current} state={state} />}
      {toast && <div key={toast.n} className="toast" role="status">{toast.text}</div>}
      <TouchTips />
      {cardDetail && state.cards[cardDetail.uid] && (
        <Popover anchor={cardDetail.el} onClose={() => setCardDetail(null)}>
          <CardFace state={state} uid={cardDetail.uid} />
        </Popover>
      )}
      {mine && !needHandoff && pend.kind === 'pay' && !onlyPay && <PayPicker key={pend.uid ?? pend.tier} state={state} onPick={onPick} busy={busy} turnOf={humansHere && handedIn === pend.player ? state.players[pend.player] : null} />}
      {moment && reckoned !== moment && <Reckoning key={moment.result.round + moment.after.moves} info={moment} root={root.current} meId={mySeats.length === 1 ? mySeats[0] : null} onLamp={setLampQid} onPaid={n => setPaid({ moment, n })} onDone={() => setReckoned(moment)} />}
      {moment && reckoned === moment && <RoundEnd info={moment} meId={mySeats.length === 1 ? mySeats[0] : null} onNext={dismissMoment} autoMs={someoneHere ? 0 : 4000} />}
      {rules && <HowToPlay onClose={() => setRules(false)} />}
      {logOpen && <Chronicle state={state} meId={mySeats.length === 1 ? mySeats[0] : null} hover={hover} onClose={() => setLogOpen(false)} />}
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
