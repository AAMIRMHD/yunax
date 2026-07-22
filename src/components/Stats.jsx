import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useMotionValue, useSpring } from 'framer-motion';

const stats = [
  { label: 'Projects', value: 100, suffix: '+' },
  { label: 'Clients', value: 50, suffix: '+' },
  { label: 'Years Experience', value: 5, suffix: '+' },
  { label: 'Support', value: 24, suffix: '/7' },
];

const Counter = ({ value, label, suffix }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const count = useMotionValue(0);
  const spring = useSpring(count, { stiffness: 90, damping: 16 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => setDisplay(Math.round(latest)));
    return () => unsubscribe();
  }, [spring]);

  useEffect(() => {
    if (isInView) {
      count.set(0);
      const controls = animate(count, value, { duration: 1.6, ease: 'easeOut' });
      return () => controls.stop();
    }
  }, [isInView, value, count]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="luxury-card flex flex-col items-start gap-2 rounded-2xl p-6"
    >
      <span className="text-4xl font-semibold text-slate-950">{display}{suffix}</span>
      <span className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</span>
    </motion.div>
  );
};

const Stats = () => (
  <section id="stats" className="relative bg-slate-50/50 border-y border-slate-100 py-20 text-slate-900 overflow-hidden">
    {/* Glowing background highlights */}
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.06),transparent_40%),radial-gradient(circle_at_75%_80%,rgba(246,166,0,0.06),transparent_40%)]" />
    
    <div className="max-w-6xl mx-auto px-6 space-y-10 relative z-10">
      <div className="flex flex-col items-center text-center gap-3">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-blue-600">Proof of performance</p>
        <h2 className="text-3xl font-black text-slate-900 md:text-4xl">Metrics that matter</h2>
        <p className="max-w-2xl text-slate-500 font-medium">Operational excellence proven across industries with measurable outcomes.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Counter key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  </section>
);

export default Stats;
