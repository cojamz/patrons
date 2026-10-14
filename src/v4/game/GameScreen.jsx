// The game table. Renders engine state from a session and turns clicks into { player, option } moves.
// What's clickable is exactly state.pending.options, and only for seats this client controls.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WORKERS } from '../../engine/v4/index.js';
import { playerColor, promptFor, roman } from '../format.js';
import Wheel from './Wheel.jsx';
import Players from './Players.jsx';
import QuadrantPanel from './QuadrantPanel.jsx';
import Shop from './Shop.jsx';
import Results from './Results.jsx';
import { ChoicePrompt, Handoff, Log } from './parts.jsx';
import PayPicker from './PayPicker.jsx';
import HowToPlay from '../HowToPlay.jsx';

export function useSessionState(session) {
  const [state, setState] = useState(() => session.getState());
  useEffect(() => {
    setState(session.getState());
    return session.subscribe(s => setState(s));
  }, [session]);
  return state;
}

export default function GameScreen({ session, onPlayAgain, onHome }) {
  const state = useSessionState(session);
  const mySeats = session.mySeats || [];
  const pend = state.pending;
  const mine = !!(pend && !state.over && mySeats.includes(pend.player));
  const [facing, setFacing] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(() => new Set());
  const [ready, setReady] = useState(null); // hot-seat: which human seat has been handed the device
  const prevSlots = useRef(state.slots);
  const sendToken = useRef(0);
  // A fresh state means our move (or someone's) landed: the table is live again.
  useEffect(() => { sendToken.current += 1; setBusy(false); }, [state]);
  const prevLog = useRef(state.log[state.log.length - 1]);
  const [toast, setToast] = useState('');
  const [rules, setRules] = useState(false);

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

  // Briefly highlight spaces that were just taken (bots' moves especially).
  useEffect(() => {
    const before = prevSlots.current || {};
    const fresh = Object.keys(state.slots).filter(k => before[k] === undefined);
    prevSlots.current = state.slots;
    if (!fresh.length) return;
    setFlash(new Set(fresh));
    const t = setTimeout(() => setFlash(new Set()), 1400);
    return () => clearTimeout(t);
  }, [state.slots]);

  // Round-end scoring is the big moment: surface it as a toast, not just a log line.
  useEffect(() => {
    const fresh = state.log.slice(state.log.lastIndexOf(prevLog.current) + 1);
    prevLog.current = state.log[state.log.length - 1];
    const end = fresh.filter(l => /^Round .* ends\./.test(l)).pop();
    if (!end) return;
    setToast(end);
    const t = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(t);
  }, [state.log]);

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

  const pr = promptFor(state, mine);
  const showChoice = mine && !needHandoff && (pend.kind === 'choose' || pend.kind === 'setup');
  // When it's your buy, the shop comes first; otherwise the board's actions do.
  const shopFirst = mine && !needHandoff && pend.kind === 'buy';
  const shop = <Shop state={state} mine={mine && !needHandoff} optionFor={needHandoff ? () => null : optionFor} onPick={onPick} />;
  const players = <Players state={state} active={pend ? pend.player : null} mySeats={mySeats} optionFor={needHandoff ? () => null : optionFor} onPick={onPick} />;
  const roundText = state.round ? `Round ${roman(state.round)}` : 'Setup';

  return (
    <div className="app game">
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
      {!state.over && players}
      {error && <div className="error" role="alert">{error} <button type="button" className="btn ghost" onClick={() => setError('')}>OK</button></div>}
      {state.over ? (
        <div className="main over">
          <Results state={state} onPlayAgain={onPlayAgain} onHome={onHome} />
          <div className="side">{players}<Log state={state} /></div>
        </div>
      ) : (
        <div className="main">
          <Wheel state={state} legal={needHandoff ? new Map() : legalSlots} onPick={onPick} flash={flash} facing={facing} onFacing={setFacing} />
          <div className="side">
            {showChoice && <ChoicePrompt state={state} onPick={onPick} busy={busy} />}
            {shopFirst && shop}
            <QuadrantPanel state={state} facing={facing} onFacing={setFacing} optionFor={needHandoff ? () => null : optionFor} onPick={onPick} />
            {!shopFirst && shop}
            <Log state={state} />
          </div>
        </div>
      )}
      {toast && !state.over && !rules && !needHandoff && !(mine && pend.kind === 'pay') && <div className="toast" role="status" onClick={() => setToast('')}>{toast}</div>}
      {mine && !needHandoff && pend.kind === 'pay' && <PayPicker state={state} onPick={onPick} busy={busy} />}
      {rules && <HowToPlay onClose={() => setRules(false)} />}
      {needHandoff && <Handoff player={state.players[pend.player]} onReady={() => setReady(pend.player)} />}
    </div>
  );
}
