/**
 * RulesReference — Complete tabbed game reference.
 *
 * Like a real board game rulebook — organized by concept, with inline
 * resource icons, god colors, and artifact images. Accessible from
 * setup screen, ? button, and tutorial final slide.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { base, godColors, godMeta, favorConditionStyle } from '../styles/theme';
import GodIcon from './icons/GodIcon';
import ResourceIcon, { WildcardIcon } from './icons/ResourceIcon';
import ArtifactImage from './icons/ArtifactImage';
import RichEffect from './shared/RichEffect';
import gods from '../../engine/v3/data/gods';
import { powerCards } from '../../engine/v3/data/powerCards';
import championsData from '../../engine/v3/data/champions';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'gods', label: 'Patrons' },
  { id: 'champions', label: 'Champions' },
  { id: 'artifacts', label: 'Artifacts' },
  { id: 'shops', label: 'Shops' },
  { id: 'rules', label: 'Key Rules' },
];

const GOD_IDS = ['gold', 'black', 'green', 'yellow'];

// ── Tab Content Components ──────────────────────────────────────────

function OverviewTab() {
  return (
    <div className="space-y-5">
      <Section title="Goal">
        <P>Earn the most <B>Favor</B> across 3 rounds to become <B style={{ color: godColors.gold.light }}>The Favored</B>.</P>
      </Section>

      <Section title="Turn Structure">
        <P>On your turn:</P>
        <ol className="list-decimal list-inside space-y-1.5 mt-2" style={{ color: base.textSecondary, fontSize: '12px', lineHeight: 1.6 }}>
          <li><B>Place</B> a worker on an open action space — gain its effect</li>
          <li><B>Buy</B> (optional) — purchase one shop benefit <em>or</em> one artifact from the same patron</li>
        </ol>
      </Section>

      <Section title="Rounds">
        <div className="flex items-center gap-6 mt-2">
          {[1, 2, 3].map(r => (
            <div key={r} className="flex flex-col items-center gap-1">
              <span style={{ fontSize: '14px', fontWeight: 700, color: base.textPrimary }}>
                Round {r}
              </span>
              <span style={{ fontSize: '11px', color: base.textMuted }}>
                {[3, 4, 5][r - 1]} workers
              </span>
              <span style={{ fontSize: '10px', color: base.textMuted }}>
                Tier {r === 1 ? '1' : r === 2 ? '1–2' : '1–3'} actions
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Turn Order">
        <P>At the start of each round, turn order is re-sorted: <B>lowest Favor goes first</B>. The underdog always gets first pick of action spaces.</P>
      </Section>

      <Section title="Winning">
        <P>After 3 rounds, the player with the most Favor wins. Each patron awards Favor differently — diversify or specialize, but always have a plan.</P>
      </Section>
    </div>
  );
}

function GodsTab() {
  const [selectedGod, setSelectedGod] = useState('gold');
  const god = gods[selectedGod];
  const colors = godColors[selectedGod];
  const meta = godMeta[selectedGod];

  return (
    <div>
      {/* God selector pills */}
      <div className="flex gap-2 mb-5">
        {GOD_IDS.map(id => {
          const c = godColors[id];
          const m = godMeta[id];
          const active = selectedGod === id;
          return (
            <button
              key={id}
              onClick={() => setSelectedGod(id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-100"
              style={{
                background: active ? c.surface : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? c.border : 'rgba(255,255,255,0.06)'}`,
                color: active ? c.text : base.textMuted,
              }}
            >
              <GodIcon god={id} size={14} />
              {m.name}
            </button>
          );
        })}
      </div>

      {/* God detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedGod}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <GodIcon god={selectedGod} size={28} />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: colors.text }}>
                {meta.name}
              </div>
              <div style={{ fontSize: '11px', color: colors.primary, opacity: 0.7 }}>
                {god.title}
              </div>
            </div>
          </div>

          {/* Favor Condition */}
          <div
            className="rounded-lg p-3"
            style={{
              background: favorConditionStyle.background,
              border: `1px solid ${favorConditionStyle.border}`,
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: favorConditionStyle.text, marginBottom: '4px' }}>
              Favor Condition
            </div>
            <div style={{ fontSize: '12px', color: base.textSecondary, lineHeight: 1.5 }}>
              <RichEffect text={god.gloryCondition.description} size={12} />
            </div>
          </div>

          {/* Actions by tier */}
          {[1, 2, 3].map(tier => {
            const tierActions = god.actions.filter(a => a.tier === tier);
            if (tierActions.length === 0) return null;
            return (
              <div key={tier}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: base.textMuted, marginBottom: '6px' }}>
                  Tier {tier} Actions {tier === 1 ? '(Round 1+)' : tier === 2 ? '(Round 2+)' : '(Round 3)'}
                </div>
                <div className="space-y-1.5">
                  {tierActions.map(action => (
                    <div
                      key={action.id}
                      className="flex items-start gap-2 rounded-md px-3 py-2"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 600, color: colors.text, minWidth: '80px', flexShrink: 0 }}>
                        {action.name}
                      </span>
                      <span style={{ fontSize: '11px', color: base.textSecondary, lineHeight: 1.5 }}>
                        <RichEffect text={action.effect} size={11} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ChampionsTab() {
  return (
    <div className="space-y-3">
      <P>At the start of each game, players draft a champion in reverse standing order (last place picks first). Each champion has a unique passive ability.</P>
      <div className="space-y-2 mt-3">
        {championsData.map(champ => (
          <div
            key={champ.id}
            className="rounded-lg px-4 py-3"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: base.textPrimary, marginBottom: '4px' }}>
              {champ.name}
            </div>
            <div style={{ fontSize: '11px', color: base.textSecondary, lineHeight: 1.5 }}>
              {champ.passive}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtifactsTab() {
  const [selectedGod, setSelectedGod] = useState('gold');
  const colors = godColors[selectedGod];
  const godCards = Object.values(powerCards).filter(c => c.god === selectedGod);

  return (
    <div>
      {/* God filter pills */}
      <div className="flex gap-2 mb-4">
        {GOD_IDS.map(id => {
          const c = godColors[id];
          const m = godMeta[id];
          const active = selectedGod === id;
          return (
            <button
              key={id}
              onClick={() => setSelectedGod(id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-100"
              style={{
                background: active ? c.surface : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? c.border : 'rgba(255,255,255,0.06)'}`,
                color: active ? c.text : base.textMuted,
              }}
            >
              <GodIcon god={id} size={12} />
              {m.name}
            </button>
          );
        })}
      </div>

      <P>Each patron has 6 artifacts. You can hold up to 4 (5 with The Ambitious). Purchase from the same patron you placed a worker on.</P>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedGod}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="space-y-2 mt-3"
        >
          {godCards.map(card => (
            <div
              key={card.id}
              className="flex items-start gap-3 rounded-lg px-3 py-2.5"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${colors.border}`,
              }}
            >
              <ArtifactImage cardId={card.id} size={28} color={colors.light} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '12px', fontWeight: 700, color: colors.text }}>
                    {card.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {Object.entries(card.cost || {}).map(([resource, amount]) => (
                      <span key={resource} className="flex items-center gap-0.5" style={{ fontSize: '10px', fontWeight: 600, color: base.textMuted }}>
                        {amount}
                        {resource === 'any' ? <WildcardIcon size={10} /> : <ResourceIcon type={resource} size={10} />}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: base.textSecondary, lineHeight: 1.4, marginTop: '2px' }}>
                  <RichEffect text={card.description} size={11} />
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ShopsTab() {
  return (
    <div className="space-y-5">
      <Section title="How Shops Work">
        <P>After placing a worker, you may buy <B>one</B> shop benefit <em>or</em> one artifact — from the <B>same patron</B> you placed on. One purchase per turn.</P>
      </Section>

      {GOD_IDS.map(godId => {
        const god = gods[godId];
        const colors = godColors[godId];
        const meta = godMeta[godId];
        return (
          <div key={godId}>
            <div className="flex items-center gap-2 mb-2">
              <GodIcon god={godId} size={16} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: colors.text }}>
                {meta.name} Shops
              </span>
            </div>
            <div className="space-y-1.5">
              {god.shops.map((shop, i) => {
                const costEntries = Object.entries(shop.cost || {});
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-md px-3 py-2"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid rgba(255,255,255,0.04)`,
                    }}
                  >
                    <div className="flex items-center gap-1 flex-shrink-0" style={{ minWidth: '36px' }}>
                      {costEntries.map(([resource, amount]) => (
                        <span key={resource} className="flex items-center gap-0.5" style={{ fontSize: '11px', fontWeight: 600, color: base.textMuted }}>
                          {amount}
                          {resource === 'any' ? <WildcardIcon size={10} /> : <ResourceIcon type={resource} size={10} />}
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: '11px', color: base.textSecondary, lineHeight: 1.5 }}>
                      <RichEffect text={shop.effect} size={11} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KeyRulesTab() {
  return (
    <div className="space-y-5">
      <Section title="Blocking">
        <P>Each action space holds <B>one worker</B>. If a rival claims your spot, find another plan. The <em>Timeline Splitter</em> artifact lets you ignore this rule.</P>
      </Section>

      <Section title="Stealing & Aegis">
        <P>Some actions steal resources or Favor from opponents. The <B>Aegis</B> (Gold shop) protects your resources from theft. <em>Tome of Deeds</em> protects your Favor from reduction.</P>
      </Section>

      <Section title="Repeat & Copy">
        <P>Green patron actions let you repeat your own actions or copy another player's. Repeats cannot chain into other repeat/copy actions. Max recursion depth: 5.</P>
      </Section>

      <Section title="Purchase Limits">
        <P>One purchase per turn: either a shop benefit <B>or</B> an artifact. Must be from the <B>same patron</B> you placed your worker on this turn.</P>
      </Section>

      <Section title="Artifact Slots">
        <P>Each player can hold up to <B>4 artifacts</B> (5 with The Ambitious champion). If full, you must discard one to buy a new one.</P>
      </Section>

      <Section title="Favor Conditions">
        <P>Each patron has a unique Favor condition — the way they award Favor throughout the game. All trigger on specific actions. Diversify across patrons or go deep on one.</P>
        <div className="space-y-1.5 mt-2">
          {GOD_IDS.map(id => {
            const god = gods[id];
            const colors = godColors[id];
            const meta = godMeta[id];
            return (
              <div key={id} className="flex items-center gap-2" style={{ fontSize: '11px' }}>
                <GodIcon god={id} size={14} />
                <span style={{ fontWeight: 600, color: colors.text, minWidth: '52px' }}>{meta.name}:</span>
                <span style={{ color: base.textSecondary }}>
                  <RichEffect text={god.gloryCondition.description} size={11} />
                </span>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

// ── Shared Primitives ───────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div>
      <div style={{
        fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: base.textMuted, marginBottom: '6px',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function P({ children }) {
  return (
    <p style={{ fontSize: '12px', lineHeight: 1.6, color: base.textSecondary }}>
      {children}
    </p>
  );
}

function B({ children, style }) {
  return <span style={{ fontWeight: 700, color: base.textPrimary, ...style }}>{children}</span>;
}

// ── Main Component ──────────────────────────────────────────────────

export default function RulesReference({ onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  const TabContent = {
    overview: OverviewTab,
    gods: GodsTab,
    champions: ChampionsTab,
    artifacts: ArtifactsTab,
    shops: ShopsTab,
    rules: KeyRulesTab,
  }[activeTab];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(12, 10, 9, 0.95)',
      }}
      onClick={onClose}
    >
      <motion.div
        className="relative flex flex-col rounded-xl w-full max-w-2xl max-h-[85vh] mx-4 overflow-hidden"
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'rgba(28, 25, 23, 0.97)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2
            className="text-lg font-semibold tracking-wide"
            style={{ color: godColors.gold.light }}
          >
            Game Reference
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150"
            style={{ color: base.textMuted }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = base.textPrimary; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = base.textMuted; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Gold accent line */}
        <div
          className="mx-4 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${godColors.gold.primary}, transparent)`,
            opacity: 0.4,
          }}
        />

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-2 overflow-x-auto">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors duration-100 whitespace-nowrap"
                style={{
                  background: active ? godColors.gold.surface : 'transparent',
                  color: active ? godColors.gold.light : base.textMuted,
                  border: `1px solid ${active ? godColors.gold.border : 'transparent'}`,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mx-6 h-px" style={{ backgroundColor: base.divider }} />

        {/* Tab content — scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.12 }}
            >
              <TabContent />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
