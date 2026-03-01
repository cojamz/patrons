/**
 * ChampionIcon — Thematic SVG symbol for each champion.
 *
 * Prescient:  All-seeing eye with radiating rays
 * Ambitious:  Ornate crown with upward aspiration
 * Fortunate:  Four-leaf clover / luck sigil
 * Blessed:    Halo ring above a head silhouette
 * Favored:    Cupped hand receiving a gem
 * Deft:       Dual swift-motion arrows
 */
import React from 'react';
import { godColors } from '../../styles/theme';

export const CHAMPION_NAMES = {
  prescient: 'The Prescient',
  ambitious: 'The Ambitious',
  fortunate: 'The Fortunate',
  blessed: 'The Blessed',
  favored: 'The Favored',
  deft: 'The Deft',
};

const CHAMPION_PATHS = {
  // All-seeing eye — triangular eye of providence with radiating lines
  prescient: (c, r) => {
    const eyeW = r * 0.75;
    const eyeH = r * 0.35;
    const eyeY = c + r * 0.1;
    return (
      <>
        {/* Upper eyelid */}
        <path
          d={`M${c - eyeW},${eyeY} Q${c},${eyeY - eyeH * 1.8} ${c + eyeW},${eyeY}`}
          fill="none" stroke="currentColor" strokeWidth={r * 0.1}
          strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Lower eyelid */}
        <path
          d={`M${c - eyeW},${eyeY} Q${c},${eyeY + eyeH * 1.4} ${c + eyeW},${eyeY}`}
          fill="none" stroke="currentColor" strokeWidth={r * 0.1}
          strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Iris */}
        <circle cx={c} cy={eyeY} r={r * 0.2} fill="none" stroke="currentColor"
          strokeWidth={r * 0.08} />
        {/* Pupil */}
        <circle cx={c} cy={eyeY} r={r * 0.08} fill="currentColor" />
        {/* Radiating rays above the eye */}
        {[-0.5, -0.25, 0, 0.25, 0.5].map((offset, i) => {
          const angle = -Math.PI / 2 + offset * 0.9;
          const startY = eyeY - eyeH * 1.5;
          const rayLen = i === 2 ? r * 0.4 : r * 0.28;
          const sx = c + r * 0.15 * Math.sin(offset * 0.9);
          return (
            <line key={i}
              x1={sx} y1={startY}
              x2={sx + rayLen * Math.cos(angle)}
              y2={startY + rayLen * Math.sin(angle)}
              stroke="currentColor"
              strokeWidth={i === 2 ? r * 0.07 : r * 0.05}
              strokeLinecap="round"
              opacity={i === 2 ? 0.9 : 0.55}
            />
          );
        })}
        {/* Subtle dot accents at eye corners */}
        <circle cx={c - eyeW + r * 0.05} cy={eyeY} r={r * 0.035} fill="currentColor" opacity={0.4} />
        <circle cx={c + eyeW - r * 0.05} cy={eyeY} r={r * 0.035} fill="currentColor" opacity={0.4} />
      </>
    );
  },

  // Ornate crown — with pointed peaks and a central upward arrow
  ambitious: (c, r) => {
    const crownTop = c - r * 0.55;
    const crownBot = c + r * 0.2;
    const bandBot = c + r * 0.35;
    const w = r * 0.75;
    return (
      <>
        {/* Crown body — five peaks */}
        <path
          d={`M${c - w},${crownBot}
              L${c - w},${crownTop + r * 0.3}
              L${c - w * 0.5},${crownTop + r * 0.55}
              L${c - w * 0.25},${crownTop + r * 0.15}
              L${c},${crownTop}
              L${c + w * 0.25},${crownTop + r * 0.15}
              L${c + w * 0.5},${crownTop + r * 0.55}
              L${c + w},${crownTop + r * 0.3}
              L${c + w},${crownBot}
              Z`}
          fill="none" stroke="currentColor" strokeWidth={r * 0.1}
          strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Crown band */}
        <line x1={c - w} y1={crownBot} x2={c + w} y2={crownBot}
          stroke="currentColor" strokeWidth={r * 0.1} strokeLinecap="round" />
        <line x1={c - w + r * 0.03} y1={bandBot} x2={c + w - r * 0.03} y2={bandBot}
          stroke="currentColor" strokeWidth={r * 0.06} strokeLinecap="round" opacity={0.5} />
        {/* Jewel dots on peaks */}
        <circle cx={c} cy={crownTop + r * 0.04} r={r * 0.05} fill="currentColor" opacity={0.7} />
        <circle cx={c - w * 0.25} cy={crownTop + r * 0.19} r={r * 0.04} fill="currentColor" opacity={0.5} />
        <circle cx={c + w * 0.25} cy={crownTop + r * 0.19} r={r * 0.04} fill="currentColor" opacity={0.5} />
        {/* Upward arrow from crown peak */}
        <line x1={c} y1={crownTop - r * 0.02} x2={c} y2={crownTop - r * 0.35}
          stroke="currentColor" strokeWidth={r * 0.06} strokeLinecap="round" />
        <path
          d={`M${c - r * 0.12},${crownTop - r * 0.22} L${c},${crownTop - r * 0.4} L${c + r * 0.12},${crownTop - r * 0.22}`}
          fill="none" stroke="currentColor" strokeWidth={r * 0.06}
          strokeLinecap="round" strokeLinejoin="round"
        />
      </>
    );
  },

  // Four-leaf clover — luck sigil with stem and detail dots
  fortunate: (c, r) => {
    const leafR = r * 0.32;
    const offset = r * 0.22;
    return (
      <>
        {/* Four leaves — each a heart-like lobe */}
        {[
          [c, c - offset],       // top
          [c, c + offset],       // bottom
          [c - offset, c],       // left
          [c + offset, c],       // right
        ].map(([lx, ly], i) => {
          const angle = (i * Math.PI) / 2;
          return (
            <React.Fragment key={i}>
              <circle cx={lx} cy={ly} r={leafR}
                fill="currentColor" fillOpacity={0.12}
                stroke="currentColor" strokeWidth={r * 0.08}
              />
              {/* Inner vein line per leaf */}
              <line
                x1={c} y1={c}
                x2={lx + (lx - c) * 0.6} y2={ly + (ly - c) * 0.6}
                stroke="currentColor" strokeWidth={r * 0.04}
                strokeLinecap="round" opacity={0.4}
              />
            </React.Fragment>
          );
        })}
        {/* Center dot */}
        <circle cx={c} cy={c} r={r * 0.07} fill="currentColor" opacity={0.6} />
        {/* Stem */}
        <path
          d={`M${c},${c + offset + leafR * 0.5}
              Q${c + r * 0.1},${c + r * 0.7} ${c + r * 0.15},${c + r * 0.85}`}
          fill="none" stroke="currentColor" strokeWidth={r * 0.07}
          strokeLinecap="round"
        />
        {/* Small accent dots between leaves */}
        {[
          [c - offset * 0.6, c - offset * 0.6],
          [c + offset * 0.6, c - offset * 0.6],
          [c - offset * 0.6, c + offset * 0.6],
          [c + offset * 0.6, c + offset * 0.6],
        ].map(([dx, dy], i) => (
          <circle key={`dot-${i}`} cx={dx} cy={dy} r={r * 0.03}
            fill="currentColor" opacity={0.35} />
        ))}
      </>
    );
  },

  // Halo — glowing ring above a head silhouette
  blessed: (c, r) => {
    const headY = c + r * 0.2;
    const headR = r * 0.28;
    const haloY = c - r * 0.35;
    const haloRx = r * 0.42;
    const haloRy = r * 0.15;
    return (
      <>
        {/* Halo glow — outer ring, faint */}
        <ellipse cx={c} cy={haloY} rx={haloRx + r * 0.08} ry={haloRy + r * 0.05}
          fill="none" stroke="currentColor" strokeWidth={r * 0.04}
          opacity={0.25} />
        {/* Halo — main ring */}
        <ellipse cx={c} cy={haloY} rx={haloRx} ry={haloRy}
          fill="none" stroke="currentColor" strokeWidth={r * 0.1}
          strokeLinecap="round" />
        {/* Head silhouette */}
        <circle cx={c} cy={headY} r={headR}
          fill="none" stroke="currentColor" strokeWidth={r * 0.09} />
        {/* Shoulders / neck hint */}
        <path
          d={`M${c - r * 0.5},${c + r * 0.85}
              Q${c - r * 0.45},${c + r * 0.5} ${c - r * 0.15},${headY + headR}
              `}
          fill="none" stroke="currentColor" strokeWidth={r * 0.08}
          strokeLinecap="round"
        />
        <path
          d={`M${c + r * 0.5},${c + r * 0.85}
              Q${c + r * 0.45},${c + r * 0.5} ${c + r * 0.15},${headY + headR}
              `}
          fill="none" stroke="currentColor" strokeWidth={r * 0.08}
          strokeLinecap="round"
        />
        {/* Light rays descending from halo */}
        {[-0.3, 0, 0.3].map((xOff, i) => (
          <line key={i}
            x1={c + r * xOff} y1={haloY + haloRy + r * 0.03}
            x2={c + r * xOff * 1.1} y2={haloY + haloRy + r * 0.18}
            stroke="currentColor" strokeWidth={r * 0.035}
            strokeLinecap="round" opacity={0.3}
          />
        ))}
        {/* Small dots flanking halo */}
        <circle cx={c - haloRx - r * 0.12} cy={haloY} r={r * 0.03}
          fill="currentColor" opacity={0.35} />
        <circle cx={c + haloRx + r * 0.12} cy={haloY} r={r * 0.03}
          fill="currentColor" opacity={0.35} />
      </>
    );
  },

  // Cupped hand receiving a gem — divine favor
  favored: (c, r) => {
    const handY = c + r * 0.15;
    const gemY = c - r * 0.35;
    return (
      <>
        {/* Hand — cupped palm shape */}
        <path
          d={`M${c - r * 0.6},${handY - r * 0.1}
              Q${c - r * 0.55},${handY + r * 0.35} ${c - r * 0.15},${handY + r * 0.5}
              Q${c},${handY + r * 0.55} ${c + r * 0.15},${handY + r * 0.5}
              Q${c + r * 0.55},${handY + r * 0.35} ${c + r * 0.6},${handY - r * 0.1}`}
          fill="none" stroke="currentColor" strokeWidth={r * 0.1}
          strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Finger lines */}
        <path
          d={`M${c - r * 0.6},${handY - r * 0.1}
              Q${c - r * 0.65},${handY - r * 0.35} ${c - r * 0.5},${handY - r * 0.45}`}
          fill="none" stroke="currentColor" strokeWidth={r * 0.07}
          strokeLinecap="round"
        />
        <path
          d={`M${c + r * 0.6},${handY - r * 0.1}
              Q${c + r * 0.65},${handY - r * 0.35} ${c + r * 0.5},${handY - r * 0.45}`}
          fill="none" stroke="currentColor" strokeWidth={r * 0.07}
          strokeLinecap="round"
        />
        {/* Inner palm line */}
        <path
          d={`M${c - r * 0.3},${handY + r * 0.2}
              Q${c},${handY + r * 0.3} ${c + r * 0.3},${handY + r * 0.2}`}
          fill="none" stroke="currentColor" strokeWidth={r * 0.04}
          strokeLinecap="round" opacity={0.4}
        />
        {/* Gem — diamond shape floating above the hand */}
        <path
          d={`M${c},${gemY - r * 0.22}
              L${c + r * 0.18},${gemY}
              L${c},${gemY + r * 0.25}
              L${c - r * 0.18},${gemY}
              Z`}
          fill="currentColor" fillOpacity={0.15}
          stroke="currentColor" strokeWidth={r * 0.08}
          strokeLinejoin="round"
        />
        {/* Gem facet line */}
        <line x1={c - r * 0.12} y1={gemY} x2={c + r * 0.12} y2={gemY}
          stroke="currentColor" strokeWidth={r * 0.04} opacity={0.5} />
        {/* Sparkle dots around gem */}
        <circle cx={c - r * 0.3} cy={gemY - r * 0.15} r={r * 0.03}
          fill="currentColor" opacity={0.4} />
        <circle cx={c + r * 0.3} cy={gemY - r * 0.1} r={r * 0.025}
          fill="currentColor" opacity={0.35} />
        <circle cx={c + r * 0.15} cy={gemY - r * 0.35} r={r * 0.025}
          fill="currentColor" opacity={0.3} />
      </>
    );
  },

  // Dual swift-motion arrows — speed, dexterity, two actions at once
  deft: (c, r) => {
    const arrowLen = r * 0.7;
    return (
      <>
        {/* Left arrow — sweeping upward-left */}
        <line
          x1={c - r * 0.05} y1={c + r * 0.25}
          x2={c - r * 0.55} y2={c - r * 0.45}
          stroke="currentColor" strokeWidth={r * 0.1}
          strokeLinecap="round"
        />
        <path
          d={`M${c - r * 0.35},${c - r * 0.55}
              L${c - r * 0.6},${c - r * 0.55}
              L${c - r * 0.6},${c - r * 0.3}`}
          fill="none" stroke="currentColor" strokeWidth={r * 0.1}
          strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Right arrow — sweeping upward-right */}
        <line
          x1={c + r * 0.05} y1={c + r * 0.25}
          x2={c + r * 0.55} y2={c - r * 0.45}
          stroke="currentColor" strokeWidth={r * 0.1}
          strokeLinecap="round"
        />
        <path
          d={`M${c + r * 0.35},${c - r * 0.55}
              L${c + r * 0.6},${c - r * 0.55}
              L${c + r * 0.6},${c - r * 0.3}`}
          fill="none" stroke="currentColor" strokeWidth={r * 0.1}
          strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Speed lines behind arrows */}
        <line x1={c - r * 0.15} y1={c + r * 0.5}
              x2={c - r * 0.45} y2={c + r * 0.0}
              stroke="currentColor" strokeWidth={r * 0.04}
              strokeLinecap="round" opacity={0.35} />
        <line x1={c + r * 0.15} y1={c + r * 0.5}
              x2={c + r * 0.45} y2={c + r * 0.0}
              stroke="currentColor" strokeWidth={r * 0.04}
              strokeLinecap="round" opacity={0.35} />
        <line x1={c - r * 0.3} y1={c + r * 0.55}
              x2={c - r * 0.55} y2={c + r * 0.15}
              stroke="currentColor" strokeWidth={r * 0.03}
              strokeLinecap="round" opacity={0.25} />
        <line x1={c + r * 0.3} y1={c + r * 0.55}
              x2={c + r * 0.55} y2={c + r * 0.15}
              stroke="currentColor" strokeWidth={r * 0.03}
              strokeLinecap="round" opacity={0.25} />
        {/* Center origin dot */}
        <circle cx={c} cy={c + r * 0.35} r={r * 0.06}
          fill="currentColor" opacity={0.5} />
        {/* Small accent dots at arrow tips */}
        <circle cx={c - r * 0.62} cy={c - r * 0.57} r={r * 0.035}
          fill="currentColor" opacity={0.4} />
        <circle cx={c + r * 0.62} cy={c - r * 0.57} r={r * 0.035}
          fill="currentColor" opacity={0.4} />
      </>
    );
  },
};

export default function ChampionIcon({ championId, size = 32, className = '', color }) {
  const Paths = CHAMPION_PATHS[championId];
  if (!Paths) return null;

  const center = size / 2;
  const radius = size * 0.45;
  const iconColor = color || godColors.gold.primary;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ color: iconColor }}
    >
      {Paths(center, radius)}
    </svg>
  );
}
