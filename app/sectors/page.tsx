
'use client';

import React from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { SectorDeepDive } from '../../components/SectorDeepDive';
import { CTASection } from '../../components/CTASection';
import { motion } from 'framer-motion';
import { ANTI_PORTFOLIO } from '../../constants';
import { TriangleAlert, ArrowDown } from 'lucide-react';

interface SectorsPageProps {
    onNavigate?: (path: string) => void;
}

const SectorsPage: React.FC<SectorsPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-brand-navy text-brand-text font-sans selection:bg-brand-emerald selection:text-brand-navy">
      <Navbar onNavigate={onNavigate} />
      
      <main className="pt-32 pb-20">
        
        {/* HERO SECTION */}
        <section className="relative px-6 lg:px-12 mb-32">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-emerald/10 blur-[150px] rounded-full pointer-events-none" />
            
            <div className="container mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald">Specialized Expertise</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight leading-[1.1]">
                        Sectors We Know <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald to-white">Deeply.</span>
                    </h1>
                    <p className="text-xl text-brand-muted max-w-2xl leading-relaxed mb-10">
                        DFI funding flows to specific sectors. We model the ones where development finance is actively deployed. <span className="text-white">Not generalists. Specialists.</span>
                    </p>
                </motion.div>

                {/* Quick Nav */}
                <div className="flex flex-wrap gap-3">
                    {['Renewable Energy', 'Data Centres', 'Agri-Industrial', 'Climate Finance'].map((sector) => (
                        <button 
                            key={sector}
                            onClick={() => document.getElementById(sector.toLowerCase().replace(' ', '-').replace('&', '').replace('--', '-'))?.scrollIntoView({ behavior: 'smooth' })}
                            className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:border-brand-emerald/50 hover:bg-white/10 transition-all text-sm font-semibold text-gray-300 hover:text-white"
                        >
                            {sector}
                            <ArrowDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-y-1 group-hover:translate-y-0" />
                        </button>
                    ))}
                </div>
            </div>
        </section>

        {/* DISCLAIMER */}
        <section className="px-6 lg:px-12 mb-32">
             <div className="container mx-auto">
                 <div className="p-6 rounded-xl bg-brand-surface/30 border border-white/5 max-w-3xl flex gap-5 items-start">
                     <div className="w-1 h-12 bg-brand-emerald rounded-full shrink-0" />
                     <p className="text-brand-muted text-sm leading-relaxed">
                         <strong className="text-white block mb-1">Our Philosophy</strong>
                         We don't model everything. We model what we've studied, built, and refined. For sectors not listed here, we'll refer you to specialists who know them better.
                     </p>
                 </div>
             </div>
        </section>

        {/* DEEP DIVES COMPONENT */}
        <SectorDeepDive />

        {/* ANTI-PORTFOLIO */}
        <section className="py-32 px-6 lg:px-12 bg-[#050A14] border-y border-white/5 mt-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none" />
            
            <div className="container mx-auto max-w-5xl relative z-10">
                <div className="flex flex-col md:flex-row gap-12 mb-16">
                    <div className="md:w-1/3">
                        <div className="inline-flex items-center gap-2 text-red-400 font-bold uppercase tracking-widest text-xs mb-4">
                            <TriangleAlert className="w-4 h-4" /> Anti-Portfolio
                        </div>
                        <h2 className="text-3xl font-display font-bold text-white mb-4">Where We're Not The Right Fit</h2>
                        <p className="text-brand-muted">
                            We believe in honest positioning. These sectors require expertise we haven't developed or align with different financing models.
                        </p>
                    </div>
                    <div className="md:w-2/3 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {ANTI_PORTFOLIO.map((item, i) => (
                            <div key={i} className="p-4 rounded-xl bg-[#0F172A] border border-white/5 opacity-60 hover:opacity-100 transition-opacity cursor-default group">
                                <item.icon className="w-6 h-6 text-gray-500 mb-3 group-hover:text-red-400 transition-colors" />
                                <div className="font-bold text-white text-sm mb-1">{item.title}</div>
                                <div className="text-xs text-gray-500">{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/10 text-center">
                    <p className="text-sm text-red-200/80 italic">
                        "If your project is in these sectors, we'll refer you to specialists who know them better than we do."
                    </p>
                </div>
            </div>
        </section>

        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

export default SectorsPage;
