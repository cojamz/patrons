// Player release identity. Bump with npm run version:v4; see design/releasing.md.
// Save/room compatibility is the rules-content hash, never this display version.
export const GAME_NAME = 'Cults';
export const VERSION = 'v0.9.877';
export const BUILD_REF = typeof __V4_BUILD__ !== 'undefined' ? String(__V4_BUILD__).split('@')[0] : 'dev';
export const VERSION_LABEL = `${VERSION} · ${BUILD_REF}`;
