import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Contact from './components/Contact';

const ContactPage = () => (
  <div className="bg-white text-slate-900 min-h-screen">
    <Navbar />
    <main className="pt-24 pb-16">
      <Contact />
    </main>
    <Footer />
  </div>
);

export default ContactPage;
