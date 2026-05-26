/**
 * generate-thumbs.js — McFarlane Hub
 * Generates thumbnails for all NFT images in this folder:
 *   _thumb  → 200x200px  (small, for lists and compact views)
 *   _medium → 600x600px  (medium, for grid cards)
 * Also regenerates files.json with all variants.
 *
 * Usage: node generate-thumbs.js
 * Requires: npm install sharp
 */

const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = __dirname;

const VARIANTS = [
  { suffix: '_thumb',  size: 200, quality: 85 },
  { suffix: '_medium', size: 600, quality: 88 },
];

async function run() {
  // Get all original JPGs (exclude existing thumbs/mediums)
  const allFiles = fs.readdirSync(DIR).filter(f =>
    f.match(/\.jpg$/i) &&
    !VARIANTS.some(v => f.includes(v.suffix))
  );

  console.log(`Found ${allFiles.length} original images. Generating variants...`);

  for (const variant of VARIANTS) {
    console.log(`\n── Generating ${variant.suffix} (${variant.size}x${variant.size}px) ──`);
    let done = 0, skipped = 0;

    for (const file of allFiles) {
      const base    = file.replace(/\.jpg$/i, '');
      const outName = base + variant.suffix + '.jpg';
      const srcPath = path.join(DIR, file);
      const dstPath = path.join(DIR, outName);

      if (fs.existsSync(dstPath)) { skipped++; continue; }

      try {
        await sharp(srcPath)
          .resize(variant.size, variant.size, { fit: 'cover', position: 'centre' })
          .jpeg({ quality: variant.quality })
          .toFile(dstPath);
        done++;
        if (done % 50 === 0) console.log(`  ${done} / ${allFiles.length - skipped} done...`);
      } catch(e) {
        console.warn(`  ✗ Failed: ${file} — ${e.message}`);
      }
    }
    console.log(`✓ ${done} new, ${skipped} already existed`);
  }

  // Regenerate files.json with all JPGs (originals + all variants)
  const allJpgs = fs.readdirSync(DIR)
    .filter(f => f.match(/\.jpg$/i))
    .sort();

  fs.writeFileSync(
    path.join(DIR, 'files.json'),
    JSON.stringify(allJpgs, null, 2)
  );

  console.log(`\n✓ files.json updated with ${allJpgs.length} entries`);
}

run().catch(console.error);
