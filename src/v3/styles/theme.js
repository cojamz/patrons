/**
 * The Favored v3 — Design Token System
 *
 * "Divine Antiquity" — dark fantasy meets luxury board game.
 * Warm obsidian surfaces, divine radiance, carved stone meeples.
 */

// --- God Color Palettes ---

export const godColors = {
  gold: {
    primary: '#D4A843',
    light: '#F0D78C',
    dark: '#8B6914',
    glow: 'rgba(212, 168, 67, 0.35)',
    glowStrong: 'rgba(212, 168, 67, 0.6)',
    gradient: 'radial-gradient(ellipse at center, rgba(212, 168, 67, 0.15) 0%, transparent 70%)',
    surface: 'rgba(212, 168, 67, 0.08)',
    border: 'rgba(212, 168, 67, 0.25)',
    text: '#F0D78C',
  },
  black: {
    primary: '#6B5B95',
    light: '#8E7CC3',
    dark: '#2D2040',
    glow: 'rgba(107, 91, 149, 0.35)',
    glowStrong: 'rgba(107, 91, 149, 0.6)',
    gradient: 'radial-gradient(ellipse at center, rgba(107, 91, 149, 0.15) 0%, transparent 70%)',
    surface: 'rgba(107, 91, 149, 0.08)',
    border: 'rgba(107, 91, 149, 0.25)',
    text: '#C4B5E0',
  },
  green: {
    primary: '#2D6B4F',
    light: '#4CAF7D',
    dark: '#1B4332',
    glow: 'rgba(45, 107, 79, 0.35)',
    glowStrong: 'rgba(45, 107, 79, 0.6)',
    gradient: 'radial-gradient(ellipse at center, rgba(45, 107, 79, 0.15) 0%, transparent 70%)',
    surface: 'rgba(45, 107, 79, 0.08)',
    border: 'rgba(45, 107, 79, 0.25)',
    text: '#7DD3A8',
  },
  yellow: {
    primary: '#C7962C',
    light: '#E8C547',
    dark: '#8B6C1A',
    glow: 'rgba(199, 150, 44, 0.35)',
    glowStrong: 'rgba(199, 150, 44, 0.6)',
    gradient: 'radial-gradient(ellipse at center, rgba(199, 150, 44, 0.15) 0%, transparent 70%)',
    surface: 'rgba(199, 150, 44, 0.08)',
    border: 'rgba(199, 150, 44, 0.25)',
    text: '#F0D78C',
  },
};

// --- Player Colors ---

export const playerColors = {
  0: { primary: '#DC2626', light: '#FCA5A5', dark: '#991B1B', name: 'Crimson' },
  1: { primary: '#2563EB', light: '#93C5FD', dark: '#1E40AF', name: 'Azure' },
  2: { primary: '#16A34A', light: '#86EFAC', dark: '#166534', name: 'Verdant' },
  3: { primary: '#9333EA', light: '#C4B5FD', dark: '#6B21A8', name: 'Amethyst' },
};

// --- Base Palette ---

export const base = {
  board: '#1C1917',
  boardLight: '#292524',
  boardLighter: '#3D3836',
  card: '#FAF5EF',
  cardDark: '#F0E8DC',
  cardBorder: '#D4C5B0',
  textPrimary: '#F5F0EB',
  textSecondary: '#A8A29E',
  textMuted: '#78716C',
  textDark: '#292524',
  positive: '#059669',
  positiveLight: '#34D399',
  negative: '#E11D48',
  negativeLight: '#FB7185',
  divider: 'rgba(255, 255, 255, 0.06)',
  overlay: 'rgba(12, 10, 9, 0.75)',
  glass: 'rgba(28, 25, 23, 0.85)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
};

// --- Resource Visuals ---
// Each resource has a unique shape + gradient for color-blind accessibility

export const resourceStyles = {
  gold: {
    shape: 'coin',      // Circle with inner ring
    fill: 'url(#goldGem)',
    color: '#D4A843',
    highlight: '#F0D78C',
    shadow: '#8B6914',
  },
  black: {
    shape: 'diamond',    // Rotated square
    fill: 'url(#blackGem)',
    color: '#6B5B95',
    highlight: '#8E7CC3',
    shadow: '#2D2040',
  },
  green: {
    shape: 'hexagon',    // Six-sided
    fill: 'url(#greenGem)',
    color: '#2D6B4F',
    highlight: '#4CAF7D',
    shadow: '#1B4332',
  },
  yellow: {
    shape: 'star',       // Six-pointed star
    fill: 'url(#yellowGem)',
    color: '#C7962C',
    highlight: '#E8C547',
    shadow: '#8B6C1A',
  },
};

// --- God Metadata ---

export const godMeta = {
  gold:   { name: 'Aurum',   title: 'God of Riches',    icon: 'coin' },
  black:  { name: 'Noctis',  title: 'God of Shadows',   icon: 'dagger' },
  green:  { name: 'Chronis', title: 'God of Time',      icon: 'hourglass' },
  yellow: { name: 'Solara',  title: 'God of Abundance',  icon: 'sun' },
};

// --- Tier Styling ---

export const tierStyles = {
  1: { label: 'I',   color: '#A8A29E', border: 'rgba(168, 162, 158, 0.2)' },
  2: { label: 'II',  color: '#E8C547', border: 'rgba(232, 197, 71, 0.3)' },
  3: { label: 'III', color: '#FB7185', border: 'rgba(251, 113, 133, 0.3)' },
};

// --- Shop Type Styling ---

export const shopStyles = {
  weak:   { label: 'Basic',    icon: 'circle', color: '#A8A29E' },
  strong: { label: 'Advanced', icon: 'diamond', color: '#E8C547' },
  vp:     { label: 'Favor',    icon: 'star', color: '#FB7185' },
};

// --- CSS Custom Properties for injection ---

export function getThemeCSSVars() {
  return {
    '--board-bg': base.board,
    '--board-light': base.boardLight,
    '--board-lighter': base.boardLighter,
    '--card-bg': base.card,
    '--card-dark': base.cardDark,
    '--text-primary': base.textPrimary,
    '--text-secondary': base.textSecondary,
    '--text-muted': base.textMuted,
    '--text-dark': base.textDark,
    '--positive': base.positive,
    '--negative': base.negative,
    '--overlay': base.overlay,
    '--glass': base.glass,
    '--glass-border': base.glassBorder,
    '--god-gold': godColors.gold.primary,
    '--god-black': godColors.black.primary,
    '--god-green': godColors.green.primary,
    '--god-yellow': godColors.yellow.primary,
    '--player-0': playerColors[0].primary,
    '--player-1': playerColors[1].primary,
    '--player-2': playerColors[2].primary,
    '--player-3': playerColors[3].primary,
  };
}
