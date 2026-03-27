import { motion } from 'framer-motion';

const gpus = [
  {
    key: 'x1',
    name: 'AMD Radeon™ RX 7900 XTX 24GB GDDR6',
    highlights: [
      '96 RDNA™ 3 Compute Units with RT + AI accelerators',
      '96MB Infinity Cache, DisplayPort™ 2.1, Radiance Display™ Engine',
      'Radeon™ Boost & Anti-Lag technologies',
    ],
    price: '₹111,980',
    link: 'https://www.sapphiretech.com/en/consumer/21322-01-20g-radeon-rx-7900-xtx-24g-gddr6',
    img: '/gpus/x1.webp',
  },
  {
    key: 'x2',
    name: 'PULSE AMD Radeon™ RX 7900 XTX 24GB',
    highlights: [
      'Boost Clock: up to 2525 MHz | Game Clock: up to 2330 MHz',
      '24GB 384-bit GDDR6 @ 20 Gbps | 6144 Stream Processors',
      'RDNA™ 3 Architecture | Ray Accelerators: 96',
    ],
    price: '₹102,258',
    link: 'https://www.sapphiretech.com/en/consumer/pulse-radeon-rx-7900-xtx-24g-gddr6',
    img: '/gpus/x2.webp',
  },
  {
    key: 'x3',
    name: 'AMD Radeon™ RX 7900 XTX Taichi 24GB OC',
    highlights: [
      'Boost Clock up to 2680 MHz | Game Clock 2510 MHz',
      '24GB GDDR6 on 384-bit bus',
      'RDNA™ 3 GPU with high-end OC design',
    ],
    price: '₹103,520',
    link: 'https://www.asrock.com/Graphics-Card/AMD/Radeon%20RX%207900%20XTX%20Taichi%2024GB%20OC/index.us.asp',
    img: '/gpus/x3.webp',
  },
  {
    key: 'x5',
    name: 'AMD Radeon™ RX 7900 XTX Phantom Gaming 24GB OC',
    highlights: [
      'Boost Clock up to 2615 MHz | Game Clock 2455 MHz',
      '24GB GDDR6 384-bit @ 20 Gbps',
      'Phantom Gaming thermal and OC design',
    ],
    price: '₹102,257',
    link: 'https://pg.asrock.com/Graphics-Card/AMD/Radeon%20RX%207900%20XTX%20Phantom%20Gaming%2024GB%20OC/index.us.asp',
    img: '/gpus/x5.webp',
  },
  {
    key: 'x6',
    name: 'ASUS TUF Gaming Radeon™ RX 7900 XTX OC 24GB',
    highlights: [
      'Axial-tech fans scaled up for +14% airflow',
      'Dual ball fan bearings for extended lifespan',
      'Military-grade caps rated 20K hrs @105°C',
    ],
    price: '₹106,045',
    link: 'https://www.asus.com/in/motherboards-components/graphics-cards/tuf-gaming/tuf-rx7900xtx-o24g-gaming/',
    img: '/gpus/x6.webp',
  },
  {
    key: 'x7',
    name: 'SAPPHIRE NITRO+ / PULSE AMD Radeon™ RX 7900 XT 20GB',
    highlights: [
      'Boost Clock up to 2450 MHz | Game Clock up to 2075 MHz',
      '20GB 320-bit GDDR6 @ 20 Gbps | 5376 SP | Ray Accelerators: 84',
      'RDNA™ 3 Architecture',
    ],
    price: '₹79,404',
    link: 'https://www.sapphiretech.com/en/consumer/pulse-radeon-rx-7900-xt-20g-gddr6',
    img: '/gpus/x7.webp',
  },
  {
    key: 'x8',
    name: 'AMD Radeon™ RX 7900 XT Phantom Gaming 20GB OC',
    highlights: [
      'Boost Clock up to 2450 MHz | Game Clock 2075 MHz',
      '20GB GDDR6 on 320-bit bus | 84 RDNA™ 3 CUs with RT+AI',
      'Phantom Gaming thermal/OC design',
    ],
    price: '₹111,980',
    link: 'https://pg.asrock.com/Graphics-Card/AMD/Radeon%20RX%207900%20XT%20Phantom%20Gaming%2020GB%20OC/index.us.asp',
    img: '/gpus/x8.webp',
  },
  {
    key: 'x9',
    name: 'ASUS TUF Gaming Radeon™ RX 7900 XT OC Edition 20GB',
    highlights: [
      'Axial-tech fans scaled up for +14% airflow',
      'Dual ball fan bearings for longevity',
      'Military-grade capacitors rated 20K hours @105°C',
    ],
    price: '₹84,821',
    link: 'https://www.asus.com/motherboards-components/graphics-cards/tuf-gaming/tuf-rx7900xt-o20g-gaming/',
    img: '/gpus/x8.webp',
  },
];

const cardVariants = {
  initial: { y: 0, scale: 1 },
  hover: { y: -8, scale: 1.02 },
};

const GPUs = () => (
  <section id="gpus" className="py-20 bg-gradient-to-b from-white to-[#f7f9ff]">
    <div className="max-w-6xl mx-auto px-6 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">GPUs</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">Flagship Radeon™ XTX Lineup</h2>
        </div>
        <p className="text-slate-600 max-w-xl">Handpicked high-end boards for elite gaming, creation, and compute—optimized for security, reliability, and raw throughput.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {gpus.map((gpu) => (
          <motion.div
            key={gpu.key}
            className="glass border border-slate-200 rounded-2xl overflow-hidden shadow-lg flex flex-col"
            variants={cardVariants}
            initial="initial"
            whileHover="hover"
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div className="relative h-44 overflow-hidden">
              <motion.img
                src={gpu.img}
                alt={gpu.name}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.35 }}
              />
            </div>
            <div className="p-5 space-y-3 flex-1">
              <h3 className="text-lg font-semibold text-slate-900 leading-tight">{gpu.name}</h3>
              <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                {gpu.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <div className="text-base font-semibold text-slate-900">{gpu.price}</div>
            </div>
            <div className="px-5 pb-5">
              <a
                href={gpu.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center w-full px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#f6a600] text-black font-semibold shadow-md hover:shadow-lg transition"
              >
                Learn more
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default GPUs;
