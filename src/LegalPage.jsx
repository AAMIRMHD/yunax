import Navbar from './components/Navbar';
import Footer from './components/Footer';

const contentByType = {
  terms: {
    eyebrow: 'Terms of Service',
    title: 'Terms for shopping with Yunax Digital',
    intro: 'These terms govern purchases placed through Yunax Digital. By using the website or placing an order, you agree to these store policies.',
    sections: [
      ['Orders', 'Orders are confirmed only after successful acceptance by Yunax Digital. Product availability, pricing corrections, and serviceability checks may affect whether an order proceeds.'],
      ['Payments', 'Online payments, bank transfers, and cash on delivery are subject to verification. Orders may be held, cancelled, or refunded if fraud checks fail or payment cannot be completed.'],
      ['Fulfillment', 'Estimated delivery timelines are shown during checkout and in your order history. These are estimates and may shift due to logistics, stock validation, or remote-area handling.'],
      ['Support', 'For help with orders, invoices, or returns, contact info@yunax.com or the support numbers shown on the contact page.'],
    ],
  },
  privacy: {
    eyebrow: 'Privacy Policy',
    title: 'How Yunax Digital handles customer data',
    intro: 'We collect only the information needed to process orders, communicate updates, and provide support.',
    sections: [
      ['What we collect', 'We may collect your name, email, phone number, shipping address, billing details, and order history when you create an account or place an order.'],
      ['How we use it', 'Your details are used to authenticate your account, deliver orders, generate invoices, send order notifications, and respond to support requests.'],
      ['Sharing', 'Customer information is shared only with trusted payment, messaging, logistics, and infrastructure providers required to operate the store.'],
      ['Security', 'We use authenticated account access, protected payment verification, and operational monitoring to reduce misuse and protect order data.'],
    ],
  },
  refunds: {
    eyebrow: 'Return & Refund Policy',
    title: 'Returns, cancellations, and refunds',
    intro: 'This policy explains when an order can be cancelled, returned, or refunded.',
    sections: [
      ['Cancellation window', 'Orders can generally be cancelled before shipment. Once an order moves to shipped status, cancellation may no longer be available.'],
      ['Refunds', 'If a prepaid order is cancelled after payment capture, the refund is processed and the order is marked as refunded. Timelines may depend on the payment provider or banking channel.'],
      ['Damaged or incorrect items', 'If an item arrives damaged, defective, or incorrect, contact support promptly with order details and photos so the case can be reviewed.'],
      ['Non-returnable cases', 'Certain custom, damaged-by-use, or clearance items may not be eligible for return unless required by applicable law.'],
    ],
  },
  support: {
    eyebrow: 'Support',
    title: 'Customer support and contact details',
    intro: 'Reach out for order help, business billing, invoice requests, delivery questions, or after-sales support.',
    sections: [
      ['Email', 'Primary support email: info@yunax.com'],
      ['Phone / WhatsApp', '+91 79948 74909 and +91 999 544 61 22'],
      ['Response times', 'Order and billing requests are typically reviewed within one business day.'],
      ['Office', 'YUNAX DIGITAL PVT LTD, 28/166A/167B, Maniparambath Building, Near Shobhika Wedding Mall, Mavoor Road, Pattery, Pottammal, Calicut, Kerala - 673016'],
    ],
  },
};

const LegalPage = ({ type = 'terms' }) => {
  const content = contentByType[type] || contentByType.terms;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 pb-20 pt-32">
        <section className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/20 md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{content.eyebrow}</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">{content.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{content.intro}</p>
        </section>

        <section className="mt-8 space-y-5">
          {content.sections.map(([heading, body]) => (
            <article key={heading} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 md:p-8">
              <h2 className="text-xl font-semibold text-slate-900">{heading}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LegalPage;
