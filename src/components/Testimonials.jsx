import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const testimonials = [
  {
    name: 'Aarav Mehta',
    company: 'FinPulse Capital',
    text: 'Yunax elevated our network security posture while keeping latency ultra-low. It feels premium end-to-end.',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Meera Iyer',
    company: 'Nova Retail',
    text: 'They orchestrated CCTV + cybersecurity into one sleek dashboard. The rollout was flawless.',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Rahul Nair',
    company: 'Skyline Logistics',
    text: 'Rock-solid uptime and support. Yunax behaves like an in-house elite task force.',
    avatar: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80',
  },
];

const Testimonials = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 3800);
    return () => clearInterval(id);
  }, []);

  const current = testimonials[index];

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-b from-white to-[#f5f7fb]">
      <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Testimonials</p>
          <h2 className="text-3xl font-semibold mt-2 text-slate-900">Trusted by visionary teams</h2>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="glass border border-slate-200 rounded-3xl px-8 py-10 max-w-3xl mx-auto"
            >
              <div className="flex flex-col items-center gap-4">
                <img src={current.avatar} alt={current.name} className="w-16 h-16 rounded-full object-cover border border-slate-200" />
                <p className="text-lg text-slate-700 leading-relaxed">"{current.text}"</p>
                <div className="font-semibold text-slate-900">{current.name}</div>
                <div className="text-slate-500 text-sm">{current.company}</div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-3 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                aria-label={`slide-${i}`}
                onClick={() => setIndex(i)}
                className={`w-2.5 h-2.5 rounded-full ${i === index ? 'bg-[#0ea5e9]' : 'bg-slate-300'} transition`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
