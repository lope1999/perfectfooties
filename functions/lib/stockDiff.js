/**
 * Compare old and new product arrays to find products that were restocked.
 *
 * @param {Array<{ id: string, name: string, stock?: number }>} oldProducts
 * @param {Array<{ id: string, name: string, stock?: number }>} newProducts
 * @returns {Array<{ id: string, name: string }>} Products that went from stock <= 0 to stock > 0
 */
function findRestockedProducts(oldProducts = [], newProducts = []) {
  const oldMap = new Map();
  for (const p of oldProducts) {
    oldMap.set(p.id, p);
  }

  const restocked = [];

  for (const newP of newProducts) {
    if (newP.stock == null || newP.stock <= 0) continue;

    const oldP = oldMap.get(newP.id);
    if (!oldP) continue; // new product, not a restock

    const oldStock = oldP.stock ?? 0;
    if (oldStock <= 0) {
      restocked.push({ id: newP.id, name: newP.name });
    }
  }

  return restocked;
}

module.exports = { findRestockedProducts };
