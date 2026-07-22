import { motion } from 'framer-motion';
import { sectionTransition } from '../../lib/motion';

const SectionDivider = ({ className = '' }) => (
  <div className={`relative py-2 ${className}`}>
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.8 }}
      variants={sectionTransition}
      className="mx-auto h-px max-w-5xl origin-center bg-gradient-to-r from-transparent via-slate-300 to-transparent"
    />
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.35, duration: 0.5 }}
      className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-sky-500 to-amber-400 shadow-[0_0_12px_rgba(14,165,233,0.5)]"
    />
  </div>
);

export default SectionDivider;
