// Using members, made obvious (Cory, 2026-10-15: "I still don't know how to activate a member / the UI for it"), and a
// player's members as one calm list (the seat card). A member you can use now is lit in your seat; its hover and its
// row in the seat card carry the same "Use: +7 ●" button; once used it reads "used" everywhere. Switches (Midas,
// Translator) are a small on/off switch. Everything here is read off the engine (memberUse.js).
import { useEffect, useRef, useState } from 'react';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { quadrant, followers } from '../../engine/v4/index.js';
import { CardName, onTable } from './Info.jsx';
import { Rich, Pip } from './Rich.jsx';
import { memberRows, useNow } from './memberUse.js';
import './members.css';

const sphereOf = (state, d) => { if (!onTable(state, d)) return 'colorless'; try { return quadrant(d.quadrant).resource; } catch { return 'colorless'; } };

/** "Use: +7 ●": the one button that uses a member. big: the primary button of a member's hover. */
export function UseButton({ use, uid, name, onPick, big = false }) {
  if (!use || use.blocked) return null;
  // worth nothing now: still there (it's your call), but muted and saying why, never inviting (w2b #19)
  const title = use.idle ? `${name} would give you nothing now: ${use.why}.` : `Ready to use: ${name}${use.words ? `, ${use.words}` : ''}`;
  return (
    <button type="button" className={`mu-use${big ? ' big' : ''}${use.idle ? ' idle' : ''}`} data-use={uid} data-idle={use.idle ? '1' : undefined} data-option={use.option} title={title}
      onClick={e => { e.stopPropagation(); onPick(use.option); }}>
      <Rich text={use.label} />
    </button>
  );
}

/** "Release: +2 ●": put the member at the bottom of the pile for the colored part of its cost (once a round). */
export function ReleaseButton({ option, name, onPick }) {
  const n = option.refund ?? 0, color = option.color || 'any';
  const say = `Release ${name}: it goes to the bottom of the pile and you get back ${n} ${color === 'any' ? 'in any colors' : color}. Once a round.`;
  return (
    <button type="button" className="mu-use mu-release" data-release={option.uid} data-option={option.id} title={say} aria-label={say}
      onClick={e => { e.stopPropagation(); onPick(option.id); }}>
      Release: <b className="num">+{n}</b><Pip color={color} n={n} />
    </button>
  );
}

/** A member's on/off switch: a button in your buy step (it flips it), else its state alone. */
export function MemberSwitch({ name, on, option = null, onPick = null }) {
  const say = `${name} is ${on ? 'on' : 'off'}.${option ? ` Click to switch it ${on ? 'off' : 'on'}.` : ' You can switch it when you buy.'}`;
  const face = <><i className="mu-track" aria-hidden="true"><i className="mu-knob" /></i><span className="mu-sw-word">{on ? 'on' : 'off'}</span></>;
  return option && onPick
    ? <button type="button" role="switch" aria-checked={on} className={`mu-switch${on ? ' on' : ''}`} data-switch={on ? 'on' : 'off'} data-option={option.id} title={say} aria-label={say}
        onClick={e => { e.stopPropagation(); onPick(option.id); }}>{face}</button>
    : <span className={`mu-switch idle${on ? ' on' : ''}`} data-switch={on ? 'on' : 'off'} title={say} aria-label={say} role="img">{face}</span>;
}

const stateOf = row => (row.toggle ? (row.toggle.on ? 'on' : 'off') : row.used ? 'used' : row.tag && row.tag.tone === 'lit' ? 'ready' : row.use && row.use.blocked ? 'blocked' : row.use && row.use.idle ? 'idle' : row.kind === 'use' ? 'unused' : '');

/**
 * The seat card's body (Cory, 2026-10-15): the player's members, one row each: picture, name, the ability as one
 * plain sentence (never cut), and a quiet state where one applies. Use-once members come first, then what pays at
 * round start, what reacts, the standing rules, and the game-end scorers.
 */
export function SeatMembers({ state, pid, me = null, optionFor = () => null, onPick = null }) {
  const rows = memberRows(state, pid, me, optionFor);
  if (!rows.length) return <p className="mu-none">No members yet.</p>;
  return (
    <ul className="mu-list" data-member-list={pid}>
      {rows.map((row, k) => {
        const st = stateOf(row);
        const brk = k > 0 && rows[k - 1].kind !== row.kind;
        return (
          <li key={row.key} className={`mu-row k-${row.kind}${st ? ` s-${st}` : ''}${brk ? ' brk' : ''}`} data-member-row={row.def.id} data-state={st || undefined}>
            <span className="mu-art" aria-hidden="true"><Sprite id={[row.def.id, spriteId(row.name)]} kind="member" sphere={sphereOf(state, row.def)} size={24} /></span>
            <span className="mu-body">
              <span className="mu-head">
                <b className="mu-name"><CardName state={state} uid={row.uid} />{row.n > 1 ? <span className="num"> ×{row.n}</span> : null}</b>
                {/* its state on the right: a switch, the Use button when it's yours to use now, else a quiet word */}
                {row.toggle ? <MemberSwitch name={row.name} on={row.toggle.on} option={row.toggle.option} onPick={onPick} />
                  : onPick && row.use && !row.use.blocked ? <UseButton use={row.use} uid={row.uid} name={row.name} onPick={onPick} />
                    : row.tag ? <span className={`mu-tag ${row.tag.tone}`} title={row.tag.title || undefined}>{row.tag.text}</span> : null}
              </span>
              {/* the whole sentence, never cut; plain (the member's own card underlines its keywords) */}
              <span className="mu-text" data-ability>{row.text ? <Rich text={row.text} /> : 'No effect.'}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Under a member's card when it's one of yours: "Use: +7 ●" when you can use it now, why not when the engine says
 * no, and its switch. Nothing for anyone else's member (the card itself says "used").
 */
export function MemberActions({ state, uid, me = null, optionFor = () => null, onPick = null }) {
  const owner = state.players.find(p => p.members.includes(uid));
  if (!owner || owner.id !== me || !state.cards[uid]) return null;
  const c = state.cards[uid];
  const row = memberRows(state, me, me, optionFor).find(r => r.uids.includes(uid));
  if (!row) return null;
  const use = row.kind === 'use' && !c.used ? useNow(state, me, uid) : null;
  // in your buy step, a member you can release says what comes back, in dots (dialogs pod: Release lives on the seat)
  const rel = row.uids.map(u => optionFor(`release:${u}`)).find(Boolean) || null;
  if (!use && !row.toggle && !rel) return null;
  return (
    <div className="mu-actions" data-member-actions={uid}>
      {row.toggle ? <span className="mu-sw-line"><span>{row.name} is {row.toggle.on ? 'on' : 'off'}</span><MemberSwitch name={row.name} on={row.toggle.on} option={row.toggle.option} onPick={onPick} /></span> : null}
      {use && use.blocked ? <small className="mu-why">Can’t use it now: {use.why || 'nothing would happen'}.</small> : null}
      {use && use.idle ? <small className="mu-why" data-idle-why>Nothing to gain now: {use.why}.</small> : null}
      {use && !use.blocked && onPick ? <UseButton use={use} uid={uid} name={row.name} onPick={onPick} big /> : null}
      {rel && onPick ? <ReleaseButton option={rel} name={row.name} onPick={onPick} /> : null}
    </div>
  );
}

/**
 * What a use just did, shown at the member for a moment (w2a #1: Safecracker spent its use for nothing and nothing
 * said so): { uid, text: "+7 gold" | "+0", n } for about 1.8s after one of pid's members turns used, else null.
 */
export function useUseResult(state, pid) {
  const prev = useRef(state);
  const [out, setOut] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const before = prev.current;
    prev.current = state;
    if (!before || before === state || before.seed !== state.seed || !(state.moves > before.moves) || pid == null) return;
    const p0 = before.players[pid], p1 = state.players[pid];
    if (!p0 || !p1) return;
    const uid = p1.members.find(u => state.cards[u] && state.cards[u].used && before.cards[u] && !before.cards[u].used);
    if (uid == null) return;
    const parts = [];
    for (const r of state.resources) { const d = (p1.res[r] || 0) - (p0.res[r] || 0); if (d) parts.push(`${d > 0 ? '+' : '−'}${Math.abs(d)} ${r}`); }
    const f = followers(state, p1) - followers(before, p0);
    if (f) parts.push(`${f > 0 ? '+' : '−'}${Math.abs(f)} follower${Math.abs(f) === 1 ? '' : 's'}`);
    if ((p1.left || 0) > (p0.left || 0)) parts.push('extra turn');
    setOut({ uid, text: parts.join(' ') || '+0', zero: !parts.length, n: Date.now() });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOut(null), 1800);
  }, [state, pid]);
  return out;
}

/** The result over the member that was just used ("+7 ●", or a quiet "+0"). */
export function UseResult({ result }) {
  if (!result) return null;
  return <span key={result.n} className={`mu-result${result.zero ? ' zero' : ''}`} data-use-result={result.text} aria-live="polite"><Rich text={result.text} /></span>;
}
