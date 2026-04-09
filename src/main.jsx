import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import GPUsPage from './GPUsPage';
import AboutPage from './AboutPage';
import ServicesPage from './ServicesPage';
import ContactPage from './ContactPage';
import ProductsPage from './ProductsPage';
import ProductDetailPage from './ProductDetailPage';
import SignupPage from './SignupPage';
import LoginPage from './LoginPage';
import AccountPage from './AccountPage';
import CartPage from './CartPage';
import OrdersPage from './OrdersPage';
import AdminPage from './AdminPage';
import AdminManagePage from './AdminManagePage';
import AdminDashboard from './admin/AdminDashboard';
import AdminProducts from './admin/AdminProducts';
import AdminOrders from './admin/AdminOrders';
import AdminLogin from './admin/AdminLogin';
import AdminUsers from './admin/AdminUsers';
import './index.css';

const path = window.location.pathname;
const isGpusPage = path.startsWith('/gpus');
const isAboutPage = path.startsWith('/about');
const isServicesPage = path.startsWith('/services');
const isContactPage = path.startsWith('/contact');
const isProductDetailPage = path.startsWith('/products/') && path.split('/').filter(Boolean).length === 2;
const isProductsPage = path === '/products';
const isSignupPage = path.startsWith('/signup');
const isLoginPage = path.startsWith('/login');
const isAccountPage = path.startsWith('/account');
const isCartPage = path.startsWith('/cart');
const isOrdersPage = path.startsWith('/orders');
const isAdminLoginPage = path.startsWith('/admin/login');
const isAdminProductsPage = path.startsWith('/admin/products');
const isAdminOrdersPage = path.startsWith('/admin/orders');
const isAdminUsersPage = path.startsWith('/admin/users');
const isAdminDashboardPage = path === '/admin' || path.startsWith('/admin/dashboard');
const isAdminManagePage = path.startsWith('/admin/manage');
const isAdminPage = path.startsWith('/admin');

const token = (() => {
  try {
    return localStorage.getItem('token');
  } catch (e) {
    return null;
  }
})();

// Allow viewing cart without login; checkout flow already enforces auth.
const protectedPath = isOrdersPage || isAdminPage || isAccountPage;
if (protectedPath && !token && !isLoginPage && !isSignupPage && !isAdminLoginPage) {
  window.location.href = '/login';
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isGpusPage ? (
      <GPUsPage />
    ) : isAboutPage ? (
      <AboutPage />
    ) : isServicesPage ? (
      <ServicesPage />
    ) : isContactPage ? (
      <ContactPage />
    ) : isProductDetailPage ? (
      <ProductDetailPage slug={path.split('/').filter(Boolean)[1]} />
    ) : isProductsPage ? (
      <ProductsPage />
    ) : isSignupPage ? (
      <SignupPage />
    ) : isLoginPage ? (
      <LoginPage />
    ) : isAccountPage ? (
      <AccountPage />
    ) : isCartPage ? (
      <CartPage />
    ) : isOrdersPage ? (
      <OrdersPage />
    ) : isAdminLoginPage ? (
      <AdminLogin />
    ) : isAdminProductsPage ? (
      <AdminProducts />
    ) : isAdminOrdersPage ? (
      <AdminOrders />
    ) : isAdminUsersPage ? (
      <AdminUsers />
    ) : isAdminDashboardPage ? (
      <AdminDashboard />
    ) : isAdminManagePage ? (
      <AdminManagePage />
    ) : isAdminPage ? (
      <AdminPage />
    ) : (
      <App />
    )}
  </React.StrictMode>
);
