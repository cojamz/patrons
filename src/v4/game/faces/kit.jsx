// The face kit: small helpers a face may use (see the contract at the top of ./index.js). Not a face itself.
import { Minion } from '../../art/Leader.jsx';
import { Marked } from '../Wheel.jsx';

export { Marked, clauses } from '../Wheel.jsx';
export { Rich } from '../Rich.jsx';
export { Sprite } from '../../art/Sprite.jsx';
export { spriteId, iconFor, withOutline } from '../../art/index.js';
export { Follower } from '../../art/Follower.jsx';
export { Minion } from '../../art/Leader.jsx';
export { shortEffect, pipEffect } from '../../shorts.js';
export { quadrant, roman } from '../../../engine/v4/index.js';

/** One minion (the pixel figure everyone knows), its FEET at (x, y), `size` board units tall. */
export function FaceMinion({ m, x = 0, y = 0, size = 18 }) {
  // (the game's CSS gives every svg on the stage width/height 100%: the outer box's inline size pins the minion's)
  return (
    <svg className={`face-minion${m.fresh ? ' fresh' : ''}`} data-seat={m.pid} x={x - size / 2} y={y - size} viewBox="0 0 16 16" overflow="visible" style={{ width: size, height: size, overflow: 'visible' }}>
      <Minion color={m.color} emoji={m.emoji} size={16} title={m.name ? `${m.name}’s minion` : null} />
    </svg>
  );
}

/** HTML inside a face: a w×h box centred on (x, y) (a foreignObject). Font sizes inside are in board units: use px. */
export function FaceHtml({ w, h, x = 0, y = 0, className = '', style = null, children }) {
  return (
    <foreignObject x={x - w / 2} y={y - h / 2} width={w} height={h} style={{ overflow: 'visible' }}>
      <div className={`face-html ${className}`} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.05, ...style }}>
        {children}
      </div>
    </foreignObject>
  );
}

/** A line of yield text with pips and marks (@m member, @r rival, @f follower), `font` screen px tall. */
export function FaceText({ text, px, font = 12, w = 60, h = 20, x = 0, y = 0, weight = 700, color = 'var(--paper-ink)', family = 'var(--sans)' }) {
  return (
    <FaceHtml w={w} h={h} x={x} y={y} style={{ fontSize: font * px, fontWeight: weight, color, fontFamily: family }}>
      <span><Marked text={text} /></span>
    </FaceHtml>
  );
}
