/**
 * RulesOverlay — Cinematic tutorial intro shown before game setup.
 *
 * Flow: thematic hook → what you do → how turns work → how rounds work → begin.
 * Visually polished with animated transitions and god iconography.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { base, godColors } from '../styles/theme';
import GodIcon from './icons/GodIcon';
import ResourceIcon from './icons/ResourceIcon';
import WorkerIcon from './icons/WorkerIcon';

const SLIDES = [
  {
    type: 'intro',
  },
  {
    heading: 'Choose Your People',
    body: 'At the start of each game, you\'ll draft a Champion — a leader whose unique power shapes your strategy. Then you\'ll send your patrons into the temples of the gods to do your bidding.',
    icon: 'champions',
  },
  {
    heading: 'Honor the Gods',
    body: 'Place your patrons on action spaces to gather blessings — sacred resources in each god\'s color. But beware: each space holds only one patron. If a rival claims your spot, you\'ll need a new plan.',
    icon: 'actions',
  },
  {
    heading: 'Acquire Artifacts & Shops',
    body: 'Spend your blessings at god shops for powerful one-time effects, or acquire artifacts — permanent relics that grow stronger each round. Build an engine of divine power.',
    icon: 'artifacts',
  },
  {
    heading: 'Earn Divine Favor',
    body: 'Each god has a unique Favor condition. Hoard gold for Aurum. Collect variety for Solara. The gods judge you at the end of every round — meet their conditions to earn Favor.',
    icon: 'favor',
  },
  {
    heading: '3 Rounds. Most Favor Wins.',
    body: 'The game builds across 3 rounds — more patrons, more action spaces, more powerful shops each round. Turn order favors the underdog: lowest Favor goes first. After 3 rounds, the player with the most Favor becomes The Favored.',
    icon: 'rounds',
  },
];

function SlideIcon({ type }) {
  switch (type) {
    case 'champions':
      return (
        <div className="flex items-center gap-3">
          <WorkerIcon playerId={1} size={32} />
          <div style={{
            fontSize: '20px',
            fontWeight: 800,
            color: base.textSecondary,
            letterSpacing: '0.05em',
          }}>
            →
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.3), rgba(212, 168, 67, 0.1))',
            border: '2px solid rgba(212, 168, 67, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
          }}>
            ⚔
          </div>
        </div>
      );
    case 'actions':
      return (
        <div className="flex items-center gap-2">
          <WorkerIcon playerId={0} size={28} />
          <span style={{ color: base.textMuted, fontSize: '16px' }}>→</span>
          <div className="flex items-center gap-1">
            <ResourceIcon type="gold" size={20} />
            <ResourceIcon type="black" size={20} />
            <ResourceIcon type="green" size={20} />
            <ResourceIcon type="yellow" size={20} />
          </div>
        </div>
      );
    case 'artifacts':
      return (
        <div className="flex items-center gap-3">
          <GodIcon god="gold" size={30} />
          <GodIcon god="black" size={30} />
          <GodIcon god="green" size={30} />
          <GodIcon god="yellow" size={30} />
        </div>
      );
    case 'favor':
      return (
        <div style={{
          fontSize: '36px',
          fontWeight: 800,
          color: '#E0E0F0',
          textShadow: '0 0 24px rgba(220, 220, 240, 0.5)',
          lineHeight: 1,
        }}>
          +3
        </div>
      );
    case 'rounds':
      return (
        <div className="flex items-center gap-5">
          {[1, 2, 3].map(r => (
            <div
              key={r}
              className="flex flex-col items-center gap-1.5"
            >
              <span style={{
                fontSize: '20px',
                fontWeight: 800,
                color: r === 3 ? '#E0E0F0' : base.textSecondary,
                textShadow: r === 3 ? '0 0 16px rgba(220, 220, 240, 0.5)' : 'none',
              }}>
                {['I', 'II', 'III'][r - 1]}
              </span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: [3, 4, 5][r - 1] }, (_, i) => (
                  <WorkerIcon key={i} playerId={0} size={9} />
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
        The gods watch from above, granting their Favor
        <br />
        to those bold enough to seek it.
        <br />
        <br />
        <span style={{ color: base.textSecondary }}>
          Draft a champion. Send your patrons.
          <br />
          Gather blessings. Acquire artifacts.
          <br />
          Earn the most divine Favor — and win.
        </span>
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

                {/* Body */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: base.textSecondary }}
                >
                  {slide.body}
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
