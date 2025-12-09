
'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useInView, useSpring } from 'framer-motion';
import { BorderBeam } from './BorderBeam';

const STATS = [
  { label: 'Renewable Complex Modelled', value: 1300, prefix: '', suffix: ' MW', sub: 'Generation, Storage, Grid' },
  { label: 'Maximum Sheet Count', value: 35, prefix: '', suffix: '', sub: 'Integrated complexity' },
  { label: 'DFI Versions Per Project', value: 4, prefix: '', suffix: '', sub: 'Multi-submission packages' },
];

const Counter: React.FC<{ value: number; prefix?: string; suffix?: string }> = ({ value, prefix = '', suffix = '' }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const springValue = useSpring(0, { duration: 2500, bounce: 0 });

  useEffect(() => {
    if (inView) {
      springValue.set(value);
    }
  }, [inView, value, springValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        let displayValue = Math.floor(latest).toLocaleString();
        ref.current.textContent = `${prefix}${displayValue}${suffix}`;
      }
    });
  }, [springValue, prefix, suffix, value]);

  return <span ref={ref} />;
};

export const StatsSection: React.FC = () => {
  return (
    <section className="relative py-32 border-y border-white/5 bg-[#0F172A] overflow-hidden">
      
      {/* Background Effect */}
      <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent)] pointer-events-none z-0" />
      
      {/* Ambient Glows for Depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl bg-brand-emerald/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-50%] right-[-20%] w-[800px] h-[800px] bg-brand-navy/60 blur-[150px] rounded-full pointer-events-none z-0" />
      
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-16">
          
          <div className="lg:w-1/3">
             <div className="inline-block px-3 py-1 mb-4 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-[10px] font-bold tracking-widest text-brand-emerald uppercase backdrop-blur-sm">
                Models that get approved
             </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 tracking-tight drop-shadow-lg">
              We model what investment committees approve.
            </h2>
            
            <div className="text-gray-300 text-sm leading-relaxed space-y-4 font-light">
                <p><strong className="text-white">1,300 MW Renewable Complex:</strong> Solar (300 MW), wind (300 MW), biogas, pyrolysis, 600 MW battery storage. Integrated smart grid architecture.</p>
                <p><strong className="text-white">Hyperscale Data Centre:</strong> 700 MW load profile, liquid cooling economics, heat reuse revenue streams.</p>
                <p><strong className="text-white">Multi-DFI Agri Projects:</strong> Single model producing 4 institutional packages (IDC, Land Bank, NEF, Ithala).</p>
                <p className="pt-4 border-t border-white/10 italic opacity-80">From 1 MW pilots to 1,300 MW complexes — the methodology scales, the quality doesn't change.</p>
            </div>
          </div>

          <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 lg:pt-0">
            {STATS.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, delay: index * 0.1 }}
                className="relative p-8 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm group overflow-hidden hover:bg-white/[0.04] transition-colors"
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-emerald/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Animated Border Beam on Hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <BorderBeam size={150} duration={6} colorFrom="#2C8A5B" colorTo="#44D685" />
                </div>

                <div className="relative z-10">
                    <div className="text-5xl font-bold text-white tracking-tighter mb-4 tabular-nums group-hover:text-brand-emerald transition-colors drop-shadow-md">
                    <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                    </div>
                    <div className="h-px w-12 bg-white/10 mb-4 group-hover:w-full group-hover:bg-brand-emerald/50 transition-all duration-500" />
                    <div className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                    {stat.label}
                    </div>
                    <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                    {stat.sub}
                    </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};
