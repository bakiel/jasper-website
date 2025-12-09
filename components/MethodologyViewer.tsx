
'use client';

import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { 
  Database, Banknote, TrendingUp, Calculator, PieChart, FileText, Layers, 
  HardHat, Globe, ArrowLeft, X, ShieldCheck, CircleAlert, CircleCheck, 
  GitBranch, Zap, Cpu, Share2, FileCheck, Search
} from 'lucide-react';
import { Button } from './Button';
import { JasperArchitecture } from './JasperArchitecture';

// --- DATA CONSTANTS ---

const LAYERS = [
  { 
    id: 1, 
    title: "Navigation", 
    desc: "Index, dashboard, model map", 
    sheets: "2-3 sheets",
    why: "DFI analysts navigate models frequently. Clear structure signals professionalism.",
    icon: Search,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20"
  },
  { 
    id: 2, 
    title: "Input", 
    desc: "Assumptions, timeline, units, constants", 
    sheets: "3-5 sheets",
    why: "Every calculation traces back here. Change one assumption, entire model updates.",
    icon: Database,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20"
  },
  { 
    id: 3, 
    title: "Funding", 
    desc: "CAPEX, startup costs, loan structure", 
    sheets: "4-6 sheets",
    why: "DFIs need to see exactly how funds will be used. Phased deployment reduces risk.",
    icon: Banknote,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20"
  },
  { 
    id: 4, 
    title: "Revenue", 
    desc: "Pricing, volume, market segments", 
    sheets: "3-5 sheets",
    why: "Revenue assumptions are most scrutinised. Bottom-up builds are credible.",
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20"
  },
  { 
    id: 5, 
    title: "Operations", 
    desc: "OPEX, personnel, COGS, depreciation", 
    sheets: "4-6 sheets",
    why: "Detailed breakdown shows management competence and operational efficiency.",
    icon: Layers,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20"
  },
  { 
    id: 6, 
    title: "Financials", 
    desc: "Income, Cash Flow, Balance Sheet", 
    sheets: "5-7 sheets",
    why: "Three-statement integration is non-negotiable. Cash flow timing is critical.",
    icon: PieChart,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20"
  },
  { 
    id: 7, 
    title: "Analysis", 
    desc: "Ratios, sensitivity, scenarios", 
    sheets: "4-6 sheets",
    why: "DFIs need to see downside scenarios. Base case isn't enough.",
    icon: FileText,
    color: "text-gray-300",
    bg: "bg-gray-500/10",
    border: "border-gray-500/20"
  }
];

const SCALES = [
  {
    title: "Simpler Deals",
    sheets: "15-20 sheets",
    target: "$5M - $15M",
    pkg: "Growth Package",
    features: ["Single revenue stream", "Straightforward funding", "3 scenarios"]
  },
  {
    title: "Standard",
    sheets: "28 sheets",
    target: "$15M - $75M",
    pkg: "Institutional",
    features: ["Multiple segments", "Multi-source funding", "5 scenarios", "Three-statement"]
  },
  {
    title: "Complex Infra",
    sheets: "35+ sheets",
    target: "$75M+",
    pkg: "Infrastructure",
    features: ["Construction period", "Multi-currency", "7+ scenarios", "Monte Carlo"]
  }
];

const STANDARDS = [
    { title: "Formula Integrity", desc: "No hardcoded values in calc sheets. Only Inputs, Formulas, or Empty.", icon: Calculator },
    { title: "Traceability", desc: "Any output traces to assumptions in <30 seconds. Audit trail built-in.", icon: GitBranch },
    { title: "Error Handling", desc: "Balance sheet must balance. Automated checks flag inconsistencies.", icon: CircleAlert },
    { title: "Formatting", desc: "Standardised Century Gothic. Colour-coded logic (Blue=Input, Black=Formula).", icon: FileCheck },
];

const INSTITUTIONS = [
    { name: "IDC", desc: "Job creation, B-BBEE compliance, local procurement." },
    { name: "IFC / World Bank", desc: "E&S integration, performance standards, additionality." },
    { name: "AfDB", desc: "High 5 priorities, regional integration, gender metrics." },
    { name: "Land Bank", desc: "Yield models, commodity pricing, climate scenarios." },
];

// --- COMPONENTS ---

const SectionHeading: React.FC<{ children: React.ReactNode, subtitle?: string }> = ({ children, subtitle }) => (
    <div className="mb-12 md:mb-16">
        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 leading-tight">{children}</h2>
        {subtitle && <p className="text-lg text-brand-muted max-w-2xl">{subtitle}</p>}
    </div>
);

const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-[#0F172A] border border-white/10 rounded-2xl p-6 md:p-8 ${className}`}>
        {children}
    </div>
);

// --- SECTIONS ---

const Hero = () => (
    <section className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-6 pt-32 pb-20 border-b border-white/10 overflow-hidden bg-[#050A14]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
        
        <div className="container mx-auto max-w-7xl relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div 
                initial={{ opacity: 0, x: -50 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.8 }}
                className="text-left"
            >
                <div className="inline-block px-3 py-1 mb-6 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-[10px] md:text-xs font-bold tracking-widest text-brand-emerald uppercase backdrop-blur-sm">
                    JASPER 28™ ARCHITECTURE
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 tracking-tight leading-[1.1]">
                    The <br/>Methodology
                </h1>
                <p className="text-xl text-brand-muted max-w-xl leading-relaxed font-light mb-8">
                    A systematic architecture for building financial models that <span className="text-white font-medium">survive DFI investment committee review</span>.
                </p>
                <div className="flex flex-col gap-4 text-sm text-gray-400 border-l border-white/10 pl-6">
                    <p>• 7 Integrated Layers</p>
                    <p>• Circular Reference Protection</p>
                    <p>• Single Source of Truth</p>
                </div>
            </motion.div>

            {/* Architecture Visual */}
            <motion.div
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 0.8, delay: 0.2 }}
                 className="relative w-full h-full flex items-center justify-center"
            >
                <div className="absolute inset-0 bg-brand-emerald/5 blur-[80px] rounded-full pointer-events-none" />
                <JasperArchitecture />
            </motion.div>
        </div>
    </section>
);

const Problem = () => (
    <section className="py-24 px-6 relative bg-[#050A14] overflow-hidden border-b border-white/5">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-900/10 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto max-w-5xl">
            <div className="flex flex-col md:flex-row gap-12 items-start">
                <div className="md:w-1/2">
                    <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-widest text-xs mb-4">
                        <CircleAlert className="w-4 h-4" /> The Problem
                    </div>
                    <h2 className="text-4xl font-display font-bold text-white mb-6">Why Models Fail</h2>
                    <p className="text-gray-400 text-lg leading-relaxed mb-8">
                        DFI analysts review hundreds of applications annually. They can identify a template-based model in seconds. If the logic is flawed, the funding stops.
                    </p>
                    <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/10">
                        <ul className="space-y-3">
                            {[
                                "Circular references that crash",
                                "Hardcoded values hiding in formulas",
                                "Disconnected sheets (no traceability)",
                                "Missing DFI-specific metrics (DSCR, IRR gates)",
                                "No sensitivity analysis"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-red-200/80">
                                    <X className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="md:w-1/2 relative mt-8 md:mt-0">
                    {/* Abstract Visual of "Broken" Model */}
                    <div className="aspect-square relative rounded-2xl bg-[#0F172A] border border-white/5 overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.1),transparent_70%)]" />
                        <div className="font-mono text-xs text-red-500/50 absolute top-4 left-4">#REF! ERROR</div>
                        <div className="font-mono text-xs text-red-500/50 absolute bottom-12 right-8">CIRCULARITY</div>
                        <div className="font-mono text-xs text-red-500/50 absolute top-1/2 right-4">HARDCODED</div>
                        
                        <div className="relative z-10 text-center">
                             <div className="text-6xl font-bold text-red-500 mb-2">90%</div>
                             <div className="text-sm text-red-300 uppercase tracking-widest">Rejection Rate</div>
                             <div className="text-[10px] text-red-400/60 mt-1">Due to technical flaws</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const Architecture = () => {
    return (
        <section className="py-32 px-6 bg-[#0B1221] border-y border-white/5">
            <div className="container mx-auto max-w-6xl">
                <SectionHeading subtitle="Total: 28 Sheets (Standard) | Scales 15-35+ based on need">
                    7 Integrated Layers
                </SectionHeading>

                <div className="grid gap-6 relative">
                    {/* Connecting Line */}
                    <div className="absolute left-6 md:left-[2.5rem] top-8 bottom-8 w-px bg-gradient-to-b from-brand-emerald/0 via-brand-emerald/30 to-brand-emerald/0" />

                    {LAYERS.map((layer, i) => (
                        <motion.div 
                            key={layer.id}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: i * 0.1 }}
                            className="relative pl-16 md:pl-24 group"
                        >
                            {/* Node on line */}
                            <div className={`absolute left-[1.5rem] md:left-[2.25rem] top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 bg-[#0B1221] z-10 transition-colors ${layer.border.replace('border', 'border')}`}>
                                <div className={`w-full h-full rounded-full ${layer.bg.replace('bg-', 'bg-')} opacity-0 group-hover:opacity-100 transition-opacity`} />
                            </div>

                            <div className={`
                                p-6 rounded-xl border bg-white/[0.02] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.04] group-hover:translate-x-2
                                ${layer.border}
                            `}>
                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                    <div className={`w-12 h-12 rounded-lg ${layer.bg} flex items-center justify-center shrink-0`}>
                                        <layer.icon className={`w-6 h-6 ${layer.color}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className={`text-xl font-bold text-white`}>{layer.title}</h3>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-gray-400">{layer.sheets}</span>
                                        </div>
                                        <div className="text-sm font-medium text-gray-300 mb-2">{layer.desc}</div>
                                        <p className="text-xs text-gray-500 leading-relaxed border-l border-white/10 pl-3">
                                            {layer.why}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Scaling = () => (
    <section className="py-24 px-6 bg-[#050A14]">
        <div className="container mx-auto max-w-6xl">
            <SectionHeading subtitle="One architecture. Flexible depth.">Scaling</SectionHeading>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SCALES.map((scale, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, delay: i * 0.1 }}
                        className="bg-[#0F172A] border border-white/5 rounded-2xl p-8 hover:border-brand-emerald/30 transition-colors group"
                    >
                        <div className="text-xs font-bold text-brand-emerald uppercase tracking-widest mb-4">{scale.sheets}</div>
                        <h3 className="text-2xl font-bold text-white mb-2">{scale.title}</h3>
                        <div className="text-lg text-gray-400 mb-6">{scale.target}</div>
                        
                        <div className="space-y-3 mb-8">
                            {scale.features.map((feat, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-brand-emerald transition-colors" />
                                    {feat}
                                </div>
                            ))}
                        </div>
                        
                        <div className="pt-6 border-t border-white/5 text-xs text-gray-500 font-mono">
                            {scale.pkg}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

const TechnicalStandards = () => (
    <section className="py-24 px-6 bg-[#0B1221] border-y border-white/5">
        <div className="container mx-auto max-w-5xl">
            <div className="flex flex-col md:flex-row gap-12">
                <div className="md:w-1/3">
                    <h2 className="text-3xl font-display font-bold text-white mb-6">Engineering Principles</h2>
                    <p className="text-brand-muted mb-8">
                        We don't just build spreadsheets. We engineer financial systems with software-grade discipline.
                    </p>
                    <div className="p-4 bg-brand-emerald/10 border border-brand-emerald/20 rounded-xl text-sm text-brand-emerald">
                        <Zap className="w-4 h-4 mb-2" />
                        Zero hardcoded values allowed in calculation logic.
                    </div>
                </div>
                
                <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {STANDARDS.map((std, i) => (
                        <div key={i} className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                            <std.icon className="w-8 h-8 text-white mb-4 opacity-80" />
                            <h3 className="text-lg font-bold text-white mb-2">{std.title}</h3>
                            <p className="text-sm text-gray-400">{std.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </section>
);

const DFIFormatting = () => (
    <section className="py-24 px-6 bg-[#050A14]">
         <div className="container mx-auto max-w-5xl text-center">
            <SectionHeading>Institution-Ready Output</SectionHeading>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                {INSTITUTIONS.map((inst, i) => (
                    <div key={i} className="p-6 rounded-xl border border-white/10 hover:border-brand-emerald/40 transition-colors group">
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-emerald transition-colors">{inst.name}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">{inst.desc}</p>
                    </div>
                ))}
            </div>
         </div>
    </section>
);

const Deliverables = () => (
    <section className="py-24 px-6 bg-[#0F172A] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
        
        <div className="container mx-auto max-w-4xl relative z-10">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">What You Receive</h2>
                <p className="text-brand-muted">The Complete Investment Package</p>
            </div>

            <div className="space-y-4">
                {[
                    { title: "1. FINANCIAL MODEL (Excel)", desc: "Full JASPER architecture. All formulas working. Print-ready. Unlocked." },
                    { title: "2. BUSINESS PLAN (PDF)", desc: "Professional LaTeX design. Custom branding. Infographics. 40-100+ pages." },
                    { title: "3. INVESTMENT MEMORANDUM", desc: "Executive summary. Key metrics highlight. Risk analysis. 10-15 pages." },
                    { title: "4. MODEL DOCUMENTATION", desc: "Assumption book. Formula guide. Sheet descriptions. Update instructions." },
                    { title: "5. DFI-SPECIFIC VERSIONS", desc: "Reformatted for target institution. Metrics adjusted. Custom cover letters." }
                ].map((item, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, delay: i * 0.1 }}
                        className="flex items-center gap-6 p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors"
                    >
                        <div className="hidden md:flex w-12 h-12 rounded-full bg-white/5 items-center justify-center font-bold text-brand-emerald border border-white/10">
                            {i + 1}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                            <p className="text-sm text-gray-400">{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

// --- MAIN VIEWER COMPONENT ---

interface MethodologyViewerProps {
  onBack: () => void;
  onNavigate?: (path: string) => void;
}

export const MethodologyViewer: React.FC<MethodologyViewerProps> = ({ onBack, onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onBack]);

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[100] bg-[#050A14] flex flex-col"
    >
        {/* Header (Sticky) */}
        <div className="absolute top-0 left-0 right-0 h-20 z-50 flex items-center justify-between px-6 lg:px-12 border-b border-white/10 bg-[#050A14]/90 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-white/10 text-brand-muted hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div className="h-6 w-px bg-white/10 hidden md:block" />
                
                {/* Branding */}
                <div className="flex items-center gap-3">
                    <img 
                        src="https://i.postimg.cc/c1rbtFg0/Geometric_crystal_like_logo_design.png" 
                        alt="JASPER Logo" 
                        className="h-8 w-auto object-contain" 
                    />
                    <span className="hidden sm:block text-sm font-bold text-white tracking-widest uppercase">Methodology Lab</span>
                </div>
            </div>
            <button 
                onClick={onBack}
                className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Scrollable Content */}
        <div ref={containerRef} className="flex-1 overflow-y-auto custom-scrollbar relative">
            <Hero />
            <Problem />
            <Architecture />
            <Scaling />
            <TechnicalStandards />
            <DFIFormatting />
            <Deliverables />
            
            {/* CTA */}
            <section className="py-32 px-6 text-center bg-[#0B1221]">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-8">
                    Ready to see JASPER in action?
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button
                        onClick={() => {
                            onBack();
                            if (onNavigate) {
                                setTimeout(() => onNavigate('/contact'), 100);
                            }
                        }}
                        className="!px-10 !py-4"
                    >
                        Start Your Project
                    </Button>
                    <span className="text-gray-500 text-sm">or</span>
                    <a href="mailto:models@jasperfinance.org" className="text-brand-emerald hover:text-white transition-colors text-sm font-bold tracking-wide uppercase">
                        models@jasperfinance.org
                    </a>
                </div>
            </section>
        </div>
    </motion.div>
  );
};
