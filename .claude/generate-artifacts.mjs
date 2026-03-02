#!/usr/bin/env node
/**
 * Generate artifact card images via Gemini (Nano Banana) API.
 *
 * Usage: GEMINI_API_KEY=... node .claude/generate-artifacts.mjs
 *
 * Generates a 256x256 PNG icon for each power card and saves to
 * src/v3/assets/artifacts/{cardId}.png
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'src/v3/assets/artifacts');

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBarWsh25YazvPkhIKpSwzI9Pbf8LWOh5Q';
if (!API_KEY) {
  console.error('Set GEMINI_API_KEY environment variable');
  process.exit(1);
}

// Card definitions with art prompts
const CARDS = [
  // GOLD
  { id: 'golden_scepter', god: 'gold', prompt: 'A golden royal scepter with a glowing orb on top, ornate engravings, divine radiance' },
  { id: 'gold_idol', god: 'gold', prompt: 'A squat golden idol statue with glowing ruby eyes, ancient temple artifact, mysterious' },
  { id: 'golden_chalice', god: 'gold', prompt: 'An ornate golden chalice overflowing with divine light, jewel-encrusted rim, ceremonial' },
  { id: 'golden_ring', god: 'gold', prompt: 'A thick golden ring with a large glowing gemstone, magical aura, ancient artifact' },
  { id: 'gold_crown', god: 'gold', prompt: 'A magnificent golden crown with three tall points, embedded with diamonds, royal power' },
  { id: 'gold_vault', god: 'gold', prompt: 'A fortified golden treasure vault door with arcane lock symbols, impenetrable, glowing seams' },

  // BLACK
  { id: 'onyx_spyglass', god: 'black', prompt: 'A dark onyx spyglass telescope with purple crystal lens, shadowy wisps emanating from it' },
  { id: 'voodoo_doll', god: 'black', prompt: 'A sinister voodoo doll wrapped in dark cloth with glowing purple pins, occult magic' },
  { id: 'thieves_gloves', god: 'black', prompt: 'A pair of sleek black leather gloves with faint purple arcane runes glowing on them, stealthy' },
  { id: 'tome_of_deeds', god: 'black', prompt: 'An ancient dark leather-bound tome with a glowing purple clasp, protective wards, mystical text' },
  { id: 'obsidian_coin', god: 'black', prompt: 'A large obsidian coin with a skull engraved on it, faint purple glow around edges, dark currency' },
  { id: 'cursed_blade', god: 'black', prompt: 'A jagged cursed dagger dripping with purple shadow energy, dark enchantment, menacing' },

  // GREEN
  { id: 'hourglass', god: 'green', prompt: 'A mystical green crystal hourglass with swirling emerald sand, time magic, ethereal glow' },
  { id: 'capacitor', god: 'green', prompt: 'A crystalline green energy capacitor jar with crackling emerald lightning trapped inside' },
  { id: 'crystal_watch', god: 'green', prompt: 'An elegant pocket watch made of green crystal with visible clockwork gears, time artifact' },
  { id: 'diadem_of_expertise', god: 'green', prompt: 'A green crystal diadem headpiece with a large central emerald, wisdom and mastery, radiant' },
  { id: 'crystal_ball', god: 'green', prompt: 'A luminous green crystal ball on an ornate stand, swirling mist inside, divination, prophecy' },
  { id: 'emerald_coin', god: 'green', prompt: 'A large emerald coin with an hourglass symbol engraved, glowing green edges, time currency' },

  // YELLOW
  { id: 'horn_of_plenty', god: 'yellow', prompt: 'A golden cornucopia horn overflowing with colorful gems and treasures, abundance, radiant warmth' },
  { id: 'prismatic_gem', god: 'yellow', prompt: 'A large faceted gem that refracts into rainbow colors, prismatic light, floating with golden aura' },
  { id: 'rainbow_crest', god: 'yellow', prompt: 'A heraldic shield crest with rainbow bands of color, golden frame, emblem of diversity' },
  { id: 'alchemists_trunk', god: 'yellow', prompt: 'An open alchemist treasure chest with colorful potions and gems inside, golden trim, transformative' },
  { id: 'abundance_charm', god: 'yellow', prompt: 'A golden charm amulet on a chain with a sun symbol, radiating warm light, blessing of plenty' },
  { id: 'travelers_journal', god: 'yellow', prompt: 'A worn leather journal with a golden compass rose on the cover, travel stickers, worldly and warm' },
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${API_KEY}`;

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
  console.log(`✓ ${card.id} → ${outPath} (${(buffer.length / 1024).toFixed(1)}KB)`);
  return true;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Generating ${CARDS.length} artifact images...\n`);

  let success = 0;
  let fail = 0;

  // Process sequentially to avoid rate limits
  for (const card of CARDS) {
    try {
      const ok = await generateImage(card);
      if (ok) success++;
      else fail++;
    } catch (err) {
      console.error(`✗ ${card.id}: ${err.message}`);
      fail++;
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\nDone: ${success} generated, ${fail} failed`);
}

main();
