import { motion } from 'framer-motion';
import { ease, revealVariants } from '../../lib/motion';

const Reveal = ({
  as: Tag = motion.div,
  children,
  variant = 'up',
  delay = 0,
  duration = 0.75,
  once = true,
  amount = 0.2,
  className = '',
  ...props
}) => {
  const selected = revealVariants[variant] || revealVariants.up;

  return (
    <Tag
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={{
        hidden: selected.hidden,
        visible: {
          ...selected.visible,
          transition: { duration, delay, ease },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
