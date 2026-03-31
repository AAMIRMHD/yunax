import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Stats from './components/Stats';
import About from './components/About';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Brands from './components/Brands';
import useLenis from './hooks/useLenis';
import { AnimatePresence, motion } from 'framer-motion';

const App = () => {
  useLenis();
  const [loading] = useState(false);

  return (
    <div className="text-slate-900">
      <AnimatePresence>{loading && null}</AnimatePresence>

      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Services />
        <Stats />
        <About />
        <Brands />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default App;
