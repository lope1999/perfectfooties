import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore/lite';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env.local');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
  return env;
}

const env = loadEnv();
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
});
const db = getFirestore(app);

function label(filename) {
  return filename
    .replace(/\.(jpg|jpeg|png|webp|JPG|JPEG|PNG)(\.(jpg|jpeg|png|webp|JPG|JPEG|PNG))?$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Services images → "nails" category
const nailImages = [
  'builder-gel.jpg',
  'chrome-nails.jpg.jpg',
  'classic-gel.png',
  'complex-overlay.JPG',
  'custom-art.jpg.jpg',
  'freehand-art.jpg.jpg',
  'french-tip.PNG',
  'gel-extensions.jpg.jpg',
  'glossy-red.jpg.jpg',
  'hardgel-extension.PNG',
  'ombre-nails.jpg.jpg',
  'overlay-nails.jpg.jpg',
  'toes.PNG',
];

// Product images → "pressOn" category
const pressOnImages = [
  'presson-1.jpg',
  'presson-2.jpg',
  'presson-3.jpg',
  'presson-4.JPG',
  'custom-long.jpg.jpg',
  'marble-luxe.jpg',
  'nude-set.jpg.jpg',
  'redenedg.jpg',
  'redenedg2.jpg',
];

async function seed() {
  const col = collection(db, 'galleryImages');

  // Check existing images to avoid duplicates
  const existing = await getDocs(col);
  const existingUrls = new Set(existing.docs.map((d) => d.data().imageUrl));
  console.log(`Found ${existing.size} existing images. Adding new ones...\n`);

  let order = existing.size;

  let added = 0;

  for (const file of nailImages) {
    const url = `/images/services/${file}`;
    if (existingUrls.has(url)) { console.log(`  skip: ${file}`); continue; }
    await addDoc(col, {
      imageUrl: url,
      caption: label(file),
      category: 'nails',
      order: order++,
      createdAt: new Date().toISOString(),
    });
    added++;
    console.log(`  ✓ nails: ${file}`);
  }

  for (const file of pressOnImages) {
    const url = `/images/products/${file}`;
    if (existingUrls.has(url)) { console.log(`  skip: ${file}`); continue; }
    await addDoc(col, {
      imageUrl: url,
      caption: label(file),
      category: 'pressOn',
      order: order++,
      createdAt: new Date().toISOString(),
    });
    added++;
    console.log(`  ✓ pressOn: ${file}`);
  }

  console.log(`\nDone! Added ${added} new gallery images (${existing.size + added} total).`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
