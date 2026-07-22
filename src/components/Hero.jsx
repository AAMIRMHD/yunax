import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect } from 'react';

const Hero = () => {
  const ref = useRef(null);
  const canvasRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const scaleBg = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const yText = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0.2]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles = [];
    const particleCount = 75;
    const maxDistance = 120;
    const focalLength = 400;

    let lastMouseX = null;
    let lastMouseY = null;
    let mouseSpeedX = 0;
    let mouseSpeedY = 0;
    let rotateX = 0;
    let rotateY = 0;

    // Create random 3D particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * 800 - 400,
        y: Math.random() * 600 - 300,
        z: Math.random() * 800 - 400,
        r: Math.random() * 2 + 1,
        baseSpeed: Math.random() * 0.2 + 0.1,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      if (lastMouseX !== null && lastMouseY !== null) {
        const dx = currentX - lastMouseX;
        const dy = currentY - lastMouseY;

        // Accumulate velocity based on cursor delta with a higher multiplier for full responsive movement
        mouseSpeedX += dx * 0.002;
        mouseSpeedY += dy * 0.002;
      }

      lastMouseX = currentX;
      lastMouseY = currentY;
    };

    const handleMouseLeave = () => {
      lastMouseX = null;
      lastMouseY = null;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('blur', handleMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Higher max velocity clamp for full 3D rotation spins
      const maxVel = 0.2;
      mouseSpeedX = Math.max(-maxVel, Math.min(maxVel, mouseSpeedX));
      mouseSpeedY = Math.max(-maxVel, Math.min(maxVel, mouseSpeedY));

      // Rotate continuously: base speed + accumulated mouse momentum
      rotateY += 0.0018 + mouseSpeedX;
      rotateX += 0.0008 - mouseSpeedY;

      // Higher retention decay (0.98) to let the constellation spin with premium momentum
      mouseSpeedX *= 0.98;
      mouseSpeedY *= 0.98;

      const cosY = Math.cos(rotateY);
      const sinY = Math.sin(rotateY);
      const cosX = Math.cos(rotateX);
      const sinX = Math.sin(rotateX);

      const projected = [];

      particles.forEach((p) => {
        // Rotate around Y axis (horizontal sway)
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        // Rotate around X axis (vertical sway)
        let y1 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        // Float drift over time
        p.z -= p.baseSpeed;
        if (p.z < -focalLength) p.z = 400; // Reset depth if too close

        // Near-plane clipping: skip particles that are behind or too close to the camera
        // to prevent division by zero (scale blowing up to Infinity) and canvas freezes
        if (z2 <= -focalLength + 80) return;

        // Perspective projection
        const scale = focalLength / (focalLength + z2);
        const screenX = x1 * scale + width / 2;
        const screenY = y1 * scale + height / 2;

        projected.push({
          x: screenX,
          y: screenY,
          r: p.r * scale,
          z: z2,
          opacity: Math.max(0, Math.min(1, scale * (1 - z2 / 500))),
        });
      });

      // Draw glowing lines between close particles
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i];
        for (let j = i + 1; j < projected.length; j++) {
          const p2 = projected[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.15 * Math.min(p1.opacity, p2.opacity);
            ctx.strokeStyle = `rgba(14, 165, 233, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      projected.forEach((p) => {
        ctx.fillStyle = `rgba(15, 23, 42, ${p.opacity})`;
        ctx.shadowColor = 'rgba(14, 165, 233, 0.4)';
        ctx.shadowBlur = p.r * 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0; // Reset shadow

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('blur', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section ref={ref} id="top" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <motion.div
        style={{ scale: scaleBg }}
        className="absolute inset-0 hero-bg"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(14,165,233,0.14),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(246,166,0,0.16),transparent_30%)]" />

      {/* 3D Constellation Particle Network */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 text-center text-slate-900">
        <motion.div style={{ y: yText, opacity: opacityText }} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm shadow-sm"
          >
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#f6a600] animate-pulse" />
            YUNAX DIGITAL
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.9, ease: 'easeOut' }}
            className="text-4xl md:text-7xl font-black leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-700/80"
          >
            Built for speed.<br />
            Designed for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0ea5e9] to-[#f6a600]">dominance.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto font-medium"
          >
            Your setup defines your game — we make it unbeatable.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <a
              href="#services"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#f6a600] text-black font-bold shadow-[0_20px_50px_rgba(14,165,233,0.28)] hover:scale-105 hover:shadow-[0_20px_50px_rgba(246,166,0,0.35)] transition-all duration-300"
            >
              Explore Services
            </a>
            <a
              href="#contact"
              className="px-8 py-4 rounded-full glass border border-slate-200 hover:border-slate-300 hover:bg-white/80 transition-all duration-300 text-slate-800 font-semibold"
            >
              Get Consultation
            </a>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <div className="scroll-indicator" />
      </motion.div>
    </section>
  );
};

export default Hero;

