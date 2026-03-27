import { motion } from 'framer-motion';

const services = [
  { title: 'IT Consultancy', img: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80', desc: 'Full-stack IT advisory covering security posture, infrastructure health checks, backup strategy, and network architecture. We benchmark your estate against business outcomes and deliver a prioritized, actionable roadmap.' },
  { title: 'CCTV Systems', img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80', desc: 'End-to-end CCTV deployments with DVR/NVR options, camera selection guidance, clean cabling, and responsive after-sales support.' },
  { title: 'Networking', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', desc: 'Wired, wireless, and hybrid LAN/WAN designs built for low latency and high availability—tuned for reliable performance from campus to branch.' },
  { title: 'Cyber Security', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80', desc: 'Layered defense against hacking, malware, phishing, and credential theft. Hardened endpoints, segmentation, and always-on monitoring keep users productive while minimizing risk.' },
  { title: 'IT Infrastructure', img: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=800&q=80', desc: 'Resilient, scalable infrastructure spanning compute, storage, and cloud—built for uptime, efficiency, and future growth.' },
];

const ServiceCard = ({ title, img }) => (
  <motion.div
    className="relative group h-72 rounded-2xl overflow-hidden glass neon-border card-glow"
    whileHover={{ y: -6, scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 180, damping: 16 }}
  >
    <motion.img
      src={img}
      alt={title}
      className="absolute inset-0 w-full h-full object-cover opacity-90"
      whileHover={{ scale: 1.06 }}
      transition={{ duration: 0.4 }}
    />
    <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/40 to-white/80" />
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(14,165,233,0.2), transparent 40%)' }} />
    <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-gradient-to-br from-[#7dd1ff]/40 to-[#f6c866]/20 blur-3xl" />
    <div className="absolute bottom-0 p-6 space-y-2 z-10 text-slate-900">
      <div className="text-2xl font-semibold text-slate-900">{title}</div>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Core Expertise</p>
          <h2 className="text-3xl md:text-4xl font-semibold mt-2 text-slate-900">Elite Services, Engineered for Security</h2>
        </div>
        <p className="text-slate-600 max-w-xl">
          We fuse strategy, design, and hardened technology to deliver infrastructure that performs today and protects tomorrow.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-1000">
        {services.map((item) => (
          <ServiceCard key={item.title} {...item} />
        ))}
      </div>
    </div>
  </section>
);

export default Services;
