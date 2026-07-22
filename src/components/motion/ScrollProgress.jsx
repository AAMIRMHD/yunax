import { motion, useScroll, useSpring } from 'framer-motion';

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  return (
    <>
      <motion.div
        aria-hidden
        className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-sky-500 via-cyan-400 to-amber-400 shadow-[0_0_18px_rgba(14,165,233,0.45)]"
        style={{ scaleX }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed right-5 top-1/2 z-40 hidden h-24 w-1 overflow-hidden rounded-full bg-slate-200/70 lg:block"
      >
        <motion.div
          className="w-full origin-top bg-gradient-to-b from-sky-500 to-amber-400"
          style={{ scaleY: scrollYProgress }}
        />
      </motion.div>
    </>
  );
};

export default ScrollProgress;
