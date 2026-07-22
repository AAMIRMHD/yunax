import { useEffect, useState } from 'react';
import { Heart, Loader2, ShoppingCart, Trash2 } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { loadWishlist, moveWishlistItemToCart, removeFromWishlist } from './lib/wishlist';

const formatMoney = (value = 0) => `₹${Math.round(value / 100).toLocaleString('en-IN')}`;

const WishlistPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionSlug, setActionSlug] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setItems(await loadWishlist());
      } catch (err) {
        setMessage(err.message || 'Could not load wishlist.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const removeItem = async (item) => {
    try {
      setActionSlug(item.slug);
      setItems(await removeFromWishlist(item.slug));
      setMessage(`${item.name || 'Item'} removed from wishlist.`);
    } catch (err) {
      setMessage(err.message || 'Could not remove item.');
    } finally {
      setActionSlug('');
    }
  };

  const moveToCart = async (item) => {
    try {
      setActionSlug(item.slug);
      setItems(await moveWishlistItemToCart(item));
      setMessage(`${item.name || 'Item'} moved to cart.`);
    } catch (err) {
      setMessage(err.message || 'Could not move item to cart.');
    } finally {
      setActionSlug('');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Wishlist</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">Saved products</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Keep products here while you compare. Move them to cart when you are ready to checkout.
            </p>
          </div>
          <a href="/products" className="premium-button premium-button-secondary w-full text-sm md:w-auto">
            Browse products
          </a>
        </div>

        {message && (
          <div className="mt-6 rounded-[18px] border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {message}
          </div>
        )}

        {loading ? (
          <div className="mt-12 flex items-center gap-3 rounded-[24px] border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading wishlist...
          </div>
        ) : items.length === 0 ? (
          <div className="mt-12 rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
              <Heart className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">No saved products yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Tap the heart on a product to save it here. Wishlist items are stored in your account.
            </p>
            <a href="/products" className="premium-button premium-button-primary mt-6 inline-flex text-sm">
              Start shopping
            </a>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item.slug} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <a href={`/products/${item.slug}`} className="block overflow-hidden rounded-[20px] bg-slate-50">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-52 w-full object-contain p-5" />
                  ) : (
                    <div className="flex h-52 items-center justify-center text-2xl font-bold text-slate-300">
                      {item.name?.slice(0, 2)?.toUpperCase() || 'YN'}
                    </div>
                  )}
                </a>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{item.category || 'Product'}</p>
                  <a href={`/products/${item.slug}`} className="line-clamp-2 text-base font-semibold leading-6 text-slate-900 hover:text-blue-600">
                    {item.name}
                  </a>
                  <p className="text-lg font-bold text-slate-900">{formatMoney(item.priceCents)}</p>
                </div>

                <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
                  <button
                    type="button"
                    onClick={() => moveToCart(item)}
                    disabled={actionSlug === item.slug}
                    className="premium-button premium-button-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {actionSlug === item.slug ? 'Moving...' : 'Move to cart'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    disabled={actionSlug === item.slug}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={`Remove ${item.name} from wishlist`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default WishlistPage;
