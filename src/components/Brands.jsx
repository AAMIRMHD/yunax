import { motion } from 'framer-motion';

const brands = [
  { name: 'Apple', img: '/brands/apple.png' },
  { name: 'ASUS', img: '/brands/asus.png' },
  { name: 'Canon', img: '/brands/canon.png' },
  { name: 'Dell', img: '/brands/dell.jpeg' },
  { name: 'Epson', img: '/brands/epson.png' },
  { name: 'Getac', img: '/brands/get.png' },
  { name: 'HP', img: '/brands/hp.png' },
  { name: 'Lenovo', img: '/brands/lenova.png' },
  { name: 'PlayStation', img: '/brands/playstaion.png' },
  { name: 'ROG', img: '/brands/rog.png' },
  { name: 'Vikin', img: '/brands/vikin.png' },
  { name: 'Xbox', img: '/brands/xbox.png' },
];

const Brands = () => (
  <section className="py-16 bg-gradient-to-b from-[#f5f7fb] to-white" id="brands">
    <div className="max-w-6xl mx-auto px-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Partners</p>
          <h2 className="text-3xl font-semibold text-slate-900">Brands We Deal With</h2>
        </div>
        <p className="text-slate-600 max-w-xl text-sm">Trusted global brands powering our solutions across compute, print, networking, gaming, and mobility.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {brands.map((brand) => (
          <motion.div
            key={brand.name}
            className="glass border border-slate-200 rounded-2xl p-4 h-32 flex items-center justify-center"
            whileHover={{ rotateX: -6, rotateY: 6, scale: 1.04 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <motion.img
              src={brand.img}
              alt={brand.name}
              className="max-h-16 w-auto object-contain"
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Brands;
