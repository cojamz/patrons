// Merges balance-bench shards (design/eval/bench/README.md, "Running at scale").
//   node scripts/v4-bench-merge.mjs partial-A-*.json                 → stage B plan (and the commands to run it)
//   node scripts/v4-bench-merge.mjs partial-A-*.json partial-B-*.json → the report, history, trend
// Options: --plan=<file> (where to write the stage B plan). Partials must share rules content and settings.
import { parseFlags, mergeMain } from './v4-bench.mjs';

const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));
if (!files.length) { console.error('Usage: node scripts/v4-bench-merge.mjs <partial.json…> [--plan=file]'); process.exit(2); }
mergeMain(files, parseFlags(args)).catch(e => { console.error(e.message || e); process.exit(1); });
