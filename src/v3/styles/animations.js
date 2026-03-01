/**
 * The Favored v3 — Motion Animation Variants
 *
 * Spring-based physics for that premium "weight" feel.
 * Everything lands with impact, not ease-in-out blandness.
 */

// --- Spring Configs ---

export const springs = {
  snappy: { type: 'spring', stiffness: 500, damping: 30 },
  bouncy: { type: 'spring', stiffness: 300, damping: 20 },
  gentle: { type: 'spring', stiffness: 200, damping: 25 },
  slow:   { type: 'spring', stiffness: 100, damping: 20 },
};

// --- Worker Placement ---
// Worker "lands" on a space with a satisfying thud

export const workerPlace = {
  initial: { scale: 0, y: -40, opacity: 0 },
  animate: {
    scale: 1,
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 15 },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// --- Resource Gain/Loss ---
// Gems float up when gained, sink when lost

export const resourceGain = {
  initial: { scale: 0, y: 20, opacity: 0 },
  animate: {
    scale: [0, 1.3, 1],
    y: [20, -5, 0],
    opacity: 1,
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
  },
};

export const resourceLoss = {
  exit: {
    scale: 0,
    y: 10,
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

// --- Favor Change ---
// Number scales up brightly, then settles

export const favorChange = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.4, 1],
    transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
  },
};

// --- Modal ---
// Glassmorphism fade + scale from center

export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContent = {
  initial: { scale: 0.9, opacity: 0, y: 20 },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: {
    scale: 0.95,
    opacity: 0,
    y: 10,
    transition: { duration: 0.15 },
  },
};

// --- Card Reveal ---
// Cards flip/slide in from below with stagger

export const cardReveal = {
  initial: { y: 30, opacity: 0, rotateX: -15 },
  animate: (i) => ({
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      delay: i * 0.08,
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  }),
};

// --- Action Space ---
// Subtle pulse when available, depressed when occupied

export const actionSpaceHover = {
  scale: 1.03,
  transition: { type: 'spring', stiffness: 400, damping: 20 },
};

export const actionSpaceTap = {
  scale: 0.97,
};

// --- God Area ---
// Gentle breathing glow on the god quadrant

export const godAreaGlow = {
  animate: {
    opacity: [0.4, 0.7, 0.4],
    scale: [1, 1.02, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// --- Round Transition ---
// Full-screen cinematic transition between rounds

export const roundTransition = {
  initial: { opacity: 0, scale: 1.1 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.4 },
  },
};

// --- Stagger Children ---
// For lists of items (action log, card market, etc.)

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, x: -10 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};

// --- Tab/Panel Switch ---

export const panelSwitch = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

// --- Tooltip ---

export const tooltip = {
  initial: { opacity: 0, y: 5, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, y: 5, scale: 0.95, transition: { duration: 0.1 } },
};

// --- Number Counter (for favor/resources) ---

export const counterPop = {
  positive: {
    scale: [1, 1.5, 1],
    color: ['currentColor', '#34D399', 'currentColor'],
    transition: { duration: 0.4 },
  },
  negative: {
    scale: [1, 1.5, 1],
    color: ['currentColor', '#FB7185', 'currentColor'],
    transition: { duration: 0.4 },
  },
};

// --- Draft Selection ---

export const draftCard = {
  initial: { y: 60, opacity: 0, rotateY: -20 },
  animate: (i) => ({
    y: 0,
    opacity: 1,
    rotateY: 0,
    transition: {
      delay: i * 0.12,
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  }),
  selected: {
    scale: 1.05,
    boxShadow: '0 0 30px rgba(212, 168, 67, 0.5)',
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  rejected: {
    scale: 0.9,
    opacity: 0.4,
    transition: { duration: 0.3 },
  },
};
