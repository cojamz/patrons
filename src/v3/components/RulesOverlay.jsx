/**
 * RulesOverlay — Thematic intro + rules slides shown before game setup.
 *
 * Opens with a cinematic hook, then 4 slides explaining core mechanics.
 * "Next" advances slides, final slide has "Play" to dismiss.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { base, godColors } from '../styles/theme';
import GodIcon from './icons/GodIcon';
import WorkerIcon from './icons/WorkerIcon';

const SLIDES = [
  {
    heading: null, // Intro slide — no heading, uses custom layout
    description: null,
    icon: 'intro',
  },
  {
    heading: 'Send Your Patrons',
    description: 'Send your patrons to action spaces at each god\'s temple. Gather blessings — resources in the god\'s color. But each space holds only one patron, so choose wisely before your rivals claim the best spots.',
    icon: 'patrons',
  },
  {
    heading: 'Please the Gods',
    description: 'Spend your blessings at god shops for powerful effects, and acquire power cards that grant lasting abilities. Build combinations that multiply your strength each round.',
    icon: 'gods',
  },
  {
    heading: 'Garner Favor',
    description: 'Each god rewards devotion differently — hoard gold for Aurum, collect variety for Solara, amass shadows for Noctis. At the end of each round, the gods grant Favor to those who meet their conditions.',
    icon: 'favor',
  },
  {
    heading: '3 Rounds. Most Favor Wins.',
    description: 'The game unfolds over 3 rounds of increasing power — 3 patrons in round 1, 4 in round 2, 5 in round 3. New action spaces and shops unlock each round. The player with the most Favor at the end becomes The Favored.',
    icon: 'rounds',
  },
];

function SlideIcon({ type }) {
  switch (type) {
    case 'intro':
      return null; // Intro slide handles its own visuals
    case 'patrons':
      return (
        <div className="flex items-center gap-1.5">
          <WorkerIcon playerId={0} size={36} />
          <WorkerIcon playerId={1} size={36} />
          <WorkerIcon playerId={2} size={36} />
          <WorkerIcon playerId={3} size={36} />
        </div>
      );
    case 'gods':
      return (
        <div className="flex items-center gap-3">
          <GodIcon god="gold" size={36} />
          <GodIcon god="black" size={36} />
          <GodIcon god="green" size={36} />
          <GodIcon god="yellow" size={36} />
        </div>
      );
    case 'favor':
      return (
        <div style={{
          fontSize: '40px',
          fontWeight: 800,
          color: godColors.gold.light,
          textShadow: `0 0 24px ${godColors.gold.glowStrong}`,
          lineHeight: 1,
        }}>
          +3
        </div>
      );
    case 'rounds':
      return (
        <div className="flex items-center gap-4">
          {[1, 2, 3].map(r => (
            <div
              key={r}
              className="flex flex-col items-center gap-1"
            >
              <span style={{
                fontSize: '22px',
                fontWeight: 800,
                color: r === 3 ? godColors.gold.light : base.textSecondary,
                textShadow: r === 3 ? `0 0 16px ${godColors.gold.glowStrong}` : 'none',
              }}>
                {['I', 'II', 'III'][r - 1]}
              </span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: [3, 5, 6][r - 1] }, (_, i) => (
                  <WorkerIcon key={i} playerId={0} size={10} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

function IntroSlide() {
  return (
    <div className="text-center py-4">
      <p
        className="text-lg leading-relaxed mb-6"
        style={{ color: base.textSecondary }}
      >
        Can you lead your people to become
      </p>
      <h2
        className="text-4xl font-bold mb-6"
        style={{
          color: godColors.gold.light,
          textShadow: `0 0 30px ${godColors.gold.glowStrong}`,
        }}
      >
        The Favored?
      </h2>
      <div
        className="w-16 h-px mx-auto mb-6"
        style={{ background: `linear-gradient(90deg, transparent, ${godColors.gold.primary}, transparent)` }}
      />
      <p
        className="text-sm leading-relaxed"
        style={{ color: base.textMuted }}
      >
        Send your patrons to the temples of rival gods.
        <br />
        Gather their blessings. Spend them wisely.
        <br />
        Earn divine Favor — and claim victory.
      </p>
    </div>
  );
}

export default function RulesOverlay({ onDismiss }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const slide = SLIDES[slideIndex];
  const isLast = slideIndex === SLIDES.length - 1;
  const isIntro = slideIndex === 0;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[100]"
      style={{ background: base.board }}
    >
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(212, 168, 67, 0.06) 0%, transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-md mx-4">
        {/* Title — always visible */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${godColors.gold.primary})` }} />
            <span
              className="text-xs uppercase tracking-[0.3em] font-medium"
              style={{ color: godColors.gold.primary }}
            >
              A Game of Divine Favor
            </span>
            <div className="h-px w-12" style={{ background: `linear-gradient(90deg, ${godColors.gold.primary}, transparent)` }} />
          </div>
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{
              color: base.textPrimary,
              textShadow: `0 0 40px ${godColors.gold.glow}`,
            }}
          >
            The Favored
          </h1>
        </motion.div>

        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slideIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl p-8 text-center"
            style={{
              background: 'rgba(28, 25, 23, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
            }}
          >
            {isIntro ? (
              <IntroSlide />
            ) : (
              <>
                {/* Icon area */}
                <div className="flex items-center justify-center mb-6" style={{ minHeight: '48px' }}>
                  <SlideIcon type={slide.icon} />
                </div>

                {/* Heading */}
                <h2
                  className="text-2xl font-bold mb-3"
                  style={{ color: godColors.gold.light }}
                >
                  {slide.heading}
                </h2>

                {/* Description */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: base.textSecondary }}
                >
                  {slide.description}
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dots + button */}
        <div className="flex flex-col items-center gap-5 mt-8">
          {/* Dot indicators */}
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === slideIndex ? '24px' : '8px',
                  height: '8px',
                  background: i === slideIndex ? godColors.gold.primary : 'rgba(255, 255, 255, 0.15)',
                }}
              />
            ))}
          </div>

          {/* Next / Play button */}
          <motion.button
            onClick={() => isLast ? onDismiss() : setSlideIndex(s => s + 1)}
            className="px-10 py-3 rounded-lg text-sm font-bold uppercase tracking-wider"
            style={{
              background: `linear-gradient(135deg, ${godColors.gold.primary}, ${godColors.gold.dark})`,
              color: base.textDark,
              boxShadow: `0 4px 20px ${godColors.gold.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
            }}
            whileHover={{ scale: 1.02, boxShadow: `0 6px 30px ${godColors.gold.glowStrong}` }}
            whileTap={{ scale: 0.97 }}
          >
            {isLast ? 'Begin' : isIntro ? 'How to Play' : 'Next'}
          </motion.button>

          {/* Skip link */}
          {!isLast && (
            <button
              onClick={onDismiss}
              className="text-xs font-medium transition-colors duration-150"
              style={{ color: base.textMuted }}
              onMouseEnter={(e) => e.target.style.color = base.textSecondary}
              onMouseLeave={(e) => e.target.style.color = base.textMuted}
            >
              Skip to setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
