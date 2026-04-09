import { LogOut, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/admin', match: (path) => path === '/admin' || path.startsWith('/admin/dashboard') },
  { label: 'Products', href: '/admin/products', match: (path) => path.startsWith('/admin/products') },
  { label: 'Orders', href: '/admin/orders', match: (path) => path.startsWith('/admin/orders') },
  { label: 'Users', href: '/admin/users', match: (path) => path.startsWith('/admin/users') },
];

const AdminLayout = ({ title, description, children }) => {
  const [path, setPath] = useState('/');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);

  useEffect(() => {
    setPath(window.location.pathname);
    try {
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      const role = user?.role || '';
      if (role !== 'admin') {
        setIsAdmin(false);
        window.location.href = '/';
      }
    } catch {
      setIsAdmin(false);
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 shadow-sm transform transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="h-16 px-6 flex items-center border-b border-slate-200">
          <div className="text-lg font-semibold tracking-tight">YunaX Admin</div>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const active = item.match(path);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <span>{item.label}</span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Go</span>
              </a>
            );
          })}
        </nav>
        <div className="absolute bottom-0 inset-x-0 p-4 border-t border-slate-200 bg-white/90">
          <button
            onClick={() => {
              try {
                localStorage.removeItem('token');
                window.location.href = '/login';
              } catch (e) {
                console.error(e);
              }
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 hover:border-slate-300"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 lg:ml-0 ml-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 text-slate-700"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <Menu size={18} />
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Admin</p>
              <h1 className="text-lg font-semibold leading-tight">{title}</h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-500">YunaX</p>
              <p className="text-sm font-semibold">Team Console</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-white grid place-items-center text-sm font-semibold">
              YX
            </div>
          </div>
        </header>

        <main className="px-4 lg:px-8 py-8 space-y-8">
          {description ? <p className="text-slate-600 text-sm max-w-3xl">{description}</p> : null}
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
