/**
 * ResourceIcon — SVG gem with distinct shape per resource type.
 *
 * Each resource has a unique silhouette for color-blind accessibility:
 *   Gold: Coin (circle + inner ring)
 *   Black: Diamond (rotated square)
 *   Green: Hexagon
 *   Yellow: Star (6-point)
 *
 * All gems have radial gradients, specular highlights, and drop shadows
 * for that "divine artifact" feel.
 */
import React from 'react';
import { resourceStyles } from '../../styles/theme';

const SHAPES = {
  // Gold coin — circle with inner ring detail
  coin: ({ color, highlight, shadow, size }) => (
    <>
      <circle cx={size/2} cy={size/2} r={size * 0.42} fill={`url(#grad-${color})`} />
      <circle cx={size/2} cy={size/2} r={size * 0.42} fill="none" stroke={highlight} strokeWidth={size * 0.04} opacity={0.4} />
      <circle cx={size/2} cy={size/2} r={size * 0.26} fill="none" stroke={highlight} strokeWidth={size * 0.03} opacity={0.25} />
      {/* Specular highlight */}
      <ellipse cx={size * 0.38} cy={size * 0.35} rx={size * 0.12} ry={size * 0.08} fill="white" opacity={0.35} transform={`rotate(-20 ${size * 0.38} ${size * 0.35})`} />
    </>
  ),

  // Black diamond — rotated square with facet lines
  diamond: ({ color, highlight, shadow, size }) => {
    const c = size / 2;
    const r = size * 0.38;
    const points = `${c},${c - r} ${c + r},${c} ${c},${c + r} ${c - r},${c}`;
    return (
      <>
        <polygon points={points} fill={`url(#grad-${color})`} />
        <polygon points={points} fill="none" stroke={highlight} strokeWidth={size * 0.03} opacity={0.3} />
        {/* Facet line */}
        <line x1={c} y1={c - r * 0.5} x2={c + r * 0.5} y2={c} stroke={highlight} strokeWidth={size * 0.02} opacity={0.15} />
        <line x1={c} y1={c - r * 0.5} x2={c - r * 0.5} y2={c} stroke={highlight} strokeWidth={size * 0.02} opacity={0.15} />
        {/* Specular */}
        <ellipse cx={c - r * 0.15} cy={c - r * 0.25} rx={size * 0.08} ry={size * 0.05} fill="white" opacity={0.3} transform={`rotate(-35 ${c - r * 0.15} ${c - r * 0.25})`} />
      </>
    );
  },

  // Green hexagon — six-sided with natural feel
  hexagon: ({ color, highlight, shadow, size }) => {
    const c = size / 2;
    const r = size * 0.4;
    const pts = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      return `${c + r * Math.cos(angle)},${c + r * Math.sin(angle)}`;
    }).join(' ');
    return (
      <>
        <polygon points={pts} fill={`url(#grad-${color})`} />
        <polygon points={pts} fill="none" stroke={highlight} strokeWidth={size * 0.03} opacity={0.3} />
        {/* Inner hex */}
        {(() => {
          const ir = r * 0.55;
          const iPts = Array.from({ length: 6 }, (_, i) => {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            return `${c + ir * Math.cos(angle)},${c + ir * Math.sin(angle)}`;
          }).join(' ');
          return <polygon points={iPts} fill="none" stroke={highlight} strokeWidth={size * 0.02} opacity={0.15} />;
        })()}
        {/* Specular */}
        <ellipse cx={c - r * 0.1} cy={c - r * 0.2} rx={size * 0.1} ry={size * 0.06} fill="white" opacity={0.3} transform={`rotate(-15 ${c - r * 0.1} ${c - r * 0.2})`} />
      </>
    );
  },

  // Yellow star — 6-pointed with radiant feel
  star: ({ color, highlight, shadow, size }) => {
    const c = size / 2;
    const outer = size * 0.4;
    const inner = size * 0.2;
    const pts = Array.from({ length: 12 }, (_, i) => {
      const r = i % 2 === 0 ? outer : inner;
      const angle = (Math.PI / 6) * i - Math.PI / 2;
      return `${c + r * Math.cos(angle)},${c + r * Math.sin(angle)}`;
    }).join(' ');
    return (
      <>
        <polygon points={pts} fill={`url(#grad-${color})`} />
        <polygon points={pts} fill="none" stroke={highlight} strokeWidth={size * 0.03} opacity={0.3} />
        {/* Center glow */}
        <circle cx={c} cy={c} r={inner * 0.6} fill={highlight} opacity={0.2} />
        {/* Specular */}
        <ellipse cx={c - outer * 0.1} cy={c - outer * 0.3} rx={size * 0.06} ry={size * 0.04} fill="white" opacity={0.4} />
      </>
    );
  },
};

export default function ResourceIcon({ type, size = 24, className = '', glow = false }) {
  const style = resourceStyles[type];
  if (!style) return null;

  const Shape = SHAPES[style.shape];
  const filterId = `shadow-${type}-${size}`;
  const gradId = `grad-${type}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ filter: glow ? `drop-shadow(0 0 ${size * 0.15}px ${style.color})` : undefined }}
    >
      <defs>
        <radialGradient id={gradId} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor={style.highlight} />
          <stop offset="50%" stopColor={style.color} />
          <stop offset="100%" stopColor={style.shadow} />
        </radialGradient>
        <filter id={filterId}>
          <feDropShadow dx="0" dy={size * 0.04} stdDeviation={size * 0.03} floodColor={style.shadow} floodOpacity="0.4" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        <Shape color={type} highlight={style.highlight} shadow={style.shadow} size={size} />
      </g>
    </svg>
  );
}

/**
 * WildcardIcon — Trivial Pursuit-style color wheel representing "any" resource type.
 * Four pie wedges (one per god color) with dark crosshair dividers.
 * Flat solid colors = clearly "pick any ONE."
 */
export function WildcardIcon({ size = 14 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const divW = size * 0.06; // crosshair line width

  // Wedge colors: top-right=Gold, bottom-right=Black, bottom-left=Green, top-left=Yellow
  // Each wedge is a quarter circle arc
  const wedge = (startAngle, endAngle, fill) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    return (
      <path
        d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`}
        fill={fill}
      />
    );
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {/* Four wedges: angles measured clockwise from 3 o'clock */}
      {wedge(270, 360, '#D4A843')}  {/* top-right: Gold */}
      {wedge(0, 90, '#6B5B95')}     {/* bottom-right: Black */}
      {wedge(90, 180, '#2D6B4F')}   {/* bottom-left: Green */}
      {wedge(180, 270, '#C7962C')}  {/* top-left: Yellow */}
      {/* Dark crosshair dividers */}
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#0a0908" strokeWidth={divW} />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#0a0908" strokeWidth={divW} />
      {/* Thin outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={size * 0.04} />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={size * 0.08} fill="#0a0908" />
    </svg>
  );
}

/**
 * Shared SVG defs for resource gradients — include once in the app.
 * Allows using fill="url(#goldGem)" etc. anywhere.
 */
export function ResourceGradientDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        {Object.entries(resourceStyles).map(([type, style]) => (
          <radialGradient key={type} id={`${type}Gem`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor={style.highlight} />
            <stop offset="50%" stopColor={style.color} />
            <stop offset="100%" stopColor={style.shadow} />
          </radialGradient>
        ))}
      </defs>
    </svg>
  );
}
