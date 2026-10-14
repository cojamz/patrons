// Plain node has no Vite define, so record.js would stamp games, saves and records with the shape hash alone, while the
// built app stamps "<shape>.<rules-source hash>" (vite.config.js defines __V4_SRC__). Import this module FIRST, before
// anything that loads src/v4/session/record.js, and node stamps exactly like the app built from the same tree.
import { engineSourceHash } from './v4-src-hash.mjs';

if (typeof globalThis.__V4_SRC__ === 'undefined') globalThis.__V4_SRC__ = engineSourceHash();
