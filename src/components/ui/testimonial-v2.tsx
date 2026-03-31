import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

// Types
interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

// Data
const testimonials: Testimonial[] = [
  {
    text: 'Their custom gaming rig hits 240fps in Valorant and stays whisper-quiet. Cable work and thermals are perfect.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150',
    name: 'Farhan Siddiqui',
    role: 'Esports Streamer',
  },
  {
    text: 'Upgraded our design team to RTX laptops—render times dropped by half and battery life is still solid on shoots.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150',
    name: 'Briana Patton',
    role: 'Creative Director',
  },
  {
    text: 'Their managed IT keeps our showroom network stable, and onsite support is fast. Zero downtime in the last quarter.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150',
    name: 'Bilal Ahmed',
    role: 'IT Manager',
  },
  {
    text: 'They built a water-cooled workstation for 8K editing—smooth timeline scrubbing and silent under load.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150',
    name: 'Omar Raza',
    role: 'Post Production Lead',
  },
  {
    text: 'Gaming laptops arrived pre-tuned with undervolting and custom fan curves. FPS is up and temps are down.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150',
    name: 'Zainab Hussain',
    role: 'Community Manager',
  },
  {
    text: 'Their CCTV and network rollout was clean—no visible wiring and rock-solid Wi‑Fi across 3 floors.',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150',
    name: 'Aliza Khan',
    role: 'Operations Lead',
  },
  {
    text: 'Custom-built PC for CAD runs cooler and faster than our OEM boxes, plus they preloaded all our toolchains.',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150',
    name: 'Hassan Ali',
    role: 'Mechanical Engineer',
  },
  {
    text: 'Field team loves the rugged laptops—great screens outdoors and the support team swapped a hinge same-day.',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
    name: 'Sana Sheikh',
    role: 'Service Delivery Manager',
  },
  {
    text: 'Their gaming lounge install nailed acoustics, lighting, and thermals. Customers noticed the difference day one.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150',
    name: 'Saman Malik',
    role: 'Arcade Owner',
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const TestimonialsColumn = ({
  className,
  testimonials,
  duration = 14,
}: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => (
  <div className={className}>
    <motion.ul
      animate={{ translateY: '-50%' }}
      transition={{ duration, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
      className="flex flex-col gap-6 pb-6 bg-transparent list-none m-0 p-0"
    >
      {[...new Array(2).fill(0)].map((_, index) => (
        <React.Fragment key={index}>
          {testimonials.map(({ text, image, name, role }, i) => (
            <motion.li
              key={`${index}-${i}`}
              aria-hidden={index === 1 ? 'true' : 'false'}
              tabIndex={index === 1 ? -1 : 0}
              whileHover={{
                scale: 1.03,
                y: -8,
                boxShadow:
                  '0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                transition: { type: 'spring', stiffness: 400, damping: 17 },
              }}
              whileFocus={{
                scale: 1.03,
                y: -8,
                boxShadow:
                  '0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                transition: { type: 'spring', stiffness: 400, damping: 17 },
              }}
              className="p-8 rounded-2xl border border-neutral-200 shadow-lg shadow-black/5 max-w-[15rem] w-full bg-white transition-all duration-300 cursor-default select-none group focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <blockquote className="m-0 p-0">
                <p className="text-neutral-600 leading-relaxed font-normal m-0">
                  {text}
                </p>
                <footer className="flex items-center gap-3 mt-6">
                  <img
                    width={40}
                    height={40}
                    src={image}
                    alt={`Avatar of ${name}`}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-neutral-100 group-hover:ring-primary/30 transition-all duration-300 ease-in-out"
                  />
                  <div className="flex flex-col">
                    <cite className="font-semibold not-italic tracking-tight leading-5 text-neutral-900">
                      {name}
                    </cite>
                    <span className="text-sm leading-5 tracking-tight text-neutral-500 mt-0.5">
                      {role}
                    </span>
                  </div>
                </footer>
              </blockquote>
            </motion.li>
          ))}
        </React.Fragment>
      ))}
    </motion.ul>
  </div>
);

export const TestimonialV2 = () => {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="bg-white py-16 relative overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: 50, rotate: -2 }}
        whileInView={{ opacity: 1, y: 0, rotate: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{
          duration: 1.2,
          ease: [0.16, 1, 0.3, 1],
          opacity: { duration: 0.8 },
        }}
        className="max-w-5xl px-4 z-10 mx-auto"
      >
        <div className="flex flex-col items-center justify-center max-w-[520px] mx-auto mb-10">
          <div className="flex justify-center">
            <div className="border border-neutral-300 py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-neutral-600 bg-neutral-100/60 transition-colors">
              Testimonials
            </div>
          </div>

          <h2
            id="testimonials-heading"
            className="text-3xl md:text-4xl font-extrabold tracking-tight mt-4 text-center text-neutral-900"
          >
            What our users say
          </h2>
          <p className="text-center mt-3 text-neutral-500 text-base leading-relaxed max-w-sm">
            Discover how thousands of teams streamline their operations with our platform.
          </p>
        </div>

        <div
          className="flex justify-center gap-5 mt-6 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[560px] overflow-hidden"
          role="region"
          aria-label="Scrolling Testimonials"
        >
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </motion.div>
    </section>
  );
};
// No default export to avoid creating a separate page; use <TestimonialV2 /> where needed.
