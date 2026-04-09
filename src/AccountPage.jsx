import Navbar from './components/Navbar';
import Footer from './components/Footer';

const sections = [
  { label: 'My Profile', href: '/account/profile' },
  { label: 'Orders', href: '/orders' },
  { label: 'Saved Addresses', href: '/account/addresses' },
  { label: 'Wishlist', href: '/account/wishlist' },
  { label: 'Notifications', href: '/account/notifications' },
];

const AccountPage = () => {
  let user = null;
  try {
    const stored = localStorage.getItem('user');
    if (stored) user = JSON.parse(stored);
  } catch {
    user = null;
  }

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 pt-24 pb-16 space-y-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Account</p>
          <h1 className="text-3xl font-semibold">Your Dashboard</h1>
          <p className="text-slate-600">Welcome back {user?.name || user?.email || user?.phoneNumber || ''}</p>
        </header>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sections.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="rounded-2xl border border-slate-200 p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition bg-white"
            >
              <div className="font-semibold text-slate-900">{s.label}</div>
              <div className="text-sm text-slate-600 mt-1">Manage your {s.label.toLowerCase()}.</div>
            </a>
          ))}
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/';
            }}
            className="rounded-2xl border border-red-200 text-red-600 p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition bg-white text-left"
          >
            <div className="font-semibold">Logout</div>
            <div className="text-sm text-red-500 mt-1">Sign out of your account.</div>
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AccountPage;
