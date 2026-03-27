import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const links = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Products', href: '/products' },
  { label: 'GPUs', href: '/gpus' },
  { label: 'Contact', href: '/contact' },
];

const Navbar = () => {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={`fixed top-0 inset-x-0 z-40 ${solid ? 'backdrop-blur-xl bg-white/85 shadow-lg border-b border-slate-200/70' : 'bg-transparent'}`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4 text-slate-800">
        <a href="/" className="flex items-center gap-3">
          <img src="/logo/logo.png" alt="Yunax Digital logo" className="h-10 w-auto object-contain drop-shadow-sm" />
        </a>

        <div className="hidden md:flex items-center gap-6 text-sm">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative pb-1 group text-slate-700 hover:text-slate-900"
            >
              {link.label}
              <span className="absolute left-0 -bottom-1 h-[2px] w-full scale-x-0 group-hover:scale-x-100 bg-gradient-to-r from-[#0ea5e9] to-[#f6a600] origin-left transition-transform duration-300" />
            </a>
          ))}
        </div>

        <a
          href="/contact"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#f6a600] text-black font-semibold shadow-[0_10px_30px_rgba(14,165,233,0.35)] hover:shadow-[0_10px_40px_rgba(246,166,0,0.35)] transition"
        >
          Secure My Business
        </a>
      </div>
    </motion.nav>
  );
};

export default Navbar;
