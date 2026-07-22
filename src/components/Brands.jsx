import { motion } from 'framer-motion';
import Reveal from './motion/Reveal';
import Stagger from './motion/Stagger';

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
  <section className="luxury-section py-16" id="brands">
    <div className="mx-auto max-w-6xl space-y-8 px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <Reveal variant="left">
          <p className="luxury-eyebrow">Partners</p>
          <h2 className="luxury-title text-3xl">Brands We Deal With</h2>
        </Reveal>
        <Reveal variant="right" className="luxury-copy max-w-xl text-sm">
          Trusted global brands powering our solutions across compute, print, networking, gaming, and mobility.
        </Reveal>
      </div>

      <Stagger className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4" stagger={0.05}>
        {brands.map((brand) => (
          <motion.div
            key={brand.name}
            className="luxury-card flex h-32 items-center justify-center rounded-2xl p-4"
            whileHover={{ rotateX: -8, rotateY: 8, scale: 1.05, y: -4 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <motion.img
              src={brand.img}
              alt={brand.name}
              className="max-h-16 w-auto object-contain"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.35 }}
            />
          </motion.div>
        ))}
      </Stagger>
    </div>
  </section>
);

export default Brands;
