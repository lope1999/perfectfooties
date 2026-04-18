/**
 * Heirloom Collection Seed Script
 *
 * Seeds Firestore with the Heirloom Collection and its three items.
 * Images are served as static files from /images/products/ — no Firebase Storage needed.
 *
 * Usage:
 *   npm run seed:heirloom
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  getDocs,
  collection,
} from 'firebase/firestore/lite';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return env;
}

const env = loadEnv();
const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const CARE =
  'Wipe clean with a soft dry cloth. Store in a dust bag when not in use. ' +
  'Avoid prolonged exposure to direct sunlight, heat, and moisture. ' +
  'Apply a quality leather conditioner monthly to maintain suppleness and sheen.';

const COLLECTION_DOC = {
  name:        'Heirloom Collection',
  description: 'Timeless pieces designed to be passed down through generations.',
  coverImage:  '/images/products/heirloom-regal-1.jpg',
  order:       3,
  active:      true,
};

const ITEMS = [
  {
    name: 'Regal Bag',
    description:
      'The Regal Bag — a PF signature piece that expresses power, elegance, and timelessness. ' +
      'Unique strap design for a standout look, structured form that holds its shape beautifully ' +
      'as a clutch, smooth genuine leather finish for a refined luxurious feel. ' +
      'Spacious enough for your essentials: phone, cards, keys, lipstick.',
    price: 29999,
    colors: ['Black', 'Brown', 'Nude'],
    images: Array.from({ length: 13 }, (_, i) => `/images/products/heirloom-regal-${i + 1}.jpg`),
    status: 'open',
    requiresLength: false,
    careGuide: CARE,
    colorStock: {},
    orderCount: 0,
  },
  {
    name: 'Royalé Bag',
    description:
      'Meet the Royalé Bag — a PF signature piece where elegance meets everyday functionality. ' +
      'A structured silhouette with a rich croc leather textured finish, a sturdy top handle ' +
      'for that classic polished feel, and a long adjustable strap for versatile styling.',
    price: 29999,
    colors: ['Black', 'Blue', 'Burgundy'],
    images: Array.from({ length: 12 }, (_, i) => `/images/products/heirloom-royal-${i + 1}.jpg`),
    status: 'open',
    requiresLength: false,
    careGuide: CARE,
    colorStock: {},
    orderCount: 0,
  },
];

async function seed() {
  console.log('\n📦 Seeding Heirloom Collection to Firestore...\n');

  // 1. Create / merge collection document
  await setDoc(doc(db, 'collections', 'heirloom'), COLLECTION_DOC, { merge: true });
  console.log('✓ collections/heirloom');

  // 2. Check for existing items
  const itemsRef    = collection(db, 'collections', 'heirloom', 'items');
  const existingSnap = await getDocs(itemsRef);

  if (existingSnap.size > 0) {
    console.log(`\n⚠  ${existingSnap.size} items already exist — skipping to avoid duplicates.`);
    console.log('   Delete existing items in the admin first, then re-run.\n');
  } else {
    for (const item of ITEMS) {
      await addDoc(itemsRef, { ...item, createdAt: new Date() });
      console.log(`✓ ${item.name}  (${item.images.length} images)`);
    }
  }

  console.log('\n✅  Done! Open Admin → Collections → Heirloom Collection to verify.\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
