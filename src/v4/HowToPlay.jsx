// "How to play": renders the rulebook (design/rulebook.md, via src/v4/rulebook.js) in an overlay.
import { Fragment } from 'react';
import { useDialog } from './game/parts.jsx';
import { RULEBOOK } from './rulebook.js';
import { GAME_NAME, VERSION } from './version.js';
import { GLOSSARY } from './glossary.js';
import { Follower } from './art/Follower.jsx';
import { ResourceGlyph } from './game/Glyphs.jsx';

// the rulebook names the two marks in words; here each is drawn right after its name, so the page shows what it asks
// you to learn (RC1 sweep 2: "describes the symbols with zero pictures of them")
const MARKS = [
  [/little-person mark/, () => <Follower size={14} title="followers" />],
  [/plain dot in its color/, () => <>{['gold', 'red', 'blue', 'green'].map(r => <ResourceGlyph key={r} r={r} size={14} />)}</>],
  [/split into the table's colors/, () => <ResourceGlyph r="any" size={14} />],
];
function marked(text, key) {
  for (const [re, draw] of MARKS) {
    const m = text.match(re);
    if (m) return <Fragment key={key}>{marked(text.slice(0, m.index), `${key}a`)}{m[0]}<span className="rules-mark"> {draw()}</span>{marked(text.slice(m.index + m[0].length), `${key}b`)}</Fragment>;
  }
  return <Fragment key={key}>{text}</Fragment>;
}
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, k) =>
    part.startsWith('**') && part.endsWith('**') ? <b key={k}>{part.slice(2, -2)}</b> : marked(part, k));
}

/** Tiny Markdown subset: #, ##, paragraphs, "- " lists (nested by indent) and "1. " lists. */
export function renderRules(md) {
  const out = [];
  const lines = md.split('\n');
  let i = 0;
  const list = (re, Tag, indent) => {
    const items = [];
    while (i < lines.length && lines[i].startsWith(' '.repeat(indent)) && re.test(lines[i].slice(indent))) {
      const body = lines[i].slice(indent).replace(re, '');
      i++;
      const kids = i < lines.length && lines[i].startsWith(' '.repeat(indent + 3)) && /^\s*- /.test(lines[i]) ? list(/^- /, 'ul', lines[i].match(/^\s*/)[0].length) : null;
      items.push(<li key={items.length}>{inline(body)}{kids}</li>);
    }
    return <Tag key={`l${i}`}>{items}</Tag>;
  };
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (l.startsWith('## ')) { out.push(<h3 key={i}>{inline(l.slice(3))}</h3>); i++; continue; }
    if (l.startsWith('# ')) { out.push(<h2 key={i}>{inline(l.slice(2))}</h2>); i++; continue; }
    if (/^- /.test(l)) { out.push(list(/^- /, 'ul', 0)); continue; }
    if (/^\d+\. /.test(l)) { out.push(list(/^\d+\. /, 'ol', 0)); continue; }
    out.push(<p key={i}>{inline(l)}</p>); i++;
  }
  return out;
}

export default function HowToPlay({ onClose }) {
  const box = useDialog(onClose);
  return (
    <div className="overlay top" role="dialog" aria-modal="true" aria-label="How to play" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog rules" ref={box}>
        <button type="button" className="btn ghost close" onClick={onClose} data-autofocus aria-label="Close how to play">Close</button>
        <div className="rules-body">{renderRules(RULEBOOK)}
          {/* every game word, from the one glossary the underlined keywords open */}
          <h3 id="glossary">Glossary</h3>
          <dl className="glossary" data-glossary>{GLOSSARY.map(t => <Fragment key={t.key}><dt>{t.word}</dt><dd>{t.def}</dd></Fragment>)}</dl>
        </div>
        <p className="version" data-version>{GAME_NAME} {VERSION}</p>
      </div>
    </div>
  );
}
