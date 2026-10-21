// Timing words for member abilities across cards and seat lists. Engine text stays intact for rule parsing.
// The opener may follow a "Worth 2 followers." lead (Late Bloomers: "Worth 2 followers. Now and at round start: …").
export function memberTimingWords(text) {
  const t = String(text || '');
  const lead = (t.match(/^Worth \d+ followers?\.\s*/i) || [''])[0];
  return lead + t.slice(lead.length)
    .replace(/^Now and at round start\b/i, 'On recruit and at round start')
    .replace(/^Now and at the start of round\b/i, 'On recruit and at the start of round')
    .replace(/^Now\b/i, 'On recruit')
    .replace(/^When recruited\b|^When it joins you\b/i, 'On recruit')
    .replace(/^Recruit\b/i, 'On recruit')
    .replace(/^Round start\b/i, 'At round start');
}
