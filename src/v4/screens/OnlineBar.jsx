// Online games: who's gone, and the one-tap fix. Shown over the game only when something needs saying:
// - you lost your connection ("reconnecting…"),
// - a player is offline: the host gets "Dan left — let a bot play for them" once they've been gone a while;
//   everyone else sees that the table is waiting on them,
// - a bot is standing in for someone until they're back (they take their seat back just by rejoining).
// It reads only session.info (session/online.js); the game screen is untouched. Bottom-left on wide screens (over the
// wheel's caption, clear of the buy row), bottom-center on phones; every row can be dismissed.
import { useEffect, useState } from 'react';
import { friendlyError } from '../errors.js';

const row = {
  pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '8px 8px 8px 14px',
  background: 'var(--table-2, #1d2928)', color: 'var(--ink, #ece6d6)', border: '1px solid var(--rim, #2d3b39)', borderRadius: 14,
  boxShadow: '0 6px 24px rgba(0,0,0,.35)', fontSize: 'var(--fs-2, 14px)', lineHeight: 1.35,
};
const warn = { ...row, borderColor: 'var(--gold, #d9b24c)' };
const quiet = { ...row, color: 'var(--muted, #97a49f)' };
const QUIET_MS = 8000; // informational rows fold away by themselves

const isWide = () => typeof window !== 'undefined' && window.innerWidth >= 900;

export default function OnlineBar({ session }) {
  const [, setTick] = useState(0);
  const [busy, setBusy] = useState(-1);
  const [err, setErr] = useState('');
  const [hidden, setHidden] = useState(() => new Set()); // dismissed row keys
  const [offlineShown, setOfflineShown] = useState(false);
  const [wide, setWide] = useState(isWide);
  useEffect(() => (session && session.subscribe ? session.subscribe(() => setTick(t => t + 1)) : undefined), [session]);
  useEffect(() => { const on = () => setWide(isWide()); addEventListener('resize', on); return () => removeEventListener('resize', on); }, []);
  const info = session && session.info;
  // a blip (or the first moment of a page load) isn't news: say "offline" only after a few seconds of it
  const selfOff = !!info && info.selfOnline === false;
  useEffect(() => {
    if (!selfOff) { setOfflineShown(false); return undefined; }
    const t = setTimeout(() => setOfflineShown(true), 3000);
    return () => clearTimeout(t);
  }, [selfOff]);
  const state = session && session.getState && session.getState();
  const seats = (info && info.seats) || [];
  const waitingOn = state && state.pending ? state.pending.player : -1;
  const gone = seats.filter(s => s.kind === 'human' && s.away && !s.sub && !s.me);
  const subbed = seats.filter(s => s.kind === 'human' && s.sub);
  // row keys carry the situation, so a dismissed row comes back when things change (they return and leave again…)
  const keys = [...gone.map(s => `${s.canSub ? 'offer' : s.seat === waitingOn ? 'turn' : 'off'}:${s.seat}`), ...subbed.map(s => `sub:${s.seat}`)];
  const quietKeys = keys.filter(k => k.startsWith('sub:') || k.startsWith('off:')).join(',');
  useEffect(() => {
    if (!quietKeys) return undefined;
    const t = setTimeout(() => setHidden(h => new Set([...h, ...quietKeys.split(',')])), QUIET_MS);
    return () => clearTimeout(t);
  }, [quietKeys]);
  useEffect(() => { setHidden(h => { const keep = new Set([...h].filter(k => keys.includes(k))); return keep.size === h.size ? h : keep; }); }, [keys.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!info || info.mode !== 'online' || !state || state.over) return null;

  const hide = key => setHidden(h => new Set([...h, key]));
  const close = key => <button type="button" className="btn ghost" aria-label="Dismiss" onClick={() => hide(key)} style={{ minWidth: 44 }}>✕</button>;
  const rows = [];
  if (selfOff && offlineShown) {
    rows.push(<div key="me" style={warn} role="status" data-online="self-offline">You’re offline. Reconnecting…</div>);
  }
  for (const s of gone) {
    const turn = s.seat === waitingOn;
    if (s.canSub) {
      const key = `offer:${s.seat}`;
      if (hidden.has(key)) continue;
      rows.push(
        <div key={key} style={warn} role="status" data-online="gone" data-seat={s.seat}>
          <span style={{ flex: '1 1 180px' }}><b>{s.name}</b> left{turn ? ' and it’s their turn' : ''}. Let a bot play for them?</span>
          <button type="button" className="btn pri" data-online-sub={s.seat} disabled={busy === s.seat}
            onClick={() => { setBusy(s.seat); setErr(''); session.letBotPlay(s.seat).catch(e => setErr(friendlyError(e))).finally(() => setBusy(-1)); }}>
            Let a bot play
          </button>
          <button type="button" className="btn ghost" onClick={() => hide(key)}>Not now</button>
        </div>,
      );
    } else if (turn) {
      const key = `turn:${s.seat}`;
      if (hidden.has(key)) continue;
      rows.push(
        <div key={key} style={warn} role="status" data-online="waiting" data-seat={s.seat}>
          <span style={{ flex: '1 1 180px' }}><b>{s.name}</b> is offline; waiting for them to come back.{info.isHost ? '' : ' The host can let a bot play for them.'}</span>
          {close(key)}
        </div>,
      );
    } else {
      const key = `off:${s.seat}`;
      if (hidden.has(key)) continue;
      rows.push(<div key={key} style={quiet} role="status" data-online="offline" data-seat={s.seat}><span style={{ flex: 1 }}><b>{s.name}</b> is offline.</span>{close(key)}</div>);
    }
  }
  for (const s of subbed) {
    const key = `sub:${s.seat}`;
    if (hidden.has(key)) continue;
    rows.push(
      <div key={key} style={quiet} role="status" data-online="sub" data-seat={s.seat}>
        <span style={{ flex: '1 1 180px' }}>A bot is playing for <b>{s.name}</b> until they’re back{s.me ? '' : '. Their invite link takes the seat back'}.</span>
        {close(key)}
      </div>,
    );
  }
  if (err) rows.push(<div key="err" style={warn} role="alert"><span style={{ flex: 1 }}>{err}</span><button type="button" className="btn ghost" aria-label="Dismiss" onClick={() => setErr('')}>✕</button></div>);
  if (!rows.length) return null;
  const place = wide
    ? { left: 16, width: 'min(440px, calc(100vw - 32px))' }
    : { left: '50%', transform: 'translateX(-50%)', width: 'calc(100vw - 32px)' };
  return (
    <div data-online-bar style={{ position: 'fixed', bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', zIndex: 900, display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none', ...place }}>
      {rows}
    </div>
  );
}
