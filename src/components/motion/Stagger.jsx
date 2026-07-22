import { motion } from 'framer-motion';
import { fadeUpChild, staggerContainer } from '../../lib/motion';

const Stagger = ({
  as: Tag = motion.div,
  children,
  className = '',
  stagger = 0.08,
  delayChildren = 0.04,
  once = true,
  amount = 0.15,
  childVariant = fadeUpChild,
  ...props
}) => (
  <Tag
    initial="hidden"
    whileInView="visible"
    viewport={{ once, amount }}
    variants={staggerContainer(stagger, delayChildren)}
    className={className}
    {...props}
  >
    {Array.isArray(children)
      ? children.map((child, index) => (
          <motion.div key={child?.key ?? index} variants={childVariant}>
            {child}
          </motion.div>
        ))
      : children}
  </Tag>
);

export default Stagger;
