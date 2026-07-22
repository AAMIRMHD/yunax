import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, User } from 'lucide-react';
import AccountDropdown from './AccountDropdown';
import { getStoredCartItems, reconcileStoredCartWithCatalog } from '../lib/cart';
import { fadeUpChild, staggerContainer } from '../lib/motion';

const links = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Products', href: '/products' },
  { label: 'GPUs', href: '/gpus' },
  { label: 'Contact', href: '/contact' },
];

const Navbar = () => {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      setUser(null);
    }

    const loadCartCount = () => {
      try {
        const list = getStoredCartItems();
        const count = list.reduce((sum, i) => sum + (i.qty || 1), 0);
        setCartCount(count);
      } catch (e) {
        setCartCount(0);
      }
    };

    const syncCartCount = async () => {
      await reconcileStoredCartWithCatalog();
      loadCartCount();
    };

    loadCartCount();
    syncCartCount();

    const onStorage = (e) => {
      if (e.key === 'cartItems') loadCartCount();
    };
    const onCustom = () => loadCartCount();
    window.addEventListener('storage', onStorage);
    window.addEventListener('cart-updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('cart-updated', onCustom);
    };
  }, []);

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        solid ? 'border-b border-slate-200/50 bg-white/90 shadow-md backdrop-blur-xl' : 'border-b border-white/20 bg-white/40 shadow-sm backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-slate-800 sm:px-6 sm:py-4">
        <a href="/" className="flex items-center gap-3 rounded-full border border-white/70 bg-white px-3 py-2 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md">
          <img src="/logo/logo.png" alt="Yunax Digital logo" className="h-9 w-auto object-contain drop-shadow-sm sm:h-10" />
        </a>

        <motion.div
          className="hidden md:flex items-center gap-6 text-sm"
          variants={staggerContainer(0.08, 0.15)}
          initial="hidden"
          animate="visible"
        >
          {links.map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              variants={fadeUpChild}
              className="relative pb-1 group text-slate-700 hover:text-slate-900 font-semibold transition-colors duration-300"
            >
              {link.label}
              <span className="absolute left-0 -bottom-1 h-[2px] w-full scale-x-0 group-hover:scale-x-100 bg-gradient-to-r from-[#0ea5e9] to-[#f6a600] origin-left transition-transform duration-300" />
            </motion.a>
          ))}
        </motion.div>

        <div className="hidden lg:flex items-center gap-3">
          <a
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(15,23,42,0.15)] transition-all duration-300 hover:bg-slate-800 hover:scale-105 hover:shadow-lg"
          >
            Consultation
          </a>
          <a
            href="/cart"
            className="relative inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-800 transition-all duration-300 hover:border-slate-300 hover:scale-105 hover:bg-white"
          >
            <ShoppingCart size={16} /> Cart
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 h-5 min-w-[20px] px-1 rounded-full bg-slate-900 text-white text-[11px] font-semibold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </a>
          {user && (
            <a
              href="/wishlist"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-800 transition-all duration-300 hover:border-slate-300 hover:scale-105 hover:bg-white"
            >
              <Heart size={16} /> Wishlist
            </a>
          )}
          {user ? (
            <AccountDropdown user={user} />
          ) : (
            <a
              href="/login"
              className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-800 transition-all duration-300 hover:border-slate-300 hover:scale-105 hover:bg-white"
            >
              Login
            </a>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {user && (
            <a
              href="/wishlist"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-800 shadow-sm"
              aria-label="Open wishlist"
            >
              <Heart size={17} />
            </a>
          )}
          <a
            href="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-800 shadow-sm"
            aria-label="Open cart"
          >
            <ShoppingCart size={17} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </a>
          <a
            href={user ? '/account' : '/login'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-800 shadow-sm"
            aria-label={user ? 'Open account profile' : 'Log in'}
          >
            <User size={17} />
          </a>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 shadow-sm md:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="w-5 h-[2px] bg-slate-800 block relative">
              <span className={`absolute left-0 top-[-6px] w-5 h-[2px] bg-slate-800 transition ${open ? 'rotate-45 translate-y-[6px]' : ''}`} />
              <span className={`absolute left-0 top-[6px] w-5 h-[2px] bg-slate-800 transition ${open ? '-rotate-45 -translate-y-[6px]' : ''}`} />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 md:hidden sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-lg flex flex-col divide-y divide-slate-200 overflow-hidden">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-3 text-sm text-slate-800 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/contact"
              className="px-4 py-3 text-sm font-semibold text-slate-900 bg-gradient-to-r from-[#0ea5e9]/15 to-[#f6a600]/15 hover:from-[#0ea5e9]/25 hover:to-[#f6a600]/25"
              onClick={() => setOpen(false)}
            >
              Secure My Business
            </a>
            <a
              href="/cart"
              className="px-4 py-3 text-sm text-slate-800 hover:bg-slate-50 flex items-center gap-2"
              onClick={() => setOpen(false)}
            >
              <ShoppingCart size={16} /> Cart {cartCount > 0 ? `(${cartCount})` : ''}
            </a>
            {user && (
              <a
                href="/wishlist"
                className="px-4 py-3 text-sm text-slate-800 hover:bg-slate-50 flex items-center gap-2"
                onClick={() => setOpen(false)}
              >
                <Heart size={16} /> Wishlist
              </a>
            )}
            {!user ? (
              <a
                href="/login"
                className="px-4 py-3 text-sm text-slate-800 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                Login
              </a>
            ) : (
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/';
                }}
                className="px-4 py-3 text-sm text-left text-red-600 hover:bg-slate-50"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </motion.nav>
  );
};

export default Navbar;
