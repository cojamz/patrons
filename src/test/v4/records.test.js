// @vitest-environment node
// Every game record under src/test/v4/records/ replays cleanly (see replay.js for the format).
import { describe } from 'vitest';
import { recordTests } from './replay.js';

describe('game records replay cleanly', () => { recordTests(); });
