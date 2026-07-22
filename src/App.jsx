import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Stats from './components/Stats';
import About from './components/About';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Brands from './components/Brands';
import Categories from './components/Categories';
import FeaturedProducts from './components/FeaturedProducts';
import SectionDivider from './components/motion/SectionDivider';

const App = () => {
  return (
    <div className="text-slate-900">
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <SectionDivider />
        <Services />
        <SectionDivider />
        <FeaturedProducts />
        <SectionDivider />
        <Categories />
        <SectionDivider />
        <Stats />
        <SectionDivider />
        <About />
        <SectionDivider />
        <Brands />
        <SectionDivider />
        <Testimonials />
        <SectionDivider />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default App;
