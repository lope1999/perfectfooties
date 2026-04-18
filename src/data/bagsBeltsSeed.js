export const BAGS_BELTS_COLLECTION = {
  id: 'bags-belts',
  name: 'Handmade Bags & Belts',
  description: 'Full-grain leather bags and belts, finished by hand in Gbagada, Lagos.',
  coverImage: '/images/products/heirloom-tmt-1.jpg',
  order: 4,
  active: true,
};

export const BAGS_BELTS_ITEMS = [
  {
    name: 'TMT — The Majesty Tote Bag',
    description: 'A signature PF piece created for women who value space, structure, and timeless elegance. Spacious interior, premium structured finish, comes with a longer strap, custom PF key holder, PF pop socket, and a beautifully printed vintage scarf. Perfect for work, travel, and elevated everyday wear.',
    price: 49999,
    colors: ['Black', 'Brown'],
    images: Array.from({ length: 6 }, (_, i) => `/images/products/heirloom-tmt-${i + 1}.jpg`),
    status: 'open',
    requiresLength: false,
    colorStock: {},
    orderCount: 0,
  },
];
