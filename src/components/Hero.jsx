import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const scaleBg = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const yText = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0.2]);

  return (
    <section ref={ref} id="top" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <motion.div
        style={{ scale: scaleBg }}
        className="absolute inset-0 hero-bg"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(14,165,233,0.14),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(246,166,0,0.16),transparent_30%)]" />

      {[...Array(18)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-slate-400"
          initial={{ x: Math.random() * 1200 - 600, y: Math.random() * 800 - 400, opacity: 0 }}
          animate={{
            y: [null, (Math.random() - 0.5) * 200],
            x: [null, (Math.random() - 0.5) * 200],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{ duration: 5 + Math.random() * 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="relative max-w-5xl mx-auto px-6 text-center text-slate-900">
        <motion.div style={{ y: yText, opacity: opacityText }} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm"
          >
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#f6a600]" />
            YUNAX.
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.9, ease: 'easeOut' }}
            className="text-4xl md:text-6xl font-semibold leading-tight"
          >
            Yunax Digital Pvt. Ltd
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto"
          >
            Empowering Businesses with Advanced IT, Security & Networking Solutions
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <a
              href="#services"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#f6a600] text-black font-semibold shadow-[0_20px_50px_rgba(14,165,233,0.28)]"
            >
              Explore Services
            </a>
            <a
              href="#contact"
              className="px-6 py-3 rounded-full glass border border-slate-200 hover:border-slate-300 transition text-slate-800"
            >
              Get Consultation
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
