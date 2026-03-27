import { motion } from 'framer-motion';
import GPUs from './components/GPUs';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const GPUsPage = () => (
  <div className="text-slate-900 bg-white min-h-screen">
    <Navbar />
    <main className="pt-24">
      <GPUs />
    </main>
    <Footer />
  </div>
);

export default GPUsPage;
