import { motion } from 'framer-motion';

const Contact = () => (
  <section id="contact" className="py-20 relative bg-white">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.18),transparent_40%)]" />
    <div className="max-w-6xl mx-auto px-6 grid gap-10 lg:grid-cols-2 lg:items-start lg:justify-items-center relative">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7 }}
        className="space-y-6 w-full"
      >
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Contact</p>
        <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">Let's Build Your Digital Future</h2>
        <p className="text-slate-600">
          Tell us about your infrastructure, security, or networking goals. Our architects will respond within one business day.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-slate-700">
          <a
            href="https://wa.me/918086856677"
            target="_blank"
            rel="noreferrer"
            className="glass rounded-xl p-4 border border-slate-200 hover:border-slate-300 transition"
          >
            +91 80868 56677
          </a>
          <a
            href="https://wa.me/919995446122"
            target="_blank"
            rel="noreferrer"
            className="glass rounded-xl p-4 border border-slate-200 hover:border-slate-300 transition"
          >
            +91 999 544 61 22
          </a>
          <a
            href="mailto:info@yunax.com"
            className="glass rounded-xl p-4 border border-slate-200 hover:border-slate-300 transition sm:col-span-2"
          >
            info@yunax.com
          </a>
        </div>
        <a
          href="https://www.google.com/maps/place/Yunax+Digital/@11.2588978,75.8036653,977m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3ba659f8938f2a4d:0x1639b3e689f38ae4!8m2!3d11.2588925!4d75.8062402!16s%2Fg%2F11rsb2hpgx?entry=ttu"
          target="_blank"
          rel="noreferrer"
          className="glass rounded-2xl p-5 border border-slate-200 block hover:border-slate-300 transition space-y-3"
        >
          <div>
            <div className="text-slate-900 font-semibold text-sm">YUNAX DIGITAL PVT LTD</div>
            <div className="text-slate-600 text-sm leading-relaxed mt-1">
              28/166A/167B, Maniparambath Building<br />
              Near Shobhika Wedding Mall<br />
              Mavoor Road, Pattery, Pottammal<br />
              Calicut, Kerala - 673016
            </div>
          </div>
          <div className="h-44 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
            <iframe
              title="Yunax Digital on Google Maps"
              src="https://www.google.com/maps?q=11.2588925,75.8062402&z=17&output=embed"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>
          <div className="text-sm text-slate-700 font-semibold">Open in Google Maps</div>
        </a>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7 }}
        className="glass rounded-2xl p-8 border border-slate-200 shadow-2xl w-full max-w-xl"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-600">Name</label>
            <input type="text" className="w-full px-4 py-3 rounded-xl" placeholder="Your name" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-600">Email</label>
            <input type="email" className="w-full px-4 py-3 rounded-xl" placeholder="you@company.com" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-600">Message</label>
            <textarea className="w-full px-4 py-3 rounded-xl min-h-[120px]" placeholder="Project brief" required />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#f6a600] text-black font-semibold shadow-[0_15px_40px_rgba(14,165,233,0.25)]"
          >
            Send Message
          </button>
        </div>
      </motion.form>
    </div>
  </section>
);

export default Contact;
