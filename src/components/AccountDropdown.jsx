import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Package, MapPin, ShieldCheck, LogOut, ChevronDown, Heart } from 'lucide-react';

const menuItems = [
  { label: 'Account overview', href: '/account', icon: User },
  { label: 'Orders', href: '/orders', icon: Package },
  { label: 'Wishlist', href: '/wishlist', icon: Heart },
  { label: 'Saved addresses', href: '/account#addresses', icon: MapPin },
  { label: 'Payments & safety', href: '/account#payments', icon: ShieldCheck },
];

const AccountDropdown = ({ user }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const initials =
    (user?.name || user?.email || user?.phoneNumber || 'U')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="premium-panel inline-flex items-center gap-3 rounded-full px-2 py-2 pr-3 text-left transition-all hover:border-blue-200"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-xs font-bold text-white">
          {initials}
        </div>
        <div className="hidden min-w-0 lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-500">My account</p>
          <p className="max-w-[130px] truncate text-sm font-semibold text-slate-900">
            {user?.name || user?.email || 'Profile'}
          </p>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="premium-panel absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-[24px]"
          >
            <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-amber-50 px-5 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-sm font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'Welcome back'}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email || user?.phoneNumber || 'Signed in user'}</p>
                </div>
              </div>
            </div>

            <div className="p-3">
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-600 transition-all hover:bg-blue-50 hover:text-slate-900"
                  >
                    <item.icon size={17} className="text-blue-500" />
                    <span className="font-medium">{item.label}</span>
                  </a>
                ))}
              </div>

              <div className="mt-3 border-t border-slate-100 pt-3">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-rose-600 transition-all hover:bg-rose-50"
                >
                  <LogOut size={17} />
                  Sign out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountDropdown;
