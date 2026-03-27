import { AnimatePresence, motion } from 'framer-motion';

const Lightbox = ({ open, onClose, image, title, desc }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {image && <img src={image} alt={title} className="w-full max-h-[60vh] object-cover" />}
          <div className="p-5 space-y-2 text-slate-800">
            {title && <div className="text-lg font-semibold">{title}</div>}
            {desc && <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default Lightbox;
