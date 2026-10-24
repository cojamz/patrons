// What the player sees when something goes wrong, instead of a blank page:
// - <Recovered> wraps the whole v4 app. A crash anywhere below shows a plain recovery screen (Copy game record /
//   Start a new game). Catching it also clears the tab's "was in a game" flag, so a reload never auto-resumes into
//   the same crash.
// - A save from an older version is never resumed (saved.js); this says so once: "start fresh", with its record.
// - Problems the sessions report (a bot move threw and a fallback was played; the game can't continue) show as a
//   small notice that doesn't block play.
// Inline styles on purpose: these screens must render even if the stylesheet is the thing that broke. They copy the
// table's look by value (walnut, cream, Alegreya; the 14/18 type scale), so a crash doesn't look like another app.
import { Component, Fragment, useEffect, useState } from 'react';
import { currentRecord, recordText, onProblem, latestProblem } from './session/record.js';
import { loadLocal, setAsideLocal, staleSave, staleRecord, markStaleSeen, clearOnline, loadOnline } from './saved.js';

const IN_GAME = 'patrons.v4.inGame';
const forgetInGame = () => { try { sessionStorage.removeItem(IN_GAME); } catch { /* ignore */ } };

// Devtools and e2e scripts: copy(patronsRecord()) gives the game on screen as a record.
if (typeof window !== 'undefined') window.patronsRecord = () => recordText(currentRecord() || staleRecord() || {});

/** Copies text. Resolves true when the clipboard took it. */
export async function copyText(text) {
  try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; } } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand && document.execCommand('copy');
    ta.remove();
    return !!ok;
  } catch { return false; }
}

const btn = { minHeight: 44, minWidth: 44, padding: '8px 16px', borderRadius: 999, border: '1px solid #f3e6c8', background: 'none', color: '#f3e6c8', font: 'inherit', cursor: 'pointer' };
const pri = { ...btn, background: '#f3e6c8', color: '#1d1611' };

/** "Copy game record": copies the JSON; if the clipboard refuses, shows it to copy by hand. */
export function CopyRecord({ getRecord, style }) {
  const [state, setState] = useState(null); // null | 'copied' | text to copy by hand
  const go = async () => {
    const rec = getRecord();
    const text = recordText(rec || { empty: true });
    setState((await copyText(text)) ? 'copied' : text);
  };
  return (
    <>
      <button type="button" style={{ ...btn, ...style }} onClick={go} data-recovery="copy">{state === 'copied' ? 'Copied' : 'Copy game record'}</button>
      {state && state !== 'copied' && (
        <textarea readOnly value={state} aria-label="Game record" onFocus={e => e.target.select()} autoFocus
          style={{ width: '100%', minHeight: 120, background: '#271d16', color: '#f3e6c8', border: '1px solid rgba(243,230,200,.16)', borderRadius: 8, font: '12px ui-monospace, monospace' }} />
      )}
    </>
  );
}

/** The plain screen shown after a crash. */
export function RecoveryScreen({ error, record, onStartNew, online = false, onRejoin, onLeave }) {
  return (
    <div style={{ minHeight: '80dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f3e6c8', fontFamily: "'Alegreya Sans', system-ui, sans-serif" }}>
      <div role="alert" data-recovery="screen" style={{ maxWidth: 440, width: '100%', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start', background: '#271d16', border: '1px solid rgba(243,230,200,.16)', borderRadius: 14, padding: 18 }}>
        <h2 style={{ margin: 0, fontFamily: "Alegreya, Georgia, serif", fontWeight: 500, fontSize: 18 }}>Something went wrong</h2>
        <p style={{ margin: 0 }}>The game hit an error it couldn’t recover from. Copy the game record and send it along: it replays the game exactly, so the bug can be found.</p>
        {error?.message && <p style={{ margin: 0, fontSize: 14, color: '#cbb894' }}>{String(error.message).slice(0, 200)}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%' }}>
          <CopyRecord getRecord={() => record} />
          {online ? (
            <>
              <button type="button" style={pri} onClick={onRejoin} data-recovery="rejoin">Rejoin the game</button>
              <button type="button" style={btn} onClick={onLeave} data-recovery="leave">Leave this game</button>
            </>
          ) : <button type="button" style={pri} onClick={onStartNew} data-recovery="new">Start a new game</button>}
        </div>
      </div>
    </div>
  );
}

const errorInfo = (error, componentStack) => ({
  message: String(error?.message || error), stack: String(error?.stack || '').split('\n').slice(0, 8).join('\n'),
  ...(componentStack ? { componentStack: String(componentStack).split('\n').slice(0, 8).join('\n') } : {}),
});

/** Error boundary for the whole app (React unmounts everything on an uncaught render error otherwise). */
export class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, record: null, key: 0, online: false };
  }

  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error, info) {
    console.error('[v4] crashed:', error, info?.componentStack);
    forgetInGame(); // a reload must not auto-resume straight back into this crash
    // the session tracked every state it published, so the record survives React unmounting the game
    this.setState({ record: currentRecord({ error: errorInfo(error, info?.componentStack) }) || staleRecord(), online: !!loadOnline() });
  }

  startNew = () => {
    setAsideLocal(this.state.error?.message || ''); // its record stays copyable; nothing resumes into the crash
    clearOnline();
    forgetInGame();
    this.setState(s => ({ error: null, record: null, key: s.key + 1 })); // remount the app fresh, on the home screen
  };

  // Online, a remount would keep this tab's connection open: the seat would read as connected while nobody plays it, so
  // the host is never offered a bot. A reload closes it. Rejoin reloads into the same seat (sessionStorage keeps it);
  // Leave forgets the seat first, so the reload lands on the home screen and the seat reads as gone.
  reload = () => (this.props.reload ? this.props.reload() : globalThis.location?.reload());
  rejoin = () => { forgetInGame(); this.reload(); };
  leaveOnline = () => { clearOnline(); forgetInGame(); this.reload(); };

  render() {
    if (this.state.error) {
      return <RecoveryScreen error={this.state.error} record={this.state.record} onStartNew={this.startNew}
        online={this.state.online} onRejoin={this.rejoin} onLeave={this.leaveOnline} />;
    }
    return <Fragment key={this.state.key}>{this.props.children}</Fragment>;
  }
}

const notice = { position: 'fixed', left: '50%', bottom: 16, transform: 'translateX(-50%)', zIndex: 1000, width: 'min(520px, calc(100vw - 32px))',
  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#271d16', color: '#f3e6c8',
  border: '1px solid #ffd99a', borderRadius: 12, boxShadow: '0 6px 24px rgba(0,0,0,.4)', fontFamily: "'Alegreya Sans', system-ui, sans-serif", fontSize: 14 };

/** "Saved on an older version" (once) and session problems, as a small notice at the bottom. Doesn't block play. */
export function Notices({ botNoticeMs = 10000 }) {
  const [stale, setStale] = useState(() => {
    loadLocal(); // sets an unusable save aside, if there is one (idempotent)
    const v = staleSave();
    return v && !v.seen && v.reason !== 'crash' ? v : null;
  });
  const [problem, setProblem] = useState(null);
  useEffect(() => onProblem(p => setProblem(p)), []);
  useEffect(() => {
    if (!problem || problem.kind !== 'bot' || !botNoticeMs) return undefined;
    const t = setTimeout(() => setProblem(cur => (cur === problem ? null : cur)), botNoticeMs);
    return () => clearTimeout(t);
  }, [problem, botNoticeMs]);

  if (stale) {
    const text = stale.reason === 'version'
      ? 'This game was saved on an older version of Cults, so it can’t continue. Start a fresh game.'
      : 'Your saved game couldn’t be opened by this version of Cults. Start a fresh game.';
    return (
      <div role="status" data-notice="stale" style={notice}>
        <span style={{ flex: '1 1 220px' }}>{text}</span>
        <CopyRecord getRecord={staleRecord} />
        <button type="button" style={btn} onClick={() => { markStaleSeen(); setStale(null); }}>OK</button>
      </div>
    );
  }
  if (problem) {
    return (
      <div role="status" data-notice={problem.kind} style={notice}>
        <span style={{ flex: '1 1 220px' }}>{problem.message}</span>
        <CopyRecord getRecord={() => currentRecord({ problem: latestProblem() })} />
        <button type="button" style={btn} aria-label="Dismiss" onClick={() => setProblem(null)}>OK</button>
      </div>
    );
  }
  return null;
}

/** The v4 app root: crash boundary plus notices. */
export function Recovered({ children, reload }) {
  return (
    <Boundary reload={reload}>
      {children}
      <Notices />
    </Boundary>
  );
}
