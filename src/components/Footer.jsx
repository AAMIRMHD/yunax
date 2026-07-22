import { motion } from 'framer-motion';
import Reveal from './motion/Reveal';
import { fadeUpChild, staggerContainer } from '../lib/motion';

const Footer = () => (
  <footer className="relative overflow-hidden border-t border-slate-200 bg-white/80 py-10">
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent"
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    />
    <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-slate-600">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <Reveal variant="left" className="space-y-2">
          <div className="text-lg font-semibold text-slate-900">Yunax Digital Pvt. Ltd.</div>
          <div className="text-slate-500">Building smart & secure digital futures.</div>
          <div className="mt-3 text-slate-500">
            Support: <a href="mailto:info@yunax.com" className="hover-lift inline-block hover:text-slate-900">info@yunax.com</a>
          </div>
        </Reveal>
        <motion.div
          className="flex flex-wrap gap-4 text-slate-600"
          variants={staggerContainer(0.06)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {[
            ['Home', '/'],
            ['About', '/about'],
            ['Products', '/products'],
            ['GPUs', '/gpus'],
            ['Contact', '/contact'],
            ['FAQ', '/faq'],
            ['Support', '/support'],
          ].map(([label, href]) => (
            <motion.a key={href} href={href} variants={fadeUpChild} className="hover-lift rounded-full px-2 py-1 hover:text-slate-900">
              {label}
            </motion.a>
          ))}
        </motion.div>
      </div>

      <Reveal variant="blur" className="flex flex-wrap gap-4 border-t border-slate-200 pt-4 text-slate-500">
        <a href="/terms" className="hover-lift hover:text-slate-900">Terms</a>
        <a href="/privacy" className="hover-lift hover:text-slate-900">Privacy</a>
        <a href="/refund-policy" className="hover-lift hover:text-slate-900">Return & Refund</a>
      </Reveal>

      <Reveal variant="up" delay={0.1} className="text-slate-500">
        (c) {new Date().getFullYear()} Yunax Digital. All rights reserved.
      </Reveal>
    </div>
  </footer>
);

export default Footer;
