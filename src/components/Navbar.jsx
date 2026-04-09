import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import AccountDropdown from './AccountDropdown';

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
    } catch {
      setUser(null);
    }
    const loadCartCount = () => {
      try {
        const raw = localStorage.getItem('cartItems');
        const list = raw ? JSON.parse(raw) : [];
        const count = list.reduce((sum, i) => sum + (i.qty || 1), 0);
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };
    loadCartCount();
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
      className={`fixed top-0 inset-x-0 z-40 ${solid ? 'backdrop-blur-xl bg-white/85 shadow-lg border-b border-slate-200/70' : 'bg-transparent'}`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4 text-slate-800">
        <a href="/" className="flex items-center gap-3">
          <img src="/logo/logo.png" alt="Yunax Digital logo" className="h-10 w-auto object-contain drop-shadow-sm" />
        </a>

        <div className="hidden md:flex items-center gap-6 text-sm">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative pb-1 group text-slate-700 hover:text-slate-900"
            >
              {link.label}
              <span className="absolute left-0 -bottom-1 h-[2px] w-full scale-x-0 group-hover:scale-x-100 bg-gradient-to-r from-[#0ea5e9] to-[#f6a600] origin-left transition-transform duration-300" />
            </a>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#f6a600] text-black font-semibold shadow-[0_10px_30px_rgba(14,165,233,0.35)] hover:shadow-[0_10px_40px_rgba(246,166,0,0.35)] transition"
          >
            Secure My Business
          </a>
          <a
            href="/cart"
            className="relative px-3 py-2 text-sm rounded-full border border-slate-200 text-slate-800 hover:border-slate-300 inline-flex items-center gap-2"
          >
            <ShoppingCart size={16} /> Cart
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 h-5 min-w-[20px] px-1 rounded-full bg-slate-900 text-white text-[11px] font-semibold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </a>
          {user ? (
            <AccountDropdown user={user} />
          ) : (
            <a
              href="/login"
              className="px-4 py-2 text-sm rounded-full border border-slate-200 text-slate-800 hover:border-slate-300"
            >
              Login
            </a>
          )}
        </div>

        <button
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white/70 shadow-sm"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="w-5 h-[2px] bg-slate-800 block relative">
            <span className={`absolute left-0 top-[-6px] w-5 h-[2px] bg-slate-800 transition ${open ? 'rotate-45 translate-y-[6px]' : ''}`} />
            <span className={`absolute left-0 top-[6px] w-5 h-[2px] bg-slate-800 transition ${open ? '-rotate-45 -translate-y-[6px]' : ''}`} />
          </span>
        </button>
      </div>

      {open && (
        <div className="md:hidden px-6 pb-4">
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
