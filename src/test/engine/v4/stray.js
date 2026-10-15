// Members that moved sphere (Doppelganger went Red → Green, Cory 2026-10-15): the card scenes written for the old
// table still deal them, so a scene whose spheres don't include the card's own gets a copy of it made up on the spot.
export const STRAYS = new Set(['echo.doppel']);
export function stray(s, def) {
  const uid = Math.max(...Object.keys(s.cards).map(Number)) + 1;
  s.cards[uid] = { uid, def };
  return uid;
}
