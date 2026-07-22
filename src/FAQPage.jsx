import Navbar from './components/Navbar';
import Footer from './components/Footer';

const groups = [
  {
    title: 'Shipping',
    items: [
      ['How do you calculate delivery charges?', 'Delivery charges are calculated during checkout from the delivery pincode, product total, and serviceability zone.'],
      ['When will my order arrive?', 'Estimated delivery is shown at checkout and again in your order history after the address is entered.'],
    ],
  },
  {
    title: 'Warranty',
    items: [
      ['Do products include warranty?', 'Warranty depends on the brand and product category. Keep your invoice safe for service or claim support.'],
      ['Who handles warranty service?', 'Brand warranty is usually handled by the manufacturer, while YunaX can help you with invoice and support coordination.'],
    ],
  },
  {
    title: 'Returns',
    items: [
      ['Can I cancel an order?', 'Orders can usually be cancelled before shipment. Once shipped, cancellation may no longer be available.'],
      ['How do returns work?', 'Return eligibility depends on the product condition, category, and policy terms shown on the refund policy page.'],
    ],
  },
  {
    title: 'Payments',
    items: [
      ['Which payment methods are supported?', 'The checkout supports Cash on Delivery, bank transfer, and Razorpay online payments.'],
      ['What happens if online payment fails?', 'If payment verification does not complete, the order will not be marked as paid. You can retry or use another method.'],
    ],
  },
];

const FAQPage = () => (
  <div className="min-h-screen bg-white text-slate-900">
    <Navbar />
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
      <div className="border-b border-slate-100 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Help center</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">Frequently asked questions</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
          Quick answers for shipping, warranty, returns, and payments.
        </p>
      </div>

      <div className="mt-10 space-y-8">
        {groups.map((group) => (
          <section key={group.title}>
            <h2 className="text-xl font-bold text-slate-900">{group.title}</h2>
            <div className="mt-4 divide-y divide-slate-100 rounded-[24px] border border-slate-200 bg-white shadow-sm">
              {group.items.map(([question, answer]) => (
                <details key={question} className="group p-5">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
                    {question}
                    <span className="float-right text-slate-400 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
    <Footer />
  </div>
);

export default FAQPage;
