// Default arc competition: printed member quantity of that arc's own color.
// Gold, Silver and Yellow retain their separate resource/set contests.
export const memberScoring = (qid, color) => ({
  label: `Most ${color} members`,
  counts: `the ${color} members you hold (each card counts its printed member quantity)`,
  score: (ctx, p) => ctx.countMembersOfColor(p, qid),
});
