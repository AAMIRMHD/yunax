import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  PackageSearch,
  PencilLine,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { API } from './lib/api';
import { addItemsToCart, getAccountKey, getStoredUser, migrateAddressBook, saveAddressBook, saveStoredUser } from './lib/account';

const emptyAddress = {
  fullName: '',
  phone: '',
  line1: '',
  city: '',
  state: '',
  pincode: '',
};

const fallbackIdentity = {
  name: 'Customer',
  email: 'customer@example.com',
};

const accountSections = [
  { id: 'profile', label: 'Profile', icon: UserRound, description: 'Personal information and account details' },
  { id: 'orders', label: 'Orders', icon: Package, description: 'Track recent purchases and reorder quickly' },
  { id: 'addresses', label: 'Addresses', icon: MapPin, description: 'Manage delivery addresses for checkout' },
  { id: 'payments', label: 'Payments', icon: ShieldCheck, description: 'Payment method and account safety' },
];

const formatMoney = (value = 0) => `₹${Math.round(value / 100).toLocaleString('en-IN')}`;
const formatPaymentMethod = (value = '') => {
  if (value === 'cod') return 'Cash on Delivery';
  if (value === 'bank_transfer') return 'Bank Transfer';
  if (value === 'razorpay') return 'Razorpay';
  return 'Not selected yet';
};

const AccountPage = () => {
  const [user, setUser] = useState(getStoredUser());
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [activeSection, setActiveSection] = useState('profile');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressIntent, setAddressIntent] = useState('add-new');
  const [editingAddressId, setEditingAddressId] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const userKey = getAccountKey(user);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setProfile({
      name: storedUser?.name || fallbackIdentity.name,
      email: storedUser?.email || fallbackIdentity.email,
    });
    setAddresses(migrateAddressBook(storedUser));
  }, []);

  useEffect(() => {
    const syncSection = () => {
      const nextHash = window.location.hash.replace('#', '');
      if (accountSections.some((section) => section.id === nextHash)) {
        setActiveSection(nextHash);
      }
    };

    syncSection();
    window.addEventListener('hashchange', syncSection);
    return () => window.removeEventListener('hashchange', syncSection);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to access your account.');
      setLoading(false);
      return;
    }

    const loadOrders = async () => {
      try {
        setLoading(true);
        const meRes = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.ok) {
          const freshUser = await meRes.json();
          const nextUser = { ...getStoredUser(), ...freshUser };
          setUser(nextUser);
          setProfile({
            name: nextUser?.name || fallbackIdentity.name,
            email: nextUser?.email || fallbackIdentity.email,
          });
          saveStoredUser(nextUser);
          const serverAddresses = Array.isArray(freshUser.addresses) ? freshUser.addresses : [];
          const nextAddresses = serverAddresses.length > 0 ? serverAddresses : migrateAddressBook(nextUser);
          saveAddressBook(getAccountKey(nextUser), nextAddresses);
          setAddresses(nextAddresses);
        }

        const res = await fetch(`${API}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load account details');
        }
        const data = await res.json();
        setOrders(data || []);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load account details');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const metrics = useMemo(() => {
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalCents || 0), 0);
    const activeOrders = orders.filter((order) => (order.status || '').toLowerCase() !== 'failed').length;
    return {
      totalOrders: orders.length,
      totalSpent,
      activeOrders,
      addresses: addresses.length,
    };
  }, [orders, addresses.length]);

  const recentOrders = useMemo(() => orders.slice(0, 3), [orders]);
  const displayName = profile.name || user?.name || fallbackIdentity.name;
  const displayEmail = profile.email || user?.email || fallbackIdentity.email;
  const initials =
    (displayName || displayEmail || 'CU')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CU';

  const persistAddresses = async (nextAddresses) => {
    saveAddressBook(userKey, nextAddresses);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API}/auth/me/addresses`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ addresses: nextAddresses }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || 'Saved locally. We could not sync addresses to your account.');
      }
    } catch (err) {
      setError(err.message || 'Saved locally. We could not sync addresses to your account.');
    }
  };

  const saveProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in again to update your profile.');
      return;
    }

    try {
      setError('');
      const res = await fetch(`${API}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name.trim(),
          email: profile.email.trim() || user?.email || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      const nextUser = {
        ...user,
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
      };

      setUser(nextUser);
      setProfile({ name: data.name || '', email: data.email || '' });
      saveStoredUser(nextUser);
      const stableAddresses = migrateAddressBook(nextUser);
      if (stableAddresses.length > 0) setAddresses(stableAddresses);
      setIsEditingProfile(false);
      setToast('Profile updated successfully.');
      setTimeout(() => setToast(''), 1800);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const cancelProfileEdit = () => {
    setProfile({
      name: user?.name || fallbackIdentity.name,
      email: user?.email || fallbackIdentity.email,
    });
    setIsEditingProfile(false);
  };

  const saveAddress = (e) => {
    e.preventDefault();
    const normalizedAddress = {
      ...addressForm,
      fullName: addressForm.fullName.trim(),
      phone: addressForm.phone.trim(),
      line1: addressForm.line1.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      pincode: addressForm.pincode.trim(),
    };

    const nextAddresses = editingAddressId
      ? addresses.map((address) =>
          address.id === editingAddressId ? { ...address, ...normalizedAddress } : address
        )
      : [
          {
            ...normalizedAddress,
            id: `addr-${Date.now()}`,
            isDefault: addresses.length === 0,
          },
          ...addresses,
        ];

    setAddresses(nextAddresses);
    persistAddresses(nextAddresses);
    setAddressForm(emptyAddress);
    setShowAddressModal(false);
    setAddressIntent('add-new');
    setEditingAddressId('');
    setToast(editingAddressId ? 'Address updated.' : 'Address saved.');
    setTimeout(() => setToast(''), 1800);
  };

  const removeAddress = (id) => {
    const nextAddresses = addresses.filter((address) => address.id !== id);
    setAddresses(nextAddresses);
    persistAddresses(nextAddresses);
  };

  const goToSection = (sectionId) => {
    setActiveSection(sectionId);
    const node = document.getElementById(sectionId);
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${sectionId}`);
  };

  const reorder = (order) => {
    const items = (order.items || []).map((item) => ({
      slug: item.slug || `${(item.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${item.productId || 'demo'}`,
      productId: item.productId,
      name: item.name,
      description: item.name,
      category: item.category || user?.preferredCategory || 'Products',
      priceCents: item.priceCents,
      quantity: item.quantity,
    }));
    addItemsToCart(items);
    setToast('Order items added to cart.');
    setTimeout(() => setToast(''), 1800);
  };

  const openAddressModal = (intent) => {
    setAddressIntent(intent);
    setEditingAddressId('');
    setAddressForm(emptyAddress);
    setShowAddressModal(true);
  };

  const startAddressEdit = (address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      fullName: address.fullName || '',
      phone: address.phone || '',
      line1: address.line1 || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
    });
  };

  return (
    <div className="premium-shell min-h-screen text-slate-900 selection:bg-primary/20">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-24 md:px-6 md:pb-20 md:pt-28">
        <section className="premium-panel overflow-hidden rounded-[20px] p-4 md:rounded-[24px] md:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr,0.9fr] lg:items-stretch">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 md:rounded-[20px] md:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    <ShieldCheck size={14} className="text-blue-600" />
                    Account overview
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white md:h-14 md:w-14 md:text-lg">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-slate-900 md:text-xl">{displayName}</p>
                      <p className="truncate text-sm text-slate-500">{displayEmail}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h1 className="max-w-xl text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Welcome back</h1>
                    <p className="max-w-xl text-sm leading-6 text-slate-600 md:text-base">
                      Manage your profile, check your orders, and keep your saved addresses up to date from one simple page.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Account status</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">Verified and protected</p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:mt-6">
                <a href="/orders" className="premium-button premium-button-secondary w-full text-sm sm:w-auto">
                  View orders
                </a>
                <button
                  type="button"
                  onClick={() => goToSection('profile')}
                  className="premium-button premium-button-primary w-full text-sm sm:w-auto"
                >
                  Edit profile
                </button>
                {toast && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700"
                  >
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 size={15} />
                      {toast}
                    </span>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                { label: 'Orders placed', value: metrics.totalOrders, icon: Package },
                { label: 'Active orders', value: metrics.activeOrders, icon: ShieldCheck },
                { label: 'Saved addresses', value: metrics.addresses, icon: MapPin },
              ].map((item) => (
                <div key={item.label} className="premium-soft-panel flex min-h-[98px] flex-col justify-between rounded-[16px] p-3 md:min-h-[120px] md:rounded-[18px] md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 md:h-10 md:w-10">
                      <item.icon size={16} />
                    </div>
                    <p className="text-[11px] font-semibold leading-4 text-slate-500 md:text-xs">{item.label}</p>
                  </div>
                  <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700"
          >
            {error}
          </motion.div>
        )}

        <div className="mt-5 grid gap-5 md:mt-6 lg:grid-cols-12 lg:gap-6">
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="premium-panel rounded-[20px] p-3 md:p-4">
                <div className="hidden rounded-[18px] border border-slate-200 bg-slate-50 px-5 py-5 lg:block">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900">{displayName}</p>
                      <p className="truncate text-sm text-slate-500">{displayEmail}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 lg:mt-4 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
                  {accountSections.map((section) => {
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => goToSection(section.id)}
                        className={`min-w-[148px] rounded-xl px-3 py-3 text-left transition-all lg:w-full lg:px-4 lg:py-3.5 ${
                          isActive ? 'border border-blue-200 bg-blue-50 text-slate-900 shadow-sm' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isActive ? 'border border-blue-100 bg-white text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                              <section.icon size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{section.label}</p>
                              <p className={`hidden text-xs leading-5 lg:block ${isActive ? 'text-slate-600' : 'text-slate-500'}`}>{section.description}</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="premium-panel hidden rounded-[20px] p-5 lg:block">
                <p className="text-sm font-semibold text-slate-900">Quick summary</p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span>Primary email</span>
                    <span className="max-w-[150px] truncate font-medium text-slate-900">{displayEmail}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span>Orders</span>
                    <span className="font-medium text-slate-900">{metrics.totalOrders}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span>Default payment</span>
                    <span className="font-medium text-slate-900">{formatPaymentMethod(orders[0]?.paymentMethod)}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-5 lg:col-span-8 lg:space-y-6 xl:col-span-9">
            <motion.section
              id="profile"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="premium-panel rounded-[20px] md:rounded-[28px]"
            >
              <div className="border-b border-slate-100 px-5 py-5 md:px-8 md:py-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Profile</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900 md:text-2xl">Personal details</h2>
                <p className="mt-2 text-sm text-slate-500">Keep your profile information up to date so checkout stays quick and accurate.</p>
              </div>

              <div className="space-y-5 px-5 py-5 md:space-y-6 md:px-8 md:py-6">
                <div className="premium-soft-panel grid gap-4 rounded-[18px] p-4 sm:grid-cols-[auto,1fr] sm:items-center md:grid-cols-[auto,1fr,auto] md:rounded-[22px] md:p-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-base font-bold text-white md:h-16 md:w-16 md:text-lg">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                    <p className="truncate text-sm text-slate-500">{displayEmail}</p>
                  </div>
                  <div className="premium-pill w-fit text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 sm:col-span-2 md:col-span-1">
                    <ShieldCheck size={14} />
                    Verified profile
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="premium-soft-panel rounded-[18px] p-4 md:rounded-[22px] md:p-5">
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <PencilLine size={15} />
                      Full name
                    </span>
                    <input
                      value={profile.name}
                      onChange={(e) => setProfile((current) => ({ ...current, name: e.target.value }))}
                      className="premium-input mt-3"
                      placeholder="Your full name"
                      disabled={!isEditingProfile}
                    />
                  </label>

                  <label className="premium-soft-panel rounded-[18px] p-4 md:rounded-[22px] md:p-5">
                    <span className="text-sm font-medium text-slate-600">Email address</span>
                    <input
                      value={profile.email}
                      onChange={(e) => setProfile((current) => ({ ...current, email: e.target.value }))}
                      className="premium-input mt-3"
                      placeholder="you@example.com"
                      disabled={!isEditingProfile}
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
                <p className="text-sm text-slate-500">These details are used in your orders, saved addresses, and checkout.</p>
                <div className="grid gap-3 sm:flex sm:flex-wrap">
                  <a href="/orders" className="premium-button premium-button-secondary text-sm">
                    View orders
                  </a>
                  {isEditingProfile ? (
                    <>
                      <button onClick={cancelProfileEdit} className="premium-button premium-button-secondary text-sm">
                        Cancel
                      </button>
                      <button onClick={saveProfile} className="premium-button premium-button-primary text-sm">
                        Save changes
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setIsEditingProfile(true)} className="premium-button premium-button-primary text-sm">
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </motion.section>

            <motion.section
              id="orders"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="premium-panel rounded-[20px] md:rounded-[28px]"
            >
              <div className="border-b border-slate-100 px-5 py-5 md:px-8 md:py-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Orders</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900 md:text-2xl">Recent activity</h2>
                <p className="mt-2 text-sm text-slate-500">See your latest orders and move the same items back into the cart when needed.</p>
              </div>

              <div className="space-y-4 px-5 py-5 md:px-8 md:py-6">
                {loading ? (
                  <div className="premium-soft-panel rounded-[18px] p-8 text-center text-sm text-slate-500 md:rounded-[22px] md:p-10">
                    <Loader2 size={26} className="mx-auto mb-3 animate-spin text-blue-600" />
                    <p className="font-semibold text-slate-900">Loading your orders</p>
                    <p className="mt-1">We are checking your recent activity.</p>
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="premium-soft-panel rounded-[18px] p-8 text-center text-sm text-slate-500 md:rounded-[22px] md:p-12">
                    <PackageSearch size={28} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-base font-semibold text-slate-900">No orders yet</p>
                    <p className="mt-2">Your recent purchases will appear here.</p>
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order._id || order.id} className="premium-soft-panel rounded-[22px] p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Order</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">#{String(order._id || order.id || '').slice(-8).toUpperCase()}</p>
                          <p className="mt-1 text-sm text-slate-500">{order.items?.length || 0} item(s) in this order</p>
                        </div>

                        <div className="space-y-2 md:text-right">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              (order.status || '').toLowerCase() === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {order.status || 'Pending'}
                          </span>
                          <p className="text-xl font-bold text-slate-900">{formatMoney(order.totalCents || 0)}</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {(order.items || []).slice(0, 3).map((item, index) => (
                          <div key={index} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm">
                            <span className="truncate text-slate-700">{item.name}</span>
                            <span className="text-slate-500">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
                        <button onClick={() => reorder(order)} className="premium-button premium-button-primary text-sm">
                          Reorder
                        </button>
                        <a href="/orders" className="premium-button premium-button-secondary text-sm">
                          <PackageSearch size={16} className="mr-2" />
                          View all orders
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.section>

            <motion.section
              id="addresses"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="premium-panel rounded-[20px] md:rounded-[28px]"
            >
              <div className="border-b border-slate-100 px-5 py-5 md:px-8 md:py-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Addresses</p>
                    <h2 className="mt-2 text-xl font-bold text-slate-900 md:text-2xl">Saved delivery addresses</h2>
                    <p className="mt-2 text-sm text-slate-500">Keep the addresses you use most often ready for checkout.</p>
                  </div>
                  <button type="button" onClick={() => openAddressModal('add-new')} className="premium-button premium-button-primary w-full text-sm md:w-auto">
                    Add address
                  </button>
                </div>
              </div>

              <div className="space-y-5 px-5 py-5 md:px-8 md:py-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      id: 'use-current',
                      title: 'Keep current address',
                      copy: 'Continue using the address already linked to your account.',
                    },
                    {
                      id: 'add-new',
                      title: 'Add a new address',
                      copy: 'Save another delivery location for future orders.',
                    },
                    {
                      id: 'change-address',
                      title: 'Update an address',
                      copy: 'Open the address form to change your delivery details.',
                    },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => (option.id === 'use-current' ? setAddressIntent(option.id) : openAddressModal(option.id))}
                      className={`rounded-[18px] border px-4 py-4 text-left transition-all md:rounded-[22px] md:px-5 md:py-5 ${
                        addressIntent === option.id
                          ? 'border-blue-200 bg-blue-50 text-slate-900'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">{option.title}</p>
                      <p className={`mt-2 text-sm leading-6 ${addressIntent === option.id ? 'text-slate-600' : 'text-slate-500'}`}>{option.copy}</p>
                    </button>
                  ))}
                </div>

                {addresses.length === 0 ? (
                  <div className="rounded-[18px] border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center md:rounded-[22px] md:p-12">
                    <MapPin size={28} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-base font-medium text-slate-900">No saved addresses yet</p>
                    <p className="mt-2 text-sm text-slate-500">Add your first address to make checkout faster.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {addresses.map((address) => (
                      <motion.div
                        layout
                        key={address.id}
                        className="premium-soft-panel flex flex-col gap-4 rounded-[18px] p-4 md:flex-row md:items-center md:justify-between md:rounded-[22px] md:p-5"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-base font-semibold text-slate-900">{address.fullName}</p>
                            {address.isDefault && (
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Default</span>
                            )}
                          </div>
                          <p className="text-sm leading-6 text-slate-600">
                            {address.line1}, {address.city}, {address.state} - {address.pincode}
                          </p>
                          <p className="text-sm text-slate-500">{address.phone}</p>
                        </div>
                        <button
                          onClick={() => removeAddress(address.id)}
                          className="premium-button w-full border border-rose-200 px-5 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 md:w-auto"
                        >
                          Delete
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>

            <motion.section
              id="payments"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="premium-panel rounded-[20px] md:rounded-[28px]"
            >
              <div className="border-b border-slate-100 px-5 py-5 md:px-8 md:py-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Payments & safety</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900 md:text-2xl">Safe checkout information</h2>
                <p className="mt-2 text-sm text-slate-500">Your payment flow and account details are protected with secure handling.</p>
              </div>

              <div className="grid gap-4 px-5 py-5 md:grid-cols-2 md:px-8 md:py-6">
                <div className="premium-soft-panel rounded-[22px] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Account protection</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Your profile and delivery details stay protected with authenticated access and secure order handling.
                  </p>
                </div>
                <div className="premium-soft-panel rounded-[22px] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Preferred payment</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">Use a trusted payment option at checkout and review your latest payment method here.</p>
                  <p className="mt-4 text-base font-semibold text-slate-900">{formatPaymentMethod(orders[0]?.paymentMethod)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-5 md:flex-row md:px-8">
                <a href="/products" className="premium-button premium-button-secondary text-sm">
                  Continue shopping
                </a>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/';
                  }}
                  className="premium-button border border-rose-200 bg-white px-5 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  Sign out
                </button>
              </div>
            </motion.section>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showAddressModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              className="premium-panel w-full max-w-3xl rounded-[28px] p-6 md:p-8"
            >
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {addressIntent === 'change-address' ? 'Update address' : 'Add address'}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">
                    {addressIntent === 'change-address' ? 'Edit your delivery address' : 'Add a new delivery address'}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">Enter the address details below and save them to your account.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="premium-button premium-button-secondary text-sm"
                >
                  Close
                </button>
              </div>

              {addressIntent === 'change-address' && !editingAddressId ? (
                <div className="mt-6 space-y-4">
                  <p className="text-sm text-slate-500">Select the address you want to update.</p>
                  {addresses.length === 0 ? (
                    <div className="rounded-[22px] border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                      <p className="text-base font-medium text-slate-900">No saved addresses yet</p>
                      <p className="mt-2 text-sm text-slate-500">Add an address first, then you can update it here.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {addresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => startAddressEdit(address)}
                          className="rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-left transition-all hover:border-slate-300 hover:bg-white"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-base font-semibold text-slate-900">{address.fullName}</p>
                              <p className="mt-1 text-sm leading-6 text-slate-600">
                                {address.line1}, {address.city}, {address.state} - {address.pincode}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">{address.phone}</p>
                            </div>
                            <span className="premium-button premium-button-secondary text-sm">Update</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
              <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={saveAddress}>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-600">Receiver name</span>
                  <input
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm((current) => ({ ...current, fullName: e.target.value }))}
                    className="premium-input"
                    placeholder="Full name"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-600">Phone</span>
                  <input
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm((current) => ({ ...current, phone: e.target.value }))}
                    className="premium-input"
                    placeholder="Contact number"
                    required
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-600">Address line</span>
                  <input
                    value={addressForm.line1}
                    onChange={(e) => setAddressForm((current) => ({ ...current, line1: e.target.value }))}
                    className="premium-input"
                    placeholder="House, street, area"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-600">City</span>
                  <input
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((current) => ({ ...current, city: e.target.value }))}
                    className="premium-input"
                    placeholder="City"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-600">State</span>
                  <input
                    value={addressForm.state}
                    onChange={(e) => setAddressForm((current) => ({ ...current, state: e.target.value }))}
                    className="premium-input"
                    placeholder="State"
                    required
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-600">Pincode</span>
                  <input
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm((current) => ({ ...current, pincode: e.target.value }))}
                    className="premium-input"
                    placeholder="Pincode"
                    required
                  />
                </label>

                <div className="flex justify-end gap-3 md:col-span-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (addressIntent === 'change-address' && editingAddressId) {
                        setEditingAddressId('');
                        setAddressForm(emptyAddress);
                        return;
                      }
                      setShowAddressModal(false);
                    }}
                    className="premium-button premium-button-secondary text-sm"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="premium-button premium-button-primary text-sm">
                    {editingAddressId ? 'Update address' : 'Save address'}
                  </button>
                </div>
              </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default AccountPage;
