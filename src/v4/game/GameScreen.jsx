// The game table. Renders engine state from a session and turns clicks into { player, option } moves.
// What's clickable is exactly state.pending.options, and only for seats this client controls.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { followers, tierLeft, tierUsed } from '../../engine/v4/index.js';
import { isRoundEnd, newLogLines, parseRoundEnd, playerColor, promptFor, roman, tierCostText, scoringSnapshot, explainLine, plainLine, latestRivalMove, movesSinceYourTurn, workersNote, turnStory } from '../format.js';
import { TouchTips } from './Info.jsx';
import Wheel from './Wheel.jsx';
import Players, { Resources, Workers } from './Players.jsx';
import ShopCards from './ShopCards.jsx';
import CultSeat from './CultSeat.jsx';
import { useHoverCards, HoverCardLayer } from './HoverCards.jsx';
import Chronicle from './Chronicle.jsx';
import { cardDef } from '../../engine/v4/index.js';
import Results from './Results.jsx';
import RoundEnd from './RoundEnd.jsx';
import Reckoning from './Reckoning.jsx';
import { ChoicePrompt, Confirm, Handoff, Log, useDialog, Popover, CardFace } from './parts.jsx';
import PayPicker from './PayPicker.jsx';
import HowToPlay from '../HowToPlay.jsx';
import Tick from './Tick.jsx';
import { flyCards, flyWorker, motionOK, snapshotShop, clearFlights, slideShop, snapshotMinions, flyMinionsHome } from './flight.js';
import { friendlyError, isNetworkError } from '../errors.js';
import { ROUND_START } from '../saved.js';
import { gameRecord, recordText } from '../session/record.js';
import { copyText } from '../Recovery.jsx';

const STEP_MS = 320;      // pace when catching up on moves that happened behind the round-end card
const RIVAL_DWELL_MS = 700; // each visible bot step (placing, recruiting, buying) holds this long; a pass doesn't wait

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

function useTable(session, rivalDwell = RIVAL_DWELL_MS) {
  const first = session.getState();
  const [table, setTable] = useState(() => ({ shown: first, moment: null }));
  const queue = useRef([]);
  const paced = useRef(false);
  const held = useRef(false);
  const timer = useRef(null);
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
    if (end) {
      held.current = true;
      const start = roundStart.current;
      roundStart.current = next;
      saveRoundStart(next, online);
      // Keep the board as it was when the round was scored until the card is dismissed.
      const board = scoringSnapshot(prev, next);
      setTable({ shown: next, moment: { result: parseRoundEnd(next, end), start, after: next, board } });
    } else {
      if (next.round !== prev.round) { roundStart.current = next; saveRoundStart(next, online); }
      setTable(t => ({ ...t, shown: next }));
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
      const dwell = myRecruitThenGone ? 1500 : rivalStep ? Math.max(rivalDwell, rivalDwell >= 600 ? 600 : 0) + (rivalBought ? Math.min(400, rivalDwell * 0.5) : 0) : rivalSetup ? Math.min(250, rivalDwell) : paced.current && queue.current.length ? STEP_MS : 0;
      if (!queue.current.length) paced.current = false;
      if (dwell) {
        timer.current = setTimeout(() => { timer.current = null; pump(); }, dwell);
        return;
      }
    }
  }, [show, session, rivalDwell]);

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

  return [table.shown, table.moment, dismiss];
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
          <button type="button" role="menuitem" className="btn ghost log-btn" onClick={pick(onLog)}>The log</button>
          <button type="button" role="menuitem" className="btn ghost record-btn" data-copy-record onClick={copyRecord}
            title="Copies this game, move by move, so a problem can be replayed exactly">{copied === 'copied' ? 'Copied ✓' : 'Copy game record'}</button>
          {copied && copied !== 'copied' && (
            <textarea className="record-text" readOnly value={copied} aria-label="Game record (copy it by hand)" onFocus={e => e.target.select()} autoFocus />
          )}
          {onLeave && <button type="button" role="menuitem" className="btn ghost leave-btn" onClick={pick(onLeave)}>Leave</button>}
        </div>
      )}
    </div>
  );
}

/** Which player sits in each corner chair: you bottom left (0), then clockwise from you (1 top left, 2 top right,
 *  3 bottom right). Empty chairs (2–3 players) stay empty. */
function seatCorners(state, me) {
  const n = state.players.length, base = me != null ? me : 0;
  return [0, 1, 2, 3].map(k => (k < n ? (base + k) % n : null));
}

/** The buy step's other answers live with the question: Pass, and (once a round) Release a member for its cost. */
function PromptActions({ state, optionFor, onPick }) {
  const pend = state.pending;
  const releases = pend.options.filter(o => o.kind === 'release');
  const [open, setOpen] = useState(false);
  const turn = `${state.round}:${pend.player}`;
  useEffect(() => { setOpen(false); }, [turn]);
  const pass = optionFor('pass');
  return (
    <span className="pr-actions">
      {releases.length > 0 && (
        <span className={`release-row${open ? ' open' : ''}`}>
          <button type="button" className="btn ghost rel-toggle" aria-expanded={open} onClick={() => setOpen(o => !o)}
            title="Once per round: discard one of your members (it goes to the bottom of the pile) for its cost, in any colors you choose.">Release…</button>
          {open && (
            <span className="rel-list" role="group" aria-label="Release which member (once a round: its cost back in any colors)">
              {releases.map(o => {
                const d = state.cards[o.uid] ? cardDef(state, o.uid) : null;
                return (
                  <button key={o.id} type="button" className="btn ghost rel" data-option={o.id} onClick={() => onPick(o.id)} style={d ? { '--c': `var(--${d.quadrant})` } : undefined}
                    title={o.label}>{d ? <>{d.name} <span className="num">+{d.s + d.w}</span></> : o.label}</button>
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

export default function GameScreen({ session, onPlayAgain, onHome, leaveText, pace, onResults }) {
  const [live0, moment, dismissMoment] = useTable(session, pace ?? RIVAL_DWELL_MS);
  const state = moment && moment.board ? moment.board : live0;
  const mySeats = session.mySeats || [];
  const pend = state.pending;
  const mine = !!(pend && !state.over && !moment && mySeats.includes(pend.player));
  const [facing, setFacing] = useState(0);

  const [gifts, setGifts] = useState([]); // short-lived "+1 gold from P2" floaters on player cards
  const [toast, setToast] = useState(null);
  const [robbed, setRobbed] = useState(null); // { pid, n }: flash that player's resources
  const [cardDetail, setCardDetail] = useState(null); // { el, uid, hover? } a shop card's details (tap on phones, hover on desktop)
  const hoverTimer = useRef(null);
  const onHoverCard = useCallback((uid, el) => {
    clearTimeout(hoverTimer.current);
    if (uid == null) { hoverTimer.current = setTimeout(() => setCardDetail(c => (c && c.hover ? null : c)), 120); return; }
    hoverTimer.current = setTimeout(() => setCardDetail(c => (c && !c.hover ? c : { uid, el, hover: true })), 160);
  }, []);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);
  const hover = useHoverCards(); // UI-B's one hover layer: spaces, plaques, seats, shop cards
  const [reckoned, setReckoned] = useState(null); // the round-end moment whose Reckoning has played (then: the summary)
  const [lampQid, setLampQid] = useState(null); // the quadrant the Reckoning is paying right now
  const [spacePeek, setSpacePeek] = useState(null); // a space selected from the panel list (one sheet, shared with the wheel)
  // re-render on every session change, so Undo disappears the moment control passes even while the table catches up
  const [, setTick] = useState(0);
  useEffect(() => session.subscribe(() => setTick(t => t + 1)), [session]);
  // results open at the top, on the winner
  // The results are on screen: only now may the app forget the saved game.
  useEffect(() => { if (live0.over && !moment && onResults) onResults(); }, [live0.over, moment]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (live0.over && !moment && typeof window !== 'undefined' && window.scrollTo) { try { window.scrollTo(0, 0); } catch { /* jsdom */ } } }, [live0.over, moment]);
  const [caption, setCaption] = useState(null); // "P3 took Swell (+5 blue)", pinned over the wheel for a beat
  const turnStart = useRef(null); // { actor, state }: where the current turn began (its story is told when it passes)
  const captionTimer = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(() => new Set());
  const [ready, setReady] = useState(null); // hot-seat: which human seat has been handed the device
  const [rules, setRules] = useState(false);
  const wide = useWide();
  const short = useShort();
  void short;
  const [logOpen, setLogOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [note, setNote] = useState(null); // { text, tone, n } — a gentle answer in the status pill
  const prevState = useRef(state);
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
  useEffect(() => { sendToken.current += 1; setBusy(false); }, [state]);

  const options = useMemo(() => (mine ? new Map(pend.options.map(o => [o.id, o])) : new Map()), [mine, pend]);
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

  // What just happened, made physical: a rival's move turns the wheel to face it, a worker travels from its
  // owner to the space, a recruited card flies from the shop to its new owner.
  useLayoutEffect(() => {
    const before = prevState.current;
    prevState.current = state;
    clearFlights(1200); // nothing from earlier moves lingers
    // the minions on the wheel a moment ago: when a new round clears the wheel, they fly home to their leaders
    const wasOnWheel = minionSnap.current;
    minionSnap.current = snapshotMinions(root.current);
    if (before === state) { shopSnap.current = snapshotShop(root.current); return undefined; }
    if (state.round !== before.round && before.round >= 1) flyMinionsHome(root.current, wasOnWheel);
    const flights = before.shop.filter(u => !state.shop.includes(u))
      .map(uid => ({ uid, to: state.players.findIndex(p => p.members.includes(uid)) }))
      .filter(m => m.to >= 0);
    if (flights.length) { flyCards(root.current, shopSnap.current, flights); slideShop(root.current, shopSnap.current); }
    shopSnap.current = snapshotShop(root.current);

    const lines = newLogLines(before, state);
    // the clock running out is news for everyone: say it where people look, not only in the log
    const clock = lines.find(l => /The game ends after this round\./.test(l));
    if (clock) showToast(clock.replace('The last', 'The last').replace(' is gone.', ' is gone:').replace(' The game', ' the game'), 3600);
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
    // Each finished turn (anyone's, yours too) is told in one plain line by the board, and the players it touched
    // pulse. A turn that ends the round is left to the round-end card.
    const turnOf = before.pending ? before.pending.player : null;
    const passed = turnOf != null && before.round >= 1 && !(state.pending && state.pending.player === turnOf && state.round === before.round);
    if (passed && turnStart.current && turnStart.current.actor === turnOf && state.round === before.round) {
      const story = turnStory(turnStart.current.state, state, turnOf, mySeats.length === 1 ? mySeats[0] : null, turnStart.current.mid);
      if (story) {
        clearTimeout(captionTimer.current);
        setCaption({ text: story.text, pid: turnOf, n: Date.now(), story: true });
        captionTimer.current = setTimeout(() => setCaption(null), 6000);
        if (story.touched.length) {
          const n = Date.now();
          setRobbed(r => ({ ...(r || {}), pids: story.touched, n }));
          setTimeout(() => setRobbed(r => (r && r.n === n ? null : r)), 1800);
        }
      }
    }
    if (state.pending && (!before.pending || state.pending.player !== before.pending.player || state.round !== before.round)) turnStart.current = { actor: state.pending.player, state, mid: null };
    // the turn reached its buy: what the action gave is settled (the buy's cost is told apart)
    if (state.pending && state.pending.kind === 'buy' && turnStart.current && turnStart.current.actor === state.pending.player && !turnStart.current.mid) turnStart.current.mid = state;
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
      setTimeout(() => showToast(msg, 2000), flights.length && motionOK() ? 650 : 0);
    }

    // A new minion travels from its leader to the space. The board never turns itself: a rival's move is marked
    // where it happened (a dashed ring) and told in the turn's story.
    const fresh = state.round !== before.round ? Object.keys(state.slots) : Object.keys(state.slots).filter(k => before.slots[k] === undefined);
    if (!fresh.length) return undefined;
    const key = fresh[fresh.length - 1];
    const owner = state.slots[key];
    if (!mySeats.includes(owner)) {
      const took = lines.map(l => l.match(new RegExp(`^${state.players[owner].name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} took (.+) \\((\\w+)\\)\\.$`))).find(Boolean);
      const b0 = before.players[owner], p1 = state.players[owner];
      const delta = state.resources.map(r => [r, p1.res[r] - b0.res[r]]).filter(([, d]) => d).map(([r, d]) => `${d > 0 ? '+' : '−'}${Math.abs(d)} ${r}`).join(', ');
      if (took) {
        clearTimeout(captionTimer.current);
        setCaption({ text: `${p1.name} took ${took[1]}${delta ? ` (${delta})` : ''}`, pid: owner, n: Date.now() });
        captionTimer.current = setTimeout(() => setCaption(null), 6000);
      }
    }
    setFlash(new Set(fresh));
    flyWorker(root.current, owner, key, playerColor(owner));
    const t = setTimeout(() => setFlash(new Set()), 2000);
    return () => clearTimeout(t);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const repeat = useRef(null);
  useEffect(() => { if (mine && pend && pend.kind === 'place') setCaption(null); }, [mine, pend]);
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
    if (step && lastStep.current && step !== lastStep.current && !noLock.current) lockUntil.current = Date.now() + 400;
    noLock.current = false;
    lastStep.current = step;
  }, [pend, mine]);
  const onPick = useCallback((optionId, mode) => {
    // a double-click is one choice: the same option again within 350ms is ignored (replays are exempt)
    const now = Date.now();
    // counted picks ("take 1 gold… (2 left)") are meant to be clicked fast and repeatedly: every click counts
    const counted = !!(pend && /\(\d+ left\)/.test(pend.prompt || ''));
    if (mode !== 'replay' && !counted && lastPick.current.id === optionId && now - lastPick.current.t < 350) return;
    const d = lastDown.current, p0 = lastPick.current;
    // a fresh pointer press far from the last pick is deliberate; anything else (near it, or a key) waits out the lock
    const farFromLast = d.x != null && p0.x != null && now - d.t < 600 && Math.hypot(d.x - p0.x, d.y - p0.y) >= 48;
    if (mode !== 'replay' && !counted && now < lockUntil.current && !farFromLast) return;
    lastPick.current = { id: optionId, t: now, x: now - d.t < 600 ? d.x : null, y: now - d.t < 600 ? d.y : null };
    if (mode === 'all') repeat.current = optionId;
    if (busy && mine) { queuedClick.current = counted ? [...queuedClick.current, optionId].slice(-4) : [optionId]; return; }
    if (!mine || needHandoff || !options.has(optionId)) return;
    setBusy(true);
    setError('');
    const token = ++sendToken.current;
    let sent;
    try { sent = session.submit({ player: pend.player, option: optionId }); } catch (e) { sent = Promise.reject(e); }
    // Don't lock the table forever if an answer never comes (online): give up waiting after a while.
    const timer = setTimeout(() => { if (sendToken.current === token) { setBusy(false); setError('No answer yet. Try again.'); } }, 8000);
    Promise.resolve(sent)
      .catch(e => { if (sendToken.current === token) setError(friendlyError(e)); })
      .finally(() => { clearTimeout(timer); if (sendToken.current === token) setBusy(false); });
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
      text = owner === undefined && pend.kind === 'buy' ? 'You’ve placed this turn — recruit, buy followers or pass' : null;
    } else if (pend.kind === 'place') text = info.type === 'card' || info.type === 'tier' ? 'Place a minion first, then recruit' : 'Place a minion first';
    else if (info.type === 'card') text = `You can’t afford ${info.name} yet`;
    else if (info.type === 'tier') text = tierLeft(state, info.tier) <= 0 ? `No +${info.tier.get} buys left`
      : tierUsed(state, state.players[pend.player], info.tier) ? `One +${info.tier.get} buy per round: yours is made` : `+${info.tier.get} needs ${tierCostText(info.tier)}`;
    else text = 'Not right now';
    if (text) say(text);
    if (el && el.animate && motionOK()) el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(0)' }], { duration: 260, easing: 'ease-out' });
  }, [state, pend, moment, mySeats, needHandoff, say, wide]);

  const live = needHandoff ? () => null : optionFor;
  // A modal takes the stage: sweep any flying ghosts so nothing floats over it.
  const modalOpen = !!(moment || rules || leaving || logOpen || (needHandoff && !moment) || (mine && pend && pend.kind === 'pay'));
  useEffect(() => { if (modalOpen) clearFlights(0); }, [modalOpen]);
  // and the page behind a modal doesn't scroll
  useEffect(() => {
    if (!modalOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [modalOpen]);
  const pr = promptFor(state, mine || (!!pend && mySeats.includes(pend.player) && !state.over));
  const showChoice = mine && !needHandoff && (pend.kind === 'choose' || pend.kind === 'setup');
  const players = <Players state={state} active={pend ? pend.player : null} mySeats={mySeats} optionFor={live} onPick={onPick} gifts={gifts} robbed={robbed} />;
  const roundText = state.over ? 'Final' : state.round ? <>Round {roman(state.round)}{state.endEarly ? <em className="last-tag"> (last)</em> : null}</> : 'Setup';
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
    <div className={`app game lt${showChoice ? ' choosing' : ''}${buyingNow ? ' buying' : ''}${pend && pend.kind === 'setup' && !state.over ? ' in-setup' : ''}`} ref={root} data-phase={phase} data-yours={yours ? '1' : '0'} data-moves={state.moves} data-actor={pend ? pend.player : ''} data-bot={pend && state.players[pend.player].kind === 'bot' ? '1' : '0'}>
      <header className="bar lt-prompt" data-region="prompt">
        <div className="bar-row status" aria-live="polite">
          {note ? (
            <span key={note.n} className={`say ${note.tone}`} data-prompt tabIndex={-1} role="status">{note.text}</span>
          ) : pr.text ? (
            <span className={`say${mine ? ' mine' : ''}`} data-prompt tabIndex={-1}>
              {pr.who && <i style={{ background: playerColor(pr.who.id) }} />}
              <span className="say-text">
                {mine && humansHere && pr.who ? <b style={{ color: playerColor(pr.who.id) }}>{pr.who.name}: </b> : null}
                {mine ? <><span className="lead">Your turn — </span><em>{pr.text ? pr.text[0].toLowerCase() + pr.text.slice(1) : pr.text}</em></> : state.over ? pr.text : <>{pr.text}<span className="dots" aria-hidden="true"> ···</span></>}
              </span>
            </span>
          ) : <span className="say" data-prompt tabIndex={-1} />}
          {buyingNow && <PromptActions state={state} optionFor={live} onPick={onPick} />}
          <span className="undo-slot">
            {canUndo && <button type="button" className="btn ghost undo" onClick={undo} aria-label={`Undo ${undoWord}`} title={undoKind === 'buy' ? 'Take back your purchase until the next player moves' : undoKind === 'setup' ? 'Take back your first pick' : 'Take back your minion until you buy or pass'}>↶ Undo<span className="undo-word"> {undoWord}</span></button>}
          </span>
        </div>
        <div className="bar-row steps-row">
          <span className="round">{roundText}{state.round && !state.over ? <small title="Minions this round: one per turn. Extra Hand and similar members add one."> · <span className="num">{workersNote(state)}</span></small> : null}</span>
          {state.round > 0 && !state.over && (
            <span className="steps" aria-hidden="true">
              <span className={phase === 'place' || phase === 'choose' ? 'on' : ''}>Place</span>
              <span className={phase === 'buy' || phase === 'pay' ? 'on' : ''}>Recruit or buy</span>
            </span>
          )}
        </div>
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
          <Results state={state} onPlayAgain={onPlayAgain} onHome={onHome} />
          <div className="side">{players}<Log state={state} /></div>
        </div>
      ) : (
        <>
          <section className="lt-wheel" data-region="wheel">
            <Wheel state={state} hover={hover} lampQid={lampQid} legal={needHandoff ? new Map() : legalSlots} onPick={onPick} onDenied={onDenied} confirmPlace={session.info?.mode === 'online'} flash={flash} caption={caption} lastMove={lastMove} recentMoves={recentMoves} spacePeek={spacePeek} onSpacePeek={setSpacePeek} meId={mySeats.length === 1 ? mySeats[0] : null} facing={facing} onFacing={setFacing} />
            {showChoice && <ChoicePrompt state={state} onPick={onPick} busy={busy} turnOf={humansHere && handedIn === pend.player ? state.players[pend.player] : null} />}
          </section>
          {/* every cult sits around the wheel like chairs at a table: yours bottom left (a little larger), then the
              others clockwise. UI-B fills each chair (CultSeat); the chairs never move. */}
          {seatCorners(state, me).map((pid, k) => (
            <section key={k} className={`lt-seat lt-seat-${k}${pid === me ? ' mine' : ''}${pid != null && pend && pend.player === pid && !state.over ? ' now' : ''}`} data-region={`seat-${k}`} data-pid={pid ?? undefined} aria-label={pid == null ? undefined : pid === me ? 'Your cult' : `${state.players[pid].name}’s cult`}>
              {pid == null ? null : (
                <CultSeat state={state} pid={pid} me={me} mine={pid === me} now={pend && pend.player === pid && !state.over} hover={hover} optionFor={pid === me ? live : undefined} onPick={onPick} />
              )}
            </section>
          ))}
          <section className="lt-shop" data-region="shop" aria-label="Shop">
            <ShopCards state={state} me={me} mySeats={yours ? mySeats : []} optionFor={live} onPick={onPick} onDenied={onDenied} phase={phase} hover={hover} />
          </section>
        </>
      )}
      {toast && <div key={toast.n} className="toast" role="status">{toast.text}</div>}
      <TouchTips />
      {cardDetail && state.cards[cardDetail.uid] && (
        <Popover anchor={cardDetail.el} onClose={() => setCardDetail(null)}>
          <CardFace state={state} uid={cardDetail.uid} />
        </Popover>
      )}
      {mine && !needHandoff && pend.kind === 'pay' && <PayPicker key={pend.uid ?? pend.tier} state={state} onPick={onPick} busy={busy} turnOf={humansHere && handedIn === pend.player ? state.players[pend.player] : null} />}
      {moment && reckoned !== moment && <Reckoning key={moment.result.round + moment.after.moves} info={moment} root={root.current} meId={mySeats.length === 1 ? mySeats[0] : null} onLamp={setLampQid} onDone={() => setReckoned(moment)} />}
      {moment && reckoned === moment && <RoundEnd info={moment} onNext={dismissMoment} autoMs={someoneHere ? 0 : 4000} />}
      {rules && <HowToPlay onClose={() => setRules(false)} />}
      {logOpen && <Chronicle state={state} onClose={() => setLogOpen(false)} />}
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
