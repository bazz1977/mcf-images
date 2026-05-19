/**
 * generate-thumbs.js — McFarlane Hub
 * Generates 200x200px thumbnails for all NFT images in this folder.
 * Also regenerates files.json with both originals and thumbnails.
 *
 * Usage: node generate-thumbs.js
 * Requires: npm install sharp
 */

const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR        = __dirname;
const THUMB_SIZE = 200;
const THUMB_SUFFIX = '_thumb';

async function run() {
  // Get all original JPGs (exclude existing thumbs)
  const allFiles = fs.readdirSync(DIR).filter(f =>
    f.match(/\.jpg$/i) && !f.includes(THUMB_SUFFIX)
  );

  console.log(`Found ${allFiles.length} original images. Generating thumbnails...`);

  let done = 0;
  let skipped = 0;

  for (const file of allFiles) {
    const base     = file.replace(/\.jpg$/i, '');
    const thumbName = base + THUMB_SUFFIX + '.jpg';
    const srcPath  = path.join(DIR, file);
    const dstPath  = path.join(DIR, thumbName);

    // Skip if thumb already exists
    if (fs.existsSync(dstPath)) {
      skipped++;
      continue;
    }

    try {
      await sharp(srcPath)
        .resize(THUMB_SIZE, THUMB_SIZE, {
          fit: 'cover',
          position: 'centre'
        })
        .jpeg({ quality: 85 })
        .toFile(dstPath);
      done++;

      if (done % 50 === 0) {
        console.log(`  ${done} / ${allFiles.length - skipped} thumbnails generated...`);
      }
    } catch(e) {
      console.warn(`  ✗ Failed: ${file} — ${e.message}`);
    }
  }

  console.log(`✓ Done — ${done} new thumbnails, ${skipped} already existed`);

  // Regenerate files.json with all JPGs (originals + thumbs)
  const allJpgs = fs.readdirSync(DIR)
    .filter(f => f.match(/\.jpg$/i))
    .sort();

  fs.writeFileSync(
    path.join(DIR, 'files.json'),
    JSON.stringify(allJpgs, null, 2)
  );

  console.log(`✓ files.json updated with ${allJpgs.length} entries (originals + thumbnails)`);
}

run().catch(console.error);
