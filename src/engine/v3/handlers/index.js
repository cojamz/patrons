/**
 * Patrons v3 — Handler Registry
 *
 * Maps sourceId to resolver function.
 * Each resolver: (state, handler, eventData, options) => { state, log, pendingDecisions }
 */

import { goldHandlers } from './goldHandlers.js';
import { blackHandlers } from './blackHandlers.js';
import { greenHandlers } from './greenHandlers.js';
import { yellowHandlers } from './yellowHandlers.js';
import { championHandlers } from './championHandlers.js';

export const HANDLER_RESOLVERS = {
  ...goldHandlers,
  ...blackHandlers,
  ...greenHandlers,
  ...yellowHandlers,
  ...championHandlers,
};
