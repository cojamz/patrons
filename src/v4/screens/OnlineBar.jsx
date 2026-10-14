// Online games: who's gone, and the one-tap fix. Shown over the game only when something needs saying:
// - you lost your connection ("reconnecting…"),
// - a player is offline: the host gets "Dan left — let a bot play for them" once they've been gone a while;
//   everyone else sees that the table is waiting on them,
// - a bot is standing in for someone until they're back (they take their seat back just by rejoining).
// It reads only session.info (session/online.js); the game screen is untouched.
import { useEffect, useState } from 'react';
import { friendlyError } from '../errors.js';

const wrap = {
  position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', zIndex: 900,
  width: 'min(560px, calc(100vw - 32px))', display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none',
};
const row = {
  pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '8px 10px 8px 14px',
  background: 'var(--table-2, #1d2928)', color: 'var(--ink, #ece6d6)', border: '1px solid var(--rim, #2d3b39)', borderRadius: 14,
  boxShadow: '0 6px 24px rgba(0,0,0,.35)', fontSize: 'var(--fs-2, 14px)', lineHeight: 1.35,
};
const warn = { ...row, borderColor: 'var(--gold, #d9b24c)' };
const quiet = { ...row, color: 'var(--muted, #97a49f)', boxShadow: 'none', padding: '6px 14px' };

export default function OnlineBar({ session }) {
  const [, setTick] = useState(0);
  const [busy, setBusy] = useState(-1);
  const [err, setErr] = useState('');
  const [offlineShown, setOfflineShown] = useState(false);
  useEffect(() => (session && session.subscribe ? session.subscribe(() => setTick(t => t + 1)) : undefined), [session]);
  const info = session && session.info;
  // a blip (or the first moment of a page load) isn't news: say "offline" only after a few seconds of it
  const selfOff = !!info && info.selfOnline === false;
  useEffect(() => {
    if (!selfOff) { setOfflineShown(false); return undefined; }
    const t = setTimeout(() => setOfflineShown(true), 3000);
    return () => clearTimeout(t);
  }, [selfOff]);
  const state = session && session.getState && session.getState();
  if (!info || info.mode !== 'online' || !state || state.over) return null;
  const seats = info.seats || [];
  const waitingOn = state.pending ? state.pending.player : -1;
  const gone = seats.filter(s => s.kind === 'human' && s.away && !s.sub && !s.me);
  const subbed = seats.filter(s => s.kind === 'human' && s.sub);
  const rows = [];
  if (selfOff && offlineShown) {
    rows.push(<div key="me" style={warn} role="status" data-online="self-offline">You’re offline. Reconnecting…</div>);
  }
  for (const s of gone) {
    const turn = s.seat === waitingOn;
    if (s.canSub) {
      rows.push(
        <div key={`g${s.seat}`} style={warn} role="status" data-online="gone" data-seat={s.seat}>
          <span style={{ flex: '1 1 200px' }}><b>{s.name}</b> left{turn ? ' and it’s their turn' : ''}. Let a bot play for them?</span>
          <button type="button" className="btn pri" data-online-sub={s.seat} disabled={busy === s.seat}
            onClick={() => { setBusy(s.seat); setErr(''); session.letBotPlay(s.seat).catch(e => setErr(friendlyError(e))).finally(() => setBusy(-1)); }}>
            Let a bot play
          </button>
        </div>,
      );
    } else if (turn || info.isHost) {
      rows.push(
        <div key={`g${s.seat}`} style={turn ? warn : quiet} role="status" data-online="waiting" data-seat={s.seat}>
          <b>{s.name}</b>&nbsp;is offline{turn ? '; waiting for them to come back' : ''}.{turn && !info.isHost ? ' The host can let a bot play for them.' : ''}
        </div>,
      );
    }
  }
  for (const s of subbed) {
    rows.push(
      <div key={`b${s.seat}`} style={quiet} role="status" data-online="sub" data-seat={s.seat}>
        A bot is playing for <b>&nbsp;{s.name}&nbsp;</b> until they’re back{s.me ? '' : ' (opening the invite link takes the seat back)'}.
      </div>,
    );
  }
  if (err) rows.push(<div key="err" style={warn} role="alert">{err}</div>);
  if (!rows.length) return null;
  return <div style={wrap} data-online-bar>{rows}</div>;
}
