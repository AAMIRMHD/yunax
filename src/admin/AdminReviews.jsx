import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Star, Trash2, XCircle } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { API } from '../lib/api';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [loadingId, setLoadingId] = useState('');

  const token = (() => {
    try { return localStorage.getItem('admin_token'); } catch (e) { return null; }
  })();

  const load = async () => {
    if (!token) throw new Error('Admin login required.');
    const res = await fetch(`${API}/reviews/admin`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load reviews');
    setReviews(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const filtered = useMemo(
    () => reviews.filter((review) => filter === 'all' || review.status === filter),
    [reviews, filter]
  );

  const updateStatus = async (review, status) => {
    try {
      setLoadingId(review._id || review.id);
      const res = await fetch(`${API}/reviews/${review._id || review.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update review');
      setReviews((current) => current.map((item) => ((item._id || item.id) === (data._id || data.id) ? data : item)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingId('');
    }
  };

  const remove = async (review) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      setLoadingId(review._id || review.id);
      const res = await fetch(`${API}/reviews/${review._id || review.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete review');
      setReviews((current) => current.filter((item) => (item._id || item.id) !== (review._id || review.id)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingId('');
    }
  };

  return (
    <AdminLayout title="Reviews" description="Approve customer reviews and remove abusive or irrelevant feedback.">
      {error && <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'approved', 'rejected'].map((option) => (
          <button
            key={option}
            onClick={() => setFilter(option)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${filter === option ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No reviews found.</div>
        ) : filtered.map((review) => (
          <div key={review._id || review.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={16} className={index < Number(review.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                  ))}
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{review.status}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{review.text}</p>
                <p className="mt-3 text-xs text-slate-400">
                  {review.userName || 'Customer'} · {review.slug}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button disabled={loadingId === (review._id || review.id)} onClick={() => updateStatus(review, 'approved')} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-50">
                  <CheckCircle size={15} /> Approve
                </button>
                <button disabled={loadingId === (review._id || review.id)} onClick={() => updateStatus(review, 'rejected')} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-700 disabled:opacity-50">
                  <XCircle size={15} /> Reject
                </button>
                <button disabled={loadingId === (review._id || review.id)} onClick={() => remove(review)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50">
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
