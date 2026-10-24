import '@testing-library/jest-dom'

// The cull (engine content/cull.js) takes cards out of the deck that real games deal. The card and scenario tests
// pin seeded decks and deal cut cards by id, so they run on the full deck; src/test/engine/v4/cull.test.js plays
// the culled deck the game ships with.
import { FULL_DECK } from '../engine/v4/content/cull.js';
FULL_DECK.tests = true;
