// Home, local setup and the online lobby.
import { useEffect, useState } from 'react';
import { PLAYER_COLORS } from '../format.js';
import HowToPlay from '../HowToPlay.jsx';
import { friendlyError } from '../errors.js';
import { quadrant } from '../../engine/v4/index.js';
import { CLASSIC, spheres, sphereName, tableProblem, randomTable, urlTable } from '../tables.js';
import { GAME_NAME, VERSION } from '../version.js';
import { copyText } from '../Recovery.jsx';

const KINDS = [['human', 'Person'], ['bot', 'Bot'], ['empty', 'Empty']];
const NAME_MAX = 14;
// count what a person sees as characters (an emoji or accented letter is one), not UTF-16 units
const graphemes = str => (typeof Intl !== 'undefined' && Intl.Segmenter ? [...new Intl.Segmenter().segment(str)].length : [...str].length);
const clip = (str, max) => (typeof Intl !== 'undefined' && Intl.Segmenter ? [...new Intl.Segmenter().segment(str)].slice(0, max).map(x => x.segment).join('') : [...str].slice(0, max).join(''));

function Seg({ value, options, onChange, label }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{text}</button>
      ))}
    </div>
  );
}

export function Home({ onLocal, onHost, onJoin, onlineReady, saved, onResume, error }) {
  const [code, setCode] = useState(() => (new URLSearchParams(location.search).get('join') || '').toUpperCase().slice(0, 8));
  const [err, setErr] = useState('');
  const [rules, setRules] = useState(false);
  const [working, setWorking] = useState(false);
  const [retry, setRetry] = useState(null);
  const go = fn => { setErr(''); setRetry(null); setWorking(true); Promise.resolve().then(fn).then(e => { if (e) { setErr(friendlyError(e)); setRetry(() => fn); } }, e => { setErr(friendlyError(e)); setRetry(() => fn); }).finally(() => setWorking(false)); };
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
        <h1>{GAME_NAME}</h1>
        <p className="version" data-version>{VERSION}</p>
        <p className="tag">Draft the wheel. Recruit members. Win followers.</p>
      </div>
      <div className="menu">
        {error && <p className="error" role="alert">{error}</p>}
        {saved && (
          <button type="button" className="btn pri big resume" onClick={onResume} data-home="resume">
            Resume game<small>{savedLine(saved)}</small>
          </button>
        )}
        <button type="button" className={`btn big${saved ? '' : ' pri'}`} onClick={onLocal} data-home="local">{saved ? 'New game on this device' : 'Play on this device'}</button>
        <div className="online-box">
          <label className="field"><span>Your name</span><input value={name} onChange={e => saveName(clip(e.target.value, NAME_MAX))} placeholder="Name" /><small className="count num">{graphemes(name)}/{NAME_MAX}</small></label>
          <button type="button" className="btn big" disabled={!onlineReady || working} onClick={() => (name.trim() ? go(() => onHost(name.trim())) : setErr('Enter a name.'))}>Host online game</button>
          <form className="join" onSubmit={e => { e.preventDefault(); if (!name.trim()) { setErr('Enter a name.'); return; } if (code.trim()) go(() => onJoin(code.trim().toUpperCase(), name.trim())); }}>
            <input aria-label="Room code" value={code} maxLength={8} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="CODE" disabled={!onlineReady} />
            <button type="submit" className="btn" disabled={!onlineReady || working || !code.trim()}>Join with code</button>
          </form>
          {working && <p className="hint">Connecting…</p>}
          {!name.trim() && onlineReady && <p className="hint">Enter your name to host or join.</p>}
          {err && <p className="error" role="alert">{err}{retry && <> <button type="button" className="btn ghost" onClick={() => go(retry)}>Retry</button></>}</p>}
          {!onlineReady && <p className="hint">Online play is being wired up. Hot-seat works now.</p>}
        </div>
        <button type="button" className="btn ghost rules-link" onClick={() => setRules(true)}>How to play</button>
      </div>
      {rules && <HowToPlay onClose={() => setRules(false)} />}
    </div>
  );
}

function savedLine({ state, savedAt, fromRoundStart }) {
  const r = state.round ? `Round ${['I', 'II', 'III'][state.round - 1]}` : 'Setup';
  const round = state.over ? 'Final scores' : fromRoundStart ? `${r}, from its start` : r;
  const names = state.players.map(p => p.name).join(', ');
  const mins = Math.round((Date.now() - (savedAt || Date.now())) / 60000);
  return `${round} · ${names}${mins > 0 ? ` · ${mins < 60 ? `${mins} min` : `${Math.round(mins / 60)} h`} ago` : ''}`;
}

function wedge(q) {
  const a0 = (q * 90 - 90 + 3) * Math.PI / 180, a1 = (q * 90 + 3 - 6) * Math.PI / 180;
  const p = (a, r) => `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  return `M${p(a0, 18)} L${p(a0, 46)} A46,46 0 0 1 ${p(a1, 46)} L${p(a1, 18)} A18,18 0 0 0 ${p(a0, 18)}Z`;
}

/** The table to start from: ?table=… wins, then the last one played, then Classic. */
export function initialTable(prev) {
  const fromUrl = urlTable();
  if (fromUrl) return { mode: 'custom', quadrants: fromUrl };
  if (prev && prev.quadrants && !tableProblem(prev.quadrants)) return prev;
  return { mode: 'classic', quadrants: [...CLASSIC] };
}
const sameTable = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Pick the 4 spheres: Classic, random 4, or your own. `value` = { mode, quadrants }. */
export function TablePicker({ value, onChange, readOnly = false }) {
  const { mode, quadrants } = value;
  const setMode = m => {
    if (m === 'classic') onChange({ mode: m, quadrants: [...CLASSIC] });
    else if (m === 'random') onChange({ mode: m, quadrants: randomTable() });
    else onChange({ mode: m, quadrants: [...quadrants] });
  };
  const toggle = id => {
    if (quadrants.includes(id)) onChange({ mode, quadrants: quadrants.filter(x => x !== id) });
    else if (quadrants.length < 4) onChange({ mode, quadrants: [...quadrants, id] });
  };
  const usedRes = quadrants.map(id => quadrant(id).resource);
  const problem = quadrants.length === 4 ? tableProblem(quadrants) : '';
  return (
    <div className="table-pick" data-table={quadrants.join(',')}>
      <div className="seat">
        <span>Table</span>
        {readOnly ? <span className="hint">{mode === 'random' ? 'Random 4' : mode === 'custom' ? 'Custom' : 'Classic'}</span>
          : <Seg label="Table" value={mode} options={[['classic', 'Classic'], ['random', 'Random 4'], ['custom', 'Custom']]} onChange={setMode} />}
      </div>
      {mode !== 'custom' || readOnly ? (
        <div className="table-chips">
          {quadrants.map(id => <TableChip key={id} id={id} />)}
          {mode === 'random' && !readOnly && <button type="button" className="btn ghost" data-reroll onClick={() => { let t; do { t = randomTable(); } while (sameTable(t, quadrants)); onChange({ mode, quadrants: t }); }}>Reroll</button>}
        </div>
      ) : (
        <>
          <p className="hint">Pick 4, in wheel order. <span className="num">{quadrants.length}</span>/4</p>
          <div className="sphere-grid">
            {spheres().map(id => {
              const on = quadrants.includes(id);
              const clash = !on && usedRes.includes(quadrant(id).resource);
              return (
                <button key={id} type="button" className={`sphere${on ? ' on' : ''}`} aria-pressed={on} data-sphere={id}
                  disabled={!on && (quadrants.length >= 4 || clash)} style={{ '--c': `var(--${id})` }} onClick={() => toggle(id)}
                  title={clash ? `Another sphere on this table already uses ${quadrant(id).resource}.` : quadrant(id).scoring.label}>
                  <i className="dot" />{on && <span className="ord num">{quadrants.indexOf(id) + 1}</span>}
                  <b>{sphereName(id)}</b><small>{quadrant(id).scoring.label}</small>
                </button>
              );
            })}
          </div>
        </>
      )}
      {problem && <p className="hint warn">{problem}</p>}
    </div>
  );
}
function TableChip({ id }) {
  return <span className="table-chip" style={{ '--c': `var(--${id})` }} title={quadrant(id).scoring.label}><i className="dot" />{sphereName(id)}</span>;
}

export function LocalSetup({ initial, onStart, onBack }) {
  const [seats, setSeats] = useState(initial?.seats || [
    { kind: 'human', name: 'P1' }, { kind: 'bot', name: 'P2' }, { kind: 'bot', name: 'P3' }, { kind: 'bot', name: 'P4' },
  ]);
  const [speed, setSpeed] = useState(initial?.speed || 'normal');
  const [table, setTable] = useState(() => initialTable(initial?.table));
  const tableOk = !tableProblem(table.quadrants);
  const filled = seats.filter(s => s.kind !== 'empty');
  const set = (i, patch) => setSeats(seats.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  return (
    <div className="app narrow">
      <div className="dialog page">
        <h2>Play on this device</h2>
        <p className="hint">Everyone plays on this screen. Bots fill the other seats.</p>
        {seats.map((s, i) => (
          <div className="seat" key={i} style={{ '--pc': PLAYER_COLORS[i] }}>
            <i className="dot" />
            <label className="namebox">
              <input aria-label={`Seat ${i + 1} name`} value={s.name} disabled={s.kind === 'empty'} onChange={e => set(i, { name: clip(e.target.value, NAME_MAX) })} />
              <small className={`count num${graphemes(s.name) >= NAME_MAX ? ' full' : ''}`} aria-hidden="true">{graphemes(s.name)}/{NAME_MAX}</small>
            </label>
            <Seg label={`Seat ${i + 1}`} value={s.kind} options={KINDS} onChange={v => set(i, { kind: v })} />
          </div>
        ))}
        <div className="seat"><span>Bot speed</span><Seg label="Bot speed" value={speed} options={[['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast']]} onChange={setSpeed} /></div>
        <TablePicker value={table} onChange={setTable} />
        {filled.length < 2 && <p className="hint warn">{GAME_NAME} needs at least 2 seats.</p>}
        <div className="row-btns">
          <button type="button" className="btn" onClick={onBack}>Back</button>
          <button type="button" className="btn pri" data-start disabled={filled.length < 2 || !tableOk} onClick={() => onStart({ seats, speed, table })}>Start</button>
        </div>
      </div>
    </div>
  );
}

/** The link that joins room `code`, keeping this page's test/transport params (?transport=, ?rtdb=). */
export function inviteLink(code) {
  const q = new URLSearchParams();
  const here = new URLSearchParams(location.search);
  for (const k of ['transport', 'rtdb']) if (here.get(k)) q.set(k, here.get(k));
  q.set('join', code);
  return `${location.origin}${location.pathname}?${q}`;
}

/** Online lobby, built against the lobby contract: subscribe(fn) -> {code, hostId, status, players}; host: addBot, removeSeat, start. */
export function Lobby({ lobby, myId, onLeave }) {
  const [view, setView] = useState(() => (lobby && lobby.getView ? lobby.getView() : null));
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState('');
  const [draft, setDraft] = useState(null);
  useEffect(() => (lobby ? lobby.subscribe(setView) : undefined), [lobby]);
  if (!lobby || !view) return <div className="app narrow"><div className="dialog page"><h2>Connecting…</h2><button type="button" className="btn" onClick={onLeave}>Back</button></div></div>;
  const me = view.me?.playerId ?? myId;
  const isHost = view.isHost ?? view.hostId === me;
  const players = [...view.players].sort((a, b) => a.seat - b.seat);
  const link = inviteLink(view.code);
  // copy with a fallback (no clipboard API on plain http or some phones); if both fail the link is right there to select
  const copy = () => copyText(link).then(ok => { setCopied(ok ? 'link copied' : 'select the link below to copy it'); setTimeout(() => setCopied(false), 2500); });
  const share = typeof navigator !== 'undefined' && navigator.share
    ? () => navigator.share({ title: GAME_NAME, text: `Join my ${GAME_NAME} game: room ${view.code}`, url: link }).catch(() => {}) : null;
  const act = fn => Promise.resolve().then(fn).catch(e => setErr(friendlyError(e)));
  const roomTable = view.table && view.table.quadrants ? view.table : { mode: 'classic', quadrants: [...CLASSIC] };
  const shownTable = isHost && draft ? draft : roomTable;
  const pickTable = t => { setDraft(t); if (!tableProblem(t.quadrants) && lobby.setTable) act(() => lobby.setTable(t)); };
  return (
    <div className="app narrow">
      <div className="dialog page lobby">
        <h2>Room</h2>
        {view.status === 'closed' && <p className="error">This room is closed.</p>}
        <button type="button" className="code" onClick={copy} title="Copy invite link" aria-label={`Room code ${view.code}, copy invite link`}>
          {view.code}<small>{copied || 'tap to copy invite link'}</small>
        </button>
        <div className="invite" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input readOnly value={link} aria-label="Invite link" data-invite onFocus={e => e.target.select()} style={{ flex: '1 1 220px', minWidth: 0, font: 'inherit', fontSize: 'var(--fs-2)', color: 'var(--muted)', background: 'var(--table)', border: '1px solid var(--rim)', borderRadius: 8, padding: '6px 10px' }} />
          <button type="button" className="btn" onClick={copy} data-copy-link>Copy link</button>
          {share && <button type="button" className="btn" onClick={share}>Share</button>}
        </div>
        <ul className="seats">
          {players.map(p => (
            <li key={p.id} className="seat" style={{ '--pc': PLAYER_COLORS[p.seat % 4] }}>
              <i className="dot" />
              <span className="nm">{p.name}{p.id === me ? ' (you)' : ''}</span>
              <span className="hint" data-presence={p.kind === 'bot' ? 'bot' : p.connected === false ? 'offline' : 'here'}>{p.kind === 'bot' ? 'bot' : `${p.id === view.hostId ? 'host · ' : ''}${p.connected === false ? 'offline' : 'connected'}`}</span>
              {isHost && p.id !== me && <button type="button" className="btn ghost" onClick={() => act(() => lobby.removeSeat(p.seat))}>Remove</button>}
            </li>
          ))}
        </ul>
        <TablePicker value={shownTable} onChange={pickTable} readOnly={!isHost || !lobby.setTable} />
        {err && <p className="error">{err}</p>}
        {isHost ? (
          <div className="row-btns">
            <button type="button" className="btn" disabled={players.length >= 4} onClick={() => act(() => lobby.addBot())}>Add bot</button>
            <button type="button" className="btn pri" disabled={view.canStart === false || players.length < 2 || !!tableProblem(shownTable.quadrants)} onClick={() => act(() => lobby.start())}>Start game</button>
          </div>
        ) : <p className="hint">Waiting for {view.hostName || 'the host'} to start…</p>}
        {isHost && view.startHint && <p className="hint" data-start-hint>{view.startHint}</p>}
        <button type="button" className="btn ghost" onClick={onLeave}>Leave</button>
      </div>
    </div>
  );
}
