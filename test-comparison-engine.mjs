import { computePHash } from './lib/image/phash.js';
import { computeSHA256 } from './lib/image/hash.js';
import { extractMetadata } from './lib/image/metadata.js';
import { scoreComparison } from './lib/image/scoring.js';
import { generateDiffOverlay } from './lib/image/diff.js';
import { readFileSync } from 'fs';
import sharp from 'sharp';

const imageABuffer = readFileSync('/tmp/imageA.png');
const imageBBuffer = readFileSync('/tmp/imageB.png');

console.log('[v0] Starting comparison engine test...\n');

(async () => {
  try {
    // Metadata extraction
    console.log('[v0] 1. Extracting metadata...');
    const metaA = await extractMetadata(imageABuffer);
    const metaB = await extractMetadata(imageBBuffer);
    console.log(`  Image A: ${metaA.width}x${metaA.height}, ${(metaA.dominantColor || 'N/A')}`);
    console.log(`  Image B: ${metaB.width}x${metaB.height}, ${(metaB.dominantColor || 'N/A')}\n`);

    // Hash computation
    console.log('[v0] 2. Computing hashes...');
    const sha256A = await computeSHA256(imageABuffer);
    const sha256B = await computeSHA256(imageBBuffer);
    console.log(`  SHA256 Match: ${sha256A === sha256B ? 'YES' : 'NO'}\n`);

    // pHash
    console.log('[v0] 3. Computing perceptual hash (DCT-based)...');
    const phashA = await computePHash(imageABuffer);
    const phashB = await computePHash(imageBBuffer);
    console.log(`  pHash A: ${phashA}`);
    console.log(`  pHash B: ${phashB}\n`);

    // Diff overlay
    console.log('[v0] 4. Generating diff overlay...');
    const diff = await generateDiffOverlay(imageABuffer, imageBBuffer);
    console.log(`  Diff overlay created: ${diff.pixelMatch} pixels differ out of ${diff.totalPixels}`);
    console.log(`  Pixel similarity: ${(diff.pixelSimilarity * 100).toFixed(2)}%\n`);

    // Scoring
    console.log('[v0] 5. Computing similarity score...');
    const score = await scoreComparison(
      { phash: phashA, ...metaA },
      { phash: phashB, ...metaB },
      diff.pixelSimilarity
    );
    console.log(`  Score: ${score.score.toFixed(2)}/100`);
    console.log(`  Classification: ${score.classification}`);
    console.log(`  Recommendation: ${score.recommendation}\n`);
    console.log('[v0] Signals:');
    Object.entries(score.signals).forEach(([k, v]) => {
      console.log(`    ${k}: ${typeof v === 'number' ? v.toFixed(2) : v}`);
    });

    console.log('\n✓ Comparison engine test completed successfully!');
  } catch (err) {
    console.error('[v0] Error:', err.message);
    process.exit(1);
  }
})();
