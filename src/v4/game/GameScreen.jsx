// The game table. Renders engine state from a session and turns clicks into { player, option } moves.
// What's clickable is exactly state.pending.options, and only for seats this client controls.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { followers, WORKERS } from '../../engine/v4/index.js';
import { isRoundEnd, newLogLines, parseRoundEnd, playerColor, promptFor, roman, tierCostText, scoringSnapshot } from '../format.js';
import Wheel from './Wheel.jsx';
import Players, { Resources, Workers } from './Players.jsx';
import QuadrantPanel from './QuadrantPanel.jsx';
import Shop, { BuyTray } from './Shop.jsx';
import Results from './Results.jsx';
import RoundEnd from './RoundEnd.jsx';
import { ChoicePrompt, Confirm, Handoff, Log } from './parts.jsx';
import PayPicker from './PayPicker.jsx';
import HowToPlay from '../HowToPlay.jsx';
import Tick from './Tick.jsx';
import { flyCards, flyWorker, motionOK, snapshotShop } from './flight.js';

const STEP_MS = 320;      // pace when catching up on moves that happened behind the round-end card
const PLACE_STEP_MS = 900; // a rival's placement gets time for the wheel to turn and the worker to land

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
function useTable(session) {
  const first = session.getState();
  const [table, setTable] = useState(() => ({ shown: first, moment: null }));
  const queue = useRef([]);
  const paced = useRef(false);
  const held = useRef(false);
  const timer = useRef(null);
  const shownRef = useRef(first);
  const roundStart = useRef(first);

  const show = useCallback(next => {
    const prev = shownRef.current;
    shownRef.current = next;
    const fresh = prev === next ? [] : newLogLines(prev, next);
    const end = fresh.filter(isRoundEnd).pop();
    if (end) {
      held.current = true;
      const start = roundStart.current;
      roundStart.current = next;
      // Keep the board as it was when the round was scored until the card is dismissed.
      const board = scoringSnapshot(prev, next);
      setTable({ shown: next, moment: { result: parseRoundEnd(next, end), start, after: next, board } });
    } else {
      if (next.round !== prev.round) roundStart.current = next;
      setTable(t => ({ ...t, shown: next }));
    }
  }, []);

  const pump = useCallback(() => {
    if (held.current || timer.current || !queue.current.length) return;
    const next = queue.current.shift();
    const prev = shownRef.current;
    show(next);
    if (!paced.current && !queue.current.length) return;
    const placed = Object.keys(next.slots).some(k => prev.slots[k] === undefined);
    timer.current = setTimeout(() => {
      timer.current = null;
      if (!queue.current.length) paced.current = false;
      pump();
    }, placed ? PLACE_STEP_MS : STEP_MS);
  }, [show]);

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

const verbFor = kind => ({ setup: 'picking a starting resource', place: 'placing a worker', buy: 'shopping', pay: 'paying', choose: 'deciding' }[kind] || 'deciding');

export default function GameScreen({ session, onPlayAgain, onHome, leaveText }) {
  const [live0, moment, dismissMoment] = useTable(session);
  const state = moment && moment.board ? moment.board : live0;
  const mySeats = session.mySeats || [];
  const pend = state.pending;
  const mine = !!(pend && !state.over && !moment && mySeats.includes(pend.player));
  const [facing, setFacing] = useState(0);
  const [lastMove, setLastMove] = useState(null); // the latest rival placement, marked on the wheel
  const [gifts, setGifts] = useState([]); // short-lived "+1 gold from P2" floaters on player cards
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(() => new Set());
  const [ready, setReady] = useState(null); // hot-seat: which human seat has been handed the device
  const [rules, setRules] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [note, setNote] = useState(null); // { text, tone, n } — a gentle answer in the status pill
  const prevState = useRef(state);
  const facingRef = useRef(facing);
  facingRef.current = facing;
  const sendToken = useRef(0);
  const root = useRef(null);
  const shopSnap = useRef(new Map());
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
    setNote(n => ({ text, tone, n: (n ? n.n : 0) + 1 }));
    noteTimer.current = setTimeout(() => setNote(null), ms);
  }, []);
  useEffect(() => () => clearTimeout(noteTimer.current), []);

  // A fresh state means our move (or someone's) landed: the table is live again.
  useEffect(() => { sendToken.current += 1; setBusy(false); }, [state]);

  const options = useMemo(() => (mine ? new Map(pend.options.map(o => [o.id, o])) : new Map()), [mine, pend]);
  const optionFor = useCallback(id => options.get(id) || null, [options]);
  const legalSlots = useMemo(() => {
    const m = new Map();
    for (const o of options.values()) if (o.kind === 'slot') m.set(`${o.q}-${o.i}`, o.id);
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
    if (before === state) { shopSnap.current = snapshotShop(root.current); return undefined; }
    const flights = before.shop.filter(u => !state.shop.includes(u))
      .map(uid => ({ uid, to: state.players.findIndex(p => p.members.includes(uid)) }))
      .filter(m => m.to >= 0);
    if (flights.length) flyCards(root.current, shopSnap.current, flights);
    shopSnap.current = snapshotShop(root.current);

    const lines = newLogLines(before, state);
    // Gifts from rivals' actions float onto the receiver's card ("+1 gold from P2").
    const got = [];
    for (const l of lines) {
      const m = l.match(/^(.+?) gave (\d+) (\w+) to (.+?)\.$/);
      const to = m && state.players.find(p => p.name === m[4]);
      if (to) got.push({ pid: to.id, text: `+${m[2]} ${m[3]} from ${m[1]}`, color: m[3], n: Date.now() + got.length });
    }
    if (got.length) { setGifts(g => [...g, ...got]); setTimeout(() => setGifts(g => g.filter(x => !got.includes(x))), 2200); }
    // Nothing to afford: say so in a readable toast — after anything you just got has landed.
    const skipped = lines.find(l => mySeats.some(id => l === `${state.players[id].name} couldn't buy anything.`));
    if (skipped) {
      const msg = humansHere ? skipped.replace("couldn't buy anything.", 'can’t afford anything. Turn passes.') : 'Nothing you can afford. Turn passes.';
      setTimeout(() => showToast(msg, 2000), flights.length && motionOK() ? 650 : 0);
    }

    // A new worker travels from its owner to the space. The board never turns itself: a rival's move is marked
    // where it happened (ring + rim arrow) and named in the header.
    const fresh = state.round !== before.round ? Object.keys(state.slots) : Object.keys(state.slots).filter(k => before.slots[k] === undefined);
    if (!fresh.length) return undefined;
    const key = fresh[fresh.length - 1];
    const owner = state.slots[key];
    if (!mySeats.includes(owner)) setLastMove(m => ({ key, pid: owner, n: (m ? m.n : 0) + 1 }));
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

  const onPick = useCallback(optionId => {
    if (!mine || busy || needHandoff || !options.has(optionId)) return;
    setBusy(true);
    setError('');
    const token = ++sendToken.current;
    let sent;
    try { sent = session.submit({ player: pend.player, option: optionId }); } catch (e) { sent = Promise.reject(e); }
    // Don't lock the table forever if an answer never comes (online): give up waiting after a while.
    const timer = setTimeout(() => { if (sendToken.current === token) { setBusy(false); setError('No answer yet. Try again.'); } }, 8000);
    Promise.resolve(sent)
      .catch(e => { if (sendToken.current === token) setError(e && e.message ? e.message : String(e)); })
      .finally(() => { clearTimeout(timer); if (sendToken.current === token) setBusy(false); });
  }, [mine, busy, needHandoff, options, session, pend]);

  // A tap on something you can't use right now gets a short answer and a small shake, never silence.
  const onDenied = useCallback((info, el) => {
    if (state.over || !pend) return;
    const who = state.players[pend.player];
    let text;
    if (moment) text = 'Start the round first';
    else if (!mySeats.includes(pend.player)) text = `${who.name} is ${verbFor(pend.kind)} — your turn comes`;
    else if (needHandoff) text = `Hand the device to ${who.name}`;
    else if (pend.kind === 'choose' || pend.kind === 'setup' || pend.kind === 'pay') text = 'Answer the question first';
    else if (info.type === 'slot') {
      const owner = state.slots[info.key];
      const ring = Number(info.key.split('-')[1]);
      if (owner !== undefined) text = `Taken by ${state.players[owner].name}`;
      else if (pend.kind === 'buy') text = 'You’ve placed this turn — recruit, buy followers or pass';
      else text = ring >= 0 ? 'That space isn’t open yet' : 'Not available';
    } else if (pend.kind === 'place') text = 'Place a worker first';
    else if (info.type === 'card') text = `You can’t afford ${info.name} yet`;
    else if (info.type === 'tier') text = info.tier.limited && state.bigLeft <= 0 ? 'No +6 buys left' : `+${info.tier.get} needs ${tierCostText(info.tier)}`;
    else text = 'Not right now';
    say(text);
    if (el && el.animate && motionOK()) el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(0)' }], { duration: 260, easing: 'ease-out' });
  }, [state, pend, moment, mySeats, needHandoff, say]);

  const live = needHandoff ? () => null : optionFor;
  const pr = promptFor(state, mine || (!!pend && mySeats.includes(pend.player) && !state.over));
  const showChoice = mine && !needHandoff && (pend.kind === 'choose' || pend.kind === 'setup');
  const players = <Players state={state} active={pend ? pend.player : null} mySeats={mySeats} optionFor={live} onPick={onPick} gifts={gifts} />;
  const roundText = state.over ? 'Final' : state.round ? `Round ${roman(state.round)}` : 'Setup';
  const someoneHere = mySeats.length > 0;
  const lastLine = state.log[state.log.length - 1] || '';
  const meP = me != null ? state.players[me] : null;
  const buyingNow = mine && !needHandoff && pend.kind === 'buy';
  const canUndo = mine && !needHandoff && !busy && typeof session.canUndo === 'function' && session.canUndo();
  const undo = () => { if (session.undo && session.undo()) say('Placement undone — place again', 'info', 1800); };

  return (
    <div className={`app game${showChoice ? ' choosing' : ''}${buyingNow ? ' buying' : ''}`} ref={root}>
      <header className="bar">
        <div className="bar-row">
          <h1>Patrons</h1>
          <span className="round">{roundText}{state.round && !state.over ? <small> · <span className="num">{WORKERS[state.round - 1]}</span> workers each</small> : null}</span>
          <button type="button" className="btn ghost rules-btn" onClick={() => setRules(true)} >How to play</button>
          {onHome && <button type="button" className="btn ghost leave-btn" onClick={() => (state.over ? onHome() : setLeaving(true))}>Leave</button>}
        </div>
        <div className="bar-row status" aria-live="polite">
          {note ? (
            <span key={note.n} className={`say ${note.tone}`} data-prompt tabIndex={-1} role="status">{note.text}</span>
          ) : pr.text ? (
            <span className={`say${mine ? ' mine' : ''}`} data-prompt tabIndex={-1}>
              {pr.who && <i style={{ background: playerColor(pr.who.id) }} />}
              <span className="say-text">
                {mine && humansHere && pr.who ? <b style={{ color: playerColor(pr.who.id) }}>{pr.who.name}: </b> : null}
                {mine ? <b>{pr.text}</b> : state.over ? pr.text : <>{pr.text}<span className="dots" aria-hidden="true">…</span></>}
              </span>
            </span>
          ) : <span className="say" data-prompt tabIndex={-1} />}
          {canUndo && <button type="button" className="btn ghost undo" onClick={undo} title="Take back your worker until you buy or pass">↶ Undo<span className="long"> placement</span></button>}
        </div>
        <div className="bar-row you-row">
          {meP && !state.over && (
            <span className="you-strip" data-pid={meP.id} style={{ '--pc': playerColor(meP.id) }} aria-label={`You, ${meP.name}`}>
              <i className="dot" /><b>{meP.name}</b>
              <span className="yf"><Tick value={followers(state, meP)} color={playerColor(meP.id)} className="num" />★</span>
              <Resources state={state} p={meP} />
              <Workers p={meP} />
            </span>
          )}
          <span className="ticker" title={lastLine} aria-label={`Last: ${lastLine}`}>{lastLine}</span>
        </div>
      </header>
      {session.info && session.info.mode === 'online' && session.info.roomCode && (
        <div className="hint room">Room {session.info.roomCode}</div>
      )}
      {!(state.over && !moment) && players}
      {error && <div className="error" role="alert">{error} <button type="button" className="btn ghost" onClick={() => setError('')}>OK</button></div>}
      {state.over && !moment ? (
        <div className="main over">
          <Results state={state} onPlayAgain={onPlayAgain} onHome={onHome} />
          <div className="side">{players}<Log state={state} /></div>
        </div>
      ) : (
        <div className="main">
          <Wheel state={state} legal={needHandoff ? new Map() : legalSlots} onPick={onPick} onDenied={onDenied} confirmPlace={session.info?.mode === 'online'} flash={flash} lastMove={lastMove} meId={mySeats.length === 1 ? mySeats[0] : null} facing={facing} onFacing={setFacing} />
          <div className="side">
            {showChoice && <ChoicePrompt state={state} onPick={onPick} busy={busy} />}
            <div className="side-scroll">
              <QuadrantPanel state={state} facing={facing} onFacing={setFacing} optionFor={live} onPick={onPick} onDenied={onDenied} meId={mySeats.length === 1 ? mySeats[0] : null} confirmPlace={session.info?.mode === 'online'} />
              <Log state={state} />
            </div>
            <div className="dock">
              <Shop state={state} me={me} mine={mine && !needHandoff} optionFor={live} onPick={onPick} onDenied={onDenied} />
              <BuyTray state={state} me={me} mine={mine && !needHandoff} optionFor={live} onPick={onPick} onDenied={onDenied} />
            </div>
          </div>
        </div>
      )}
      {toast && <div key={toast.n} className="toast" role="status">{toast.text}</div>}
      {mine && !needHandoff && pend.kind === 'pay' && <PayPicker key={pend.uid ?? pend.tier} state={state} onPick={onPick} busy={busy} />}
      {moment && <RoundEnd info={moment} onNext={dismissMoment} autoMs={someoneHere ? 0 : 4000} />}
      {rules && <HowToPlay onClose={() => setRules(false)} />}
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
