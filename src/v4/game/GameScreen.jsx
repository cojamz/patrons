// The game table. Renders engine state from a session and turns clicks into { player, option } moves.
// What's clickable is exactly state.pending.options, and only for seats this client controls.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { WORKERS } from '../../engine/v4/index.js';
import { isRoundEnd, newLogLines, parseRoundEnd, playerColor, promptFor, roman } from '../format.js';
import Wheel from './Wheel.jsx';
import Players from './Players.jsx';
import QuadrantPanel from './QuadrantPanel.jsx';
import Shop from './Shop.jsx';
import Results from './Results.jsx';
import RoundEnd from './RoundEnd.jsx';
import { ChoicePrompt, Handoff, Log } from './parts.jsx';
import PayPicker from './PayPicker.jsx';
import HowToPlay from '../HowToPlay.jsx';
import { flyCards, snapshotShop } from './flight.js';

const STEP_MS = 260; // pace when catching up on moves that happened behind the round-end card

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
 * (the round-end card) and queues whatever happens next; dismissing it replays the queue at a readable pace.
 */
function useTable(session) {
  const [table, setTable] = useState(() => ({ shown: session.getState(), moment: null }));
  const queue = useRef([]);
  const held = useRef(false);
  const timer = useRef(null);
  const shownRef = useRef(table.shown);

  const show = useCallback(next => {
    const prev = shownRef.current;
    shownRef.current = next;
    const fresh = prev === next ? [] : newLogLines(prev, next);
    const end = fresh.filter(isRoundEnd).pop();
    if (end) {
      held.current = true;
      setTable({ shown: next, moment: { result: parseRoundEnd(next, end), before: prev, after: next } });
    } else {
      setTable(t => ({ ...t, shown: next }));
    }
  }, []);

  const pump = useCallback(() => {
    if (held.current || timer.current || !queue.current.length) return;
    const paced = queue.current.length > 1 || queue.current.paced;
    const next = queue.current.shift();
    if (!paced) { show(next); return; }
    show(next);
    timer.current = setTimeout(() => { timer.current = null; if (!queue.current.length) queue.current.paced = false; pump(); }, STEP_MS);
  }, [show]);

  useEffect(() => {
    const off = session.subscribe(s => {
      if (s === shownRef.current) return;
      queue.current.push(s);
      pump();
    });
    return () => { off(); clearTimeout(timer.current); };
  }, [session, pump]);

  const dismiss = useCallback(() => {
    held.current = false;
    queue.current.paced = true;
    setTable(t => ({ ...t, moment: null }));
    pump();
  }, [pump]);

  return [table.shown, table.moment, dismiss];
}

export default function GameScreen({ session, onPlayAgain, onHome }) {
  const [state, moment, dismissMoment] = useTable(session);
  const mySeats = session.mySeats || [];
  const pend = state.pending;
  const mine = !!(pend && !state.over && !moment && mySeats.includes(pend.player));
  const [facing, setFacing] = useState(0);
  const [late, setLate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(() => new Set());
  const [ready, setReady] = useState(null); // hot-seat: which human seat has been handed the device
  const [rules, setRules] = useState(false);
  const prevState = useRef(state);
  const facingRef = useRef(facing);
  facingRef.current = facing;
  const sendToken = useRef(0);
  const root = useRef(null);
  const shopSnap = useRef(new Map());

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

  // What just happened, made physical: a new worker drops (the wheel turns to face a rival's move first),
  // and a recruited card flies from the shop to its new owner.
  useLayoutEffect(() => {
    const before = prevState.current;
    prevState.current = state;
    if (before === state) { shopSnap.current = snapshotShop(root.current); return undefined; }
    const flights = before.shop.filter(u => !state.shop.includes(u))
      .map(uid => ({ uid, to: state.players.findIndex(p => p.members.includes(uid)) }))
      .filter(m => m.to >= 0);
    if (flights.length) flyCards(root.current, shopSnap.current, flights);
    shopSnap.current = snapshotShop(root.current);

    const fresh = Object.keys(state.slots).filter(k => before.slots[k] === undefined || state.round !== before.round);
    if (!fresh.length) return undefined;
    const key = fresh[fresh.length - 1];
    const q = Number(key.split('-')[0]);
    const rival = !mySeats.includes(state.slots[key]);
    const turn = rival && q !== facingRef.current;
    if (turn) setFacing(q);
    setLate(turn);
    setFlash(new Set(fresh));
    const t = setTimeout(() => setFlash(new Set()), 1700);
    return () => clearTimeout(t);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const live = needHandoff ? () => null : optionFor;
  const pr = promptFor(state, mine || (pend && mySeats.includes(pend.player) && !state.over));
  const showChoice = mine && !needHandoff && (pend.kind === 'choose' || pend.kind === 'setup');
  const shopFirst = mine && !needHandoff && pend.kind === 'buy';
  const players = <Players state={state} active={pend ? pend.player : null} mySeats={mySeats} optionFor={live} onPick={onPick} />;
  const roundText = state.round ? `Round ${roman(state.round)}` : 'Setup';
  const someoneHere = mySeats.length > 0;

  return (
    <div className={`app game${showChoice ? ' choosing' : ''}`} ref={root}>
      <header className="bar">
        <h1>Patrons</h1>
        <div className="status" aria-live="polite">
          <span className="round">{roundText}{state.round ? <small> · {WORKERS[state.round - 1]} workers each</small> : null}</span>
          {pr.text && (
            <span className={`say${mine ? ' mine' : ''}`} data-prompt>
              {pr.who && <i style={{ background: playerColor(pr.who.id) }} />}
              {mine && humansHere && pr.who ? <b style={{ color: playerColor(pr.who.id) }}>{pr.who.name}: </b> : null}
              {mine ? <b>{pr.text}</b> : state.over ? pr.text : <>{pr.text}<span className="dots" aria-hidden="true">…</span></>}
            </span>
          )}
        </div>
        <div className="bar-btns">
          <button type="button" className="btn ghost" onClick={() => setRules(true)}>How to play</button>
          {onHome && <button type="button" className="btn ghost" onClick={onHome}>Leave</button>}
        </div>
      </header>
      {session.info && session.info.mode === 'online' && session.info.roomCode && (
        <div className="hint">Room {session.info.roomCode}</div>
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
          <Wheel state={state} legal={needHandoff ? new Map() : legalSlots} onPick={onPick} flash={flash} late={late} facing={facing} onFacing={setFacing} />
          <div className={`side${shopFirst ? ' shop-first' : ''}`}>
            {showChoice && <ChoicePrompt state={state} onPick={onPick} busy={busy} />}
            <QuadrantPanel state={state} facing={facing} onFacing={setFacing} optionFor={live} onPick={onPick} />
            <Shop state={state} mine={mine && !needHandoff} optionFor={live} onPick={onPick} />
            <Log state={state} />
          </div>
        </div>
      )}
      {mine && !needHandoff && pend.kind === 'pay' && <PayPicker state={state} onPick={onPick} busy={busy} />}
      {moment && <RoundEnd info={moment} onNext={dismissMoment} autoMs={someoneHere ? 0 : 4000} />}
      {rules && <HowToPlay onClose={() => setRules(false)} />}
      {needHandoff && !moment && <Handoff player={state.players[pend.player]} onReady={() => setReady(pend.player)} />}
    </div>
  );
}
