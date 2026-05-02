/**
 * RichEffect — Render effect text with inline resource icons and Favor highlighting.
 *
 * "+3 green" → ["+3", <ResourceIcon green />]
 * "Gain 3 resources (any colors)" → ["Gain 3", <WildcardIcon />]
 * "Favor" → bold white Favor
 *
 * Shared across ActionSpace, GodArea shops, and power card descriptions.
 */
import React from 'react';
import ResourceIcon, { WildcardIcon } from '../icons/ResourceIcon';
import { tierStyles } from '../../styles/theme';

// CSS for Favor text pulse
const favorCSS = document.createElement('style');
favorCSS.textContent = `
@keyframes favorPulse {
  0%, 100% { text-shadow: 0 0 4px rgba(255, 255, 255, 0.15); }
  50% { text-shadow: 0 0 8px rgba(255, 255, 255, 0.4), 0 0 2px rgba(255, 255, 255, 0.2); }
}
.favor-text { animation: favorPulse 3s ease-in-out infinite; }
`;
if (!document.querySelector('[data-favor-css]')) {
  favorCSS.setAttribute('data-favor-css', '');
  document.head.appendChild(favorCSS);
}

// Combined pattern: resource amounts OR "Favor"/"Glory" OR standalone "resource(s)" OR tier numerals (Ⅰ/Ⅱ/Ⅲ)
const PATTERN = /([+-]?\d+)\s+(gold|black|green|yellow|any)\b|\bFavor\b|\bGlory\b|\bresources?\b|[ⅠⅡⅢ]/g;

const TIER_MAP = { 'Ⅰ': 1, 'Ⅱ': 2, 'Ⅲ': 3 };

export default function RichEffect({ text, size = 11 }) {
  if (!text) return null;

  const parts = [];
  let lastIndex = 0;
  let match;

  // Reset regex state
  PATTERN.lastIndex = 0;

  while ((match = PATTERN.exec(text)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      parts.push(<span key={`t${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    const fullMatch = match[0];

    if (TIER_MAP[fullMatch]) {
      // Tier numeral → inline badge matching ActionSpace tier pills
      const tierNum = TIER_MAP[fullMatch];
      const tier = tierStyles[tierNum];
      parts.push(
        <span
          key={`tier${match.index}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '3px',
            fontSize: `${Math.max(size - 2, 7)}px`,
            fontWeight: 700,
            letterSpacing: '0.05em',
            background: tier.border,
            color: tier.color,
            minWidth: `${size + 6}px`,
            height: `${size + 4}px`,
            lineHeight: 1,
            verticalAlign: 'middle',
            margin: '0 1px',
          }}
        >
          {tier.label}
        </span>
      );
    } else if (/^resources?$/i.test(fullMatch)) {
      // "resource" / "resources" → wildcard icon
      parts.push(
        <span key={`w${match.index}`} className="inline-flex items-center gap-0.5">
          <WildcardIcon size={size} />
        </span>
      );
    } else if (/^Favor$/i.test(fullMatch) || /^Glory$/i.test(fullMatch)) {
      // Favor/Glory → bold white with margin for breathing room
      parts.push(
        <span
          key={`f${match.index}`}
          className="favor-text"
          style={{ fontWeight: 700, color: '#FFFFFF', margin: '0 1.5px' }}
        >Favor</span>
      );
    } else {
      // Resource amount + icon
      const num = match[1];
      const color = match[2].toLowerCase();
      parts.push(
        <span key={`r${match.index}`} className="inline-flex items-center gap-0.5">
          <span>{num}</span>
          {color === 'any'
            ? <WildcardIcon size={size} />
            : <ResourceIcon type={color} size={size} />
          }
        </span>
      );
    }
    lastIndex = match.index + fullMatch.length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`end`}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? <span style={{ whiteSpace: 'pre-wrap' }}>{parts}</span> : <span>{text}</span>;
}
