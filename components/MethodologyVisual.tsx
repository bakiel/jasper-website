
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Banknote, TrendingUp, Calculator, PieChart, FileText, Layers, HardHat, Globe, ArrowDown, Share2 } from 'lucide-react';

type ScaleType = 'growth' | 'institutional' | 'infra';

const SCALES = {
  growth: {
    id: 'growth',
    label: 'Growth',
    sheets: '15-20 Sheets',
    target: '$5M - $15M',
    desc: 'Streamlined core for rapid funding rounds.',
    layers: [
      { id: 'inputs', label: 'Inputs & Assumptions', icon: Database, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
      { id: 'revenue', label: 'Revenue Model', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
      { id: 'costs', label: 'Cost Structure', icon: Calculator, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
      { id: 'financials', label: 'Financial Statements', icon: PieChart, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
      { id: 'output', label: 'Presentation Output', icon: FileText, color: 'text-gray-300', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
    ]
  },
  institutional: {
    id: 'institutional',
    label: 'Institutional',
    sheets: '28 Sheets (Standard)',
    target: '$15M - $75M',
    desc: 'The DFI standard. Full integrated logic.',
    layers: [
      { id: 'inputs', label: 'Global Inputs', icon: Database, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
      { id: 'funding', label: 'Funding & Debt', icon: Banknote, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
      { id: 'revenue', label: 'Revenue Build-up', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
      { id: 'costs', label: 'OPEX & CAPEX', icon: Calculator, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
      { id: 'ops', label: 'Working Capital', icon: Layers, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
      { id: 'financials', label: 'Financial Statements', icon: PieChart, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
      { id: 'output', label: 'DFI Formatting', icon: FileText, color: 'text-gray-300', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
    ]
  },
  infra: {
    id: 'infra',
    label: 'Infrastructure',
    sheets: '35+ Sheets',
    target: '$75M+',
    desc: 'Complex capital stacks and construction phases.',
    layers: [
      { id: 'inputs', label: 'Global Inputs', icon: Database, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
      { id: 'macro', label: 'Macro & Tariff', icon: Globe, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
      { id: 'funding', label: 'Complex Capital Stack', icon: Banknote, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
      { id: 'construction', label: 'Construction Draw', icon: HardHat, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
      { id: 'revenue', label: 'Revenue Build-up', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
      { id: 'costs', label: 'OPEX & Maintenance', icon: Calculator, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
      { id: 'ops', label: 'Working Capital', icon: Layers, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
      { id: 'financials', label: 'Financial Statements', icon: PieChart, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
      { id: 'output', label: 'Multi-DFI Output', icon: FileText, color: 'text-gray-300', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
    ]
  }
};

export const MethodologyVisual: React.FC = () => {
  const [activeScale, setActiveScale] = useState<ScaleType>('institutional');
  const currentData = SCALES[activeScale];

  return (
    <div className="w-full max-w-5xl mx-auto">
      
      {/* Controls */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex p-1 rounded-full bg-brand-navy/5 border border-brand-navy/10 relative z-10">
          {(Object.keys(SCALES) as ScaleType[]).map((scaleKey) => (
            <button
              key={scaleKey}
              onClick={() => setActiveScale(scaleKey)}
              className={`
                relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300
                ${activeScale === scaleKey ? 'text-white' : 'text-brand-muted hover:text-brand-navy'}
              `}
            >
              {activeScale === scaleKey && (
                <motion.div
                  layoutId="scaleTab"
                  className="absolute inset-0 bg-brand-navy rounded-full shadow-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{SCALES[scaleKey].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Blueprint Container */}
      <div className="relative rounded-3xl bg-[#0F172A] border border-brand-navy/10 overflow-hidden shadow-2xl p-8 lg:p-12">
        
        {/* Background Grid & Glow */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-emerald/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left: Info & Context */}
            <div className="text-left">
                <motion.div
                    key={activeScale}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center gap-2 text-brand-emerald mb-4 font-mono text-xs uppercase tracking-widest">
                        <Share2 className="w-3 h-3" />
                        JASPER 28™ Architecture
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">{currentData.label}</h3>
                    <div className="text-lg text-brand-emerald font-medium mb-4">{currentData.sheets}</div>
                    <p className="text-gray-400 mb-8 leading-relaxed max-w-sm">
                        {currentData.desc} <br/>
                        <span className="text-xs opacity-60">Target Raise: {currentData.target}</span>
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse shadow-[0_0_8px_#2C8A5B]" />
                            Integrated Data Flow
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            Circular Reference Protection
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            DFI Validation Checkpoints
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Right: The Stack Visual */}
            <div className="relative flex flex-col items-center">
                {/* Connecting Line running through background */}
                <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                
                <AnimatePresence mode="popLayout">
                    {currentData.layers.map((layer, index) => (
                        <motion.div
                            key={layer.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                            transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.05 }}
                            className="relative w-full z-10 group"
                        >
                             {/* Flow Arrow */}
                             {index !== 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 24 }}
                                    className="w-0.5 bg-brand-emerald/30 mx-auto relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-brand-emerald animate-border-beam" />
                                </motion.div>
                             )}

                             {/* The Block */}
                             <div className={`
                                relative flex items-center gap-4 p-4 mx-auto w-full max-w-sm rounded-xl backdrop-blur-md transition-all duration-300
                                ${layer.bg} ${layer.border} border border-opacity-30 hover:border-opacity-60 hover:scale-[1.02] shadow-lg
                             `}>
                                <div className={`p-2 rounded-lg bg-[#0F172A]/50 border border-white/10 ${layer.color} shadow-inner`}>
                                    <layer.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white tracking-wide">{layer.label}</div>
                                </div>
                                
                                {/* Status Indicator */}
                                <div className="ml-auto flex items-center gap-1.5">
                                    <div className={`w-1 h-1 rounded-full ${layer.color.replace('text-', 'bg-')}`} />
                                    <div className={`w-1 h-1 rounded-full ${layer.color.replace('text-', 'bg-')} opacity-50`} />
                                    <div className={`w-1 h-1 rounded-full ${layer.color.replace('text-', 'bg-')} opacity-25`} />
                                </div>
                             </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

        </div>
      </div>
    </div>
  );
};
