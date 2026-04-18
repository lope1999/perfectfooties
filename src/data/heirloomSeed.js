const CARE =
  'Wipe clean with a soft dry cloth. Store in a dust bag when not in use. ' +
  'Avoid prolonged exposure to direct sunlight, heat, and moisture. ' +
  'Apply a quality leather conditioner monthly to maintain suppleness and sheen.';

export const HEIRLOOM_COLLECTION = {
  id: 'heirloom',
  name: 'Heirloom Collection',
  description: 'Timeless pieces designed to be passed down through generations.',
  coverImage: '/images/products/heirloom-regal-1.jpg',
  order: 3,
  active: true,
};

export const HEIRLOOM_ITEMS = [
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
  },
];
