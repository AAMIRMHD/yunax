import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const images = [
  { category: 'Security', src: '/gallery/security.jpeg', desc: 'Command center security monitoring and threat response.' },
  { category: 'Infrastructure', src: '/gallery/infrastructure.jpeg', desc: 'Data center-grade infrastructure and resilient backbones.' },
  { category: 'Custom PC Building', src: '/gallery/custom.jpeg', desc: 'Enthusiast rigs engineered for peak performance.' },
  { category: 'Work Station', src: '/gallery/work.jpeg', desc: 'Ergonomic, productivity-focused workstation setups.' },
  { category: 'Services', src: '/gallery/laptop.jpeg', desc: 'Analytics and managed IT services in action.' },
  { category: 'Networking', src: '/gallery/networking.jpeg', desc: 'High-availability networking for smart cities and campuses.' },
];

const categories = ['All', 'Security', 'Networking', 'Infrastructure', 'Services', 'Custom PC Building', 'Work Station'];

const GalleryCard = ({ src, category, desc, onClick }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-50, 50], [10, -10]);
  const rotateY = useTransform(x, [-50, 50], [-10, 10]);
  const springX = useSpring(rotateX, { stiffness: 180, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 180, damping: 20 });

  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    x.set(dx);
    y.set(dy);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      layout
      className="rounded-2xl overflow-hidden relative group cursor-pointer h-72 shadow-lg"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      style={{ rotateX: springX, rotateY: springY, transformStyle: 'preserve-3d' }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
    >
      <motion.img
        src={src}
        alt={category}
        className="absolute inset-0 w-full h-full object-cover"
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.4 }}
        style={{ transformStyle: 'preserve-3d' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/18 to-black/38 opacity-0 group-hover:opacity-100 transition duration-400" />
      <div className="absolute bottom-4 left-4 text-sm tracking-wide text-white space-y-1">
        <div className="font-semibold text-white drop-shadow-sm">{category}</div>
        <div className="text-white/80 text-xs max-w-[80%] leading-snug">{desc}</div>
        <div className="text-white/85 text-xs">Tap to view</div>
      </div>
    </motion.div>
  );
};

const Gallery = () => {
  const [active, setActive] = useState('All');
  const [lightbox, setLightbox] = useState(null);

  const filtered = useMemo(() => {
    if (active === 'All') return images;
    return images.filter((img) => img.category === active);
  }, [active]);

  return (
    <section id="gallery" className="relative py-20 bg-gradient-to-b from-white to-[#f5f7fb]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.12),transparent_40%)]" />
      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Gallery</p>
            <h2 className="text-3xl font-semibold mt-2 text-slate-900">Immersive Work Showcase</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`px-4 py-2 rounded-full text-sm border border-slate-200 transition ${active === cat ? 'bg-gradient-to-r from-[#0ea5e9] to-[#f6a600] text-black' : 'glass text-slate-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 perspective-1000">
          {filtered.map((item, idx) => (
            <GalleryCard
              key={idx}
              src={item.src}
              category={item.category}
              desc={item.desc}
              onClick={() => setLightbox(item.src)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 blur-backdrop z-50 grid place-items-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 160, damping: 15 }}
              className="max-w-4xl w-full rounded-2xl overflow-hidden neon-border"
            >
              <img src={lightbox} alt="lightbox" className="w-full h-full object-cover" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Gallery;
