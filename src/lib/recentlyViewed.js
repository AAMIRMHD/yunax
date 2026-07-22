const KEY = 'recentlyViewedProducts';
const LIMIT = 8;

export const getRecentlyViewed = () => {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
};

export const trackRecentlyViewed = (product) => {
  if (!product?.slug) return;
  try {
    const item = {
      slug: product.slug,
      name: product.name || '',
      category: product.category || '',
      brand: product.brand || '',
      priceCents: product.priceCents || 0,
      image: Array.isArray(product.images) ? product.images.find(Boolean) || '' : '',
      viewedAt: Date.now(),
    };
    const next = [item, ...getRecentlyViewed().filter((entry) => entry.slug !== item.slug)].slice(0, LIMIT);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (err) {
    // Recently viewed is a convenience feature; storage failure should not block browsing.
  }
};
