import { motion } from 'framer-motion';
import Tilt from './ui/Tilt';

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

const GPUs = () => {
  return (
    <section id="gpus" className="py-24 bg-white relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-amber-500/10 blur-[130px] rounded-full translate-x-1/2" />
        <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -translate-x-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-16">
        <motion.div
          className="flex flex-col items-center text-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-700">Flagship Series</p>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-3xl">
            The Elite <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-primary">Radeon™ XTX</span> Lineup
          </h2>
          <p className="text-slate-500 max-w-2xl text-lg font-medium leading-relaxed">
            Unleash unparalleled throughput with our curated selection of high-end boards, optimized for security, reliability, and raw compute power.
          </p>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.15 }
            }
          }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12"
        >
          {gpus.map((gpu) => (
            <motion.div
              key={gpu.key}
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="group relative cursor-pointer"
            >
              <Tilt maxRotation={10} className="h-full">
                {/* Card Glow */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-amber-500/10 to-transparent rounded-[40px] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
                
                <div className="h-full glass border border-slate-200/60 rounded-[40px] overflow-hidden shadow-2xl shadow-slate-200/40 flex flex-col bg-white transition-all duration-500 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5">
                  <div className="relative h-52 overflow-hidden bg-slate-50 p-6 flex items-center justify-center border-b border-slate-100">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100/30 to-white pointer-events-none" />
                    <motion.img
                      src={gpu.img}
                      alt={gpu.name}
                      className="w-full h-full object-contain relative z-10 transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md border border-slate-200/50 px-3 py-1.5 rounded-2xl shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">View Gallery</p>
                    </div>
                  </div>

                  <div className="p-8 flex flex-col flex-1 space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-amber-600 transition-colors min-h-[56px] line-clamp-2">
                        {gpu.name}
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Technical Highlights</p>
                      <ul className="text-sm text-slate-600 space-y-3">
                        {gpu.highlights.map((h, idx) => (
                          <li key={idx} className="flex gap-3 leading-relaxed">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40 mt-1.5 flex-shrink-0" />
                            <span className="font-medium text-slate-500">{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6 border-t border-slate-100 mt-auto flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Base MSRP</span>
                         <span className="text-2xl font-black text-slate-900 tracking-tighter">{gpu.price}</span>
                      </div>
                      
                      <a
                        href={gpu.link}
                        target="_blank"
                        rel="noreferrer"
                        className="group/btn relative overflow-hidden flex items-center justify-center h-14 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/10 transition-all duration-500 hover:bg-amber-600"
                      >
                        <div className="flex items-center gap-3 relative z-10">
                          <span className="text-xs font-black uppercase tracking-[0.2em]">Acquire Board</span>
                          <svg className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-500 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                      </a>
                    </div>
                  </div>
                </div>
              </Tilt>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default GPUs;
