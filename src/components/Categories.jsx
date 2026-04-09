import { motion } from 'framer-motion';

const categories = [
  {
    title: 'Laptops',
    icon: '💻',
    items: ['Gaming Laptops', 'Business Laptops', 'Student Laptops', 'Refurbished Laptops'],
  },
  {
    title: 'Desktop PCs',
    icon: '🖥️',
    items: ['Prebuilt PCs', 'Custom Build PCs', 'Gaming PCs', 'Office PCs'],
  },
  {
    title: 'Computer Components',
    icon: '🔧',
    items: ['Processors (Intel / AMD)', 'Motherboards', 'RAM', 'SSD / HDD', 'Graphics Cards', 'Power Supply (SMPS)', 'Cabinets'],
  },
  {
    title: 'Gaming Zone',
    icon: '🎮',
    items: ['Gaming PCs', 'Gaming Laptops', 'Gaming Accessories (Mouse, Keyboard, Headset)'],
  },
  {
    title: 'Printers & Accessories',
    icon: '🖨️',
    items: ['Printers (Inkjet / Laser)', 'Ink & Toner', 'Scanner'],
  },
  {
    title: 'Accessories',
    icon: '🔌',
    items: ['Keyboard', 'Mouse', 'Headphones', 'Webcams', 'USB Drives', 'External Hard Disks'],
  },
  {
    title: 'Networking Products',
    icon: '🌐',
    items: ['Routers', 'Modems', 'WiFi Adapters', 'LAN Cables'],
  },
  {
    title: 'Power & Backup',
    icon: '🔋',
    items: ['UPS', 'Laptop Batteries', 'Chargers / Adapters'],
  },
  {
    title: 'Services',
    icon: '🛠️',
    items: ['Laptop Repair', 'Desktop Repair', 'Chip-Level Service', 'Data Recovery', 'Software Installation'],
  },
  {
    title: 'Used / Refurbished',
    icon: '♻️',
    items: ['Used Laptops', 'Used Desktops', 'Exchange Offers'],
  },
  {
    title: 'Business Solutions',
    icon: '💼',
    items: ['Bulk Orders', 'Office Setup', 'AMC (Annual Maintenance Contracts)'],
    highlight: true,
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.45, ease: 'easeOut' } }),
};

const Categories = () => (
  <section id="categories" className="relative py-24 bg-gradient-to-b from-white via-[#f6f8ff] to-white">
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_22%,rgba(14,165,233,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(246,166,0,0.12),transparent_28%)]" />
    <div className="max-w-6xl mx-auto px-6 relative space-y-10">
      <motion.div
        className="text-center space-y-3"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Shop by Category</p>
        <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">Everything for Your Setup</h2>
        <p className="text-slate-600 max-w-3xl mx-auto">Browse the full catalog from gaming rigs to business-grade rollouts and after-sales care.</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.title}
            className={`border border-slate-200 rounded-2xl bg-white/90 shadow-sm p-5 space-y-3 glass ${cat.highlight ? 'ring-2 ring-amber-400/60 ring-offset-2 ring-offset-white' : ''}`}
            variants={cardVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            custom={i}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden>{cat.icon}</span>
              <div className="text-lg font-semibold text-slate-900">{cat.title}</div>
            </div>
            <ul className="space-y-1 text-sm text-slate-600">
              {cat.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-500">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Categories;
