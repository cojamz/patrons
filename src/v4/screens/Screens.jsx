// Home, local setup and the online lobby.
import { useEffect, useState } from 'react';
import { PLAYER_COLORS } from '../format.js';

const KINDS = [['human', 'Person'], ['bot', 'Bot'], ['empty', 'Empty']];

function Seg({ value, options, onChange, label }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{text}</button>
      ))}
    </div>
  );
}

export function Home({ onLocal, onHost, onJoin, onlineReady }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState(() => { try { return localStorage.getItem('patrons.name') || ''; } catch { return ''; } });
  const saveName = v => { setName(v); try { localStorage.setItem('patrons.name', v); } catch { /* ignore */ } };
  return (
    <div className="app home">
      <div className="hero">
        <svg className="mark" viewBox="0 0 100 100" aria-hidden="true">
          {['gold', 'red', 'blue', 'green'].map((c, q) => (
            <path key={c} d={wedge(q)} fill={`var(--${c})`} fillOpacity=".8" />
          ))}
          <circle cx="50" cy="50" r="14" fill="var(--table)" />
        </svg>
        <h1>Patrons</h1>
        <p className="tag">Draft the wheel. Recruit members. Win followers.</p>
      </div>
      <div className="menu">
        <button type="button" className="btn pri big" onClick={onLocal} data-home="local">Play on this device</button>
        <div className="online-box">
          <label className="field"><span>Your name</span><input value={name} maxLength={16} onChange={e => saveName(e.target.value)} placeholder="Name" /></label>
          <button type="button" className="btn big" disabled={!onlineReady} onClick={() => onHost(name || 'Host')}>Host online game</button>
          <form className="join" onSubmit={e => { e.preventDefault(); if (code.trim()) onJoin(code.trim().toUpperCase(), name || 'Guest'); }}>
            <input aria-label="Room code" value={code} maxLength={8} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="CODE" disabled={!onlineReady} />
            <button type="submit" className="btn" disabled={!onlineReady || !code.trim()}>Join with code</button>
          </form>
          {!onlineReady && <p className="hint">Online play is being wired up. Hot-seat works now.</p>}
        </div>
      </div>
    </div>
  );
}

function wedge(q) {
  const a0 = (q * 90 - 90 + 3) * Math.PI / 180, a1 = (q * 90 + 3 - 6) * Math.PI / 180;
  const p = (a, r) => `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  return `M${p(a0, 18)} L${p(a0, 46)} A46,46 0 0 1 ${p(a1, 46)} L${p(a1, 18)} A18,18 0 0 0 ${p(a0, 18)}Z`;
}

export function LocalSetup({ initial, onStart, onBack }) {
  const [seats, setSeats] = useState(initial?.seats || [
    { kind: 'human', name: 'P1' }, { kind: 'bot', name: 'P2' }, { kind: 'bot', name: 'P3' }, { kind: 'bot', name: 'P4' },
  ]);
  const [speed, setSpeed] = useState(initial?.speed || 'normal');
  const filled = seats.filter(s => s.kind !== 'empty');
  const set = (i, patch) => setSeats(seats.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  return (
    <div className="app narrow">
      <div className="dialog page">
        <h2>Play on this device</h2>
        <p className="hint">Everyone plays on this screen. Bots fill the other seats. Gold and Red are designed; Blue and Green are plain stand-ins.</p>
        {seats.map((s, i) => (
          <div className="seat" key={i} style={{ '--pc': PLAYER_COLORS[i] }}>
            <i className="dot" />
            <input aria-label={`Seat ${i + 1} name`} value={s.name} maxLength={14} disabled={s.kind === 'empty'} onChange={e => set(i, { name: e.target.value })} />
            <Seg label={`Seat ${i + 1}`} value={s.kind} options={KINDS} onChange={v => set(i, { kind: v })} />
          </div>
        ))}
        <div className="seat"><span>Bot speed</span><Seg label="Bot speed" value={speed} options={[['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast']]} onChange={setSpeed} /></div>
        {filled.length < 2 && <p className="hint warn">Patrons needs at least 2 seats.</p>}
        <div className="row-btns">
          <button type="button" className="btn" onClick={onBack}>Back</button>
          <button type="button" className="btn pri" data-start disabled={filled.length < 2} onClick={() => onStart({ seats, speed })}>Start</button>
        </div>
      </div>
    </div>
  );
}

/** Online lobby, built against the lobby contract: subscribe(fn) -> {code, hostId, status, players}; host: addBot, removeSeat, start. */
export function Lobby({ lobby, myId, onLeave }) {
  const [view, setView] = useState(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => (lobby ? lobby.subscribe(setView) : undefined), [lobby]);
  if (!lobby || !view) return <div className="app narrow"><div className="dialog page"><h2>Connecting…</h2><button type="button" className="btn" onClick={onLeave}>Back</button></div></div>;
  const isHost = view.hostId === myId;
  const players = [...view.players].sort((a, b) => a.seat - b.seat);
  const copy = () => {
    const url = `${location.origin}${location.pathname}?join=${view.code}`;
    Promise.resolve(navigator.clipboard?.writeText(url)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  };
  const act = fn => Promise.resolve().then(fn).catch(e => setErr(e.message || String(e)));
  return (
    <div className="app narrow">
      <div className="dialog page lobby">
        <h2>Room</h2>
        <button type="button" className="code" onClick={copy} title="Copy invite link" aria-label={`Room code ${view.code}, copy invite link`}>
          {view.code}<small>{copied ? 'link copied' : 'tap to copy invite link'}</small>
        </button>
        <ul className="seats">
          {players.map(p => (
            <li key={p.id} className="seat" style={{ '--pc': PLAYER_COLORS[p.seat % 4] }}>
              <i className="dot" />
              <span className="nm">{p.name}{p.id === myId ? ' (you)' : ''}</span>
              <span className="hint">{p.kind === 'bot' ? 'bot' : p.connected === false ? 'offline' : p.id === view.hostId ? 'host' : 'ready'}</span>
              {isHost && p.id !== myId && <button type="button" className="btn ghost" onClick={() => act(() => lobby.removeSeat(p.seat))}>Remove</button>}
            </li>
          ))}
        </ul>
        {err && <p className="error">{err}</p>}
        {isHost ? (
          <div className="row-btns">
            <button type="button" className="btn" disabled={players.length >= 4} onClick={() => act(() => lobby.addBot())}>Add bot</button>
            <button type="button" className="btn pri" disabled={players.length < 2} onClick={() => act(() => lobby.start())}>Start game</button>
          </div>
        ) : <p className="hint">Waiting for the host to start…</p>}
        <button type="button" className="btn ghost" onClick={onLeave}>Leave</button>
      </div>
    </div>
  );
}
