// Player release identity. Bump with npm run version:v4; see design/releasing.md.
// Save/room compatibility is the rules-content hash, never this display version.
export const GAME_NAME = 'Cults';
export const VERSION = 'v0.8.66';
export const BUILD_REF = typeof __V4_BUILD__ !== 'undefined' ? String(__V4_BUILD__).split('@')[0] : 'dev';
export const VERSION_LABEL = `Try build (artifacts, round decks) · ${BUILD_REF}`;
