// Soft hyphens for long single words on narrow faces (a shop card's name box is ~80px: "DOPPELGANGER" in tracked caps
// is 99px). A word of 10+ letters gets one break point at its most natural seam near the middle: between two consonants
// (Doppel-ganger, Bench-warmer, Impres-sionist, Toast-master), else before a consonant between vowels (Prose-lytizer).
// The hyphen only shows if the line actually breaks; words with their own hyphen already break there.
const V = /[aeiouy]/i;
function seam(w) {
  const lo = 4, hi = w.length - 4, mid = w.length / 2;
  let best = -1;
  const take = i => { if (best < 0 || Math.abs(i - mid) < Math.abs(best - mid)) best = i; };
  for (let i = lo; i <= hi; i++) if (!V.test(w[i - 1]) && !V.test(w[i])) take(i);
  if (best < 0) for (let i = lo; i <= hi; i++) if (V.test(w[i - 1]) && !V.test(w[i]) && V.test(w[i + 1] || '')) take(i);
  return best;
}
export function breakable(name) {
  return String(name).split(' ').map(w => {
    if (w.length < 10 || w.includes('-') || !/^[A-Za-z]+$/.test(w)) return w;
    const i = seam(w);
    return i > 0 ? `${w.slice(0, i)}­${w.slice(i)}` : w;
  }).join(' ');
}
