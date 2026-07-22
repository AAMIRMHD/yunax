import { motion } from 'framer-motion';

const orbs = [
  { className: 'left-[-8%] top-[8%] h-72 w-72 bg-sky-300/20', duration: 9, delay: 0 },
  { className: 'right-[-6%] top-[22%] h-80 w-80 bg-amber-300/20', duration: 11, delay: 1.2 },
  { className: 'left-[18%] bottom-[12%] h-64 w-64 bg-cyan-300/15', duration: 10, delay: 0.6 },
  { className: 'right-[12%] bottom-[8%] h-56 w-56 bg-violet-300/10', duration: 12, delay: 1.8 },
];

const AmbientBackground = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    {orbs.map((orb) => (
      <motion.div
        key={orb.className}
        className={`absolute rounded-full blur-3xl ${orb.className}`}
        animate={{
          y: [0, -28, 12, 0],
          x: [0, 18, -10, 0],
          scale: [1, 1.08, 0.96, 1],
        }}
        transition={{
          duration: orb.duration,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: orb.delay,
        }}
      />
    ))}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_42%)]" />
  </div>
);

export default AmbientBackground;
