import { motion } from 'framer-motion';

// Combined Solutions + Gallery items (deduped)
const solutions = [
  { title: 'Custom PC Building', img: '/gallery/custom.jpeg', desc: 'Enthusiast rigs engineered for peak performance with meticulous thermals and cable management.' },
  { title: 'IT Consultancy', img: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80', desc: 'Full-stack IT advisory covering security posture, infrastructure health checks, backup strategy, and network architecture.' },
  { title: 'Managed IT Services', img: '/gallery/laptop.jpeg', desc: 'Analytics-led managed services and lifecycle support to keep your fleet running smoothly.' },
  { title: 'Networking', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', desc: 'Wired, wireless, and hybrid LAN/WAN designs built for low latency and high availability—tuned for reliable performance from campus to branch.' },
  { title: 'CCTV Systems', img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80', desc: 'End-to-end CCTV deployments with DVR/NVR options, camera selection guidance, clean cabling, and responsive after-sales support.' },
  { title: 'Work Station', img: '/gallery/work.jpeg', desc: 'Ergonomic productivity setups with calibrated displays, clean layouts, and quiet power.' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: (custom = 0) => ({
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 140, damping: 18, delay: custom * 0.06 },
  }),
};

const ServiceCard = ({ title, img, index }) => (
  <motion.div
    className="relative group h-72 rounded-2xl overflow-hidden glass neon-border card-glow"
    whileHover={{ y: -6, scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 180, damping: 16 }}
    variants={cardVariants}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.25 }}
    custom={index}
  >
    <motion.img
      src={img}
      alt={title}
      className="absolute inset-0 w-full h-full object-cover"
      whileHover={{ scale: 1.06 }}
      transition={{ duration: 0.4 }}
    />
    <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/15 to-black/65" />
    <div className="absolute inset-0 opacity-0 group-hover:opacity-85 transition duration-500" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(14,165,233,0.14), transparent 48%)' }} />
    <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-gradient-to-br from-[#7dd1ff]/40 to-[#f6c866]/20 blur-3xl" />
    <div className="absolute bottom-0 p-6 space-y-2 z-10 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
      <div className="text-2xl font-semibold">{title}</div>
      <div className="h-[1px] w-14 bg-gradient-to-r from-[#7dd1ff] to-[#f6c866]" />
    </div>
    <motion.div
      className="absolute inset-0"
      style={{ background: 'linear-gradient(120deg, rgba(125,209,255,0.25), rgba(246,200,102,0.05))' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.25, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    />
  </motion.div>
);

const Services = () => (
  <section id="services" className="relative py-24 bg-gradient-to-b from-[#f7f9ff] via-white to-[#eef2f7]">
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_10%_20%,rgba(14,165,233,0.12),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(246,166,0,0.14),transparent_30%)]" />
    <div className="max-w-6xl mx-auto px-6 relative space-y-12">
      <motion.div
        className="flex flex-col items-center text-center gap-3"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        viewport={{ once: true, amount: 0.4 }}
      >
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Built for Real Setups</p>
        <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">Our Work & Expertise, All in One</h2>
        <p className="text-slate-600 max-w-3xl">
          A single view of the solutions we deliver and real-world snapshots of how we build, secure, and support them.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-1000">
        {solutions.map((item, idx) => (
          <ServiceCard key={item.title} {...item} index={idx} />
        ))}
      </div>
    </div>
  </section>
);

export default Services;
