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
    <section id="about" className="py-20 relative bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_30%,rgba(246,166,0,0.12),transparent_32%)]" />
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-start relative">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="space-y-6"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">About</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">Yunax Digital is driven by innovation and precision.</h2>
          <p className="text-slate-600 leading-relaxed">
            We architect intelligent IT ecosystems that anticipate threats, adapt to change, and scale with ambition. From network core to edge, Yunax Digital blends cybersecurity rigor with elegant experience design.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 items-start">
            {reasons.map((reason) => (
              <div key={reason.title} className="glass border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-[#0ea5e9]/15 to-[#f6a600]/15 border border-slate-200 text-slate-700">
                  {reason.badge}
                </div>
                <div className="text-lg font-semibold text-slate-900">{reason.title}</div>
                <p className="text-slate-600 text-sm">{reason.desc}</p>
              </div>
            ))}
            <div className="glass border border-slate-200 px-6 py-5 rounded-2xl text-sm shadow-lg sm:col-span-2">
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
          <div className="rounded-3xl overflow-hidden neon-border-gold shadow-2xl">
            <img
              src="/yunax.avif"
              alt="Yunax facility"
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
