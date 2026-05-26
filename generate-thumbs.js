/**
 * generate-thumbs.js — McFarlane Hub
 * Generates image variants and indexes all assets for the hub.
 *
 * Output folder structure:
 *   originals/   — original downloaded images (moved here if in root)
 *   thumbs/      — 200x200px small thumbnails (for lists/compact views)
 *   medium/      — 600x600px medium images (for grid cards)
 *   models/      — 3D GLB models for AR viewer
 *
 * Output files:
 *   files.json   — index of all image variants { originals, thumbs, medium }
 *   models.json  — index of all GLB models
 *
 * Usage: node generate-thumbs.js
 * Requires: npm install sharp
 */

const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = __dirname;

const DIRS = {
  originals: path.join(DIR, 'originals'),
  thumbs:    path.join(DIR, 'thumbs'),
  medium:    path.join(DIR, 'medium'),
  models:    path.join(DIR, 'models'),
};

const VARIANTS = [
  { name: 'thumbs',  size: 200, quality: 85 },
  { name: 'medium',  size: 600, quality: 88 },
];

async function run() {
  // Ensure all subdirectories exist
  for (const [key, dir] of Object.entries(DIRS)) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
      console.log(`Created folder: ${key}/`);
    }
  }

  // Move any root-level JPGs into originals/ (migration step)
  const rootJpgs = fs.readdirSync(DIR).filter(f =>
    f.match(/\.jpg$/i) && !f.startsWith('.')
  );
  if (rootJpgs.length > 0) {
    console.log(`\nMigrating ${rootJpgs.length} root JPGs → originals/...`);
    for (const f of rootJpgs) {
      fs.renameSync(path.join(DIR, f), path.join(DIRS.originals, f));
    }
    console.log('✓ Migration done');
  }

  // Get all originals
  const originals = fs.readdirSync(DIRS.originals)
    .filter(f => f.match(/\.jpg$/i))
    .sort();

  console.log(`\nFound ${originals.length} originals. Generating variants...`);

  // Generate each variant
  for (const variant of VARIANTS) {
    const outDir = DIRS[variant.name];
    console.log(`\n── ${variant.name}/ (${variant.size}x${variant.size}px) ──`);
    let done = 0, skipped = 0;

    for (const file of originals) {
      const srcPath = path.join(DIRS.originals, file);
      const dstPath = path.join(outDir, file);

      if (fs.existsSync(dstPath)) { skipped++; continue; }

      try {
        await sharp(srcPath)
          .resize(variant.size, variant.size, { fit: 'cover', position: 'centre' })
          .jpeg({ quality: variant.quality })
          .toFile(dstPath);
        done++;
        if (done % 50 === 0) console.log(`  ${done} / ${originals.length} done...`);
      } catch(e) {
        console.warn(`  ✗ Failed: ${file} — ${e.message}`);
      }
    }
    console.log(`✓ ${done} new, ${skipped} already existed`);
  }

  // Build files.json — paths relative to repo root
  const filesJson = {
    originals: fs.readdirSync(DIRS.originals).filter(f => f.match(/\.jpg$/i)).sort()
      .map(f => 'originals/' + f),
    thumbs: fs.readdirSync(DIRS.thumbs).filter(f => f.match(/\.jpg$/i)).sort()
      .map(f => 'thumbs/' + f),
    medium: fs.readdirSync(DIRS.medium).filter(f => f.match(/\.jpg$/i)).sort()
      .map(f => 'medium/' + f),
  };

  fs.writeFileSync(
    path.join(DIR, 'files.json'),
    JSON.stringify(filesJson, null, 2)
  );
  console.log(`\n✓ files.json updated`);
  console.log(`  originals: ${filesJson.originals.length}`);
  console.log(`  thumbs:    ${filesJson.thumbs.length}`);
  console.log(`  medium:    ${filesJson.medium.length}`);

  // Build models.json — all GLB files in models/
  const models = fs.existsSync(DIRS.models)
    ? fs.readdirSync(DIRS.models).filter(f => f.match(/\.glb$/i)).sort()
        .map(f => 'models/' + f)
    : [];

  fs.writeFileSync(
    path.join(DIR, 'models.json'),
    JSON.stringify(models, null, 2)
  );
  console.log(`✓ models.json updated — ${models.length} models`);
}

run().catch(console.error);
