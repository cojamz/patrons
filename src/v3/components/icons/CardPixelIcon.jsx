/**
 * CardPixelIcon — Detailed SVG icons for power cards.
 *
 * Each card gets a distinctive icon at 32x32 viewBox.
 * Rendered with smooth paths, god-colored fills, and subtle detail.
 * Looks good from 16px to 48px display size.
 */
import React from 'react';

// Icon render functions — each returns SVG children for a 32x32 viewBox
const ICONS = {
  // === GOLD ===
  golden_scepter: (c, g) => (
    <>
      <circle cx="16" cy="5" r="4" fill={c} opacity={0.9} />
      <circle cx="16" cy="5" r="2.5" fill={g} opacity={0.4} />
      <rect x="14.5" y="8" width="3" height="16" rx="1" fill={c} />
      <rect x="12" y="24" width="8" height="3" rx="1" fill={c} opacity={0.8} />
      <rect x="13" y="22" width="6" height="2" rx="0.5" fill={c} opacity={0.5} />
    </>
  ),
  gold_idol: (c, g) => (
    <>
      <circle cx="16" cy="7" r="4" fill={c} opacity={0.9} />
      <circle cx="16" cy="7" r="2" fill={g} opacity={0.3} />
      <path d="M12 13 L16 11 L20 13 L19 22 L13 22 Z" fill={c} opacity={0.85} />
      <rect x="10" y="22" width="12" height="3" rx="1" fill={c} opacity={0.7} />
      <rect x="11" y="25" width="10" height="2" rx="0.5" fill={c} opacity={0.5} />
    </>
  ),
  golden_chalice: (c, g) => (
    <>
      <path d="M9 5 L23 5 L21 14 L11 14 Z" fill={c} opacity={0.9} />
      <ellipse cx="16" cy="5" rx="7" ry="2" fill={c} />
      <ellipse cx="16" cy="5" rx="5" ry="1.2" fill={g} opacity={0.3} />
      <rect x="14.5" y="14" width="3" height="5" rx="1" fill={c} opacity={0.7} />
      <rect x="11" y="19" width="10" height="2.5" rx="1" fill={c} opacity={0.8} />
      <ellipse cx="16" cy="9" rx="4" ry="1" fill={g} opacity={0.15} />
    </>
  ),
  golden_ring: (c, g) => (
    <>
      <circle cx="16" cy="16" r="10" fill="none" stroke={c} strokeWidth="3.5" />
      <circle cx="16" cy="16" r="10" fill="none" stroke={g} strokeWidth="1" opacity={0.3} />
      <circle cx="16" cy="6.5" r="3.5" fill={c} />
      <circle cx="16" cy="6.5" r="2" fill={g} opacity={0.4} />
    </>
  ),
  gold_crown: (c, g) => (
    <>
      <path d="M6 20 L8 10 L13 15 L16 7 L19 15 L24 10 L26 20 Z" fill={c} />
      <rect x="6" y="20" width="20" height="4" rx="1" fill={c} opacity={0.85} />
      <circle cx="8" cy="10" r="1.5" fill={g} opacity={0.5} />
      <circle cx="16" cy="7" r="1.5" fill={g} opacity={0.5} />
      <circle cx="24" cy="10" r="1.5" fill={g} opacity={0.5} />
      <rect x="8" y="21" width="16" height="1" rx="0.5" fill={g} opacity={0.2} />
    </>
  ),
  gold_vault: (c, g) => (
    <>
      <rect x="5" y="8" width="22" height="16" rx="2" fill={c} opacity={0.85} />
      <rect x="5" y="6" width="22" height="4" rx="1.5" fill={c} />
      <rect x="7" y="7" width="18" height="1" rx="0.5" fill={g} opacity={0.2} />
      <circle cx="16" cy="17" r="3" fill="none" stroke={g} strokeWidth="1.5" opacity={0.5} />
      <rect x="15" y="15.5" width="2" height="4" rx="0.5" fill={g} opacity={0.4} />
    </>
  ),

  // === BLACK ===
  onyx_spyglass: (c, g) => (
    <>
      <ellipse cx="22" cy="10" rx="5" ry="5.5" fill={c} opacity={0.85} />
      <ellipse cx="22" cy="10" rx="3" ry="3.5" fill={g} opacity={0.2} />
      <rect x="6" y="13" width="16" height="4" rx="2" fill={c} opacity={0.9} transform="rotate(-25 14 15)" />
      <circle cx="22" cy="10" r="2" fill="none" stroke={g} strokeWidth="0.8" opacity={0.3} />
    </>
  ),
  voodoo_doll: (c, g) => (
    <>
      <circle cx="16" cy="7" r="4" fill={c} opacity={0.9} />
      <path d="M12 12 L20 12 L19 24 L13 24 Z" fill={c} opacity={0.8} />
      <line x1="10" y1="14" x2="7" y2="11" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="14" x2="25" y2="11" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="24" x2="13" y2="29" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="24" x2="19" y2="29" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="7" r="1" fill={g} opacity={0.5} />
      <circle cx="18" cy="7" r="1" fill={g} opacity={0.5} />
      <line x1="14" y1="16" x2="18" y2="20" stroke={g} strokeWidth="1.5" opacity={0.3} />
    </>
  ),
  thieves_gloves: (c, g) => (
    <>
      <path d="M10 26 L10 14 L12 14 L12 9 L14 9 L14 7 L16 7 L16 9 L18 9 L18 11 L20 11 L20 14 L22 14 L22 26 Z" fill={c} opacity={0.85} />
      <path d="M12 14 L12 10" stroke={g} strokeWidth="0.8" opacity={0.3} />
      <path d="M16 14 L16 8" stroke={g} strokeWidth="0.8" opacity={0.3} />
      <path d="M20 14 L20 12" stroke={g} strokeWidth="0.8" opacity={0.3} />
      <rect x="9" y="20" width="14" height="2" rx="0.5" fill={g} opacity={0.15} />
    </>
  ),
  tome_of_deeds: (c, g) => (
    <>
      <rect x="7" y="4" width="18" height="24" rx="2" fill={c} opacity={0.85} />
      <rect x="7" y="4" width="4" height="24" rx="1" fill={c} />
      <rect x="13" y="8" width="9" height="1.5" rx="0.5" fill={g} opacity={0.3} />
      <rect x="13" y="12" width="9" height="1.5" rx="0.5" fill={g} opacity={0.25} />
      <rect x="13" y="16" width="7" height="1.5" rx="0.5" fill={g} opacity={0.2} />
      <rect x="13" y="20" width="8" height="1.5" rx="0.5" fill={g} opacity={0.15} />
      <circle cx="9" cy="8" r="1" fill={g} opacity={0.3} />
    </>
  ),
  obsidian_coin: (c, g) => (
    <>
      <circle cx="16" cy="16" r="10" fill={c} opacity={0.9} />
      <circle cx="16" cy="16" r="7.5" fill="none" stroke={g} strokeWidth="1" opacity={0.3} />
      <circle cx="16" cy="16" r="3" fill={g} opacity={0.3} />
      <path d="M16 7 L16 9 M16 23 L16 25 M7 16 L9 16 M23 16 L25 16" stroke={g} strokeWidth="1.2" opacity={0.25} />
    </>
  ),
  cursed_blade: (c, g) => (
    <>
      <path d="M16 3 L18.5 18 L16 20 L13.5 18 Z" fill={c} opacity={0.9} />
      <line x1="16" y1="5" x2="16" y2="16" stroke={g} strokeWidth="0.8" opacity={0.25} />
      <rect x="11" y="19" width="10" height="3" rx="1" fill={c} opacity={0.8} />
      <rect x="14" y="22" width="4" height="5" rx="1" fill={c} opacity={0.7} />
      <circle cx="16" cy="20.5" r="1" fill={g} opacity={0.3} />
    </>
  ),

  // === GREEN ===
  hourglass: (c, g) => (
    <>
      <rect x="8" y="4" width="16" height="3" rx="1" fill={c} />
      <path d="M9 7 L16 16 L23 7 Z" fill={c} opacity={0.75} />
      <path d="M9 25 L16 16 L23 25 Z" fill={c} opacity={0.85} />
      <rect x="8" y="25" width="16" height="3" rx="1" fill={c} />
      <ellipse cx="16" cy="22" rx="4" ry="1.5" fill={g} opacity={0.2} />
      <line x1="16" y1="14" x2="16" y2="18" stroke={g} strokeWidth="1" opacity={0.4} />
    </>
  ),
  capacitor: (c, g) => (
    <>
      <path d="M18 4 L12 16 L17 16 L11 28" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 4 L12 16 L17 16 L11 28" fill="none" stroke={g} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity={0.4} />
      <circle cx="18" cy="4" r="2" fill={c} opacity={0.6} />
      <circle cx="11" cy="28" r="2" fill={c} opacity={0.6} />
    </>
  ),
  crystal_watch: (c, g) => (
    <>
      <circle cx="16" cy="16" r="10" fill={c} opacity={0.15} />
      <circle cx="16" cy="16" r="10" fill="none" stroke={c} strokeWidth="2.5" />
      <circle cx="16" cy="16" r="8" fill="none" stroke={g} strokeWidth="0.5" opacity={0.3} />
      <line x1="16" y1="16" x2="16" y2="9" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="16" x2="21" y2="19" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity={0.7} />
      <circle cx="16" cy="16" r="1.5" fill={g} opacity={0.4} />
    </>
  ),
  diadem_of_expertise: (c, g) => (
    <>
      <path d="M5 20 Q8 12 13 14 Q16 8 19 14 Q24 12 27 20" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="10" r="3" fill={c} />
      <circle cx="16" cy="10" r="1.5" fill={g} opacity={0.4} />
      <circle cx="8" cy="16" r="2" fill={c} opacity={0.7} />
      <circle cx="24" cy="16" r="2" fill={c} opacity={0.7} />
      <rect x="6" y="20" width="20" height="3" rx="1" fill={c} opacity={0.6} />
    </>
  ),
  crystal_ball: (c, g) => (
    <>
      <circle cx="16" cy="14" r="9" fill={c} opacity={0.2} />
      <circle cx="16" cy="14" r="9" fill="none" stroke={c} strokeWidth="2" />
      <circle cx="13" cy="11" r="2.5" fill={g} opacity={0.2} />
      <path d="M10 23 Q16 26 22 23 L23 27 L9 27 Z" fill={c} opacity={0.7} />
      <rect x="9" y="27" width="14" height="2" rx="0.5" fill={c} opacity={0.5} />
    </>
  ),
  emerald_coin: (c, g) => (
    <>
      <polygon points="16,4 24,10 24,22 16,28 8,22 8,10" fill={c} opacity={0.85} />
      <polygon points="16,7 22,11.5 22,20.5 16,25 10,20.5 10,11.5" fill="none" stroke={g} strokeWidth="1" opacity={0.3} />
      <polygon points="16,11 19,13 19,19 16,21 13,19 13,13" fill={g} opacity={0.2} />
    </>
  ),

  // === YELLOW ===
  horn_of_plenty: (c, g) => (
    <>
      <path d="M24 6 Q26 8 24 12 Q22 18 14 22 L8 26 Q6 27 7 25 L10 20 Q16 16 20 10 Q22 6 24 6 Z" fill={c} opacity={0.85} />
      <circle cx="7" cy="24" r="2" fill={c} opacity={0.7} />
      <circle cx="10" cy="22" r="1.5" fill={g} opacity={0.3} />
      <circle cx="13" cy="20" r="1.5" fill={g} opacity={0.25} />
      <circle cx="16" cy="17" r="1.2" fill={g} opacity={0.2} />
      <path d="M22 8 Q24 10 22 14" fill="none" stroke={g} strokeWidth="0.8" opacity={0.3} />
    </>
  ),
  prismatic_gem: (c, g) => (
    <>
      <polygon points="16,3 26,12 22,28 10,28 6,12" fill={c} opacity={0.85} />
      <polygon points="16,6 23,12 20,26 12,26 9,12" fill="none" stroke={g} strokeWidth="0.8" opacity={0.3} />
      <line x1="16" y1="3" x2="16" y2="28" stroke={g} strokeWidth="0.6" opacity={0.2} />
      <line x1="6" y1="12" x2="26" y2="12" stroke={g} strokeWidth="0.6" opacity={0.2} />
      <line x1="10" y1="28" x2="26" y2="12" stroke={g} strokeWidth="0.5" opacity={0.15} />
      <line x1="22" y1="28" x2="6" y2="12" stroke={g} strokeWidth="0.5" opacity={0.15} />
    </>
  ),
  rainbow_crest: (c, g) => (
    <>
      <path d="M8 24 L16 6 L24 24 Z" fill={c} opacity={0.8} />
      <path d="M10 22 L16 9 L22 22 Z" fill="none" stroke={g} strokeWidth="0.8" opacity={0.3} />
      <path d="M12 18 Q16 12 20 18" fill="none" stroke={g} strokeWidth="1.5" opacity={0.25} />
      <path d="M13 20 Q16 15 19 20" fill="none" stroke={g} strokeWidth="1" opacity={0.2} />
      <rect x="7" y="24" width="18" height="3" rx="1" fill={c} opacity={0.7} />
    </>
  ),
  alchemists_trunk: (c, g) => (
    <>
      <rect x="6" y="12" width="20" height="14" rx="2" fill={c} opacity={0.85} />
      <path d="M6 12 Q6 9 10 9 L22 9 Q26 9 26 12" fill={c} opacity={0.9} />
      <rect x="13" y="7" width="6" height="4" rx="1" fill={c} opacity={0.6} />
      <rect x="8" y="14" width="16" height="1.5" rx="0.5" fill={g} opacity={0.2} />
      <rect x="14" y="18" width="4" height="4" rx="1" fill={g} opacity={0.2} />
      <circle cx="16" cy="20" r="1" fill={g} opacity={0.3} />
    </>
  ),
  abundance_charm: (c, g) => (
    <>
      <circle cx="16" cy="12" r="3" fill={c} opacity={0.8} />
      <circle cx="12" cy="17" r="3" fill={c} opacity={0.8} />
      <circle cx="20" cy="17" r="3" fill={c} opacity={0.8} />
      <circle cx="16" cy="22" r="3" fill={c} opacity={0.8} />
      <circle cx="16" cy="17" r="5" fill={g} opacity={0.15} />
      <rect x="14.5" y="3" width="3" height="5" rx="1" fill={c} opacity={0.6} />
      <circle cx="16" cy="3" r="1.5" fill={g} opacity={0.3} />
    </>
  ),
  travelers_journal: (c, g) => (
    <>
      <rect x="8" y="4" width="17" height="24" rx="2" fill={c} opacity={0.85} />
      <rect x="7" y="5" width="4" height="22" rx="1" fill={c} />
      <rect x="13" y="8" width="9" height="1.5" rx="0.5" fill={g} opacity={0.3} />
      <rect x="13" y="12" width="9" height="1.5" rx="0.5" fill={g} opacity={0.25} />
      <rect x="13" y="16" width="7" height="1.5" rx="0.5" fill={g} opacity={0.2} />
      <rect x="13" y="20" width="8" height="1.5" rx="0.5" fill={g} opacity={0.15} />
      <path d="M7 6 Q9 5 10 6" stroke={g} strokeWidth="1" opacity={0.3} />
      <path d="M7 12 Q9 11 10 12" stroke={g} strokeWidth="1" opacity={0.25} />
      <path d="M7 18 Q9 17 10 18" stroke={g} strokeWidth="1" opacity={0.2} />
      <path d="M7 24 Q9 23 10 24" stroke={g} strokeWidth="1" opacity={0.15} />
    </>
  ),
};

export default function CardPixelIcon({ cardId, size = 24, color = '#A8A29E', glowColor }) {
  const renderIcon = ICONS[cardId];
  const g = glowColor || color;

  if (!renderIcon) {
    // Fallback: generic card icon
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect x="8" y="4" width="16" height="24" rx="2" fill={color} opacity={0.4} />
        <rect x="11" y="9" width="10" height="1.5" rx="0.5" fill={color} opacity={0.3} />
        <rect x="11" y="14" width="10" height="1.5" rx="0.5" fill={color} opacity={0.25} />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {renderIcon(color, g)}
    </svg>
  );
}
