import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminDashboard from './admin/AdminDashboard';
import AdminProducts from './admin/AdminProducts';
import AdminOrders from './admin/AdminOrders';
import AdminUsers from './admin/AdminUsers';
import AdminLogin from './admin/AdminLogin';
import './index.css';

const path = window.location.pathname;

const isAdminProductsPage = path.startsWith('/admin/products');
const isAdminOrdersPage = path.startsWith('/admin/orders');
const isAdminUsersPage = path.startsWith('/admin/users');
const isAdminDashboardPage = path === '/admin' || path.startsWith('/admin/dashboard');
const isAdminLoginPage = path.startsWith('/admin/login');

const token = (() => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
})();

const user = (() => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

const requiresAuth = isAdminDashboardPage || isAdminProductsPage || isAdminOrdersPage || isAdminUsersPage;

if (requiresAuth) {
  if (!token) {
    window.location.href = '/admin/login';
  } else if (user?.role !== 'admin') {
    window.location.href = '/';
  }
}

let element = <AdminLogin />;
if (isAdminLoginPage) {
  element = <AdminLogin />;
} else if (isAdminProductsPage) {
  element = <AdminProducts />;
} else if (isAdminOrdersPage) {
  element = <AdminOrders />;
} else if (isAdminUsersPage) {
  element = <AdminUsers />;
} else if (isAdminDashboardPage) {
  element = <AdminDashboard />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {element}
  </React.StrictMode>
);
