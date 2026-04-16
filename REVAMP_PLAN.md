# PerfectFooties Shop — Revamp Plan
> Based on the Chizzysstyles eshop codebase. Follow each phase in order.

---

## What this app becomes
A clean e-commerce store for handmade leather goods (shoes, belts, bags, wallets, accessories).
- Product categories replace nail collections
- Size/colour/material selectors replace nail shape/length/bed size inputs
- Paystack checkout stays identical
- Auth, loyalty, referral, admin orders — all kept
- Services, appointments, booking — fully removed

---

## Phase 1 — Branding & Colour Scheme

### 1A. Update `index.html`
- Change `<title>` from `Chizzysstyles` to `PerfectFooties`
- Update meta description and og:tags
- Update favicon (replace with a shoe/leather icon)

### 1B. Update CSS variables in `src/index.css`
Replace the pink/purple palette with leather tones:
```css
/* Suggested leather palette */
--color-primary: #8B4513;       /* saddle brown — replaces #E91E8C */
--color-primary-dark: #5C2D0A;  /* dark brown — replaces #C2185B */
--color-secondary: #3E1F00;     /* deep chocolate — replaces #4A0E4E */
--color-accent: #C9A84C;        /* brass/gold — replaces #F0C0D0 */
--color-bg-light: #FDF8F0;      /* warm cream — replaces #FFF0F5 */
--color-border: #E8D5B0;        /* tan border — replaces #F0C0D0 */
--text-main: #1A1A1A;
--text-muted: #6B5B45;
--text-purple: #3E1F00;         /* reuse var name, new value */
```
Then do a find-and-replace across all JSX files:
- `#E91E8C` → `var(--color-primary)` or `#8B4513`
- `#4A0E4E` → `var(--color-secondary)` or `#3E1F00`
- `#FFF0F5` → `var(--color-bg-light)` or `#FDF8F0`
- `#F0C0D0` → `var(--color-border)` or `#E8D5B0`

### 1C. Update constants across the codebase
In every file that has these, update:
```js
const WHATSAPP_NUMBER = 'your-new-number';
const BUSINESS_EMAIL = 'your-new-email';
```

---

## Phase 2 — Delete Nail/Service Specific Files

### 2A. Delete these page files entirely
```
src/pages/ServiceMenuPage.jsx
src/pages/ServiceDetailPage.jsx
src/pages/BookAppointmentPage.jsx
src/pages/RescheduleAppointmentPage.jsx
src/pages/GroupBookingPage.jsx
src/pages/NailCarePage.jsx
src/pages/NailShopPage.jsx
src/pages/ProductsMenuPage.jsx
src/pages/PressOnCategoryPage.jsx
src/pages/PressOnDetailPage.jsx
```

### 2B. Delete these nail-specific components
```
src/components/NailBedSizeInput.jsx
src/components/NailShapeSelector.jsx
src/components/NailLengthSelector.jsx
src/components/PresetSizeGuide.jsx
src/components/FlashSaleCountdown.jsx   (keep if you want flash sales)
```

### 2C. Delete or clear these data files
```
src/data/customPressOnOptions.js   → delete entirely
src/data/products.js               → replace with leather product categories
```

Replace `src/data/products.js` with:
```js
// Leather product categories shown on the shop landing page
export const LEATHER_CATEGORIES = [
  { id: 'shoes',       label: 'Shoes',       emoji: '👟', description: 'Handcrafted leather footwear' },
  { id: 'belts',       label: 'Belts',       emoji: '🪢', description: 'Full-grain leather belts' },
  { id: 'bags',        label: 'Bags',        emoji: '👜', description: 'Tote bags, shoulder bags & more' },
  { id: 'wallets',     label: 'Wallets',     emoji: '👛', description: 'Slim wallets & cardholders' },
  { id: 'accessories', label: 'Accessories', emoji: '✨', description: 'Keyrings, straps & small goods' },
];

export const LEATHER_MATERIALS = [
  'Full-grain leather',
  'Top-grain leather',
  'Suede',
  'Nubuck',
  'Vegetable-tanned',
  'Crocodile-embossed',
];

export const SHOE_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
export const BELT_SIZES = ['XS (28-30")', 'S (30-32")', 'M (32-34")', 'L (34-36")', 'XL (36-38")', 'XXL (38-40")'];
export const BAG_COLOURS = ['Chocolate Brown', 'Tan', 'Black', 'Cognac', 'Navy', 'Burgundy', 'Natural'];
```

---

## Phase 3 — Remove Service Routes from App.jsx

Open `src/App.jsx` and:
1. Remove all imports for deleted pages
2. Remove these routes:
   - `/services`, `/services/:serviceId`
   - `/book`, `/reschedule`
   - `/group-booking`
   - `/order`, `/shop`
   - `/products`, `/products/:categoryId`, `/products/:categoryId/:productId`
   - `/nail-care`
3. The `/collections` and `/collections/:collectionId` routes stay — these become your main shop
4. Rename the route path from `/collections` to `/shop` if desired:
```jsx
<Route path="/shop" element={<ShopPage />} />
<Route path="/shop/:categoryId" element={<CategoryPage />} />
```

---

## Phase 4 — Repurpose Collections Pages as the Shop

### 4A. Rename files (optional but clean)
```
src/pages/NicheCollectionsPage.jsx     → src/pages/ShopPage.jsx
src/pages/NicheCollectionDetailPage.jsx → src/pages/CategoryPage.jsx
src/lib/nicheCollectionService.js       → src/lib/productService.js
```

### 4B. Update `ShopPage.jsx` (was NicheCollectionsPage)
- Change header text from "Niche Collections" to "Shop"
- Change subtitle to describe leather goods
- Change season filter → category filter (Shoes, Belts, Bags, etc.)
- Remove nail-specific terminology throughout
- Card display stays the same — just update field labels:
  - `col.season` → `col.material` (e.g. "Full-grain leather")
  - `col.price` → stays as price
  - Status chips stay (open/upcoming/closed → available/coming soon/sold out)
- Remove `HowToMeasureModal` (nail-specific) — replace with a `SizeGuideModal` for shoes/belts

### 4C. Update `CategoryPage.jsx` (was NicheCollectionDetailPage)
This page shows an individual product category (e.g. Bags) with:
- Product images gallery — keep as is
- Replace nail form fields with leather product fields:

**Remove:**
- `NailShapeSelector`
- `NailLengthSelector`
- `NailBedSizeInput`
- `measureOpen` / HowToMeasureModal
- `nailMeasurements` state
- `requiresMeasurements` logic

**Add instead:**
```jsx
// Size selector (shoes use numbers, belts use S/M/L, bags don't need size)
const [selectedSize, setSelectedSize] = useState('');

// Colour selector
const [selectedColour, setSelectedColour] = useState('');

// Custom engraving / personalisation (optional)
const [engraving, setEngraving] = useState('');
```

- Render size buttons (like the existing preset size chips — same UI pattern)
- Render colour swatches or a colour dropdown
- Keep quantity selector
- Keep Paystack payment flow — only change `type: 'nicheCollection'` to `type: 'product'`
- Keep PostPaymentDialog (WhatsApp/email prompt after payment)

### 4D. Update `productService.js` (was nicheCollectionService)
- Rename Firestore collection from `nicheCollections` to `products` (or keep same if you don't want to re-seed data)
- Update function names: `fetchNicheCollections` → `fetchProducts`
- Update `incrementCollectionOrderCount` → `incrementProductOrderCount`

---

## Phase 5 — Update the Admin Panel

Open `src/pages/AdminPage.jsx`:

### 5A. Remove the Appointments tab completely
- Remove the `AppointmentsSection` import and tab
- Remove the appointments tab button from the tab bar
- Keep: Orders, Customers, Revenue, Products/Collections tabs

### 5B. Update order type labels in `OrdersSection.jsx`
- `nicheCollection` label → `product`
- Remove appointment-specific status options (`in progress`, `rescheduled`, `cancelled`)
- Order statuses for leather goods: `pending` → `confirmed` → `production` → `shipped` → `delivered`
- Update `orderStatusOptions` array:
```js
const orderStatusOptions = ['pending', 'confirmed', 'production', 'shipped', 'delivered'];
```
- Update shipping label template in `printShippingLabel()` — remove nail-specific text

### 5C. Update `src/lib/validate.js`
```js
const ALLOWED_ORDER_TYPES = new Set(['product', 'retail', 'mixed']);
// Remove: 'pressOn', 'service', 'nicheCollection'
```

---

## Phase 6 — Update Navigation & Footer

### 6A. Find your Navbar component (likely `src/components/Navbar.jsx` or similar)
Remove links:
- Services
- Book Appointment
- Press-ons / Products menu

Add links:
- Shop (`/shop`)
- Our Story (`/our-story`)
- Gallery (`/gallery`)
- Contact

### 6B. Update Footer
- Remove nail care, booking, services links
- Update brand name and description
- Update social links if different

---

## Phase 7 — Update Remaining Pages

### HomePage.jsx
- Replace hero image and headline
- Change CTAs from "Shop Press-Ons" / "Book Appointment" → "Shop Now" / "View Collections"
- Update any nail-specific sections

### OurStoryPage.jsx
- Update the brand story for leather goods
- Change certifications/skills section to leather craft background

### GalleryPage.jsx
- No structural changes — just swap out nail images for leather goods images in Firebase Storage

### TestimonialsPage.jsx
- No changes needed — reviews are dynamic from Firestore

### BlogPage.jsx
- No structural changes — update blog posts content in Firestore

### AccountPage.jsx
- Update order type display labels:
  - `nicheCollection` → `Leather Goods`
  - `pressOn` → remove or keep as legacy
- Remove nail bed size display if present
- Keep timestamps, order history, loyalty points — all stays

---

## Phase 8 — Update Email Templates

In `email-templates/all-templates.html`:
- Replace "Handcrafted press-ons, made with love" → "Handcrafted leather goods, made with love"
- Replace nail care tip in Template 4 with leather care tip:
  > **Leather care tip:** Wipe with a dry cloth after each use and apply leather conditioner monthly to maintain suppleness and colour.
- Update brand colour in the gradient from purple to brown
- Update all `chizzysstyles` references to `perfectfooties`
- Update Instagram/Website links

In `src/lib/emailService.js`:
- Template variables stay the same (`customer_name`, `order_id`, `order_total`, `order_items`)
- No structural changes needed

---

## Phase 9 — Firestore Data Structure

When you add products in the admin panel, each product document in the `products` collection should follow this shape:

```js
{
  name: 'The Somerset Belt',
  description: 'A clean, minimal belt for everyday wear.',
  material: 'Full-grain leather',           // replaces 'season'
  category: 'belts',                        // bags | shoes | belts | wallets | accessories
  price: 25000,                             // base price in NGN
  images: ['url1', 'url2', 'url3'],
  sizes: ['S (30-32")', 'M (32-34")', 'L (34-36")'],   // array
  colours: ['Chocolate Brown', 'Tan', 'Black'],          // array
  status: 'open',                           // open | upcoming | closed
  stock: null,                              // null = unlimited / made-to-order
  maxOrders: null,                          // null = no cap
  orderCount: 0,
  requiresSize: true,                       // replaces requiresMeasurements
  allowEngraving: false,                    // optional personalisation flag
  multiSetDiscount: false,
}
```

---

## Phase 10 — New Components to Build

### `SizeSelector.jsx`
Similar to NailShapeSelector but renders size chips (36, 37, 38... for shoes or S/M/L for belts).
Receives `sizes` array as prop, returns selected size.

### `ColourSelector.jsx`
Renders coloured circles or a dropdown for colour selection.
Receives `colours` array as prop, returns selected colour.

### `SizeGuideModal.jsx`
Replaces HowToMeasureModal. Shows:
- Shoe sizing guide (foot length in cm → size)
- Belt sizing guide (waist measurement → belt size)
- Bag dimensions reference

---

## Quick Reference — Files Changed Per Phase

| Phase | Files |
|-------|-------|
| 1 | `index.html`, `src/index.css`, all JSX (colour replace) |
| 2 | Delete 10 page files, 4 component files, 2 data files |
| 3 | `src/App.jsx` |
| 4 | `NicheCollectionsPage` → `ShopPage`, `NicheCollectionDetailPage` → `CategoryPage`, `nicheCollectionService` → `productService` |
| 5 | `AdminPage.jsx`, `OrdersSection.jsx`, `validate.js` |
| 6 | `Navbar.jsx`, `Footer.jsx` |
| 7 | `HomePage`, `OurStoryPage`, `AccountPage` |
| 8 | `email-templates/all-templates.html`, `emailService.js` |
| 9 | Firestore (no code — data setup in admin panel) |
| 10 | New: `SizeSelector.jsx`, `ColourSelector.jsx`, `SizeGuideModal.jsx` |

---

## Suggested Order of Work
1. Phase 2 first — delete everything you're removing (clean slate)
2. Phase 3 — fix App.jsx so the app doesn't crash on deleted imports
3. Phase 1 — rebrand colours and name
4. Phase 4 — repurpose the collections/shop pages (biggest work)
5. Phase 5 — clean up admin
6. Phase 6 + 7 — nav, footer, remaining pages
7. Phase 10 — build new components
8. Phase 8 — update email templates
9. Phase 9 — seed Firestore with first products via admin panel
