import { motion } from 'framer-motion';
import useLenis from '../../hooks/useLenis';
import { pageVariants } from '../../lib/motion';
import AmbientBackground from './AmbientBackground';
import ScrollProgress from './ScrollProgress';

const PageShell = ({ children }) => {
  useLenis();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <ScrollProgress />
      <AmbientBackground />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={pageVariants}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PageShell;
