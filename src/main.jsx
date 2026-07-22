import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import GPUsPage from './GPUsPage';
import AboutPage from './AboutPage';
import ServicesPage from './ServicesPage';
import ContactPage from './ContactPage';
import ProductsPage from './ProductsPage';
import ProductDetailPage from './ProductDetailPage';
import SignupPage from './SignupPage';
import LoginPage from './LoginPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import AccountPage from './AccountPage';
import CartPage from './CartPage';
import OrdersPage from './OrdersPage';
import WishlistPage from './WishlistPage';
import FAQPage from './FAQPage';
import LegalPage from './LegalPage';
import ResetPasswordPage from './ResetPasswordPage';
import AdminPage from './AdminPage';
import AdminManagePage from './AdminManagePage';
import AdminDashboard from './admin/AdminDashboard';
import AdminProducts from './admin/AdminProducts';
import AdminOrders from './admin/AdminOrders';
import AdminLogin from './admin/AdminLogin';
import AdminSignup from './admin/AdminSignup';
import AdminGuard from './admin/AdminGuard';
import AdminUsers from './admin/AdminUsers';
import AdminAddProduct from './admin/AdminAddProduct';
import AdminEditProduct from './admin/AdminEditProduct';
import AdminSupport from './admin/AdminSupport';
import AdminCategories from './admin/AdminCategories';
import AdminReviews from './admin/AdminReviews';
import PageShell from './components/motion/PageShell';
import './index.css';

// Normalize path: ignore trailing slashes for easier matching
const rawPath = window.location.pathname;
const path = rawPath.endsWith('/') && rawPath !== '/' ? rawPath.slice(0, -1) : rawPath;

const isGpusPage = path.startsWith('/gpus');
const isAboutPage = path.startsWith('/about');
const isServicesPage = path.startsWith('/services');
const isContactPage = path.startsWith('/contact');
const isProductDetailPage = path.startsWith('/products/') && path.split('/').filter(Boolean).length === 2;
const isProductsPage = path === '/products';
const isSignupPage = path.startsWith('/signup');
const isLoginPage = path.startsWith('/login');
const isForgotPasswordPage = path.startsWith('/forgot-password');
const isAccountPage = path.startsWith('/account');
const isCartPage = path.startsWith('/cart');
const isOrdersPage = path.startsWith('/orders');
const isWishlistPage = path.startsWith('/wishlist');
const isResetPasswordPage = path.startsWith('/reset-password');
const isTermsPage = path === '/terms';
const isPrivacyPage = path === '/privacy';
const isRefundsPage = path === '/refund-policy';
const isSupportPage = path === '/support';
const isFAQPage = path === '/faq';

// Admin Routes
const isAdminLoginPage = path === '/admin/login';
const isAdminSignupPage = path === '/admin/signup';
const isAdminDashboardPage = path === '/admin' || path === '/admin/dashboard';
const isAdminProductsPage = path === '/admin/products';
const isAdminAddProductPage = path === '/admin/products/add';
const isAdminEditProductPage = path.startsWith('/admin/products/edit/');
const isAdminOrdersPage = path === '/admin/orders';
const isAdminCategoriesPage = path === '/admin/categories';
const isAdminReviewsPage = path === '/admin/reviews';
const isAdminSupportPage = path === '/admin/support';
const isAdminUsersPage = path === '/admin/users';
const isAdminManagePage = path === '/admin/manage';
const isAdminPage = path.startsWith('/admin');

// User Session
const token = (() => {
  try { return localStorage.getItem('token'); } catch (e) { return null; }
})();
// Authentication Middleware
if ((isOrdersPage || isAccountPage || isWishlistPage) && !token) {
  window.location.href = '/login';
}

// Determine which component to render
let RootComponent;

if (isGpusPage) RootComponent = <GPUsPage />;
else if (isAboutPage) RootComponent = <AboutPage />;
else if (isServicesPage) RootComponent = <ServicesPage />;
else if (isContactPage) RootComponent = <ContactPage />;
else if (isProductDetailPage) {
  const slug = path.split('/').filter(Boolean)[1];
  RootComponent = <ProductDetailPage slug={slug} />;
}
else if (isProductsPage) RootComponent = <ProductsPage />;
else if (isSignupPage) RootComponent = <SignupPage />;
else if (isLoginPage) RootComponent = <LoginPage />;
else if (isForgotPasswordPage) RootComponent = <ForgotPasswordPage />;
else if (isAccountPage) RootComponent = <AccountPage />;
else if (isCartPage) RootComponent = <CartPage />;
else if (isOrdersPage) RootComponent = <OrdersPage />;
else if (isWishlistPage) RootComponent = <WishlistPage />;
else if (isResetPasswordPage) RootComponent = <ResetPasswordPage />;
else if (isTermsPage) RootComponent = <LegalPage type="terms" />;
else if (isPrivacyPage) RootComponent = <LegalPage type="privacy" />;
else if (isRefundsPage) RootComponent = <LegalPage type="refunds" />;
else if (isSupportPage) RootComponent = <LegalPage type="support" />;
else if (isFAQPage) RootComponent = <FAQPage />;
else if (isAdminLoginPage) RootComponent = <AdminLogin />;
else if (isAdminSignupPage) RootComponent = <AdminSignup />;
else if (isAdminAddProductPage) RootComponent = <AdminAddProduct />;
else if (isAdminEditProductPage) RootComponent = <AdminEditProduct />;
else if (isAdminProductsPage) RootComponent = <AdminProducts />;
else if (isAdminOrdersPage) RootComponent = <AdminOrders />;
else if (isAdminCategoriesPage) RootComponent = <AdminCategories />;
else if (isAdminReviewsPage) RootComponent = <AdminReviews />;
else if (isAdminSupportPage) RootComponent = <AdminSupport />;
else if (isAdminUsersPage) RootComponent = <AdminUsers />;
else if (isAdminDashboardPage) RootComponent = <AdminDashboard />;
else if (isAdminManagePage) RootComponent = <AdminManagePage />;
else if (isAdminPage) RootComponent = <AdminPage />;
else RootComponent = <App />;

if (isAdminPage && !isAdminLoginPage && !isAdminSignupPage) {
  RootComponent = <AdminGuard>{RootComponent}</AdminGuard>;
} else {
  RootComponent = <PageShell>{RootComponent}</PageShell>;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {RootComponent}
  </React.StrictMode>
);
