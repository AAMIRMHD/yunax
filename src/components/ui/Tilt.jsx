import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const Tilt = ({ children, className = '', maxRotation = 12 }) => {
  const ref = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 220, mass: 0.6 };
  
  // Maps normalized coordinate values [-0.5, 0.5] to rotation angles
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxRotation, -maxRotation]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxRotation, maxRotation]), springConfig);

  // Glare overlay coordinate animation
  const glareX = useSpring(useTransform(x, [-0.5, 0.5], ['0%', '100%']), springConfig);
  const glareY = useSpring(useTransform(y, [-0.5, 0.5], ['0%', '100%']), springConfig);
  
  // Glare visibility based on tilt intensity
  const glareOpacity = useSpring(
    useTransform(
      [x, y],
      ([latestX, latestY]) => Math.sqrt(latestX ** 2 + latestY ** 2) * 0.55
    ),
    springConfig
  );

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Normalize coordinates relative to card center: [-0.5, 0.5]
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;
    
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative ${className}`}
    >
      <div style={{ transform: 'translateZ(15px)', transformStyle: 'preserve-3d' }} className="h-full w-full">
        {children}
      </div>
      
      {/* Dynamic 3D specular highlight/glare overlay */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.18) 0%, transparent 65%)`,
          opacity: glareOpacity,
          pointerEvents: 'none',
          zIndex: 20,
          borderRadius: 'inherit',
        }}
      />
    </motion.div>
  );
};

export default Tilt;
