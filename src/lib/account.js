export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const saveStoredUser = (user) => {
  try {
    localStorage.setItem('user', JSON.stringify(user));
  } catch (e) {
    // Ignore storage failures; callers still keep in-memory state.
  }
};

export const getAccountKey = (user) => {
  if (user?.id) return `user:${user.id}`;
  if (user?._id) return `user:${user._id}`;
  if (user?.email) return `email:${String(user.email).trim().toLowerCase()}`;
  return 'guest';
};

export const getAddressBook = (userKey = 'guest') => {
  try {
    const raw = localStorage.getItem(`addresses:${userKey}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveAddressBook = (userKey = 'guest', addresses = []) => {
  try {
    localStorage.setItem(`addresses:${userKey}`, JSON.stringify(addresses));
  } catch (e) {
    // Ignore storage failures; callers still keep in-memory state.
  }
};

export const migrateAddressBook = (user) => {
  const stableKey = getAccountKey(user);
  const legacyKeys = [
    user?.email || '',
    user?.id || '',
    user?._id || '',
    user?.email ? `email:${String(user.email).trim().toLowerCase()}` : '',
  ].filter(Boolean);

  try {
    const stableAddresses = getAddressBook(stableKey);
    if (stableAddresses.length > 0) return stableAddresses;

    for (const legacyKey of legacyKeys) {
      if (legacyKey === stableKey) continue;
      const legacyAddresses = getAddressBook(legacyKey);
      if (legacyAddresses.length > 0) {
        saveAddressBook(stableKey, legacyAddresses);
        return legacyAddresses;
      }
    }
  } catch (e) {
    return [];
  }

  return [];
};

export const addItemsToCart = (items = []) => {
  const raw = localStorage.getItem('cartItems');
  const existing = raw ? JSON.parse(raw) : [];

  items.forEach((item) => {
    const match = existing.find((entry) => entry.slug === item.slug);
    if (match) {
      match.qty = (match.qty || 1) + (item.qty || item.quantity || 1);
      return;
    }

    existing.push({
      slug: item.slug,
      productId: item.productId || item._id || item.id,
      name: item.name,
      spec: item.spec || item.description || item.category,
      category: item.category,
      images: Array.isArray(item.images) ? item.images.filter(Boolean) : [],
      priceCents: item.priceCents || 0,
      qty: item.qty || item.quantity || 1,
    });
  });

  localStorage.setItem('cartItems', JSON.stringify(existing));
  window.dispatchEvent(new Event('cart-updated'));
};
