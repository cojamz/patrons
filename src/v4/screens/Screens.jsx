// Home, local setup and the online lobby.
import { useEffect, useRef, useState } from 'react';
import { PLAYER_COLORS, lowColor } from '../format.js';
import HowToPlay from '../HowToPlay.jsx';
import { friendlyError } from '../errors.js';
import { quadrant, BOT_LEVEL_INFO, DEFAULT_BOT_LEVEL } from '../../engine/v4/index.js';
import { CLASSIC, spheres, sphereName, sphereLine, tableProblem, randomTable, urlTable, fitTable, sphereCount } from '../tables.js';
import { panelWords } from '../game/panelText.js';
import { GAME_NAME, VERSION } from '../version.js';
import { copyText } from '../Recovery.jsx';
import { Tip } from '../game/Info.jsx';
import { EmojiButton, EmojiFace, emojiName } from './EmojiPicker.jsx';
import { settleEmojis, takeEmoji, lastEmoji, rememberEmoji } from '../emojiPick.js';
import { SPEEDS, SPEED_NAMES, motionSpeed, setMotionSpeed } from '../motion.js';

const KINDS = [['human', 'Person'], ['bot', 'Bot'], ['empty', 'Empty']];
const NAME_MAX = 14;
// count what a person sees as characters (an emoji or accented letter is one), not UTF-16 units
const graphemes = str => (typeof Intl !== 'undefined' && Intl.Segmenter ? [...new Intl.Segmenter().segment(str)].length : [...str].length);
const clip = (str, max) => (typeof Intl !== 'undefined' && Intl.Segmenter ? [...new Intl.Segmenter().segment(str)].slice(0, max).map(x => x.segment).join('') : [...str].slice(0, max).join(''));

// the game's one speed: how fast the bots move and moves play out (the ☰ menu changes it during a game too)
const SPEED_HINT = { quick: 'Bots move fast; moves play out quickly', steady: 'Clear and steady: you can follow every move', relaxed: 'Slower: time to read each move' };
const SPEED_OPTS = Object.keys(SPEEDS).map(k => [k, SPEED_NAMES[k], `${SPEED_HINT[k] || SPEED_NAMES[k]}. Also in the ☰ menu during a game.`]);

function Seg({ value, options, onChange, label }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(([v, text, title]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} title={title} onClick={() => onChange(v)}>{text}</button>
      ))}
    </div>
  );
}

export function Home({ onLocal, onHost, onJoin, onlineReady, saved, onResume, last = null, onLast, error, lastCode = '' }) {
  // an invite link's code; else the room this device was just in (Join takes your seat back)
  const [code, setCode] = useState(() => (new URLSearchParams(location.search).get('join') || lastCode || '').toUpperCase().slice(0, 8));
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
        {/* under the way to play, never above it: a finished game's results pushed "Play" down 66px and a click on its
            old spot reopened the results (w3a #39) */}
        {last && onLast && (
          <button type="button" className="btn ghost last-results" onClick={onLast} data-home="last">
            Last game's results<small>{lastLine(last)}</small>
          </button>
        )}
        <div className="online-box">
          <label className="field"><span>Your name{!name.trim() && onlineReady ? <small className="name-need"> · needed to host or join</small> : null}</span><input value={name} onChange={e => saveName(clip(e.target.value, NAME_MAX))} placeholder="Name" />{graphemes(name) >= NAME_MAX - 3 && <small className="count num">{graphemes(name)}/{NAME_MAX}</small>}</label>
          <button type="button" className="btn big" disabled={!onlineReady || working} onClick={() => (name.trim() ? go(() => onHost(name.trim(), lastEmoji() || undefined)) : setErr('Enter a name.'))}>Host online game</button>
          <form className="join" onSubmit={e => { e.preventDefault(); if (!name.trim()) { setErr('Enter a name.'); return; } if (code.trim()) go(() => onJoin(code.trim().toUpperCase(), name.trim(), lastEmoji() || undefined)); }}>
            <input aria-label="Room code" value={code} maxLength={8} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="CODE" disabled={!onlineReady} />
            <button type="submit" className="btn" disabled={!onlineReady || working || !code.trim()}>Join with code</button>
          </form>
          {working && <p className="hint">Connecting…</p>}
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

/** "P1 won with 54 · P1, P2, P3 · 5 min ago": the finished game home offers again. */
function lastLine({ state, finishedAt }) {
  const won = state.ranking && state.players[state.ranking[0]];
  const names = state.players.map(p => p.name).join(', ');
  const mins = Math.round((Date.now() - (finishedAt || Date.now())) / 60000);
  return `${won ? `${won.name} won · ` : ''}${names}${mins > 0 ? ` · ${mins < 60 ? `${mins} min` : `${Math.round(mins / 60)} h`} ago` : ''}`;
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

/** Pick the spheres, one per player (`n`): Classic, random, or your own. `value` = { mode, quadrants }, already fitted
 *  to n (fitTable); a change hands back the whole pick. */
export function TablePicker({ value, onChange, readOnly = false, n = 4 }) {
  const { mode, quadrants } = value;
  const setMode = m => {
    if (m === 'classic') onChange({ mode: m, quadrants: [...CLASSIC] });
    else if (m === 'random') onChange({ mode: m, quadrants: randomTable() });
    else onChange({ mode: m, quadrants: [...quadrants] });
  };
  // a fifth sphere with four picked swaps in for the last one picked, in its place on the wheel, and says so quietly
  // beside the count (live panel r1: "you can't swap a colour once 4 are picked"; before, it only said "take one off")
  const [swapped, setSwapped] = useState(null); // { out, in }
  const full = quadrants.length >= n;
  const last = full ? quadrants[quadrants.length - 1] : null;
  const toggle = id => {
    setSwapped(null);
    if (quadrants.includes(id)) onChange({ mode, quadrants: quadrants.filter(x => x !== id) });
    else if (quadrants.length < n) onChange({ mode, quadrants: [...quadrants, id] });
    else { onChange({ mode, quadrants: [...quadrants.slice(0, -1), id] }); setSwapped({ out: last, in: id }); }
  };
  const clear = () => { setSwapped(null); onChange({ mode, quadrants: [] }); };
  // a sphere clashes with a color already on the table; with four picked, the last one is the one a click swaps out
  const usedRes = (full ? quadrants.slice(0, -1) : quadrants).map(id => quadrant(id).resource);
  const problem = quadrants.length === n ? tableProblem(quadrants) : '';
  return (
    <div className={`table-pick${readOnly ? '' : ' editable'}`} data-table={quadrants.join(',')}>
      <div className="seat">
        <span>Table</span>
        {readOnly ? <span className="hint">{mode === 'random' ? `Random ${n}` : mode === 'custom' ? 'Custom' : 'Classic'}</span>
          : <Seg label="Table" value={mode} options={[['classic', 'Classic'], ['random', `Random ${n}`], ['custom', 'Custom']]} onChange={setMode} />}
      </div>
      {mode !== 'custom' || readOnly ? (
        <div className="table-chips">
          {/* Reroll first, so it stays under the pointer while the names after it change width (w2b #33) */}
          {mode === 'random' && !readOnly && <button type="button" className="btn ghost" data-reroll onClick={() => { let t; do { t = randomTable(); } while (sameTable(t.slice(0, n), quadrants)); onChange({ mode, quadrants: t }); }}>Reroll</button>}
          {quadrants.map(id => <TableChip key={id} id={id} />)}
        </div>
      ) : (
        <>
          <p className="hint">Pick {n}, one per player: they go round the wheel in the order you pick them (the corner number). <span className="nowrap"><span className="num">{quadrants.length}</span> of {n}</span>
            {quadrants.length > 0 && <> · <button type="button" className="link-btn" data-table-clear onClick={clear} title="Take them all off and pick again">Clear</button></>}
            {swapped && <span className="full-note" data-full-note data-swapped={swapped.out} role="status"> · {sphereName(swapped.in)} in for {sphereName(swapped.out)}</span>}</p>
          <div className="sphere-grid">
            {spheres().map(id => {
              const on = quadrants.includes(id);
              const clash = !on && usedRes.includes(quadrant(id).resource);
              const over = !on && !clash && full;
              return (
                <button key={id} type="button" className={`sphere${on ? ' on' : ''}${over ? ' over' : ''}`} aria-pressed={on} data-sphere={id}
                  disabled={clash} style={{ '--c': `var(--${id})` }} onClick={() => toggle(id)}
                  title={clash ? `Another sphere on this table already uses ${quadrant(id).resource}.` : over ? `Swap ${sphereName(id)} in for ${sphereName(last)} (the last one picked). ${sphereHint(id)}` : sphereHint(id)}>
                  <i className="dot" />{on && <span className="ord num">{quadrants.indexOf(id) + 1}</span>}
                  <b>{sphereName(id)}</b><small>{lowColor(quadrant(id).scoring.label)}</small><small className="sphere-line">{sphereLine(id)}</small>
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
/** What a sphere does, in its own panels' words (RC1 sweep 6: the chips said only how it scores): "Most gold. Its
 *  round I spaces: +3 gold, pick who gets 1 · +2 gold · Save 4 on next member." The resource dot is a word here. */
export function sphereHint(id) {
  const q = quadrant(id);
  // the follower mark in words, singular only after a 1 ("+1 follower"; "+1 per rival with more followers")
  const lines = q.actions.filter(a => a.ring === 1).map(a => panelWords(id, a, 1).replace(/(^|[^\d])1 @f/g, '$11 follower').replace(/@f/g, 'followers'));
  return `${sphereLine(id)} ${lowColor(q.scoring.label)} at round end. Its round I spaces: ${lines.join(' · ')}.`;
}
// a chip opens what its sphere does, like any hover in the game (w4b #24: its native title showed nothing to a pointer
// that paused, and nothing at all on touch)
function TableChip({ id }) {
  const q = quadrant(id);
  return (
    <Tip className="table-chip" style={{ '--c': `var(--${id})` }} label={`${sphereName(id)}: what it does`} content={() => (
      <div className="pop-card" data-chip-card={id}><b>{sphereName(id)}</b><span>{sphereLine(id)}</span><span>{lowColor(q.scoring.label)} at round end.</span>
        <span>Its round I spaces: {q.actions.filter(a => a.ring === 1).map(a => panelWords(id, a, 1).replace(/(^|[^\d])1 @f/g, '$11 follower').replace(/@f/g, 'followers')).join(' · ')}.</span></div>
    )}><i className="dot" />{sphereName(id)}<small className="chip-line">{sphereLine(id)}</small></Tip>
  );
}

// Every seat wears an emoji, none twice: the first person starts with the one this browser picked last, everyone
// else (bots too) with a random free one. People outrank bots: picking a bot's emoji makes the bot take another.
function dressSeats(seats) {
  const first = seats.findIndex(s => s.kind === 'human');
  const wish = lastEmoji();
  const with1 = first >= 0 && !seats[first].emoji && wish && !seats.some(s => s.kind === 'human' && s.emoji === wish)
    ? seats.map((s, i) => (i === first ? { ...s, emoji: wish } : s)) : seats;
  return settleEmojis(with1);
}

export function LocalSetup({ initial, onStart, onBack }) {
  const [seats, setSeats] = useState(() => dressSeats(initial?.seats || [
    { kind: 'human', name: 'P1' }, { kind: 'bot', name: 'P2' }, { kind: 'bot', name: 'P3' }, { kind: 'bot', name: 'P4' },
  ]));
  // one speed (Quick / Steady / Relaxed): the bots' pace and how moves play out, the same setting as the ☰ menu's
  const [speed, setSpeed] = useState(motionSpeed);
  const [level, setLevel] = useState(initial?.level || DEFAULT_BOT_LEVEL);
  const [table, setTable] = useState(() => initialTable(initial?.table));
  const filled = seats.filter(s => s.kind !== 'empty');
  // one sphere per player (Cory, 2026-10-15): the table follows the seats as they're filled or emptied
  const nSph = sphereCount(filled.length);
  const fitted = fitTable(table, filled.length);
  const tableOk = !tableProblem(fitted.quadrants, nSph);
  const short = nSph - fitted.quadrants.length;
  const startWhy = filled.length < 2 ? 'Needs at least 2 seats' : short > 0 ? `Pick ${short} more sphere${short === 1 ? '' : 's'}` : tableOk ? '' : tableProblem(fitted.quadrants, nSph);
  const set = (i, patch) => setSeats(settleEmojis(seats.map((s, k) => (k === i ? { ...s, ...patch } : s))));
  const pickEmoji = (i, id) => {
    const next = takeEmoji(seats, i, id);
    if (!next) return;
    setSeats(settleEmojis(next));
    if (i === seats.findIndex(s => s.kind === 'human')) rememberEmoji(id);
  };
  const holders = (i, kind) => new Map(seats.map((s, k) => [s, k]).filter(([s, k]) => k !== i && s.kind === kind && s.emoji).map(([s, k]) => [s.emoji, s.name.trim() || `P${k + 1}`]));
  // the seat's default name is a placeholder, never text in the box (w2a #48: typing gave "P1Wren"); left empty, it plays
  // as that default
  const named = () => seats.map((s, k) => ({ ...s, name: s.name.trim() || `P${k + 1}` }));
  // the press that opened this page (a double click on "Play on this device") never lands on what now stands under the
  // pointer: P4's name box sat right under Play and took the focus (blind panel)
  const born = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const carried = e => { if (performance.now() - born.current < 400 && e.target.closest && e.target.closest('input')) e.preventDefault(); };
  return (
    <div className="app narrow">
      <div className="dialog page" onMouseDownCapture={carried}>
        <h2>Play on this device</h2>
        <p className="hint">Everyone plays on this screen. Bots fill the other seats.</p>
        {seats.map((s, i) => (
          <div className="seat" key={i} style={{ '--pc': PLAYER_COLORS[i] }} data-seat-row={i}>
            {s.kind === 'human'
              ? <EmojiButton value={s.emoji} label={`${s.name.trim() || `P${i + 1}`}’s emoji`} taken={holders(i, 'human')} bots={holders(i, 'bot')} onPick={id => pickEmoji(i, id)} />
              : <EmojiFace id={s.kind === 'bot' ? s.emoji : null} title={s.kind === 'bot' ? `${emojiName(s.emoji)}: a random one for this bot. Pick it for a person and the bot takes another.` : null} />}
            <label className="namebox">
              <input aria-label={`Seat ${i + 1} name`} value={s.name === `P${i + 1}` ? '' : s.name} placeholder={`P${i + 1}`} disabled={s.kind === 'empty'} onChange={e => set(i, { name: clip(e.target.value, NAME_MAX) })} />
              {/* the count only near the limit (w2a #48: "4/14" was noise) */}
              {graphemes(s.name) >= NAME_MAX - 3 && <small className={`count num${graphemes(s.name) >= NAME_MAX ? ' full' : ''}`} aria-hidden="true">{graphemes(s.name)}/{NAME_MAX}</small>}
            </label>
            <Seg label={`Seat ${i + 1}`} value={s.kind} options={KINDS} onChange={v => set(i, { kind: v })} />
          </div>
        ))}
        <div className="seat"><span>Bots</span><Seg label="Bot level" value={level} options={BOT_LEVEL_INFO.map(l => [l.level, l.name, l.blurb])} onChange={setLevel} /></div>
        <div className="seat"><span>Speed</span><Seg label="Speed" value={speed} options={SPEED_OPTS} onChange={v => { setSpeed(v); setMotionSpeed(v); }} /></div>
        <TablePicker value={fitted} n={nSph} onChange={setTable} />
        <div className="row-btns">
          {/* why Start is off, said beside it (RC1 #8: it dimmed at 3 of 4 with nothing near it) */}
          {startWhy && <span className="hint start-why" data-start-why>{startWhy}</span>}
          <button type="button" className="btn" onClick={onBack}>Back</button>
          <button type="button" className="btn pri" data-start disabled={!!startWhy} title={startWhy || undefined} onClick={() => onStart({ seats: named(), speed, level, table: fitted })}>Start</button>
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
  const [botLevel, setBotLevel] = useState(DEFAULT_BOT_LEVEL);
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
  // one sphere per player (Cory, 2026-10-15): everyone sees the room's table fitted to the seats taken now
  const nSph = sphereCount(players.length);
  const shownTable = fitTable(isHost && draft ? draft : roomTable, players.length);
  const pickTable = t => { setDraft(t); if (!tableProblem(t.quadrants) && lobby.setTable) act(() => lobby.setTable(t)); };
  // one emoji per table: another person's is dimmed; a bot's can be taken (the bot picks another)
  const held = kind => new Map(players.filter(p => p.id !== me && p.kind === kind && p.emoji).map(p => [p.emoji, p.name]));
  const pickEmoji = id => act(async () => { setErr(''); await lobby.setEmoji(id); rememberEmoji(id); });
  const levelInfo = l => BOT_LEVEL_INFO.find(x => x.level === l) || BOT_LEVEL_INFO.find(x => x.level === DEFAULT_BOT_LEVEL);
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
            <li key={p.id} className="seat" style={{ '--pc': PLAYER_COLORS[p.seat % 4] }} data-lobby-seat={p.seat}>
              {p.id === me && lobby.setEmoji && view.status === 'lobby'
                ? <EmojiButton value={p.emoji} label="Your emoji" taken={held('human')} bots={held('bot')} onPick={pickEmoji} />
                : <EmojiFace id={p.emoji} title={p.emoji ? `${p.name}: ${emojiName(p.emoji)}` : null} />}
              <span className="nm">{p.name}{p.id === me ? ' (you)' : ''}</span>
              <span className="hint" data-presence={p.kind === 'bot' ? 'bot' : p.connected === false ? 'offline' : 'here'} data-bot-level={p.kind === 'bot' ? levelInfo(p.bot).level : undefined}
                title={p.kind === 'bot' ? `${levelInfo(p.bot).name} bot: ${levelInfo(p.bot).blurb}` : undefined}>
                {p.kind === 'bot' ? `bot · ${levelInfo(p.bot).name}` : `${p.id === view.hostId ? 'host · ' : ''}${p.connected === false ? 'offline' : 'connected'}`}
              </span>
              {isHost && p.id !== me && <button type="button" className="btn ghost" onClick={() => act(() => lobby.removeSeat(p.seat))}>Remove</button>}
            </li>
          ))}
        </ul>
        {isHost && (
          <div className="seat add-bot">
            <button type="button" className="btn" data-add-bot disabled={players.length >= 4} title={`Add a ${levelInfo(botLevel).name} bot: ${levelInfo(botLevel).blurb}`} onClick={() => act(() => lobby.addBot(undefined, undefined, botLevel))}>Add bot</button>
            <Seg label="Bot level" value={botLevel} options={BOT_LEVEL_INFO.map(l => [l.level, l.name, l.blurb])} onChange={setBotLevel} />
          </div>
        )}
        <TablePicker value={shownTable} n={nSph} onChange={pickTable} readOnly={!isHost || !lobby.setTable} />
        {err && <p className="error">{err}</p>}
        {!isHost && <p className="hint">Waiting for {view.hostName || 'the host'} to start…</p>}
        {isHost && view.startHint && <p className="hint" data-start-hint>{view.startHint}</p>}
        {/* Leave beside Start, as Back sits beside Start on the setup page (one footer, one pattern) */}
        <div className="row-btns">
          <button type="button" className="btn" onClick={onLeave}>Leave</button>
          {isHost && <button type="button" className="btn pri" disabled={view.canStart === false || players.length < 2 || !!tableProblem(shownTable.quadrants, nSph)} onClick={() => act(() => lobby.start())}>Start game</button>}
        </div>
      </div>
    </div>
  );
}
