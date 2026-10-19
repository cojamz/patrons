// Timing words for member abilities across cards and seat lists. Engine text stays intact for rule parsing.
export function memberTimingWords(text) {
  return String(text || '')
    .replace(/^Now and at round start\b/i, 'On recruit and at round start')
    .replace(/^Now and at the start of round\b/i, 'On recruit and at the start of round')
    .replace(/^Now\b/i, 'On recruit')
    .replace(/^When recruited\b|^When it joins you\b/i, 'On recruit')
    .replace(/^Recruit\b/i, 'On recruit')
    .replace(/^Round start\b/i, 'At round start');
}
