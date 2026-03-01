/**
 * GodIcon — Thematic SVG symbol for each god.
 *
 * Gold (Aurum): Ornate coin with laurel wreath detail
 * Black (Noctis): Curved dagger / crescent blade
 * Green (Chronis): Hourglass with flowing sand
 * Yellow (Solara): Radiant sun with ray corona
 */
import React from 'react';
import { godColors } from '../../styles/theme';

const GOD_PATHS = {
  // Ornate coin — circle with cross detail and rim
  coin: (c, r) => (
    <>
      <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth={r * 0.15} />
      <circle cx={c} cy={c} r={r * 0.65} fill="none" stroke="currentColor" strokeWidth={r * 0.08} opacity={0.5} />
      {/* Crown/points at top */}
      <path d={`M${c - r * 0.25},${c - r * 0.15} L${c},${c - r * 0.45} L${c + r * 0.25},${c - r * 0.15}`} fill="none" stroke="currentColor" strokeWidth={r * 0.08} strokeLinecap="round" strokeLinejoin="round" />
      {/* Horizontal line */}
      <line x1={c - r * 0.35} y1={c + r * 0.15} x2={c + r * 0.35} y2={c + r * 0.15} stroke="currentColor" strokeWidth={r * 0.06} opacity={0.6} />
    </>
  ),

  // Curved dagger — crescent blade with handle
  dagger: (c, r) => (
    <>
      {/* Blade */}
      <path
        d={`M${c},${c - r * 0.85} C${c + r * 0.5},${c - r * 0.3} ${c + r * 0.3},${c + r * 0.2} ${c},${c + r * 0.55}`}
        fill="none" stroke="currentColor" strokeWidth={r * 0.12} strokeLinecap="round"
      />
      <path
        d={`M${c},${c - r * 0.85} C${c - r * 0.15},${c - r * 0.3} ${c - r * 0.05},${c + r * 0.15} ${c},${c + r * 0.55}`}
        fill="none" stroke="currentColor" strokeWidth={r * 0.08} strokeLinecap="round" opacity={0.5}
      />
      {/* Guard */}
      <line x1={c - r * 0.3} y1={c + r * 0.55} x2={c + r * 0.3} y2={c + r * 0.55} stroke="currentColor" strokeWidth={r * 0.1} strokeLinecap="round" />
      {/* Handle */}
      <line x1={c} y1={c + r * 0.55} x2={c} y2={c + r * 0.85} stroke="currentColor" strokeWidth={r * 0.1} strokeLinecap="round" />
      {/* Pommel */}
      <circle cx={c} cy={c + r * 0.9} r={r * 0.08} fill="currentColor" />
    </>
  ),

  // Hourglass with flowing sand particles
  hourglass: (c, r) => {
    const top = c - r * 0.8;
    const mid = c;
    const bot = c + r * 0.8;
    const w = r * 0.55;
    return (
      <>
        {/* Frame */}
        <line x1={c - w} y1={top} x2={c + w} y2={top} stroke="currentColor" strokeWidth={r * 0.1} strokeLinecap="round" />
        <line x1={c - w} y1={bot} x2={c + w} y2={bot} stroke="currentColor" strokeWidth={r * 0.1} strokeLinecap="round" />
        {/* Glass body */}
        <path
          d={`M${c - w * 0.85},${top + r * 0.08} L${c - r * 0.05},${mid} L${c - w * 0.85},${bot - r * 0.08}`}
          fill="none" stroke="currentColor" strokeWidth={r * 0.07} strokeLinejoin="round"
        />
        <path
          d={`M${c + w * 0.85},${top + r * 0.08} L${c + r * 0.05},${mid} L${c + w * 0.85},${bot - r * 0.08}`}
          fill="none" stroke="currentColor" strokeWidth={r * 0.07} strokeLinejoin="round"
        />
        {/* Sand in bottom */}
        <path
          d={`M${c - w * 0.5},${bot - r * 0.15} Q${c},${bot - r * 0.35} ${c + w * 0.5},${bot - r * 0.15}`}
          fill="currentColor" opacity={0.3}
        />
        {/* Falling sand */}
        <circle cx={c} cy={mid + r * 0.15} r={r * 0.03} fill="currentColor" opacity={0.5} />
        <circle cx={c} cy={mid + r * 0.3} r={r * 0.025} fill="currentColor" opacity={0.35} />
      </>
    );
  },

  // Radiant sun with ray corona
  sun: (c, r) => {
    const rays = 8;
    const innerR = r * 0.35;
    const outerR = r * 0.85;
    const midR = r * 0.55;
    return (
      <>
        {/* Core circle */}
        <circle cx={c} cy={c} r={innerR} fill="currentColor" opacity={0.3} />
        <circle cx={c} cy={c} r={innerR} fill="none" stroke="currentColor" strokeWidth={r * 0.08} />
        {/* Rays — alternating long/short */}
        {Array.from({ length: rays }, (_, i) => {
          const angle = (Math.PI * 2 / rays) * i - Math.PI / 2;
          const len = i % 2 === 0 ? outerR : midR;
          return (
            <line
              key={i}
              x1={c + innerR * 1.2 * Math.cos(angle)}
              y1={c + innerR * 1.2 * Math.sin(angle)}
              x2={c + len * Math.cos(angle)}
              y2={c + len * Math.sin(angle)}
              stroke="currentColor"
              strokeWidth={i % 2 === 0 ? r * 0.08 : r * 0.05}
              strokeLinecap="round"
              opacity={i % 2 === 0 ? 0.9 : 0.5}
            />
          );
        })}
      </>
    );
  },
};

const ICON_MAP = {
  gold: 'coin',
  black: 'dagger',
  green: 'hourglass',
  yellow: 'sun',
};

export default function GodIcon({ god, size = 32, className = '' }) {
  const iconType = ICON_MAP[god];
  if (!iconType) return null;

  const colors = godColors[god];
  const center = size / 2;
  const radius = size * 0.45;
  const Paths = GOD_PATHS[iconType];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ color: colors.primary }}
    >
      {Paths(center, radius)}
    </svg>
  );
}
