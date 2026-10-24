// demo: the face contract's worked example (not a candidate look). A plate in the quadrant's ink with the name, the
// yield in pips, and the minions standing on it. Copy this file to start a face; the contract is in ./index.js.
import { FaceMinion, FaceText } from './kit.jsx';

export default function Demo({ ring, status, minions, size, name, effect, px, color }) {
  const { w, h } = size;
  const taken = status === 'taken' || status === 'fresh';
  const locked = status === 'locked';
  return (
    <>
    <g opacity={taken ? 0.55 : 1}>
      {status === 'lit' && <rect x={-w / 2 - 3} y={-h / 2 - 3} width={w + 6} height={h + 6} rx="9" fill="rgba(255,196,92,.55)" filter="url(#ltGlow)" />}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="7" fill={locked ? 'none' : color} fillOpacity={locked ? 0 : 0.22}
        stroke={status === 'lit' ? '#ffcf6b' : 'rgba(42,31,23,.45)'} strokeWidth={status === 'lit' ? 2 : 1} strokeDasharray={locked ? '3 3' : undefined} />
      {!locked && <text y={-h / 2 + 15 * px} textAnchor="middle" fontSize={12 * px} fontWeight="800" fill="var(--paper-ink)" fontFamily="var(--sans)">{name}</text>}
      {!locked && <FaceText text={effect} px={px} w={w} h={h / 2} y={h / 6} />}
      {locked && <text y={5 * px} textAnchor="middle" fontSize={13 * px} fontWeight="700" fill="rgba(42,31,23,.5)" fontFamily="var(--serif)">{['', 'I', 'II', 'III'][ring]}</text>}
    </g>
      {minions.map((m, k) => <FaceMinion key={m.pid} m={m} x={(k - (minions.length - 1) / 2) * 16} y={h / 2 - 2} size={ring === 1 ? 20 : 16} />)}
      {status === 'fresh' && <rect x={-w / 2 - 2} y={-h / 2 - 2} width={w + 4} height={h + 4} rx="9" fill="none" stroke={minions.find(m => m.fresh)?.color || '#8f7f66'} strokeWidth="1.6" strokeDasharray="2 2.5" />}
    </>
  );
}
