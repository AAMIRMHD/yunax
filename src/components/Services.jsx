import { motion } from 'framer-motion';
import Tilt from './ui/Tilt';

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

const ServiceCard = ({ title, img, desc, index }) => (
  <Tilt maxRotation={12} className="h-80 rounded-[28px] overflow-hidden">
    <motion.div
      className="card-glow group relative h-full w-full overflow-hidden border border-slate-200/80 bg-slate-100 shadow-xl shadow-slate-200/50"
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
        whileHover={{ scale: 1.08 }}
        transition={{ duration: 0.4 }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/25 to-black/82 pointer-events-none" />
      <div className="absolute bottom-0 z-10 space-y-3 p-6 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] pointer-events-none">
        <div className="text-2xl font-semibold tracking-tight">{title}</div>
        <div className="h-[1px] w-14 bg-gradient-to-r from-[#7dd1ff] to-[#f6c866]" />
        <p className="line-clamp-2 text-sm leading-6 text-slate-200">{desc}</p>
      </div>
    </motion.div>
  </Tilt>
);

const Services = () => (
  <section id="services" className="relative bg-white py-20 sm:py-24">
    <div className="max-w-6xl mx-auto px-6 relative space-y-12">
      <motion.div
        className="flex flex-col items-center text-center gap-3"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        viewport={{ once: true, amount: 0.4 }}
      >
        <p className="luxury-eyebrow">Built for Real Setups</p>
        <h2 className="luxury-title text-3xl md:text-5xl">White-glove service for every setup.</h2>
        <p className="luxury-copy max-w-3xl">
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
