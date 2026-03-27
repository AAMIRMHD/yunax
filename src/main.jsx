import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import GPUsPage from './GPUsPage';
import AboutPage from './AboutPage';
import ServicesPage from './ServicesPage';
import ContactPage from './ContactPage';
import ProductsPage from './ProductsPage';
import './index.css';

const path = window.location.pathname;
const isGpusPage = path.startsWith('/gpus');
const isAboutPage = path.startsWith('/about');
const isServicesPage = path.startsWith('/services');
const isContactPage = path.startsWith('/contact');
const isProductsPage = path.startsWith('/products');

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
    ) : isProductsPage ? (
      <ProductsPage />
    ) : (
      <App />
    )}
  </React.StrictMode>
);
