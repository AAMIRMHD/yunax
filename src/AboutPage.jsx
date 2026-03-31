import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { motion, useInView, useMotionValue, useSpring, animate } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

const team = [
  { name: 'ABDUSALAM', role: 'Chairman', img: '/team/chairman.png' },
  { name: 'Ummer Yohana', role: 'Managing Director', img: '/team/ummer.png' },
  { name: 'Ahammad Finash', role: 'Director', img: '/team/finash.png' },
  { name: 'ABDUL BASITH P P', role: 'Director', img: '/team/basith.png' },
  { name: 'Muhammed Sirajudheen P P', role: 'Director', img: '/team/siraj.png' },
  { name: 'Sabith', role: 'Director', img: '/team/sabith.png' },
  { name: 'SHAMSHIDA UMMER', role: 'Director', img: '/team/shamshida.png' },
];

const aboutStats = [
  { label: 'Team Members', value: 50, suffix: '+' },
  { label: 'Customers', value: 250, suffix: 'k+' },
  { label: 'Products', value: 500, suffix: '+' },
  { label: 'Years in Business', value: 22, suffix: '' },
];

const achievements = [
  { title: 'Award 2012 – Sri Lankan Ministry', desc: 'Best Customer Network and Satisfaction Award', img: '/ach/ach1.jpg' },
  { title: 'KMCT 2012–2013', desc: 'Best Business Performance Award', img: '/ach/ach2.jpg' },
  { title: 'Asus Taiwan 2011–2012', desc: 'Best Retailer Award', img: '/ach/ach3.jpg' },
  { title: 'Direct Customer Interaction', desc: 'Recognized for hands-on service excellence', img: '/ach/ach4.jpg' },
];

const StatCard = ({ value, suffix, label }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const count = useMotionValue(0);
  const spring = useSpring(count, { stiffness: 90, damping: 16 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const unsub = spring.on('change', (latest) => setDisplay(Math.round(latest)));
    return () => unsub();
  }, [spring]);

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, { duration: 1.6, ease: 'easeOut' });
      return () => controls.stop();
    }
  }, [isInView, count, value]);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="glass border border-slate-200 rounded-2xl p-4 text-sm space-y-1 shadow-md"
    >
      <div className="text-2xl font-semibold text-slate-900">
        {display}{suffix}
      </div>
      <div className="text-slate-600">{label}</div>
    </motion.div>
  );
};

const AboutPage = () => (
  <div className="bg-white text-slate-900 min-h-screen">
    <Navbar />
    <main className="pt-24 pb-16">
      <section className="max-w-6xl mx-auto px-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="space-y-3 text-center"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">About Us</p>
          <h1 className="text-3xl md:text-4xl font-semibold">Advanced Technologies to Our Customers at an Affordable Cost</h1>
          <p className="text-slate-600 leading-relaxed">
            We, Yunax Digital Pvt Ltd, are the sister concern of M/s. YOHANA COMPUTERS, started 22 years ago in Mumbai. We shifted to Calicut in 2002 and today are a leading wholesaler and retailer for servers, desktops, laptops, net tops, and peripherals, serving both enterprise and retail customers.
          </p>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-6 space-y-10 mt-12">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="overflow-hidden rounded-2xl shadow-lg relative">
              <img src="/newsecabout/ourstory.jpeg" alt="Our Story" className="w-full h-[392px] object-cover" style={{ aspectRatio: '1 / 1' }} />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/30 flex items-center justify-center">
                <h2 className="text-2xl font-semibold text-white drop-shadow">Our Story</h2>
              </div>
            </div>
            <p className="text-slate-600 leading-relaxed">
              We provide consultancy across all IT areas with a 22-year legacy from Mumbai to Calicut. From our roots as Yohana Computers to the premium Yunax Digital experience, we’ve evolved with our customers—modernizing infrastructure, hardening security, and scaling performance. Our Pottammal, Calicut hub features curated products, live demos, and labs so clients can see and feel emerging tech before adoption. We stay hands-on from strategy to execution, ensuring every rollout is stable, secure, future-ready, and tied to measurable ROI.
            </p>
          </motion.div>
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            <div className="overflow-hidden rounded-2xl shadow-lg relative">
              <img src="/newsecabout/ourmission.jpeg" alt="Our Mission" className="w-full h-[392px] object-cover" style={{ aspectRatio: '1 / 1' }} />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/30 flex items-center justify-center">
                <h2 className="text-2xl font-semibold text-white drop-shadow">Our Mission</h2>
              </div>
            </div>
            <p className="text-slate-600 leading-relaxed">
              To bring the most advanced technology to the common people at an affordable cost—without sacrificing reliability or security. We believe in transparent partnerships, measurable outcomes, and long-term value. Every deployment is secure by default, scalable by design, and adaptable as needs evolve, so customers stay ahead as technology moves.
            </p>
          </motion.div>
        </div>

        <motion.div
          className="space-y-3 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <h2 className="text-2xl font-semibold">Visit Our Space</h2>
          <p className="text-slate-600 leading-relaxed">A glimpse of the Yunax experience center where customers explore, demo, and co-design solutions.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[ '/newsecabout/shop1.webp', '/newsecabout/shop2.avif', '/newsecabout/shop3.jpeg' ].map((src) => (
              <motion.div
                key={src}
                className="overflow-hidden rounded-2xl shadow-lg"
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              >
                <motion.img
                  src={src}
                  alt="Yunax showroom"
                  className="w-full h-48 object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.35 }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-6 mt-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {aboutStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 mt-14 space-y-6">
        <motion.h2
          className="text-2xl font-semibold text-center"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          Meet The Team
        </motion.h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {team.map((member) => (
            <div key={member.name} className="glass border border-slate-200 rounded-2xl p-4 space-y-3 text-center">
              <div className="h-28 w-28 mx-auto rounded-full overflow-hidden bg-slate-100">
                <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
              </div>
              <div className="text-lg font-semibold text-slate-900">{member.name}</div>
              <div className="text-sm text-slate-600">{member.role}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 mt-14 space-y-6 overflow-hidden">
        <motion.div
          className="flex flex-col items-center gap-3 text-center"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 bg-slate-100 rounded-full">Achievements</span>
          <h3 className="text-2xl font-semibold">Milestones that celebrate our service, performance, and customer-first mindset.</h3>
        </motion.div>
        <div className="relative pt-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent" />
          <motion.div
            className="flex gap-5"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 26, ease: 'linear', repeat: Infinity }}
          >
            {[...achievements, ...achievements].map((item, idx) => (
              <motion.div
                key={`${item.title}-${idx}`}
                className="flex-none w-[260px] rounded-2xl overflow-hidden border border-slate-200 shadow-lg shadow-slate-900/5 bg-white"
                whileHover={{ y: -6, scale: 1.015 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              >
                <div className="h-40 w-full overflow-hidden relative">
                  <motion.img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.35 }}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className="p-4 space-y-2">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500 line-clamp-2">{item.title}</div>
                  <div className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default AboutPage;
