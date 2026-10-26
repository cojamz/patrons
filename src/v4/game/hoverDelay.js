// Cory 2026-10-25: hovers open the moment you point; the wait moved to closing (MO.hoverClose). Was 200 (Cory 2026-10-15).
export const HOVER_DELAY_MS = 0;
/** From the pointer's arrival to the card shown: the delay, or one frame to draw and place it hidden when there is none. */
export const HOVER_OPEN_MS = Math.max(16, HOVER_DELAY_MS);
