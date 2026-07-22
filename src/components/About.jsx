import { motion } from 'framer-motion';

const reasons = [
  {
    title: 'Built-In Security',
    desc: 'Security is deeply integrated at every layer with continuous protection, monitoring, and advanced threat prevention.',
    badge: '🛡️',
  },
  {
    title: 'High-Performance Networks',
    desc: 'Robust, scalable networks optimized for speed, reliability, and stability during critical operations.',
    badge: '🌐',
  },
  {
    title: '24/7 Expert Support',
    desc: 'Dedicated round-the-clock monitoring with proactive remediation to maximize uptime and efficiency.',
    badge: '⚡',
  },
  {
    title: 'Future-Ready Solutions',
    desc: 'Intelligent, scalable systems that evolve with your business and stay adaptable to new technologies.',
    badge: '🚀',
  },
  {
    title: 'Trusted Expertise',
    desc: 'Precision delivery backed by real-world experience and a client-first approach to quality and reliability.',
    badge: '🤝',
  },
  {
    title: 'Client-Centric Approach',
    desc: 'Customized solutions aligned to your goals with transparency, reliability, and long-term partnership.',
    badge: '🎯',
  },
];

const About = () => {
  return (
    <section id="about" className="luxury-section relative py-20">
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-start relative">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="space-y-6"
        >
          <p className="luxury-eyebrow">About</p>
          <h2 className="luxury-title text-3xl md:text-5xl">Yunax Digital is driven by innovation and precision.</h2>
          <p className="luxury-copy">
            We architect intelligent IT ecosystems that anticipate threats, adapt to change, and scale with ambition. From network core to edge, Yunax Digital blends cybersecurity rigor with elegant experience design.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 items-start">
            {reasons.map((reason) => (
              <div key={reason.title} className="luxury-card space-y-2 rounded-xl p-4">
                <div className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {reason.badge}
                </div>
                <div className="text-lg font-semibold text-slate-900">{reason.title}</div>
                <p className="text-slate-600 text-sm">{reason.desc}</p>
              </div>
            ))}
            <div className="luxury-card rounded-2xl px-6 py-5 text-sm sm:col-span-2">
              <div className="text-slate-600 uppercase tracking-[0.25em]">Tagline</div>
              <div className="text-lg font-semibold text-slate-900">“Purpose-built solutions engineered for security, performance, scalability, and long-term trust.”</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative lg:self-start space-y-6"
        >
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-200/60">
            <img
              src="/yunax.avif"
              alt="Yunax facility"
              className="h-full w-full rounded-[24px] object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
