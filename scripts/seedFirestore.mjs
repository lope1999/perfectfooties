/**
 * Seed script — uploads product data from static JS files to Firestore.
 *
 * Usage:
 *   1. Fill in your Firebase config in .env.local
 *   2. Run: npm run seed
 *
 * This reads .env.local via a simple parser (no dotenv needed).
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore/lite';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ──────────────────────────────────────────────────
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

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId || firebaseConfig.projectId === 'your-project-id') {
  console.error('ERROR: Fill in your Firebase config in .env.local before running the seed script.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Product data (copied from static files) ──────────────────────────
// We inline the data here so the seed script is self-contained and
// doesn't need Vite/ESM alias resolution for the src/data imports.

const productCategories = [
  {
    id: 'available-pressons',
    title: 'Available Press-On Nails — Ready to Ship',
    description:
      'Handcrafted press-on nail sets that are already made and ready to go. No wait time — just pick your favourite design, place your order, and we will ship it straight to you. Each set comes with a complimentary nail kit.',
    note: 'Limited stock — once sold out, these designs may not be restocked, but can be ordered on request.',
    readyMade: true,
    image: '/images/products/glossy-red.jpg.jpg',
    products: [
      {
        id: 'av-golden-gilded',
        name: 'Golden & Gilded Elegant Nails',
        description:
          'Stunning clear base with delicate gold foil accents and gilded detailing — effortlessly luxurious for any occasion.',
        price: 18000,
        image: '/images/products/marble-luxe.jpg',
        type: 'Gel-X',
        stock: 2,
        length: 'Long',
        shape: 'Almond',
      },
      {
        id: 'av-french-twist',
        name: 'Pink French Press-Ons',
        description:
          'A modern take on the classic French tip with coloured tips, gems, and a clean glossy finish.',
        price: 13000,
        image: '/images/products/nude-set.jpg.jpg',
        type: 'Gel-X',
        stock: 3,
        length: 'Short',
        shape: 'Square',
      },
      {
        id: 'lonely-night',
        name: 'Not so Lonley Night Pres-Ons',
        description:
          'Bright glossy chrome on a nude base  with bright contasting designs, giving light to my darkeness.',
        price: 17000,
        image: '/images/products/nude-set.jpg.jpg',
        type: 'Gel-X',
        stock: 3,
        length: 'Short',
        shape: 'Square',
      },
      {
        id: 'av-elegances-daughter',
        name: "Elegance's Daughter",
        description:
          'Soft nude tones with graceful gold-line detailing and subtle shimmer — refined beauty inherited from elegance itself.',
        price: 16000,
        image: '/images/products/nude-set.jpg.jpg',
        type: 'Gel-X',
        stock: 3,
        length: 'Medium',
        shape: 'Almond',
      },
      {
        id: 'av-purples-fantasy-mirage',
        name: "Purple's Fantasy Mirage",
        description:
          'Dreamy purple hues blended with holographic shimmer and soft lavender accents — a mystical, head-turning set.',
        price: 17000,
        image: '/images/products/freehand-art.jpg.jpg',
        type: 'Gel-X',
        stock: 3,
        length: 'Long',
        shape: 'Coffin',
      },
      {
        id: 'av-colorful-playground',
        name: 'Colourful Playground — But Mild',
        description:
          'A playful mix of soft pastels and muted pops of colour — fun and vibrant without being too loud. Cheerful yet classy.',
        price: 14000,
        image: '/images/products/glossy-red.jpg.jpg',
        type: 'Gel-X',
        stock: 4,
        length: 'Medium',
        shape: 'Oval',
      },
      {
        id: 'av-mix-match-bling',
        name: 'Mix & Match Bling',
        description:
          'Each nail tells its own story — a bold mix of glitter, gems, chrome, and textured finishes for maximum sparkle.',
        price: 18000,
        image: '/images/products/marble-luxe.jpg',
        type: 'Hard Gel',
        stock: 2,
        length: 'Long',
        shape: 'Coffin',
      },
      {
        id: 'av-miss-independent',
        name: 'Miss Independent but Dependent',
        description:
          'Fierce dark tones with delicate soft-pink accents — strong and self-assured on the outside, sweet on the inside.',
        price: 15000,
        image: '/images/products/custom-long.jpg.jpg',
        type: 'Gel-X',
        stock: 3,
        length: 'Medium',
        shape: 'Almond',
      },
      {
        id: 'av-reddened-glister',
        name: 'Reddened Glister',
        description:
          'Rich, deep red base with fine glitter particles that catch the light beautifully — classic glamour with a sparkling twist.',
        price: 15000,
        image: '/images/products/glossy-red.jpg.jpg',
        type: 'Hard Gel',
        stock: 3,
        length: 'Medium',
        shape: 'Oval',
      },
    ],
  },
  {
    id: 'simple-gelx',
    title: 'Simple Gel-X Press-On Nails',
    description:
      'Clean, elegant press-on nails made with Gel-X extensions and minimal designs. Perfect for everyday wear or a soft, classy look. Available in any length of your choice, shaped and finished for a smooth, natural feel.',
    image: '/images/products/nude-set.jpg.jpg',
    products: [
      { id: 'sg-short', name: 'Simple Gel-X — Short', description: 'Short-length Gel-X press-ons with a clean, minimal finish.', price: 7000, image: '/images/products/nude-set.jpg.jpg' },
      { id: 'sg-medium', name: 'Simple Gel-X — Medium', description: 'Medium-length Gel-X press-ons. Elegant and easy to wear daily.', price: 8500, image: '/images/products/glossy-red.jpg.jpg' },
      { id: 'sg-long', name: 'Simple Gel-X — Long', description: 'Long-length Gel-X press-ons for a bold yet simple statement.', price: 10000, image: '/images/products/custom-long.jpg.jpg' },
      { id: 'sg-xl', name: 'Simple Gel-X — XL', description: 'Extra-long Gel-X press-ons for maximum length and impact.', price: 12500, image: '/images/products/freehand-art.jpg.jpg' },
    ],
  },
  {
    id: 'luxury-gelx',
    title: 'Luxury Gel-X Press-On Nails (Complex Designs)',
    description:
      'Premium Gel-X press-on nails featuring detailed, artistic, and eye-catching designs. Ideal for special occasions, photoshoots, or when you want a bold, standout look. Any length available, fully customized to your style.',
    image: '/images/products/freehand-art.jpg.jpg',
    products: [
      { id: 'lg-short', name: 'Luxury Gel-X — Short', description: 'Short-length Gel-X with intricate nail art and embellishments.', price: 9000, image: '/images/products/freehand-art.jpg.jpg' },
      { id: 'lg-medium', name: 'Luxury Gel-X — Medium', description: 'Medium-length luxury press-ons with custom art designs.', price: 10000, image: '/images/products/marble-luxe.jpg' },
      { id: 'lg-long', name: 'Luxury Gel-X — Long', description: 'Long-length luxury Gel-X with detailed, standout artistry.', price: 12000, image: '/images/products/glossy-red.jpg.jpg' },
      { id: 'lg-xl', name: 'Luxury Gel-X — XL', description: 'Extra-long luxury Gel-X press-ons — maximum drama and detail.', price: 15000, image: '/images/products/nude-set.jpg.jpg' },
    ],
  },
  {
    id: 'simple-overlay',
    title: 'Simple Overlay Press-On Nails (Hard Gel / Polygel)',
    description:
      'Timeless press-on nails reinforced with a hard gel or polygel overlay for extra strength and durability. Finished with simple, neat designs that give a clean and polished appearance — perfect for everyday elegance.',
    image: '/images/products/custom-long.jpg.jpg',
    products: [
      { id: 'so-short', name: 'Simple Overlay — Short', description: 'Short hard gel / polygel press-ons with a neat, polished finish.', price: 13000, image: '/images/products/nude-set.jpg.jpg' },
      { id: 'so-medium', name: 'Simple Overlay — Medium', description: 'Medium overlay press-ons. Durable and clean for everyday wear.', price: 15000, image: '/images/products/glossy-red.jpg.jpg' },
      { id: 'so-long', name: 'Simple Overlay — Long', description: 'Long overlay press-ons for added strength and elegance.', price: 16500, image: '/images/products/custom-long.jpg.jpg' },
      { id: 'so-xl', name: 'Simple Overlay — XL', description: 'Extra-long overlay press-ons. +₦1,000 for extended length.', price: 18000, image: '/images/products/freehand-art.jpg.jpg' },
    ],
  },
  {
    id: 'luxury-overlay',
    title: 'Luxury Overlay Press-On Nails (Polygel — Complex Designs)',
    description:
      'Show-stopping polygel press-on nails with elaborate designs, 3D art, chrome finishes, and embellishments. Built for durability with the wow-factor of a luxury salon set. Fully customizable to your vision of soft glam and elegance.',
    image: '/images/products/marble-luxe.jpg',
    products: [
      { id: 'lo-short', name: 'Luxury Overlay — Short', description: 'Short polygel press-ons with luxury art and embellishments.', price: 15000, image: '/images/products/marble-luxe.jpg' },
      { id: 'lo-medium', name: 'Luxury Overlay — Medium', description: 'Medium luxury overlay with chrome, 3D art, or custom designs.', price: 17500, image: '/images/products/freehand-art.jpg.jpg' },
      { id: 'lo-long', name: 'Luxury Overlay — Long', description: 'Long luxury polygel press-ons. Maximum detail and style.', price: 20000, image: '/images/products/custom-long.jpg.jpg' },
      { id: 'lo-xl', name: 'Luxury Overlay — XL', description: 'Extra-long luxury overlay press-ons — the ultimate statement set.', price: 25000, image: '/images/products/nude-set.jpg.jpg' },
    ],
  },
];

const retailCategories = [
  {
    id: 'aftercare',
    title: 'Nail Care & Aftercare',
    description: 'Keep your nails healthy and beautiful between appointments. These professional-grade products hydrate, strengthen, and protect your nails daily.',
    products: [
      { id: 'rc-cuticle-oil', name: 'Cuticle Oil (10ml)', description: 'Hydrates cuticles and prevents dryness for healthy nail growth.', price: 2500, stock: 15, image: 'https://images.pexels.com/photos/6954633/pexels-photo-6954633.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-hand-cream', name: 'Hand Cream & Lotion (100ml)', description: 'Keeps hands soft and moisturized after manicures.', price: 3000, stock: 10, image: 'https://images.pexels.com/photos/286951/pexels-photo-286951.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-nail-strengthener', name: 'Nail Strengthener & Growth Serum', description: 'Improves weak or brittle nails with a strengthening formula.', price: 3500, stock: 8, image: 'https://images.pexels.com/photos/3609620/pexels-photo-3609620.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-remover-acetone', name: 'Nail Polish Remover (Acetone)', description: 'Fast-acting acetone remover for gel and regular polish.', price: 1500, stock: 20, image: 'https://images.pexels.com/photos/1373747/pexels-photo-1373747.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-hand-mask', name: 'Moisturizing Hand Mask (Pack of 3)', description: 'Deep-moisture glove masks for soft, rejuvenated hands.', price: 2000, stock: 10, image: 'https://images.pexels.com/photos/3738377/pexels-photo-3738377.jpeg?auto=compress&cs=tinysrgb&w=400' },
    ],
  },
  {
    id: 'polish-enhancement',
    title: 'Nail Polish & Enhancements',
    description: 'Salon-quality polishes and enhancement products to maintain beautiful nails at home. From classic colours to gel finishes.',
    products: [
      { id: 'rc-gel-polish', name: 'Gel Nail Polish', description: 'Long-lasting gel polish for a glossy, chip-free finish.', price: 3000, stock: 18, image: 'https://images.pexels.com/photos/29229021/pexels-photo-29229021.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-matte-topcoat', name: 'Matte Top Coat', description: 'Transform any polish into a trendy matte finish.', price: 2000, stock: 12, image: 'https://images.pexels.com/photos/6446797/pexels-photo-6446797.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-glossy-topcoat', name: 'Glossy Top Coat', description: 'High-shine top coat for a salon-quality glossy seal.', price: 2000, stock: 15, image: 'https://images.pexels.com/photos/3997347/pexels-photo-3997347.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-builder-gel', name: 'Builder Gel Kit', description: 'Professional builder gel for nail extensions and overlays at home.', price: 7000, stock: 4, image: 'https://images.pexels.com/photos/2533311/pexels-photo-2533311.jpeg?auto=compress&cs=tinysrgb&w=400' },
    ],
  },
  {
    id: 'nail-art',
    title: 'Nail Art Supplies',
    description: 'Get creative with your nails. These high-profit art supplies let you personalize your manicure with stunning designs.',
    products: [
      { id: 'rc-stickers', name: 'Nail Stickers & Decals (Sheet)', description: 'Easy-to-apply decorative stickers in assorted designs.', price: 800, stock: 30, image: 'https://images.pexels.com/photos/6429663/pexels-photo-6429663.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-rhinestones', name: 'Rhinestones & Glitter Set', description: 'Mixed rhinestones, glitter, and foils for dazzling nail art.', price: 1500, stock: 20, image: 'https://images.pexels.com/photos/6806707/pexels-photo-6806707.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-art-brushes', name: 'Nail Art Brush Set', description: 'Professional fine-tip brushes for detailed freehand nail art.', price: 2500, stock: 10, image: 'https://images.pexels.com/photos/2303797/pexels-photo-2303797.jpeg?auto=compress&cs=tinysrgb&w=400' },
    ],
  },
  {
    id: 'tools-accessories',
    title: 'Nail Tools & Accessories',
    description: 'Essential tools for home nail maintenance. Extend the life of your manicure and keep nails in shape between salon visits.',
    products: [
      { id: 'rc-file-buffer', name: 'Nail File & Buffer Set(5)', description: 'Double-sided files and buffers for smooth shaping and shine.', price: 1000, stock: 20, image: 'https://images.pexels.com/photos/3997377/pexels-photo-3997377.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-manicure-kit', name: 'Manicure Kit (5-Piece)', description: 'Compact kit with clippers, file, pusher, scissors, and buffer.', price: 3500, stock: 8, image: 'https://images.pexels.com/photos/3997390/pexels-photo-3997390.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-toe-separators', name: 'Toe Separators (Pair)', description: 'Soft foam separators for comfortable pedicures.', price: 500, stock: 30, image: 'https://images.pexels.com/photos/5240726/pexels-photo-5240726.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-cuticle-tools', name: 'Cuticle Pusher, Remover & Nipper Set', description: 'Stainless steel cuticle tools and remover for clean, safe cuticle care.', price: 10000, stock: 12, image: 'https://images.pexels.com/photos/3997385/pexels-photo-3997385.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-uv-lamp', name: 'Mini UV/LED Nail Lamp', description: 'Portable UV/LED lamp for curing gel polish at home.', price: 8000, stock: 4, image: 'https://images.pexels.com/photos/7755296/pexels-photo-7755296.jpeg?auto=compress&cs=tinysrgb&w=400' },
    ],
  },
  {
    id: 'hand-foot-care',
    title: 'Hand & Foot Care',
    description: 'Spa-quality products for complete hand and foot pampering. Perfect for self-care routines and maintaining soft, healthy skin.',
    products: [
      { id: 'rc-foot-scrub', name: 'Foot Scrub', description: 'Exfoliating foot scrub to remove dead skin and rough patches.', price: 2500, stock: 10, image: 'https://images.pexels.com/photos/6634660/pexels-photo-6634660.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-pumice-stone', name: 'Pumice Stone', description: 'Natural pumice stone for smoothing calluses and rough heels.', price: 800, stock: 15, image: 'https://images.pexels.com/photos/5240623/pexels-photo-5240623.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-callus-remover', name: 'Callus Remover Gel', description: 'Fast-acting gel that softens and removes tough calluses.', price: 2000, stock: 8, image: 'https://images.pexels.com/photos/6628700/pexels-photo-6628700.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-foot-mask', name: 'Hand & Foot Mask (Pack of 3)', description: 'Deep-moisture masks for baby-soft hands and feet.', price: 2500, stock: 10, image: 'https://images.pexels.com/photos/3321416/pexels-photo-3321416.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-pedicure-kit', name: 'Pedicure Kit', description: 'Complete pedicure set with file, buffer, scrub brush, and separator.', price: 4500, stock: 6, image: 'https://images.pexels.com/photos/3993398/pexels-photo-3993398.jpeg?auto=compress&cs=tinysrgb&w=400' },
    ],
  },
  {
    id: 'gift-bundles',
    title: 'Gift Sets & Bundles',
    description: 'Thoughtfully curated bundles that make perfect gifts — or a treat for yourself. Great value and beautifully packaged.',
    products: [
      { id: 'rc-starter-kit', name: 'Nail Care Starter Kit', description: 'Cuticle oil + hand cream + nail strengthener — everything to start.', price: 7500, stock: 5, image: 'https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-polish-gift', name: 'Polish Lovers Gift Set', description: '3 trending polishes + glossy top coat in a gift box.', price: 6000, stock: 6, image: 'https://images.pexels.com/photos/865635/pexels-photo-865635.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-diy-art-kit', name: 'DIY Nail Art Kit for Beginners', description: 'Brushes, stickers, rhinestones, and dotting tools — all-in-one.', price: 5000, stock: 8, image: 'https://images.pexels.com/photos/34121866/pexels-photo-34121866.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { id: 'rc-selfcare-bundle', name: 'Self-Care Bundle', description: 'Hand mask + foot scrub + cuticle oil — the ultimate pamper pack.', price: 6500, stock: 4, image: 'https://images.pexels.com/photos/374071/pexels-photo-374071.jpeg?auto=compress&cs=tinysrgb&w=400' },
    ],
  },
];

// ── Seed logic ────────────────────────────────────────────────────────
async function seed() {
  console.log('Seeding Firestore...\n');

  // Product categories (press-on nails)
  for (let i = 0; i < productCategories.length; i++) {
    const cat = productCategories[i];
    const docData = {
      title: cat.title,
      description: cat.description,
      image: cat.image,
      order: i,
      products: cat.products,
    };
    if (cat.note) docData.note = cat.note;
    if (cat.readyMade) docData.readyMade = true;

    await setDoc(doc(db, 'productCategories', cat.id), docData);
    console.log(`  ✓ productCategories/${cat.id}`);
  }

  // Retail categories
  for (let i = 0; i < retailCategories.length; i++) {
    const cat = retailCategories[i];
    const docData = {
      title: cat.title,
      description: cat.description,
      order: i,
      products: cat.products,
    };

    await setDoc(doc(db, 'retailCategories', cat.id), docData);
    console.log(`  ✓ retailCategories/${cat.id}`);
  }

  console.log('\nDone! All data seeded to Firestore.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
