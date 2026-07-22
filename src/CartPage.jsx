import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, CreditCard, Loader2, MapPin, ShieldCheck, ShoppingBag, ShoppingCart, Truck } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { API } from './lib/api';
import { getStoredCartItems, reconcileStoredCartWithCatalog, saveStoredCartItems } from './lib/cart';
import { getAccountKey, migrateAddressBook, getStoredUser, saveAddressBook, saveStoredUser } from './lib/account';

const emptyCheckoutForm = {
  fullName: '',
  phone: '',
  line1: '',
  city: '',
  state: '',
  pincode: '',
};

const emptyBillingForm = {
  isBusiness: false,
  companyName: '',
  gstNumber: '',
  sameAsShipping: true,
  fullName: '',
  phone: '',
  line1: '',
  city: '',
  state: '',
  pincode: '',
};

const paymentOptions = [
  {
    id: 'razorpay',
    label: 'Razorpay Online',
    description: 'Pay securely using Card, UPI, Netbanking, or Wallet.',
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    description: 'Pay when your order arrives.',
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    description: 'Place the order now and complete payment manually.',
  },
];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const checkoutSteps = [
  { id: 1, label: 'Address' },
  { id: 2, label: 'Review' },
  { id: 3, label: 'Payment' },
];

const isSameAddress = (left = {}, right = {}) =>
  ['fullName', 'phone', 'line1', 'city', 'state', 'pincode'].every(
    (field) => String(left[field] || '').trim() === String(right[field] || '').trim()
  );

const formatMoney = (value = 0) => `₹${Math.round(value / 100).toLocaleString('en-IN')}`;

const clearCustomerSession = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (err) {
    // Storage can fail in restricted browser contexts; redirect still recovers.
  }
};

const CartPage = () => {
  const [items, setItems] = useState(getStoredCartItems);
  const [message, setMessage] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [checkoutForm, setCheckoutForm] = useState(emptyCheckoutForm);
  const [billingForm, setBillingForm] = useState(emptyBillingForm);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [currentStep, setCurrentStep] = useState(1);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');

  useEffect(() => {
    saveStoredCartItems(items);
  }, [items]);

  useEffect(() => {
    let active = true;

    const refreshCart = async () => {
      const previousItems = getStoredCartItems();
      setIsRefreshing(true);
      const nextItems = await reconcileStoredCartWithCatalog();
      if (!active) return;
      setItems(nextItems);
      if (previousItems.length > 0 && nextItems.length < previousItems.length) {
        setMessage('Some unavailable products were removed from your cart.');
      }
      setIsRefreshing(false);
    };

    refreshCart();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const user = getStoredUser();
    let addresses = migrateAddressBook(user);
    setSavedAddresses(addresses);
    if (addresses[0]) {
      setCheckoutForm({
        fullName: addresses[0].fullName || '',
        phone: addresses[0].phone || '',
        line1: addresses[0].line1 || '',
        city: addresses[0].city || '',
        state: addresses[0].state || '',
        pincode: addresses[0].pincode || '',
      });
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    let active = true;
    const loadAccountAddresses = async () => {
      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const freshUser = await res.json();
        const nextUser = { ...user, ...freshUser };
        const serverAddresses = Array.isArray(freshUser.addresses) ? freshUser.addresses : [];
        if (!active || serverAddresses.length === 0) return;
        saveStoredUser(nextUser);
        saveAddressBook(getAccountKey(nextUser), serverAddresses);
        setSavedAddresses(serverAddresses);
        setCheckoutForm((current) => {
          if (Object.values(current).some((value) => String(value || '').trim())) return current;
          return {
            fullName: serverAddresses[0].fullName || '',
            phone: serverAddresses[0].phone || '',
            line1: serverAddresses[0].line1 || '',
            city: serverAddresses[0].city || '',
            state: serverAddresses[0].state || '',
            pincode: serverAddresses[0].pincode || '',
          };
        });
      } catch (err) {
        // Local cached addresses are still usable if account sync fails.
      }
    };

    loadAccountAddresses();

    return () => {
      active = false;
    };
  }, []);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.priceCents || 0) * (item.qty || 1), 0), [items]);
  const addressComplete = useMemo(() => Object.values(checkoutForm).every((value) => String(value || '').trim()), [checkoutForm]);
  const selectedSavedAddressId = useMemo(
    () => savedAddresses.find((address) => isSameAddress(address, checkoutForm))?.id || null,
    [checkoutForm, savedAddresses]
  );
  const messageTone = message.toLowerCase().includes('redirecting') || message.toLowerCase().includes('placed') ? 'success' : 'default';
  const discount = quote?.discountCents || 0;
  const shippingCents = quote?.shippingCents || 0;
  const taxCents = quote?.taxCents || 0;
  const total = quote?.totalCents ?? subtotal;
  const etaLabel = quote?.estimatedDelivery?.label || '';
  const isServiceable = quote?.shipping?.serviceable !== false;
  const freeShippingThreshold = quote?.shipping?.freeThresholdCents || 500000;

  useEffect(() => {
    let active = true;

    const fetchQuote = async () => {
      if (!items.length || !addressComplete) {
        setQuote(null);
        setQuoteError('');
        return;
      }

      try {
        setQuoteLoading(true);
        setQuoteError('');
        const res = await fetch(`${API}/orders/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((item) => ({
              productId: item.productId,
              slug: item.slug,
              quantity: item.qty || 1,
            })),
            shippingAddress: checkoutForm,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not calculate shipping');
        if (!active) return;
        setQuote(data);
      } catch (err) {
        if (!active) return;
        setQuote(null);
        setQuoteError(err.message || 'Could not calculate shipping');
      } finally {
        if (active) setQuoteLoading(false);
      }
    };

    fetchQuote();

    return () => {
      active = false;
    };
  }, [addressComplete, checkoutForm, items]);

  const canOpenStep = (step) => {
    if (step === 1) return true;
    if (step === 2 || step === 3) return addressComplete;
    return false;
  };

  const goToStep = (step) => {
    if (canOpenStep(step)) {
      setMessage('');
      setCurrentStep(step);
    } else {
      setMessage('Please complete your delivery address first.');
    }
  };

  const updateQty = (slug, delta) => {
    setItems((list) =>
      list.map((item) => (item.slug === slug ? { ...item, qty: Math.max(1, (item.qty || 1) + delta) } : item))
    );
  };

  const removeItem = (slug) => setItems((list) => list.filter((item) => item.slug !== slug));

  const handleCheckout = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!items.length) {
      setMessage('Add at least one item before checkout.');
      return;
    }

    const token = (() => {
      try {
        return localStorage.getItem('token');
      } catch (err) {
        return null;
      }
    })();

    if (!token) {
      setMessage('Please log in to continue to checkout.');
      window.location.href = '/login';
      return;
    }

    const shippingAddress = {
      fullName: checkoutForm.fullName.trim(),
      phone: checkoutForm.phone.trim(),
      line1: checkoutForm.line1.trim(),
      city: checkoutForm.city.trim(),
      state: checkoutForm.state.trim(),
      pincode: checkoutForm.pincode.trim(),
    };

    const billingDetails = {
      isBusiness: billingForm.isBusiness,
      companyName: billingForm.companyName.trim(),
      gstNumber: billingForm.gstNumber.trim(),
      sameAsShipping: billingForm.sameAsShipping,
      address: billingForm.sameAsShipping
        ? shippingAddress
        : {
            fullName: billingForm.fullName.trim(),
            phone: billingForm.phone.trim(),
            line1: billingForm.line1.trim(),
            city: billingForm.city.trim(),
            state: billingForm.state.trim(),
            pincode: billingForm.pincode.trim(),
          },
    };

    if (Object.values(shippingAddress).some((value) => !value)) {
      setMessage('Please complete the delivery address before placing the order.');
      return;
    }

    if (!billingDetails.sameAsShipping && Object.values(billingDetails.address).some((value) => !value)) {
      setMessage('Please complete the billing address before placing the order.');
      return;
    }

    if (quote && quote.shipping?.serviceable === false) {
      setMessage('This pincode is currently outside our delivery network.');
      return;
    }

    try {
      setIsPaying(true);

      const catalogRes = await fetch(`${API}/products`);
      if (!catalogRes.ok) throw new Error('Could not refresh your cart. Please try again.');
      const catalog = await catalogRes.json();
      const productMap = new Map((Array.isArray(catalog) ? catalog : []).map((product) => [product.slug, product]));

      const hydratedItems = items
        .map((item) => {
          const product = productMap.get(item.slug);
          if (!product) return null;
          return {
            ...item,
            productId: product._id || product.id || item.productId,
            slug: product.slug || item.slug,
            priceCents: product.priceCents ?? item.priceCents,
            name: product.name || item.name,
            spec: product.description || product.category || item.spec,
            category: product.category || item.category,
            images: Array.isArray(product.images) ? product.images.filter(Boolean) : item.images || [],
          };
        })
        .filter(Boolean);

      if (hydratedItems.length !== items.length) {
        setItems(hydratedItems);
        saveStoredCartItems(hydratedItems);
        throw new Error('Some items were removed because they are no longer available. Please review your cart and try again.');
      }

      if (paymentMethod === 'razorpay') {
        const orderRes = await fetch(`${API}/payments/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: hydratedItems.map((item) => ({
              productId: item.productId,
              slug: item.slug,
              quantity: item.qty || 1,
            })),
            shippingAddress,
            billingDetails,
          }),
        });

        if (orderRes.status === 401) {
          clearCustomerSession();
          setMessage('Your session expired. Please log in again to continue checkout.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 900);
          return;
        }

        if (!orderRes.ok) {
          const err = await orderRes.json().catch(() => ({}));
          throw new Error(err.error || 'Could not initiate payment order.');
        }

        const paymentData = await orderRes.json();

        // Dynamically load Razorpay Checkout script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
        }

        const options = {
          key: paymentData.keyId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          name: 'Yunax Digital',
          description: 'Payment for your order',
          order_id: paymentData.orderId,
          handler: async function (response) {
            try {
              setIsPaying(true);
              setMessage('Verifying payment status...');

              const verifyRes = await fetch(`${API}/payments/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              if (!verifyRes.ok) {
                const verifyErr = await verifyRes.json().catch(() => ({}));
                throw new Error(verifyErr.error || 'Payment verification failed');
              }

              setMessage('Order placed successfully! Redirecting to your orders...');
              setItems([]);
              saveStoredCartItems([]);
              setTimeout(() => {
                window.location.href = '/orders';
              }, 900);
            } catch (vErr) {
              setMessage(vErr.message || 'Payment verification failed.');
              setIsPaying(false);
            }
          },
          prefill: {
            name: shippingAddress.fullName,
            contact: shippingAddress.phone,
          },
          theme: {
            color: '#2563eb',
          },
          modal: {
            ondismiss: function () {
              setIsPaying(false);
              setMessage('Payment was cancelled.');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      const orderRes = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: hydratedItems.map((item) => ({
            productId: item.productId,
            slug: item.slug,
            quantity: item.qty || 1,
          })),
          paymentMethod,
          shippingAddress,
          billingDetails,
        }),
      });

      if (orderRes.status === 401) {
        clearCustomerSession();
        setMessage('Your session expired. Please log in again to continue checkout.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 900);
        return;
      }

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        throw new Error(err.error || 'Could not place the order.');
      }

      setMessage(
        paymentMethod === 'cod'
          ? 'Order placed successfully. Redirecting to your orders...'
          : 'Order placed. Please complete the bank transfer. Redirecting to your orders...'
      );
      setItems([]);
      saveStoredCartItems([]);
      setTimeout(() => {
        window.location.href = '/orders';
      }, 900);
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Checkout failed.');
    } finally {
      setIsPaying(false);
    }
  };

  const stepCopy = {
    1: 'Choose a saved address or enter a new one.',
    2: 'Review the products in your bag before payment.',
    3: 'Select your payment method and place the order.',
  };

  return (
    <div className="premium-shell min-h-screen text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-24 md:px-6 md:pb-16 md:pt-28">
        <section className="premium-panel overflow-hidden rounded-[20px] p-4 md:rounded-[28px] md:p-8">
          <div className="grid gap-5 lg:grid-cols-[1.2fr,0.8fr] lg:items-center lg:gap-8">
            <div className="space-y-4 md:space-y-5">
              <div className="premium-pill text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                <ShoppingBag size={14} className="text-blue-600" />
                Shopping cart
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-4xl">Review your cart</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                  Confirm your items, delivery details, and payment method in one simple checkout flow.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="premium-pill text-sm text-slate-700">
                  <Truck size={15} className="text-blue-600" />
                  Shipping calculated by pincode
                </div>
                <div className="premium-pill text-sm text-slate-700">
                  <ShieldCheck size={15} className="text-amber-500" />
                  Secure checkout flow
                </div>
                {isRefreshing && (
                  <div className="premium-pill text-sm text-slate-500">
                    <Loader2 size={15} className="animate-spin" />
                    Refreshing cart
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-1 xl:grid-cols-3">
                {[
                  { label: 'Items', value: items.length, icon: ShoppingCart },
                  { label: 'Saved addresses', value: savedAddresses.length, icon: MapPin },
                  { label: 'Order total', value: formatMoney(total), icon: CreditCard },
              ].map((item) => (
                <div key={item.label} className="premium-soft-panel rounded-[16px] p-3 md:rounded-[22px] md:p-5">
                  <div className="mb-3 flex items-center gap-3 md:mb-4 md:items-start md:justify-between md:gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm md:h-10 md:w-10">
                      <item.icon size={16} />
                    </div>
                    <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.12em] text-slate-400 sm:text-right md:text-xs md:tracking-[0.18em]">{item.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 md:text-2xl">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 md:mt-6 lg:grid-cols-12 lg:gap-6">
          <section className="space-y-5 lg:col-span-7 lg:space-y-6 xl:col-span-8">
            <div className="premium-panel overflow-hidden rounded-[20px] md:rounded-[28px]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 md:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Shopping bag</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900 md:text-2xl">Your items</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">{items.length}</span>
              </div>

              <div className="space-y-4 p-5 md:p-6">
                {isRefreshing && items.length === 0 ? (
                  <div className="premium-soft-panel rounded-[18px] p-8 text-center md:rounded-[22px] md:p-12">
                    <Loader2 size={30} className="mx-auto mb-3 animate-spin text-blue-600" />
                    <p className="text-base font-semibold text-slate-900">Refreshing your cart</p>
                    <p className="mt-2 text-sm text-slate-500">We are checking current availability and prices.</p>
                  </div>
                ) : items.length === 0 ? (
                  <div className="premium-soft-panel rounded-[18px] p-8 text-center md:rounded-[22px] md:p-12">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm md:h-16 md:w-16">
                      <ShoppingCart size={28} className="text-slate-300" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-slate-900">Your cart is empty</p>
                    <p className="mt-2 text-sm text-slate-500">Browse products and add items to start checkout.</p>
                    <a href="/products" className="premium-button premium-button-primary mt-6 w-full text-sm sm:w-auto">
                      Continue shopping
                    </a>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.slug} className="premium-soft-panel rounded-[18px] p-4 md:rounded-[22px] md:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
                        <div className="flex h-28 w-full items-center justify-center rounded-[16px] bg-white p-4 shadow-sm sm:w-28 md:rounded-[18px]">
                          <img src={item.images?.[0]} alt={item.name} className="h-full w-full object-contain" />
                        </div>

                        <div className="flex-1 space-y-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
                              <p className="mt-1 text-sm text-slate-500">{item.category || 'Premium hardware'}</p>
                            </div>
                            <p className="text-lg font-bold text-slate-900">{formatMoney(item.priceCents || 0)}</p>
                          </div>

                          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1">
                              <button
                                onClick={() => updateQty(item.slug, -1)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                              >
                                -
                              </button>
                              <span className="w-10 text-center text-sm font-semibold text-slate-900">{item.qty}</span>
                              <button
                                onClick={() => updateQty(item.slug, 1)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                              >
                                +
                              </button>
                            </div>

                            <button onClick={() => removeItem(item.slug)} className="w-fit text-sm font-medium text-rose-600 transition hover:text-rose-700">
                              Remove
                            </button>

                            <div className="premium-pill w-fit text-xs text-blue-700">
                              <CheckCircle2 size={14} />
                              GST invoice available
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-5 lg:col-span-5 lg:space-y-6 xl:col-span-4">
            <div className="premium-panel rounded-[20px] p-5 md:rounded-[28px] md:p-6">
              <div className="flex items-center justify-between gap-3">
                {checkoutSteps.map((step) => {
                  const isActive = currentStep === step.id;
                  const isComplete = currentStep > step.id;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => goToStep(step.id)}
                      className={`flex-1 rounded-[16px] border px-2 py-3 text-center transition-all md:rounded-[22px] md:px-3 ${
                        isActive
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : isComplete
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] md:text-xs md:tracking-[0.18em]">{step.label}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-[18px] bg-slate-50 px-4 py-4 md:rounded-[22px]">
                <p className="text-sm font-semibold text-slate-900">Step {currentStep}</p>
                <p className="mt-1 text-sm text-slate-500">{stepCopy[currentStep]}</p>
              </div>

              <form onSubmit={handleCheckout} className="mt-6 space-y-6">
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-[18px] border px-4 py-4 text-sm md:rounded-[24px] ${
                      messageTone === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {message}
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-5">
                    {savedAddresses.length > 0 && (
                      <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">Saved addresses</p>
                          <span className="text-xs text-slate-400">{savedAddresses.length} available</span>
                        </div>
                        <div className="space-y-3">
                          {savedAddresses.map((address) => {
                            const isSelected = selectedSavedAddressId === address.id;
                            return (
                              <label
                                key={address.id}
                                className={`flex w-full cursor-pointer items-start gap-3 rounded-[18px] border px-4 py-4 transition-all md:rounded-[20px] ${
                                  isSelected ? 'border-blue-200 bg-blue-50 text-slate-900' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    setCheckoutForm({
                                      fullName: address.fullName || '',
                                      phone: address.phone || '',
                                      line1: address.line1 || '',
                                      city: address.city || '',
                                      state: address.state || '',
                                      pincode: address.pincode || '',
                                    })
                                  }
                                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-slate-900">{address.fullName}</p>
                                      <p className={`mt-1 text-sm ${isSelected ? 'text-slate-600' : 'text-slate-500'}`}>
                                        {address.line1}, {address.city}, {address.state} - {address.pincode}
                                      </p>
                                    </div>
                                    {isSelected && (
                                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                                        Selected
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Where should we deliver?</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            Add the receiver name, phone number, full house or building details, and pincode. We use the pincode to confirm delivery availability and shipping charges.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Receiver name</span>
                            <input
                              value={checkoutForm.fullName}
                              onChange={(e) => setCheckoutForm((current) => ({ ...current, fullName: e.target.value }))}
                              placeholder="Eg: Muhammed Ali"
                              className="premium-input mt-2"
                              autoComplete="name"
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mobile number</span>
                            <input
                              value={checkoutForm.phone}
                              onChange={(e) => setCheckoutForm((current) => ({ ...current, phone: e.target.value }))}
                              placeholder="10-digit mobile number"
                              className="premium-input mt-2"
                              autoComplete="tel"
                              inputMode="tel"
                            />
                          </label>
                        </div>

                        <label className="block">
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">House / building / street</span>
                          <input
                            value={checkoutForm.line1}
                            onChange={(e) => setCheckoutForm((current) => ({ ...current, line1: e.target.value }))}
                            placeholder="House no, building name, street, landmark"
                            className="premium-input mt-2"
                            autoComplete="street-address"
                          />
                          <span className="mt-2 block text-xs leading-5 text-slate-400">
                            Include a nearby landmark if it helps the delivery team find you faster.
                          </span>
                        </label>

                        <div className="grid gap-4 sm:grid-cols-3">
                          <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">City</span>
                            <input
                              value={checkoutForm.city}
                              onChange={(e) => setCheckoutForm((current) => ({ ...current, city: e.target.value }))}
                              placeholder="City"
                              className="premium-input mt-2"
                              autoComplete="address-level2"
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">State</span>
                            <input
                              value={checkoutForm.state}
                              onChange={(e) => setCheckoutForm((current) => ({ ...current, state: e.target.value }))}
                              placeholder="State"
                              className="premium-input mt-2"
                              autoComplete="address-level1"
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pincode</span>
                            <input
                              value={checkoutForm.pincode}
                              onChange={(e) => setCheckoutForm((current) => ({ ...current, pincode: e.target.value }))}
                              placeholder="Eg: 673001"
                              className="premium-input mt-2"
                              autoComplete="postal-code"
                              inputMode="numeric"
                            />
                          </label>
                        </div>
                      </div>

                      {quoteLoading && <p className="text-xs text-slate-400">Calculating delivery options...</p>}
                      {!quoteLoading && quote && (
                        <div className={`mt-4 rounded-[18px] border px-4 py-4 text-sm ${isServiceable ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-rose-100 bg-rose-50 text-rose-700'}`}>
                          <p className="font-semibold">{isServiceable ? 'Delivery available' : 'Delivery unavailable'}</p>
                          <p className="mt-1">
                            {isServiceable
                              ? `${etaLabel} delivery available for pincode ${checkoutForm.pincode}.`
                              : `We do not currently deliver to pincode ${checkoutForm.pincode}.`}
                          </p>
                        </div>
                      )}
                      {quoteError && <p className="text-xs text-rose-600">{quoteError}</p>}
                    </div>

                    <button type="button" onClick={() => goToStep(2)} className="premium-button premium-button-primary w-full text-sm">
                      Continue to review
                    </button>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Please confirm delivery address</p>
                          <p className="mt-1 text-xs text-slate-500">Your order will be shipped to this address.</p>
                        </div>
                        <MapPin className="h-5 w-5 shrink-0 text-blue-600" />
                      </div>
                      <div className="mt-4 space-y-3 text-sm">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Receiver</p>
                          <p className="mt-1 font-semibold text-slate-900">{checkoutForm.fullName || 'Name not added'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Address</p>
                          <p className="mt-1 leading-6 text-slate-600">
                            {checkoutForm.line1 || 'Address not added'}
                            <br />
                            {[checkoutForm.city, checkoutForm.state, checkoutForm.pincode].filter(Boolean).join(', ') || 'City, state, and pincode not added'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Contact</p>
                          <p className="mt-1 font-medium text-slate-700">{checkoutForm.phone || 'Phone not added'}</p>
                        </div>
                      </div>
                    </div>

                    {quote && (
                      <div className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-slate-100">
                        <p className="text-sm font-semibold text-slate-900">Delivery and invoice summary</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                          <p>Shipping zone: <span className="font-semibold text-slate-900 capitalize">{quote.shipping?.zone || 'national'}</span></p>
                          <p>Estimated delivery: <span className="font-semibold text-slate-900">{etaLabel || 'To be confirmed'}</span></p>
                          <p>GST: <span className="font-semibold text-slate-900">Included in total</span></p>
                          <p>Free shipping above: <span className="font-semibold text-slate-900">{formatMoney(freeShippingThreshold)}</span></p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.slug} className="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-4 text-sm">
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="text-slate-500">Qty: {item.qty}</p>
                          </div>
                          <p className="font-semibold text-slate-900">{formatMoney((item.priceCents || 0) * (item.qty || 1))}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button type="button" onClick={() => goToStep(1)} className="premium-button premium-button-secondary flex-1 text-sm">
                        Edit address
                      </button>
                      <button type="button" onClick={() => goToStep(3)} className="premium-button premium-button-primary flex-1 text-sm">
                        Continue to payment
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      {paymentOptions.map((option) => (
                        <label
                          key={option.id}
                          className={`block cursor-pointer rounded-[20px] border px-4 py-4 transition-all ${
                            paymentMethod === option.id ? 'border-blue-200 bg-blue-50 text-slate-900' : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            checked={paymentMethod === option.id}
                            onChange={() => setPaymentMethod(option.id)}
                            className="hidden"
                          />
                          <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                          <p className={`mt-1 text-sm ${paymentMethod === option.id ? 'text-slate-600' : 'text-slate-500'}`}>{option.description}</p>
                        </label>
                      ))}
                    </div>

                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
                      <label className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                        <input
                          type="checkbox"
                          checked={billingForm.isBusiness}
                          onChange={(e) => setBillingForm((current) => ({ ...current, isBusiness: e.target.checked }))}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        Need a business GST invoice
                      </label>

                      {billingForm.isBusiness && (
                        <div className="mt-4 space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <input
                              value={billingForm.companyName}
                              onChange={(e) => setBillingForm((current) => ({ ...current, companyName: e.target.value }))}
                              placeholder="Company name"
                              className="premium-input"
                            />
                            <input
                              value={billingForm.gstNumber}
                              onChange={(e) => setBillingForm((current) => ({ ...current, gstNumber: e.target.value.toUpperCase() }))}
                              placeholder="GST number"
                              className="premium-input"
                            />
                          </div>
                          <label className="flex items-center gap-3 text-sm text-slate-600">
                            <input
                              type="checkbox"
                              checked={billingForm.sameAsShipping}
                              onChange={(e) => setBillingForm((current) => ({ ...current, sameAsShipping: e.target.checked }))}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Billing address is same as delivery address
                          </label>
                          {!billingForm.sameAsShipping && (
                            <div className="space-y-4">
                              <input
                                value={billingForm.fullName}
                                onChange={(e) => setBillingForm((current) => ({ ...current, fullName: e.target.value }))}
                                placeholder="Billing contact name"
                                className="premium-input"
                              />
                              <input
                                value={billingForm.phone}
                                onChange={(e) => setBillingForm((current) => ({ ...current, phone: e.target.value }))}
                                placeholder="Billing phone"
                                className="premium-input"
                              />
                              <input
                                value={billingForm.line1}
                                onChange={(e) => setBillingForm((current) => ({ ...current, line1: e.target.value }))}
                                placeholder="Billing address line"
                                className="premium-input"
                              />
                              <div className="grid gap-4 sm:grid-cols-2">
                                <input
                                  value={billingForm.city}
                                  onChange={(e) => setBillingForm((current) => ({ ...current, city: e.target.value }))}
                                  placeholder="Billing city"
                                  className="premium-input"
                                />
                                <input
                                  value={billingForm.state}
                                  onChange={(e) => setBillingForm((current) => ({ ...current, state: e.target.value }))}
                                  placeholder="Billing state"
                                  className="premium-input"
                                />
                              </div>
                              <input
                                value={billingForm.pincode}
                                onChange={(e) => setBillingForm((current) => ({ ...current, pincode: e.target.value }))}
                                placeholder="Billing pincode"
                                className="premium-input"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button type="submit" disabled={isPaying || !items.length || !isServiceable} className="premium-button premium-button-primary w-full text-sm disabled:cursor-not-allowed disabled:opacity-60">
                      {isPaying ? 'Placing order...' : 'Place order'}
                    </button>
                  </div>
                )}
              </form>
            </div>

            <div className="premium-panel rounded-[20px] p-5 md:rounded-[28px] md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Price summary</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatMoney(quote?.subtotalCents ?? subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Shipping</span>
                  <span className={`font-semibold ${shippingCents === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {quote ? (shippingCents === 0 ? 'Free' : formatMoney(shippingCents)) : 'Enter address'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Shipping discount</span>
                  <span className="font-semibold text-emerald-600">- {formatMoney(discount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">GST</span>
                  <span className="font-semibold text-slate-900">{formatMoney(taxCents)} <span className="text-xs text-slate-400">(included)</span></span>
                </div>
                <div className="border-t border-dashed border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-slate-900">{formatMoney(total)}</span>
                  </div>
                </div>
              </div>

              <div className={`mt-5 rounded-[24px] px-4 py-4 text-sm ${isServiceable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {quote
                  ? `${etaLabel || 'Delivery ETA will be confirmed'} and invoice details will be attached to this order.`
                  : `Add a complete address to calculate shipping and tax.`}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
