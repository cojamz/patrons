export const meta = {
  name: 'quadrant-forge',
  description: 'Ideate cult-sphere quadrants, evaluate each with an agent team (lint/value, blind judges, mind-play, red team, synthesizer), revise or kill, then stress-test combos',
  phases: [
    { title: 'Ideate', detail: 'parallel inventors with distinct sphere briefs' },
    { title: 'Forge', detail: 'per quadrant: lint/value, 2 judges, mind-play, red team, synthesize; revise up to 2x or kill' },
    { title: 'Combos', detail: 'mind-play varied 4-quadrant tables from the passing pool' },
    { title: 'Meta', detail: 'combo synthesis + rubric critique' },
  ],
}

const CTX = `Project: /home/user/patrons (Patrons v4, digital worker-placement board game). Read these before working: .claude/rules/design-principles.md (Cory's calls — obey; note Theme: Cult Wars), design/eval/rubric.md (evaluator, latest version), design/eval/value-model.md (numbers), design/eval/spec-format.md (format). Do not modify any files. Vocabulary: followers = VP (everyone starts with 1); members = items you recruit (each worth 1 follower); spheres = quadrants (color-coded; any 4 of a larger pool may be on the wheel, so interplay must be generic).`

const IDEAS = { type: 'object', properties: { quadrants: { type: 'array', items: { type: 'object', properties: {
  id: { type: 'string', description: 'short kebab id, e.g. coffers' }, sphere: { type: 'string' }, pitch: { type: 'string' }, spec: { type: 'string', description: 'full spec in spec-format' } }, required: ['id','sphere','pitch','spec'] } } }, required: ['quadrants'] }

const BRIEFS = [
  'Re-theme the existing four quadrants in design/quadrants.md (Gold merchant, Shadow thief, Verdant gardener, Sunlight giver) as cult spheres. Keep what is strong, fix what the v2 notes below flag, and make members (items) lean into each sphere. Known v2 problems: 7-cost Favor items dominated by fixtures; Shadow weak; Echo chains unbounded; Eternity ~20u; Zenith spill ratio 1.5; defensive items dangle when no taker sphere is present; several R1/R2 spaces have no fallback. Return 4 quadrants.',
  'Invent 2 spheres around CHARISMA and DEVOTION: swaying followers/members (only from players ahead), sermons, conversion, loyalty that protects members. Distinct scoring shapes.',
  'Invent 2 spheres around RITUAL and SACRIFICE: releasing members for power, offerings, ceremonies that pay off at round end, thresholds. Distinct scoring shapes.',
  'Invent 2 spheres around PROPHECY and TIMING: visions of next round, foresight of turn order, delayed payoffs, acting earlier/later — without dead turns or breaking the snake draft.',
  'Invent 2 spheres around PILGRIMAGE/PRESENCE and RELICS: where your workers sit across the wheel (spread, rings, adjacency) and a market-focused sphere that plays with recruiting (reserve, refresh stalls, member synergies).',
]

phase('Ideate')
const ideaSets = (args && args.poolPath) ? [await agent(`Read the JSON file ${args.poolPath} (an array of objects with id, sphere, pitch, spec). Return it verbatim as {quadrants: [...]}, preserving order and every character of each spec. Do not edit anything.`, { label: 'load-pool', phase: 'Ideate', schema: IDEAS, effort: 'low' })] : (args && args.pool) ? [{ quadrants: args.pool }] : await parallel(BRIEFS.map((b, i) => () => agent(`${CTX}\n\nYou are an inventive tabletop designer (worker placement, engine building). Task: ${b}\nEach quadrant must follow spec-format exactly (3/2/1 actions ≤14 words, ONE scoring rule paid only at round end with ring values, 6 members costs 1–7, emits/consumes in generic vocabulary). Self-check lints L1–L10 and value bands before returning. Make each sphere feel unmistakably distinct and fun, with cult flavor in names.`, { label: `invent:${i}`, phase: 'Ideate', schema: IDEAS })))
const pool = ideaSets.filter(Boolean).flatMap(s => s.quadrants)
log(`${pool.length} candidate spheres: ${pool.map(q => q.id).join(', ')}`)

const LINT = { type: 'object', properties: { lint_fails: { type: 'array', items: { type: 'string' } }, lint_warns: { type: 'array', items: { type: 'string' } }, value_flags: { type: 'array', items: { type: 'string' } } }, required: ['lint_fails','lint_warns','value_flags'] }
const JUDGE = { type: 'object', properties: { Q1:{type:'integer'},Q2:{type:'integer'},Q3:{type:'integer'},Q4:{type:'integer'},Q5:{type:'integer'},Q6:{type:'integer'},Q7:{type:'integer'},Q8:{type:'integer'}, reasons: { type: 'array', items: { type: 'string' } }, fixes: { type: 'array', items: { type: 'string' } }, protect: { type: 'string' } }, required: ['Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','reasons','fixes','protect'] }
const PLAY = { type: 'object', properties: { final_ledger: { type: 'string' }, non_decisions: { type: 'array', items: { type: 'string' } }, dead_moves: { type: 'array', items: { type: 'string' } }, feel_bad: { type: 'array', items: { type: 'string' } }, best_combo: { type: 'string' }, burst_in_r3: { type: 'boolean' }, ambiguities: { type: 'array', items: { type: 'string' } }, verdict: { type: 'string' } }, required: ['final_ledger','non_decisions','dead_moves','feel_bad','best_combo','burst_in_r3','ambiguities','verdict'] }
const RED = { type: 'object', properties: { exploits: { type: 'array', items: { type: 'object', properties: { line: { type: 'string' }, size: { type: 'string' }, fix: { type: 'string' }, confidence: { type: 'string', enum: ['confirmed','plausible'] } }, required: ['line','size','fix','confidence'] } } }, required: ['exploits'] }
const SYNTH = { type: 'object', properties: { verdict: { type: 'string', enum: ['pass','revise','kill'] }, medians: { type: 'object', properties: { Q1:{type:'number'},Q2:{type:'number'},Q3:{type:'number'},Q4:{type:'number'},Q5:{type:'number'},Q6:{type:'number'},Q7:{type:'number'},Q8:{type:'number'} }, required: ['Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8'] }, mean: { type: 'number' }, summary: { type: 'string' }, revised_spec: { type: 'string' }, changelog: { type: 'array', items: { type: 'string' } }, rubric_notes: { type: 'array', items: { type: 'string' } } }, required: ['verdict','medians','mean','summary','revised_spec','changelog','rubric_notes'] }

const ids = pool.map(q => q.id)
function partners(i) { const n = pool.length; return [1, 3, 5].map(k => pool[(i + k) % n]).filter(p => p && p.id !== pool[i].id) }

async function evaluate(spec, q, i, pass) {
  const others = partners(i).map(p => `### ${p.sphere} (${p.id})\n${p.spec}`).join('\n\n')
  const tag = `${q.id}#${pass}`
  const [lint, j1, j2, play, red] = await parallel([
    () => agent(`${CTX}\n\nRun rubric Layers 1–2 (lints L1–L10 with actual word counts; value pass per value-model v2) on this sphere. Be mechanical and exact.\n\n${spec}`, { label: `lint:${tag}`, phase: 'Forge', schema: LINT, effort: 'low' }),
    () => agent(`${CTX}\n\nYou are a blind judge (lens: player experience & clarity). Score Q1–Q8 per rubric Layer 3 with one-line reasons, top 3 concrete fixes (≤14-word rewrites), one thing to protect.\n\n${spec}`, { label: `judgeA:${tag}`, phase: 'Forge', schema: JUDGE }),
    () => agent(`${CTX}\n\nYou are a blind judge (lens: systems, economy & balance; cite value-model numbers). Score Q1–Q8 per rubric Layer 3 with one-line reasons, top 3 concrete fixes (≤14-word rewrites), one thing to protect.\n\n${spec}`, { label: `judgeB:${tag}`, phase: 'Forge', schema: JUDGE }),
    () => agent(`${CTX}\n\nYou are a mind-playtester (rubric Layer 4). The wheel holds the sphere UNDER TEST plus three partner spheres (partners are context only). Set up a concrete 4-player state at the start of round II (seats, followers, resources, 1–2 members each, personas Builder/Opportunist/Spoiler/Newcomer). Play round II fully and round III's first 4 placements in snake order, updating an explicit ledger after EVERY move and noting the ripple of each move. Resolve round-end scoring explicitly. Focus your report on the sphere under test.\n\nUNDER TEST:\n${spec}\n\nPARTNERS:\n${others}`, { label: `play:${tag}`, phase: 'Forge', schema: PLAY }),
    () => agent(`${CTX}\n\nYou are the red team (rubric Layer 5). Break this sphere: dominant lines, loops, free lunches, kingmaking, griefing, feel-bad, analysis paralysis, rule ambiguity. Concrete lines, sizes, smallest fixes. Default to suspicion; mark confidence.\n\n${spec}`, { label: `red:${tag}`, phase: 'Forge', schema: RED }),
  ])
  const dossier = JSON.stringify({ lint, judges: [j1, j2].filter(Boolean), mindplay: play, redteam: red })
  return agent(`${CTX}\n\nYou are the synthesizer. Aggregate this evaluation dossier for sphere "${q.sphere}" (pass ${pass}). Medians per Q (2 judges: use the lower when they differ by ≥2 and say so; weigh mind-play and red-team evidence over opinion). Apply the pass bar and kill rule from the rubric (pass ${pass} of max 2 revisions). Verdict: pass (meets bar), revise (fixable), or kill (concept not working — don't get attached). If revise or pass, write revised_spec fixing lint fails first, then lowest medians and confirmed exploits, keeping the sphere's identity; keep spec-format. Note any rubric weaknesses observed.\n\nSPEC:\n${spec}\n\nDOSSIER:\n${dossier}`, { label: `synth:${tag}`, phase: 'Forge', schema: SYNTH })
}

phase('Forge')
const A = args || {}
const lo = A.from || 0, hi = A.to == null ? pool.length : A.to
const slice = pool.slice(lo, hi)
log(`forging slice ${lo}-${hi}: ${slice.map(q => q.id).join(', ')}`)
const forged = await pipeline(slice, async (q, _o, j) => { const i = lo + j
  let spec = q.spec, history = []
  for (let pass = 0; pass <= 2; pass++) {
    const s = await evaluate(spec, q, i, pass)
    if (!s) break
    history.push({ pass, verdict: s.verdict, mean: s.mean, medians: s.medians, summary: s.summary, changelog: s.changelog, rubric_notes: s.rubric_notes })
    if (s.verdict === 'pass') { return { id: q.id, sphere: q.sphere, status: 'pass', spec: s.revised_spec || spec, history } }
    if (s.verdict === 'kill' || pass === 2) { return { id: q.id, sphere: q.sphere, status: 'killed', spec, history } }
    spec = s.revised_spec
    log(`${q.id}: revise after pass ${pass} (mean ${s.mean})`)
  }
  return { id: q.id, sphere: q.sphere, status: 'killed', spec, history }
})
const done = forged.filter(Boolean)
const passed = done.filter(f => f.status === 'pass')
log(`passed ${passed.length}/${done.length}: ${passed.map(p => p.id).join(', ')}`)

if (A.stage === 'forge') return { passed, killed: done.filter(f => f.status !== 'pass') }

phase('Combos')
const COMBO = { type: 'object', properties: { table: { type: 'array', items: { type: 'string' } }, interplay: { type: 'integer' }, dependencies: { type: 'array', items: { type: 'string' } }, dominant: { type: 'string' }, flat_spheres: { type: 'array', items: { type: 'string' } }, feel_bad: { type: 'array', items: { type: 'string' } }, highlights: { type: 'array', items: { type: 'string' } }, fixes: { type: 'array', items: { type: 'string' } } }, required: ['table','interplay','dependencies','dominant','flat_spheres','feel_bad','highlights','fixes'] }
let combos = []
if (passed.length >= 4) {
  const n = passed.length
  const offsets = [[0,1,2,3],[0,2,4,6],[0,3,5,7],[0,1,4,7]]
  const tables = []
  const seen = new Set()
  for (let i = 0; i < n; i++) for (const off of offsets) {
    const t = [...new Set(off.map(o => passed[(i + o) % n].id))]
    if (t.length < 4) continue
    const key = [...t].sort().join('|')
    if (!seen.has(key)) { seen.add(key); tables.push(t) }
  }
  const pick = tables.slice(0, Math.min(8, tables.length))
  log(`combo tables: ${pick.length}${tables.length > pick.length ? ` (dropped ${tables.length - pick.length} extra combos)` : ''}`)
  combos = (await parallel(pick.map((t, k) => () => agent(`${CTX}\n\nYou are a mind-playtester for a whole TABLE (rubric Layers 4 + set scores S1–S6). These four spheres are on the wheel together:\n\n${t.map(id => { const p = passed.find(x => x.id === id); return `### ${p.sphere} (${id})\n${p.spec}` }).join('\n\n')}\n\nPlay a compressed full game at 4 players (setup picks, round I summary, round II and III move by move) with an explicit ledger and ripple notes. Then judge: interplay 1–5; any sphere that only works because a specific partner is present (dependency); any dominant sphere or line; any flat sphere; feel-bad moments; best highlights; concrete fixes.`, { label: `table:${k}`, phase: 'Combos', schema: COMBO })))).filter(Boolean)
}

phase('Meta')
const META = { type: 'object', properties: { per_sphere: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, partner_dependence: { type: 'string' }, fix: { type: 'string' } }, required: ['id','partner_dependence','fix'] } }, set_verdict: { type: 'string' }, rubric_changes: { type: 'array', items: { type: 'string' } }, next_ideas: { type: 'array', items: { type: 'string' } } }, required: ['per_sphere','set_verdict','rubric_changes','next_ideas'] }
const meta2 = await agent(`${CTX}\n\nYou are the meta-critic. Inputs: forge results and combo playtests below. (1) For each passing sphere, assess partner dependence across tables and give one fix. (2) Overall verdict on the pool toward the goal: 8 solid spheres that play well in any combination. (3) Concrete rubric/process improvements based on judge disagreements, synthesizer rubric_notes, and what the evaluator missed. (4) 3–5 fresh sphere ideas to fill gaps.\n\nFORGE:\n${JSON.stringify(done.map(d => ({ id: d.id, status: d.status, history: d.history })))}\n\nCOMBOS:\n${JSON.stringify(combos)}`, { label: 'meta', phase: 'Meta', schema: META })

return { passed, killed: done.filter(f => f.status !== 'pass'), combos, meta: meta2 }
