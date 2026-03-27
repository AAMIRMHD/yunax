const Footer = () => (
  <footer className="py-10 border-t border-slate-200 bg-white/80">
    <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-sm text-slate-600">
      <div>
        <div className="text-slate-900 font-semibold">Yunax Digital Pvt. Ltd.</div>
        <div className="text-slate-500">Building smart & secure digital futures.</div>
      </div>
      <div className="flex flex-wrap gap-4 text-slate-600">
        <a href="/" className="hover:text-slate-900">Home</a>
        <a href="/about" className="hover:text-slate-900">About</a>
        <a href="/services" className="hover:text-slate-900">Services</a>
        <a href="/products" className="hover:text-slate-900">Products</a>
        <a href="/gpus" className="hover:text-slate-900">GPUs</a>
        <a href="/contact" className="hover:text-slate-900">Contact</a>
      </div>
      <div className="text-slate-500">
        (c) {new Date().getFullYear()} Yunax Digital. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
