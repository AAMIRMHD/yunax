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
      className="glass rounded-2xl p-6 border border-slate-200 flex flex-col items-start gap-2"
    >
      <span className="text-4xl font-semibold text-slate-900">{display}{suffix}</span>
      <span className="text-slate-500 uppercase tracking-[0.25em] text-xs">{label}</span>
    </motion.div>
  );
};

const Stats = () => (
  <section id="stats" className="py-20 bg-gradient-to-b from-[#f5f7fb] to-white">
    <div className="max-w-6xl mx-auto px-6 space-y-10">
      <div className="flex flex-col items-center text-center gap-3">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Proof of performance</p>
        <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">Metrics that matter</h2>
        <p className="text-slate-600 max-w-2xl">Operational excellence proven across industries with measurable outcomes.</p>
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
