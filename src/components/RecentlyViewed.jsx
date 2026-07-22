import { useEffect, useState } from 'react';
import { getRecentlyViewed } from '../lib/recentlyViewed';

const formatMoney = (value = 0) => `₹${Math.round(value / 100).toLocaleString('en-IN')}`;

const RecentlyViewed = ({ excludeSlug = '', title = 'Recently viewed products' }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getRecentlyViewed().filter((item) => item.slug !== excludeSlug).slice(0, 4));
  }, [excludeSlug]);

  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">History</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2>
        </div>
        <a href="/products" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
          View catalog
        </a>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <a key={item.slug} href={`/products/${item.slug}`} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-36 items-center justify-center rounded-[18px] bg-slate-50">
              {item.image ? (
                <img src={item.image} alt={item.name} className="h-full w-full object-contain p-4" />
              ) : (
                <span className="text-xl font-bold text-slate-300">{item.name?.slice(0, 2)?.toUpperCase() || 'YX'}</span>
              )}
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{item.brand || item.category || 'Product'}</p>
            <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-900">{item.name}</h3>
            <p className="mt-2 text-sm font-bold text-slate-900">{formatMoney(item.priceCents)}</p>
          </a>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
