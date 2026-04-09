import { useState, useRef, useEffect } from 'react';

const menuItems = [
  { label: 'My Profile', href: '/account' },
  { label: 'Orders', href: '/orders' },
  { label: 'Saved Addresses', href: '/account/addresses' },
  { label: 'Wishlist', href: '/account/wishlist' },
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
    (user?.name || user?.email || user?.phoneNumber || '')
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 text-sm text-slate-800 hover:border-slate-300"
      >
        <span className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">{initials}</span>
        <span className="hidden sm:inline-block truncate max-w-[120px]">{user?.email || user?.phoneNumber || 'Account'}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white shadow-lg p-2 text-sm">
          {menuItems.map((item) => (
            <a key={item.href} href={item.href} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50">
              {item.label}
            </a>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-xl text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountDropdown;
