// "How to play": renders the rulebook (design/rulebook.md, via src/v4/rulebook.js) in an overlay.
import { Fragment } from 'react';
import { useDialog } from './game/parts.jsx';
import { RULEBOOK } from './rulebook.js';
import { GAME_NAME, VERSION } from './version.js';

function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, k) =>
    part.startsWith('**') && part.endsWith('**') ? <b key={k}>{part.slice(2, -2)}</b> : <Fragment key={k}>{part}</Fragment>);
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
        <div className="rules-body">{renderRules(RULEBOOK)}</div>
        <p className="version" data-version>{GAME_NAME} {VERSION}</p>
      </div>
    </div>
  );
}
