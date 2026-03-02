/**
 * CardPixelIcon -- Bold SVG icons for power cards.
 *
 * Each card gets a distinctive icon in a 32x32 viewBox.
 * Designed for readability at 12px (collapsed pills), 18px (market), and 24px (tooltips).
 * Style: bold silhouettes, thick strokes (2-3), two-tone (c = primary, g = accent).
 */
import React from 'react';

// Icon render functions -- each returns SVG children for a 32x32 viewBox
const ICONS = {
  // === GOLD (wealth/trade) ===

  // Scepter with orb on top
  golden_scepter: (c, g) => (
    <>
      <rect x="14" y="10" width="4" height="17" rx="2" fill={c} opacity={0.9} />
      <circle cx="16" cy="7" r="5" fill={c} />
      <circle cx="16" cy="7" r="3" fill={g} opacity={0.35} />
      <rect x="11" y="25" width="10" height="3" rx="1.5" fill={c} opacity={0.85} />
    </>
  ),

  // Idol figure -- squat humanoid shape
  gold_idol: (c, g) => (
    <>
      <circle cx="16" cy="8" r="5" fill={c} />
      <circle cx="16" cy="8" r="2.5" fill={g} opacity={0.3} />
      <path d="M11 14 L21 14 L20 24 L12 24 Z" fill={c} opacity={0.9} />
      <rect x="9" y="24" width="14" height="3" rx="1.5" fill={c} opacity={0.8} />
    </>
  ),

  // Goblet / chalice
  golden_chalice: (c, g) => (
    <>
      <path d="M8 5 L24 5 L21 16 L11 16 Z" fill={c} opacity={0.9} />
      <ellipse cx="16" cy="5.5" rx="8" ry="2.5" fill={c} />
      <ellipse cx="16" cy="5.5" rx="5.5" ry="1.5" fill={g} opacity={0.3} />
      <rect x="14" y="16" width="4" height="5" rx="1.5" fill={c} opacity={0.85} />
      <rect x="11" y="21" width="10" height="3" rx="1.5" fill={c} opacity={0.8} />
    </>
  ),

  // Ring with gemstone
  golden_ring: (c, g) => (
    <>
      <circle cx="16" cy="17" r="9" fill="none" stroke={c} strokeWidth="4" />
      <circle cx="16" cy="17" r="9" fill="none" stroke={g} strokeWidth="1.5" opacity={0.25} />
      <path d="M11 10 L16 4 L21 10 Z" fill={c} />
      <path d="M13 10 L16 6 L19 10 Z" fill={g} opacity={0.35} />
    </>
  ),

  // Crown with three points
  gold_crown: (c, g) => (
    <>
      <path d="M5 22 L8 10 L13 16 L16 7 L19 16 L24 10 L27 22 Z" fill={c} />
      <rect x="5" y="22" width="22" height="4" rx="1.5" fill={c} opacity={0.9} />
      <circle cx="8" cy="10" r="2" fill={g} opacity={0.4} />
      <circle cx="16" cy="7" r="2" fill={g} opacity={0.4} />
      <circle cx="24" cy="10" r="2" fill={g} opacity={0.4} />
    </>
  ),

  // Vault / treasure chest
  gold_vault: (c, g) => (
    <>
      <rect x="4" y="10" width="24" height="16" rx="3" fill={c} opacity={0.9} />
      <rect x="4" y="8" width="24" height="6" rx="2" fill={c} />
      <rect x="6" y="9" width="20" height="1.5" rx="0.75" fill={g} opacity={0.2} />
      <circle cx="16" cy="19" r="3.5" fill="none" stroke={g} strokeWidth="2" opacity={0.4} />
      <rect x="15" y="17" width="2" height="5" rx="1" fill={g} opacity={0.35} />
    </>
  ),

  // === BLACK (theft/aggression) ===

  // Spyglass / telescope
  onyx_spyglass: (c, g) => (
    <>
      <circle cx="22" cy="10" r="7" fill={c} opacity={0.9} />
      <circle cx="22" cy="10" r="4.5" fill={g} opacity={0.25} />
      <circle cx="22" cy="10" r="2" fill={g} opacity={0.15} />
      <rect x="4" y="14" width="18" height="5" rx="2.5" fill={c} opacity={0.9} transform="rotate(-30 13 16.5)" />
    </>
  ),

  // Voodoo doll -- simple stick figure with X eyes
  voodoo_doll: (c, g) => (
    <>
      <circle cx="16" cy="7" r="5" fill={c} opacity={0.9} />
      <rect x="13" y="12" width="6" height="12" rx="2" fill={c} opacity={0.9} />
      <line x1="13" y1="15" x2="7" y2="10" stroke={c} strokeWidth="3" strokeLinecap="round" />
      <line x1="19" y1="15" x2="25" y2="10" stroke={c} strokeWidth="3" strokeLinecap="round" />
      <line x1="14" y1="24" x2="12" y2="29" stroke={c} strokeWidth="3" strokeLinecap="round" />
      <line x1="18" y1="24" x2="20" y2="29" stroke={c} strokeWidth="3" strokeLinecap="round" />
      <line x1="14" y1="6" x2="15" y2="8" stroke={g} strokeWidth="1.5" opacity={0.5} />
      <line x1="15" y1="6" x2="14" y2="8" stroke={g} strokeWidth="1.5" opacity={0.5} />
      <line x1="17" y1="6" x2="18" y2="8" stroke={g} strokeWidth="1.5" opacity={0.5} />
      <line x1="18" y1="6" x2="17" y2="8" stroke={g} strokeWidth="1.5" opacity={0.5} />
    </>
  ),

  // Glove / hand for stealing
  thieves_gloves: (c, g) => (
    <>
      <path d="M10 27 L10 14 Q10 12 12 12 L12 8 Q12 6 14 6 L14 8 L14 5 Q14 3 16 3 L16 8 L18 6 Q18 4 20 5 L20 12 L22 11 Q22 9 24 10 L24 14 Q24 27 17 27 Z" fill={c} opacity={0.9} />
      <rect x="10" y="20" width="14" height="2.5" rx="1" fill={g} opacity={0.2} />
    </>
  ),

  // Thick book / tome
  tome_of_deeds: (c, g) => (
    <>
      <rect x="7" y="4" width="18" height="24" rx="2.5" fill={c} opacity={0.9} />
      <rect x="7" y="4" width="5" height="24" rx="1.5" fill={c} />
      <rect x="14" y="9" width="8" height="2" rx="1" fill={g} opacity={0.3} />
      <rect x="14" y="14" width="8" height="2" rx="1" fill={g} opacity={0.25} />
      <rect x="14" y="19" width="6" height="2" rx="1" fill={g} opacity={0.2} />
    </>
  ),

  // Dark coin with skull-like mark
  obsidian_coin: (c, g) => (
    <>
      <circle cx="16" cy="16" r="11" fill={c} opacity={0.9} />
      <circle cx="16" cy="16" r="8" fill="none" stroke={g} strokeWidth="1.5" opacity={0.3} />
      <circle cx="13" cy="14" r="2" fill={g} opacity={0.3} />
      <circle cx="19" cy="14" r="2" fill={g} opacity={0.3} />
      <ellipse cx="16" cy="19" rx="3" ry="1.5" fill={g} opacity={0.25} />
    </>
  ),

  // Dagger / blade pointing up
  cursed_blade: (c, g) => (
    <>
      <path d="M16 2 L20 19 L16 21 L12 19 Z" fill={c} opacity={0.9} />
      <line x1="16" y1="5" x2="16" y2="17" stroke={g} strokeWidth="1.5" opacity={0.25} />
      <rect x="10" y="20" width="12" height="3.5" rx="1.5" fill={c} />
      <rect x="13.5" y="23" width="5" height="6" rx="1.5" fill={c} opacity={0.85} />
      <circle cx="16" cy="21.5" r="1.5" fill={g} opacity={0.3} />
    </>
  ),

  // === GREEN (time/repetition) ===

  // Hourglass -- bold symmetric shape
  hourglass: (c, g) => (
    <>
      <rect x="7" y="3" width="18" height="4" rx="1.5" fill={c} />
      <path d="M8 7 L16 16 L24 7 Z" fill={c} opacity={0.8} />
      <path d="M8 25 L16 16 L24 25 Z" fill={c} opacity={0.9} />
      <rect x="7" y="25" width="18" height="4" rx="1.5" fill={c} />
      <ellipse cx="16" cy="22" rx="4" ry="2" fill={g} opacity={0.25} />
      <circle cx="16" cy="16" r="1.5" fill={g} opacity={0.4} />
    </>
  ),

  // Lightning bolt -- bold zigzag
  capacitor: (c, g) => (
    <>
      <path d="M19 3 L11 17 L17 17 L13 29" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 3 L11 17 L17 17 L13 29" fill="none" stroke={g} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.35} />
    </>
  ),

  // Clock face -- circle with hands
  crystal_watch: (c, g) => (
    <>
      <circle cx="16" cy="16" r="11" fill={c} opacity={0.15} />
      <circle cx="16" cy="16" r="11" fill="none" stroke={c} strokeWidth="3" />
      <line x1="16" y1="16" x2="16" y2="8" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="16" x2="22" y2="19" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity={0.75} />
      <circle cx="16" cy="16" r="2" fill={g} opacity={0.4} />
    </>
  ),

  // Tiara / diadem with center gem
  diadem_of_expertise: (c, g) => (
    <>
      <path d="M4 22 Q8 12 14 15 Q16 9 18 15 Q24 12 28 22" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" />
      <rect x="5" y="22" width="22" height="3.5" rx="1.5" fill={c} opacity={0.7} />
      <circle cx="16" cy="11" r="3.5" fill={c} />
      <circle cx="16" cy="11" r="2" fill={g} opacity={0.4} />
    </>
  ),

  // Crystal ball on stand
  crystal_ball: (c, g) => (
    <>
      <circle cx="16" cy="13" r="10" fill={c} opacity={0.2} />
      <circle cx="16" cy="13" r="10" fill="none" stroke={c} strokeWidth="2.5" />
      <circle cx="13" cy="10" r="3" fill={g} opacity={0.25} />
      <path d="M10 23 Q16 27 22 23 L24 28 L8 28 Z" fill={c} opacity={0.8} />
    </>
  ),

  // Hexagonal emerald gem
  emerald_coin: (c, g) => (
    <>
      <polygon points="16,3 25,9.5 25,22.5 16,29 7,22.5 7,9.5" fill={c} opacity={0.9} />
      <polygon points="16,8 21,11.5 21,20.5 16,24 11,20.5 11,11.5" fill="none" stroke={g} strokeWidth="1.5" opacity={0.3} />
      <polygon points="16,12 19,14 19,18 16,20 13,18 13,14" fill={g} opacity={0.2} />
    </>
  ),

  // === YELLOW (resources/abundance) ===

  // Cornucopia -- horn spilling out
  horn_of_plenty: (c, g) => (
    <>
      <path d="M26 5 Q28 8 26 14 Q22 22 12 26 L6 28 Q4 28 5 26 L8 22 Q14 18 20 12 Q24 6 26 5 Z" fill={c} opacity={0.9} />
      <ellipse cx="7" cy="27" rx="3" ry="2.5" fill={c} opacity={0.8} />
      <circle cx="10" cy="24" r="2" fill={g} opacity={0.3} />
      <circle cx="13" cy="22" r="1.5" fill={g} opacity={0.25} />
      <circle cx="17" cy="18" r="1.5" fill={g} opacity={0.2} />
    </>
  ),

  // Faceted pentagon gem
  prismatic_gem: (c, g) => (
    <>
      <polygon points="16,2 27,12 23,29 9,29 5,12" fill={c} opacity={0.9} />
      <line x1="16" y1="2" x2="16" y2="29" stroke={g} strokeWidth="1" opacity={0.2} />
      <line x1="5" y1="12" x2="27" y2="12" stroke={g} strokeWidth="1" opacity={0.2} />
      <line x1="9" y1="29" x2="27" y2="12" stroke={g} strokeWidth="1" opacity={0.15} />
      <line x1="23" y1="29" x2="5" y2="12" stroke={g} strokeWidth="1" opacity={0.15} />
      <polygon points="16,7 22,12 20,24 12,24 10,12" fill={g} opacity={0.1} />
    </>
  ),

  // Shield / crest shape
  rainbow_crest: (c, g) => (
    <>
      <path d="M6 6 L26 6 L26 18 Q26 28 16 30 Q6 28 6 18 Z" fill={c} opacity={0.9} />
      <path d="M9 9 L23 9 L23 17 Q23 25 16 27 Q9 25 9 17 Z" fill="none" stroke={g} strokeWidth="1.5" opacity={0.3} />
      <path d="M12 16 Q16 10 20 16" fill="none" stroke={g} strokeWidth="2" opacity={0.25} />
      <path d="M13 19 Q16 14 19 19" fill="none" stroke={g} strokeWidth="1.5" opacity={0.2} />
    </>
  ),

  // Chest / trunk with clasp
  alchemists_trunk: (c, g) => (
    <>
      <rect x="5" y="12" width="22" height="15" rx="2.5" fill={c} opacity={0.9} />
      <path d="M5 12 Q5 8 9 8 L23 8 Q27 8 27 12" fill={c} />
      <rect x="12" y="6" width="8" height="4" rx="1.5" fill={c} opacity={0.7} />
      <rect x="7" y="14" width="18" height="2" rx="1" fill={g} opacity={0.2} />
      <rect x="14" y="18" width="4" height="5" rx="1.5" fill={g} opacity={0.25} />
      <circle cx="16" cy="21" r="1.5" fill={g} opacity={0.3} />
    </>
  ),

  // Cluster of orbs -- abundance
  abundance_charm: (c, g) => (
    <>
      <circle cx="16" cy="11" r="4.5" fill={c} opacity={0.9} />
      <circle cx="10" cy="18" r="4.5" fill={c} opacity={0.85} />
      <circle cx="22" cy="18" r="4.5" fill={c} opacity={0.85} />
      <circle cx="16" cy="24" r="4.5" fill={c} opacity={0.8} />
      <circle cx="16" cy="17" r="3" fill={g} opacity={0.2} />
      <rect x="14.5" y="3" width="3" height="4" rx="1.5" fill={c} opacity={0.7} />
      <circle cx="16" cy="3" r="2" fill={g} opacity={0.3} />
    </>
  ),

  // Journal / book with bookmark
  travelers_journal: (c, g) => (
    <>
      <rect x="7" y="4" width="18" height="24" rx="2.5" fill={c} opacity={0.9} />
      <rect x="7" y="4" width="5" height="24" rx="1.5" fill={c} />
      <rect x="14" y="9" width="8" height="2" rx="1" fill={g} opacity={0.3} />
      <rect x="14" y="14" width="8" height="2" rx="1" fill={g} opacity={0.25} />
      <rect x="14" y="19" width="6" height="2" rx="1" fill={g} opacity={0.2} />
      <path d="M22 4 L22 12 L24 10 L26 12 L26 4" fill={g} opacity={0.3} />
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
