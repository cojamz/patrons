/**
 * JoinScreen — 4-character room code entry for joining a multiplayer game.
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { base, godColors } from '../../styles/theme';

export default function JoinScreen({ onJoin, onBack, error }) {
  const [code, setCode] = useState(['', '', '', '']);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  // Auto-focus first input
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleChange = (index, value) => {
    // Only accept alphanumeric
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
    const next = [...code];
    next[index] = char;
    setCode(next);

    // Auto-advance to next input
    if (char && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all 4 filled
    if (char && index === 3) {
      const fullCode = next.join('');
      if (fullCode.length === 4) {
        onJoin(fullCode);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === 'Enter') {
      const fullCode = code.join('');
      if (fullCode.length === 4) {
        onJoin(fullCode);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const next = [...code];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setCode(next);
    if (pasted.length === 4) {
      onJoin(pasted);
    } else if (pasted.length > 0) {
      inputRefs[Math.min(pasted.length, 3)].current?.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: base.board }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(212, 168, 67, 0.06) 0%, transparent 60%)',
        }}
      />

      <motion.div
        className="relative w-full max-w-sm mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${godColors.gold.primary})` }} />
            <span className="text-xs uppercase tracking-[0.3em] font-medium" style={{ color: godColors.gold.primary }}>
              Join Game
            </span>
            <div className="h-px w-12" style={{ background: `linear-gradient(90deg, ${godColors.gold.primary}, transparent)` }} />
          </div>
        </div>

        <div
          className="rounded-xl p-6 space-y-5"
          style={{
            background: 'rgba(28, 25, 23, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div>
            <label className="block text-xs uppercase tracking-wider font-medium mb-3 text-center" style={{ color: base.textMuted }}>
              Enter Room Code
            </label>
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {code.map((char, i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="text"
                  maxLength={1}
                  value={char}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-14 h-16 text-center text-2xl font-bold rounded-lg outline-none transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: `2px solid ${char ? godColors.gold.border : 'rgba(255, 255, 255, 0.08)'}`,
                    color: godColors.gold.light,
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = godColors.gold.primary;
                    e.target.style.boxShadow = `0 0 16px ${godColors.gold.glow}`;
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = char ? godColors.gold.border : 'rgba(255, 255, 255, 0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-center" style={{ color: '#ef4444' }}>
              {error}
            </p>
          )}

          <button
            onClick={onBack}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: base.textMuted,
            }}
          >
            Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
