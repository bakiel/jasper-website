
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ArrowLeft, Check, Zap, Landmark, Factory, 
  FileSpreadsheet, FileText, Clock, ShieldCheck, 
  ChevronRight, Download, Star, Sparkles
} from 'lucide-react';
import { PACKAGES, ADDONS } from '../constants';
import { Button } from './Button';

interface ServicesPageProps {
  onBack: () => void;
  initialPackage?: string; // 'Growth', 'Institutional', 'Infrastructure'
}

const PACKAGE_ICONS: Record<string, any> = {
  'Growth': Zap,
  'Institutional': Landmark,
  'Infrastructure': Factory,
  'Strategic': Landmark
};

const PACKAGE_COLORS: Record<string, string> = {
  'Growth': 'text-yellow-400',
  'Institutional': 'text-brand-emerald',
  'Infrastructure': 'text-blue-400',
  'Strategic': 'text-purple-400'
};

const PACKAGE_BG: Record<string, string> = {
  'Growth': 'bg-yellow-400',
  'Institutional': 'bg-brand-emerald',
  'Infrastructure': 'bg-blue-400',
  'Strategic': 'bg-purple-400'
};

export const ServicesPage: React.FC<ServicesPageProps> = ({ onBack, initialPackage = 'Institutional' }) => {
  const [activePkgName, setActivePkgName] = useState(initialPackage);
  const activePkg = PACKAGES.find(p => p.name === activePkgName) || PACKAGES[1];
  const ActiveIcon = PACKAGE_ICONS[activePkgName] || Zap;

  // Keypress listener for Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onBack]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] bg-[#050A14] flex flex-col overflow-hidden text-white"
    >
      {/* --- BACKGROUND FX --- */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#1A2C38] via-[#050A14] to-[#000000] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] opacity-40 pointer-events-none" />
      <div className={`absolute top-0 right-0 w-[800px] h-[800px] blur-[150px] rounded-full pointer-events-none transition-colors duration-700 opacity-20 ${PACKAGE_BG[activePkgName]}`} />

      {/* --- HEADER --- */}
      <div className="relative z-50 h-20 border-b border-white/10 flex items-center justify-between px-6 lg:px-12 bg-[#050A14]/80 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack} 
            className="group flex items-center gap-2 text-brand-muted hover:text-white transition-colors"
          >
            <div className="p-2 rounded-full border border-white/10 group-hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium tracking-wide uppercase hidden md:inline">Back</span>
          </button>
          
          <div className="h-8 w-px bg-white/10 hidden md:block" />
          
          <div className="flex items-center gap-3">
             <img 
                src="https://i.postimg.cc/c1rbtFgd/Financial_building_logo_white_design.png" 
                alt="JASPER Logo" 
                className="h-8 w-auto object-contain hidden sm:block" 
             />
             <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${PACKAGE_COLORS[activePkgName]}`}>
                <ActiveIcon className="w-5 h-5" />
             </div>
             <div>
                <h1 className="text-sm font-bold uppercase tracking-widest text-white">Service Matrix</h1>
                <p className="text-[10px] text-brand-muted font-mono hidden sm:block">PKG-ID: {activePkgName.toUpperCase()}-V3.0</p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Package Switcher (Desktop) */}
           <div className="hidden md:flex bg-white/5 p-1 rounded-lg border border-white/10">
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.name}
                  onClick={() => setActivePkgName(pkg.name)}
                  className={`
                    px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all
                    ${activePkgName === pkg.name 
                      ? `${PACKAGE_BG[pkg.name]} text-[#050A14] shadow-lg` 
                      : 'text-brand-muted hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {pkg.name}
                </button>
              ))}
           </div>

           <button 
             onClick={onBack}
             className="p-2 rounded-full hover:bg-red-500/10 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
           >
             <X className="w-6 h-6" />
           </button>
        </div>
      </div>

      {/* --- MAIN CONTENT LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* LEFT SIDEBAR (Context & Pricing) */}
        <div className="hidden lg:flex w-[400px] flex-col border-r border-white/10 bg-[#0A0F1C]/50 backdrop-blur-sm overflow-y-auto custom-scrollbar p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePkgName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
              >
                  {/* Badge */}
                  <div className={`inline-flex items-center self-start gap-2 px-3 py-1 rounded-full border mb-6 ${PACKAGE_COLORS[activePkgName]} border-current bg-white/5`}>
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{activePkg.target}</span>
                  </div>

                  <h2 className="text-5xl font-display font-bold text-white mb-2">{activePkg.name}</h2>
                  <div className="text-3xl font-light text-brand-muted mb-8">{activePkg.price}</div>

                  <div className="space-y-6 mb-12">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3 mb-2 text-white font-bold">
                              <Clock className="w-5 h-5 text-brand-emerald" />
                              Timeline
                          </div>
                          <p className="text-sm text-brand-muted">{activePkg.duration} est. delivery</p>
                          <div className="w-full bg-white/10 h-1 mt-3 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: activePkgName === 'Growth' ? '30%' : activePkgName === 'Institutional' ? '60%' : '100%' }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className={`h-full ${PACKAGE_BG[activePkgName]}`} 
                              />
                          </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3 mb-2 text-white font-bold">
                              <ShieldCheck className="w-5 h-5 text-brand-emerald" />
                              Best For
                          </div>
                          <ul className="space-y-2">
                             {activePkg.bestFor?.map((item, i) => (
                               <li key={i} className="flex items-start gap-2 text-sm text-brand-muted">
                                  <div className={`mt-1.5 w-1 h-1 rounded-full ${PACKAGE_BG[activePkgName]}`} />
                                  {item}
                               </li>
                             ))}
                          </ul>
                      </div>
                  </div>

                  <div className="mt-auto">
                     <Button 
                        className="w-full justify-center !py-4 !text-lg shadow-lg"
                        onClick={() => {
                            onBack();
                            setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 300);
                        }}
                     >
                        Select {activePkg.name}
                     </Button>
                     <p className="text-center text-xs text-brand-muted mt-4">
                        50% Deposit • Crypto Accepted
                     </p>
                  </div>
              </motion.div>
            </AnimatePresence>
        </div>

        {/* CENTER CONTENT (Deliverables Grid) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-transparent p-6 md:p-12">
            
            {/* Mobile Package Select */}
            <div className="lg:hidden mb-8 overflow-x-auto pb-4 no-scrollbar">
               <div className="flex gap-2">
                 {PACKAGES.map((pkg) => (
                    <button
                      key={pkg.name}
                      onClick={() => setActivePkgName(pkg.name)}
                      className={`
                        px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap border
                        ${activePkgName === pkg.name 
                          ? `${PACKAGE_BG[pkg.name]} text-[#050A14] border-transparent` 
                          : 'text-brand-muted border-white/10 bg-[#0F172A]'
                        }
                      `}
                    >
                      {pkg.name}
                    </button>
                  ))}
               </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activePkgName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="mb-12">
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className={`w-8 h-1 ${PACKAGE_BG[activePkgName]} rounded-full`} />
                            Package Deliverables
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* MODEL */}
                            <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 hover:border-white/20 transition-colors group">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <FileSpreadsheet className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white">Financial Model</h4>
                                        <p className="text-xs text-brand-muted uppercase tracking-wider">Excel / .XLSX</p>
                                    </div>
                                </div>
                                <ul className="space-y-3">
                                    {activePkg.deliverables?.model.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <Check className="w-4 h-4 text-blue-500 mt-0.5" />
                                            <span className="text-sm text-gray-300">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* DOCS */}
                            <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 hover:border-white/20 transition-colors group">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white">Documentation</h4>
                                        <p className="text-xs text-brand-muted uppercase tracking-wider">PDF + Source Files</p>
                                    </div>
                                </div>
                                <ul className="space-y-3">
                                    {activePkg.deliverables?.docs.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <Check className="w-4 h-4 text-purple-500 mt-0.5" />
                                            <span className="text-sm text-gray-300">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                             {/* SUPPORT */}
                             <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 hover:border-white/20 transition-colors group">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white">Support & Warranty</h4>
                                        <p className="text-xs text-brand-muted uppercase tracking-wider">Post-Delivery</p>
                                    </div>
                                </div>
                                <ul className="space-y-3">
                                    {activePkg.deliverables?.support.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                                            <span className="text-sm text-gray-300">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* EXTRA */}
                            {activePkg.deliverables?.other && (
                                <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 hover:border-white/20 transition-colors group">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white">Bonus Inclusions</h4>
                                            <p className="text-xs text-brand-muted uppercase tracking-wider">Value Add</p>
                                        </div>
                                    </div>
                                    <ul className="space-y-3">
                                        {activePkg.deliverables?.other.map((item, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <Check className="w-4 h-4 text-orange-500 mt-0.5" />
                                                <span className="text-sm text-gray-300">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ADD ONS SECTION */}
                    <div className="border-t border-white/10 pt-12">
                        <h3 className="text-xl font-bold text-white mb-6">Available Add-ons</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {ADDONS.map((addon, i) => (
                                <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-sm text-white">{addon.title}</span>
                                        <span className={`text-xs font-mono ${PACKAGE_COLORS[activePkgName]}`}>{addon.price}</span>
                                    </div>
                                    <p className="text-xs text-brand-muted">{addon.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                </motion.div>
            </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
