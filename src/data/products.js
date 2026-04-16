// Leather product categories for the shop.
// `icon` values map to @mui/icons-material component names — used by ShopPage to render icons.

export const LEATHER_CATEGORIES = [
  {
    id: 'shoes',
    label: 'Shoes',
    icon: 'DirectionsWalk',        // @mui/icons-material/DirectionsWalk
    description: 'Handcrafted leather footwear',
  },
  {
    id: 'belts',
    label: 'Belts',
    icon: 'Style',                 // @mui/icons-material/Style
    description: 'Full-grain leather belts',
  },
  {
    id: 'bags',
    label: 'Bags',
    icon: 'ShoppingBag',           // @mui/icons-material/ShoppingBag
    description: 'Tote bags, shoulder bags & more',
  },
  {
    id: 'wallets',
    label: 'Wallets',
    icon: 'AccountBalanceWallet',  // @mui/icons-material/AccountBalanceWallet
    description: 'Slim wallets & cardholders',
  },
  {
    id: 'accessories',
    label: 'Accessories',
    icon: 'AutoAwesome',           // @mui/icons-material/AutoAwesome
    description: 'Keyrings, straps & small goods',
  },
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

export const BELT_SIZES = [
  'XS (28-30")',
  'S (30-32")',
  'M (32-34")',
  'L (34-36")',
  'XL (36-38")',
  'XXL (38-40")',
];

export const BAG_COLOURS = [
  'Chocolate Brown',
  'Tan',
  'Black',
  'Cognac',
  'Navy',
  'Burgundy',
  'Natural',
];
