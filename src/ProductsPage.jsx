import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { motion } from 'framer-motion';

const products = [
  { title: 'Apple Products', desc: 'Authorized dealer with the best deals across the Apple ecosystem.', img: '/products/applegadgets.jpeg' },
  { title: 'Multi-Branded Laptops/Desktops', desc: 'All major brands plus custom/assembled desktops for your exact specs.', img: '/products/multibrandlaptop.jpeg' },
  { title: 'Motion Technology', desc: 'Latest motion tech and gadgets at accessible pricing.', img: '/products/motiontechnology.jpeg' },
  { title: 'Gaming Laptops / Accessories', desc: 'Full range of gaming essentials without compromise on performance.', img: '/products/gamiinglaptopandassecroies.jpeg' },
  { title: 'Home & Office Security Systems', desc: 'Comprehensive safety solutions for home and workplace.', img: '/products/homeofficesec.jpeg' },
  { title: 'Mobile Phone Accessories', desc: 'Customize your smartphone with the newest accessories.', img: '/products/mobileassceories.jpeg' },
  { title: 'Gadgets', desc: 'Own the latest gadgets with great deals and availability.', img: '/products/gadgets.jpeg' },
  { title: 'Editing Systems', desc: 'Cutting-edge editing hardware to elevate your creativity.', img: '/products/editingsystem.jpeg' },
  { title: 'Sony PlayStation & Microsoft Xbox', desc: 'Level up gaming with the newest consoles and titles.', img: '/products/sonyplaystaionandxbox.jpeg' },
];

const ProductsPage = () => (
  <div className="bg-white text-slate-900 min-h-screen">
    <Navbar />
    <main className="pt-24 pb-16 space-y-12">
      <section className="max-w-6xl mx-auto px-6 space-y-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="space-y-3"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Products</p>
          <h1 className="text-3xl md:text-4xl font-semibold">Product Lines & Solutions</h1>
          <p className="text-slate-600 leading-relaxed max-w-3xl mx-auto">Discover the categories we specialize in, pairing top-tier brands with custom builds and services tailored to your needs.</p>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm text-slate-700">
          {products.map((item) => (
            <motion.div
              key={item.title}
              className="glass border border-slate-200 rounded-2xl overflow-hidden shadow-md flex flex-col"
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            >
              <div className="relative h-36 overflow-hidden">
                <motion.img
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.35 }}
                />
              </div>
              <div className="p-4 space-y-2 flex-1">
                <h4 className="font-semibold text-slate-900 text-base">{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default ProductsPage;
