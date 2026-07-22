import { API } from './api';

export const getStoredCartItems = () => {
  try {
    const raw = localStorage.getItem('cartItems');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const saveStoredCartItems = (items = []) => {
  try {
    localStorage.setItem('cartItems', JSON.stringify(items));
    window.dispatchEvent(new Event('cart-updated'));
  } catch (err) {
    console.error(err);
  }
};

export const addProductToStoredCart = (product) => {
  const existing = getStoredCartItems();
  const already = existing.find((item) => item.slug === product.slug);

  if (already) {
    already.qty = (already.qty || 1) + 1;
  } else {
    existing.push({
      slug: product.slug,
      productId: product.productId || product._id || product.id,
      name: product.name,
      spec: product.spec || product.description || product.category,
      category: product.category,
      images: Array.isArray(product.images) ? product.images.filter(Boolean) : [],
      priceCents: product.priceCents || 0,
      qty: 1,
    });
  }

  saveStoredCartItems(existing);
};

export const reconcileStoredCartWithCatalog = async () => {
  const currentItems = getStoredCartItems();
  if (!currentItems.length) return [];

  try {
    const res = await fetch(`${API}/products`);
    if (!res.ok) throw new Error('Failed to load products');
    const products = await res.json();
    const productMap = new Map(
      (Array.isArray(products) ? products : []).map((product) => [product.slug, product])
    );

    const validItems = currentItems
      .map((item) => {
        const product = productMap.get(item.slug);
        if (!product) return null;
        return {
          ...item,
          productId: product._id || product.id || item.productId,
          name: product.name || item.name,
          spec: product.description || product.category || item.spec,
          category: product.category || item.category,
          images: Array.isArray(product.images) ? product.images.filter(Boolean) : item.images || [],
          priceCents: product.priceCents ?? item.priceCents ?? 0,
          qty: Math.max(1, item.qty || 1),
        };
      })
      .filter(Boolean);

    const changed =
      validItems.length !== currentItems.length ||
      validItems.some((item, index) => JSON.stringify(item) !== JSON.stringify(currentItems[index]));

    if (changed) {
      saveStoredCartItems(validItems);
    }

    return validItems;
  } catch (e) {
    return currentItems;
  }
};
