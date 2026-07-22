import { motion } from 'framer-motion';
import { ArrowRight, Cpu, Headphones, Monitor, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import Tilt from './ui/Tilt';

const storePaths = [
  {
    label: 'Performance Systems',
    description: 'Prebuilt desktops, workstations, and creator-ready machines.',
    icon: Cpu,
  },
  {
    label: 'Display & Desk Gear',
    description: 'Monitors, peripherals, and accessories for polished setups.',
    icon: Monitor,
  },
  {
    label: 'Audio & Essentials',
    description: 'Headsets, daily drivers, and reliable add-ons for every desk.',
    icon: Headphones,
  },
];

const benefits = ['Verified stock', 'Secure checkout', 'Expert guidance'];

const ease = [0.16, 1, 0.3, 1];

const FeaturedProducts = () => {
  return (
    <section className="store-gateway luxury-section relative overflow-hidden py-16 sm:py-20 lg:py-24" id="featured">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-8rem] top-10 h-72 w-72 rounded-full bg-cyan-200/25 blur-3xl"
        animate={{ y: [0, -22, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-7rem] left-[-6rem] h-72 w-72 rounded-full bg-amber-200/30 blur-3xl"
        animate={{ y: [0, 24, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-5 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12 } },
          }}
          className="space-y-6"
        >
          <motion.div
            variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } }}
            className="store-gateway-pill inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm"
          >
            <Sparkles className="h-4 w-4 text-[var(--luxury-gold)]" />
            <p className="luxury-eyebrow">Ecommerce Store</p>
          </motion.div>

          <div className="space-y-4">
            <motion.h2
              variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.72, ease } } }}
              className="luxury-title max-w-3xl text-4xl leading-tight sm:text-5xl"
            >
              Enter the Yunax store, built for focused hardware discovery.
            </motion.h2>
            <motion.p
              variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.72, ease } } }}
              className="luxury-copy max-w-2xl text-base sm:text-lg"
            >
              Browse the full ecommerce section when you are ready to compare categories, filter by your needs, and move from shortlist to checkout without noise.
            </motion.p>
          </div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.72, ease } } }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <a
              href="/products"
              className="store-gateway-primary group inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1 hover:bg-slate-800"
            >
              Open Store
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a
              href="/cart"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-900 shadow-sm backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:border-slate-300 hover:bg-white"
            >
              View Bag
              <ShoppingBag className="h-4 w-4" />
            </a>
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }}
            className="grid gap-3 pt-2 sm:grid-cols-3"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>{benefit}</span>
                <span className="ml-auto text-[10px] font-black text-slate-300">{`0${index + 1}`}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 34, rotateX: 10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8, delay: 0.1, ease }}
          style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
          className="w-full"
        >
          <Tilt className="luxury-card store-gateway-panel relative overflow-hidden rounded-[28px] p-4 sm:p-5" maxRotation={8}>
            <div className="relative rounded-[24px] border border-slate-200/80 bg-white/95 p-5 text-slate-900 sm:p-6 shadow-xl backdrop-blur-md" style={{ transform: 'translateZ(10px)' }}>
              <motion.div
                aria-hidden="true"
                className="absolute right-[-3rem] top-[-3rem] h-28 w-28 rounded-full border border-slate-200/40"
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Store Mode</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Shop by intent</h3>
                </div>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md"
                >
                  <ShoppingBag className="h-5 w-5" />
                </motion.div>
              </div>

              <div className="mt-6 space-y-3">
                {storePaths.map((path, index) => {
                  const Icon = path.icon;
                  return (
                    <motion.a
                      key={path.label}
                      href="/products"
                      initial={{ opacity: 0, x: 24 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      whileHover={{ x: 6, scale: 1.015 }}
                      transition={{ duration: 0.55, delay: 0.18 + index * 0.08, ease }}
                      className="group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-primary/45 hover:bg-white hover:shadow-xl hover:shadow-primary/5"
                    >
                      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-amber-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 border border-slate-100 group-hover:bg-slate-100 group-hover:text-slate-900">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-slate-900">{path.label}</span>
                        <span className="mt-1 block text-sm leading-6 text-slate-500">{path.description}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-900 align-middle mt-1" />
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </Tilt>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
