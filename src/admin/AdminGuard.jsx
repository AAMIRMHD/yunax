import { useEffect, useState } from 'react';
import { API } from '../lib/api';

const clearAdminSession = () => {
  try {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  } catch (err) {
    // Ignore storage access failures and let the redirect handle recovery.
  }
};

const AdminGuard = ({ children }) => {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let active = true;

    const verifyAdmin = async () => {
      let token = '';
      try {
        token = localStorage.getItem('admin_token') || '';
      } catch (err) {
        token = '';
      }

      if (!token) {
        clearAdminSession();
        window.location.replace('/admin/login');
        return;
      }

      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = await res.json().catch(() => ({}));

        if (!res.ok || user?.role !== 'admin') {
          clearAdminSession();
          window.location.replace('/admin/login');
          return;
        }

        localStorage.setItem('admin_user', JSON.stringify(user));
        if (active) setStatus('ready');
      } catch (err) {
        clearAdminSession();
        window.location.replace('/admin/login');
      }
    };

    verifyAdmin();

    return () => {
      active = false;
    };
  }, []);

  if (status !== 'ready') {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">Admin access</p>
          <h1 className="mt-3 text-2xl font-bold">Verifying administrator session</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">Only approved admin accounts can open this area.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminGuard;
