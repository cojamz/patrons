// The build stamp a hand-made save needs to resume in a built app. record.js's CONTENT_HASH is the rules' shape hash
// plus a hash of the rules source that the build defines (__V4_SRC__, vite.config.js); plain node has no define, so
// the source hash is taken here the same way (scripts/v4-src-hash.mjs). A save stamped with BUILD alone is set aside
// by the app as "saved on an older version" and never resumes.
import '../../../scripts/v4-node-stamp.mjs'; // first, so record.js itself stamps like the built app
import { BUILD, SHAPE_HASH, SRC_HASH } from '../../../src/v4/session/record.js';
import { engineSourceHash } from '../../../scripts/v4-src-hash.mjs';

export const buildStamp = () => ({ ...BUILD, content: SRC_HASH ? BUILD.content : `${SHAPE_HASH}.${engineSourceHash()}` });
