import { iconFor, rectsFor } from '../../../src/v4/art/index.js';
const [id, kind, sphere] = process.argv.slice(2);
const { icon } = iconFor(id, kind);
const g = Array.from({ length: 24 }, () => Array(24).fill('.'));
for (const r of rectsFor(icon, sphere)) if (r.fill) for (let i = 0; i < r.w; i++) g[r.y][r.x + i] = r.fill;
console.log(JSON.stringify(g));
