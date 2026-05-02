#!/usr/bin/env node
/**
 * Generate artifact card images via Gemini API.
 *
 * Usage: node .claude/generate-artifacts.mjs [--only-missing] [--card cardId]
 *
 * Generates a 256x256 PNG icon for each power card and saves to
 * src/v3/assets/artifacts/{cardId}.png
 *
 * Flags:
 *   --only-missing  Only generate images that don't already exist
 *   --card <id>     Generate only a specific card
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'src/v3/assets/artifacts');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Set GEMINI_API_KEY environment variable.\nGet a key at https://aistudio.google.com/apikey');
  process.exit(1);
}

// All 24 cards with actual game IDs and themed art prompts
const CARDS = [
  // === GOLD (6 cards) ===
  { id: 'golden_scepter', god: 'gold', prompt: 'A golden royal scepter with a glowing orb on top, ornate engravings, divine radiance, extra gold bonus' },
  { id: 'rainbow_scepter', god: 'gold', prompt: 'A golden scepter crowned with a prismatic rainbow crystal, refracting light into multiple colors, magical versatility' },
  { id: 'golden_ring', god: 'gold', prompt: 'A thick golden ring with a large glowing gemstone, magical aura, steady income, ancient artifact' },
  { id: 'gold_crown', god: 'gold', prompt: 'A magnificent golden crown with three tall points, embedded with diamonds, royal power, endgame dominance' },
  { id: 'golden_scope', god: 'gold', prompt: 'A golden telescope or monocular scope with crystal lens, protective watchful eye, anti-theft ward, golden glow' },
  { id: 'golden_idol', god: 'gold', prompt: 'A squat golden idol statue with glowing ruby eyes sitting on a pedestal, ancient temple artifact, favor multiplier' },

  // === BLACK (6 cards) ===
  { id: 'thieves_gloves', god: 'black', prompt: 'A pair of sleek black leather gloves with faint purple arcane runes glowing on fingers, stealthy, bonus loot' },
  { id: 'onyx_spyglass', god: 'black', prompt: 'A dark onyx spyglass telescope with purple crystal lens, shadowy wisps, watching others, intelligence gathering' },
  { id: 'voodoo_doll', god: 'black', prompt: 'A sinister voodoo doll wrapped in dark cloth with glowing purple pins stuck in it, occult curse magic' },
  { id: 'skeleton_key', god: 'black', prompt: 'An ornate skeleton key made of dark bone-like metal with a skull bow, purple gemstone eye, unlocks any door, infiltration' },
  { id: 'poisoned_blade', god: 'black', prompt: 'A wickedly curved dagger with green-purple poison dripping from the blade, toxic enchantment, extra damage on attacks' },
  { id: 'tome_of_deeds', god: 'black', prompt: 'An ancient dark leather-bound tome with a glowing purple clasp and protective ward symbols, immunity shield, mystical' },

  // === GREEN (6 cards) ===
  { id: 'flux_capacitor', god: 'green', prompt: 'A crystalline green energy capacitor device with crackling emerald lightning trapped inside a glass chamber, time energy storage' },
  { id: 'resonance_crystal', god: 'green', prompt: 'A luminous green crystal that resonates and hums with emerald light, radiating concentric energy waves, echo power' },
  { id: 'temporal_patent', god: 'green', prompt: 'An official-looking scroll or patent document sealed with green wax and an hourglass stamp, temporal authority, time law' },
  { id: 'diadem_of_expertise', god: 'green', prompt: 'A green crystal diadem headpiece with a large central emerald, wisdom and mastery, radiant double power crown' },
  { id: 'timeline_splitter', god: 'green', prompt: 'A magical device that splits reality into two glowing green parallel timelines, bifurcating light, dual paths, paradox artifact' },
  { id: 'chrono_compass', god: 'green', prompt: 'An elegant compass with green crystal face and golden hands that spin through time, temporal navigation, turn order control' },

  // === YELLOW (6 cards) ===
  { id: 'rainbow_crest', god: 'yellow', prompt: 'A heraldic shield crest with rainbow bands of color, golden frame, emblem of diversity, multi-color bonus' },
  { id: 'extraction_vial', god: 'yellow', prompt: 'A glass alchemical vial filled with swirling yellow-amber liquid, extraction tubes, converting other colors to yellow essence' },
  { id: 'slag_catcher', god: 'yellow', prompt: 'A bronze mechanical funnel-basket device that catches falling golden sparks and residue, recycling spent resources, efficiency' },
  { id: 'alchemists_trunk', god: 'yellow', prompt: 'An open alchemist treasure chest with colorful potions and gems inside, golden trim, redistribution, transformative' },
  { id: 'philosophers_stone', god: 'yellow', prompt: 'A legendary golden-red philosopher stone floating and radiating transmutation energy, turning base metals to gold, wildcard power' },
  { id: 'horn_of_plenty', god: 'yellow', prompt: 'A golden cornucopia horn overflowing with colorful gems and treasures, abundance, radiant warmth, all colors' },
];

const GOD_COLORS = {
  gold: 'warm golden amber',
  black: 'deep purple and obsidian black',
  green: 'emerald green and dark forest',
  yellow: 'warm amber and sunlight gold',
};

const STYLE_PREFIX = `Digital painting of a single fantasy artifact icon on a dark background. Style: dark fantasy board game art, painterly, rich colors, dramatic lighting from above, slight glow effect. The artifact should be centered, detailed, and feel like a rare collectible item. Color palette emphasizing`;

async function generateImage(card) {
  const prompt = `${STYLE_PREFIX} ${GOD_COLORS[card.god]} tones. ${card.prompt}. No text, no labels, no borders. Square composition, single object, dark moody background.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;

  const body = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const json = await res.json();

  // Extract image from response
  const parts = json.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));

  if (!imagePart) {
    console.error(`No image in response for ${card.id}. Parts:`, parts.map(p => Object.keys(p)));
    return false;
  }

  const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
  const outPath = path.join(OUT_DIR, `${card.id}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`  ${card.id} → ${(buffer.length / 1024).toFixed(1)}KB`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const onlyMissing = args.includes('--only-missing');
  const cardIdx = args.indexOf('--card');
  const singleCard = cardIdx >= 0 ? args[cardIdx + 1] : null;

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let cards = CARDS;

  if (singleCard) {
    cards = CARDS.filter(c => c.id === singleCard);
    if (cards.length === 0) {
      console.error(`Card "${singleCard}" not found. Available: ${CARDS.map(c => c.id).join(', ')}`);
      process.exit(1);
    }
  }

  if (onlyMissing) {
    cards = cards.filter(c => !fs.existsSync(path.join(OUT_DIR, `${c.id}.png`)));
    if (cards.length === 0) {
      console.log('All images already exist.');
      return;
    }
  }

  console.log(`Generating ${cards.length} artifact images...\n`);

  let success = 0;
  let fail = 0;

  // Process sequentially to avoid rate limits
  for (const card of cards) {
    try {
      const ok = await generateImage(card);
      if (ok) success++;
      else fail++;
    } catch (err) {
      console.error(`  ${card.id}: ${err.message}`);
      fail++;
    }
    // Small delay to avoid rate limiting
    if (cards.indexOf(card) < cards.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\nDone: ${success} generated, ${fail} failed`);
}

main();
