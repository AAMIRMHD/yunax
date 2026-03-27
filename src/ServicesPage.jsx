import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { motion } from 'framer-motion';

const serviceCards = [
  { title: 'Consultancy', desc: 'Security, health checks, backups, and network design audits aligned to your goals.', img: '/services/itcounsaltation.jpeg' },
  { title: 'Security Solutions', desc: 'Protection from hackers, viruses, mail relay, and password theft with cost-effective defenses.', img: '/services/securitysolution.jpeg' },
  { title: 'Networking', desc: 'LAN/Wi‑Fi/hybrid designs for efficient, reliable connectivity across sites.', img: '/services/networkingg.jpeg' },
  { title: 'CCTV Camera Installation', desc: 'Turnkey CCTV with DVR options and wide camera choices backed by strong after-sales support.', img: '/services/cctv2.jpeg' },
  { title: 'Computer Server', desc: 'Cloud-ready servers with advanced data privacy and security.', img: '/services/server.jpeg' },
  { title: 'Workstation Computers', desc: 'High-performance, graphics-ready workstations tailored to your workload.', img: '/services/workstationcomp.jpeg' },
  { title: 'Build Your Own PCs', desc: 'Custom desktops from home systems to high-end gaming builds.', img: '/services/buildyourpc.jpeg' },
];

const ServicesPage = () => (
  <div className="bg-white text-slate-900 min-h-screen">
    <Navbar />
    <main className="pt-24 pb-16 space-y-12">
      <section className="max-w-6xl mx-auto px-6 space-y-4">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Services</p>
        <h1 className="text-3xl md:text-4xl font-semibold">Comprehensive IT & Security Services</h1>
        <p className="text-slate-600 leading-relaxed">We prioritize your business needs, delivering tailored solutions with transparency, reliability, and consistent results.</p>
      </section>

      <section className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {serviceCards.map((card) => (
          <motion.div
            key={card.title}
            className="glass border border-slate-200 rounded-2xl overflow-hidden shadow-md flex flex-col"
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          >
            <div className="relative h-36 overflow-hidden">
              <motion.img
                src={card.img}
                alt={card.title}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 0.35 }}
              />
            </div>
            <div className="p-5 space-y-2">
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{card.desc}</p>
            </div>
          </motion.div>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-6 space-y-4">
        <h2 className="text-2xl font-semibold">Our Specialities</h2>
        <ul className="grid sm:grid-cols-2 gap-3 text-slate-700 text-sm">
          <li>Professional & experienced employees</li>
          <li>More than 22 years in the field</li>
          <li>24x7 after-sale support*</li>
          <li>Best price guaranteed</li>
          <li>Special rates for bulk enquiry</li>
          <li>Committed to high-quality products</li>
          <li>Authorized education service expert</li>
        </ul>
      </section>
    </main>
    <Footer />
  </div>
);

export default ServicesPage;
