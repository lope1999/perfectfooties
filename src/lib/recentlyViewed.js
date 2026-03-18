const KEY = 'chizzystyles-recently-viewed';
const MAX = 6;

export function addRecentlyViewed({ id, categoryId, name, price, image, type }) {
  try {
    const existing = getRecentlyViewed().filter(
      (p) => !(p.id === id && p.categoryId === categoryId)
    );
    const updated = [
      { id, categoryId, name, price, image, type, viewedAt: Date.now() },
      ...existing,
    ].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
}

export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}
