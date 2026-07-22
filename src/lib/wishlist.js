import { API } from './api';
import { addProductToStoredCart } from './cart';

export const getAuthToken = () => {
  try {
    return localStorage.getItem('token');
  } catch (err) {
    return null;
  }
};

const parseResponse = async (res) => {
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error || 'Wishlist request failed');
  return Array.isArray(payload) ? payload : [];
};

export const loadWishlist = async () => {
  const token = getAuthToken();
  if (!token) return [];
  const res = await fetch(`${API}/auth/me/wishlist`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(res);
};

export const addToWishlist = async (product) => {
  const token = getAuthToken();
  if (!token) throw new Error('Please log in to save items to your wishlist.');
  const res = await fetch(`${API}/auth/me/wishlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      productId: product._id || product.id || product.productId || '',
      slug: product.slug,
    }),
  });
  return parseResponse(res);
};

export const removeFromWishlist = async (slug) => {
  const token = getAuthToken();
  if (!token) throw new Error('Please log in to update your wishlist.');
  const res = await fetch(`${API}/auth/me/wishlist/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(res);
};

export const moveWishlistItemToCart = async (item) => {
  addProductToStoredCart({
    ...item,
    images: item.image ? [item.image] : item.images || [],
  });
  return removeFromWishlist(item.slug);
};
