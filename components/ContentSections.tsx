
'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import { CircleX, CircleCheck, ArrowRight, Layers, FileJson, FileSpreadsheet, Briefcase, Award, CircleAlert, ChevronRight, Ban, Check, ShieldCheck, X, Activity, User, BookOpen, GitBranch, Sprout, Landmark, Factory, Zap } from 'lucide-react';
import { PROCESS_STEPS, FIT_CRITERIA } from '../constants';
import { Button } from './Button';
import { BorderBeam } from './BorderBeam';
import { JasperArchitecture } from './JasperArchitecture';

interface SectionProps {
    id?: string;
    onLaunchMethodology?: () => void;
}

// --- PROBLEM SECTION ---
export const ProblemSection: React.FC<SectionProps> = ({ id }) => {
    return (
        <section id={id} className="py-32 bg-[#050A14] relative overflow-hidden">
             <div className="absolute inset-0 bg-grid-white/[0.02]" />
             {/* Red ambient glow */}
             <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-red-600/5 blur-[150px] rounded-full pointer-events-none" />

             <div className="container mx-auto px-6 lg:px-12 relative z-10 flex flex-col lg:flex-row gap-20 items-center">
                 <div className="lg:w-1/2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold tracking-widest text-red-400 uppercase backdrop-blur-sm">
                        <CircleAlert className="w-3 h-3" /> The Risk
                    </div>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-8 leading-tight">
                        DFI applications fail at financial review.
                    </h2>
                    <h3 className="text-xl text-white/80 mb-6 font-medium">
                        Not because projects aren't viable—because models aren't.
                    </h3>
                    <p className="text-lg text-brand-muted mb-10 leading-relaxed border-l-2 border-red-500/20 pl-6">
                        Development finance institutions review hundreds of applications. Investment committees can spot a template in seconds. Your project might be solid, but if the financial model doesn't meet institutional standards, it never reaches the decision-makers.
                    </p>
                    <div className="space-y-4">
                        {[
                            "Generic templates adapted from different contexts",
                            "Unresolved circular references that crash or produce errors",
                            "Single-scenario models with no stress testing",
                            "Disconnected sheets with hardcoded values",
                            "Missing DFI-specific metrics (DSCR, IRR gates)",
                            "Models built by people who don't understand how the systems actually work"
                        ].map((item, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, delay: i * 0.1 }}
                                className="flex items-center gap-4 group"
                            >
                                <CircleX className="w-5 h-5 text-red-500/60 group-hover:text-red-500 transition-colors flex-shrink-0" />
                                <span className="text-brand-muted text-sm group-hover:text-white transition-colors">{item}</span>
                            </motion.div>
                        ))}
                    </div>
                    
                    <p className="mt-8 pt-6 border-t border-white/5 text-white font-medium italic">
                        Most modellers understand spreadsheets. We understand how energy systems, infrastructure, and data centres actually operate. That difference shows.
                    </p>
                 </div>
                 
                 {/* Visual Representation of a "Bad" Model vs "Jasper" */}
                 <div className="lg:w-1/2 relative w-full">
                     <div className="relative glass-card rounded-2xl p-0.5 border-t border-white/10 overflow-hidden">
                        <BorderBeam size={200} duration={20} colorFrom="#EF4444" colorTo="#7F1D1D" anchor={10} />
                        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent rounded-2xl pointer-events-none" />
                        <div className="relative bg-[#0F172A]/90 rounded-xl p-8 overflow-hidden backdrop-blur-xl">
                            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-8">
                                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-2xl shadow-[0_0_20px_rgba(239,68,68,0.2)]">!</div>
                                <div>
                                    <h3 className="text-white font-semibold text-lg">Investment Committee Warning</h3>
                                    <p className="text-xs text-brand-muted uppercase tracking-wider mt-1">Risk assessment flag raised</p>
                                </div>
                            </div>
                            <div className="font-mono text-xs text-red-200/90 leading-loose bg-red-950/30 p-6 rounded-lg border border-red-500/20 shadow-inner">
                                <span className="text-red-500 font-bold">Error:</span> Circular reference detected in Sheet 'Debt_Service'.<br/>
                                <span className="text-red-500 font-bold">Warning:</span> DSCR drops below 1.1x in Year 3.<br/>
                                <span className="text-red-500 font-bold">Critical:</span> Assumptions do not trace to Feasibility Study.
                            </div>
                        </div>
                     </div>
                 </div>
             </div>
        </section>
    );
};

// --- SOLUTION / METHODOLOGY SECTION ---
export const SolutionSection: React.FC<SectionProps> = ({ id, onLaunchMethodology }) => {
    return (
        <section id={id} className="py-32 bg-[#0B1221] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-emerald/5 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="container mx-auto px-6 lg:px-12 text-center relative z-10">
                <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-[11px] font-bold tracking-widest text-brand-emerald uppercase backdrop-blur-sm">
                    THE SOLUTION
                </div>
                
                <h2 className="text-4xl lg:text-6xl font-display font-bold text-white mb-6 tracking-tight">
                    The Architecture of Approval
                </h2>
                <p className="text-brand-muted text-lg md:text-xl max-w-3xl mx-auto mb-16 leading-relaxed">
                    A systematic methodology for building financial models that survive institutional scrutiny.
                    <span className="block text-white mt-2">Structured. Traceable. Validated.</span>
                </p>

                {/* Architecture Visual Teaser - The "Monitor" Look */}
                <div className="relative w-full max-w-5xl mx-auto mb-20 group">
                    {/* The Frame */}
                    <div 
                        className="relative rounded-3xl bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-[0_0_50px_rgba(44,138,91,0.15)] hover:border-brand-emerald/30 cursor-pointer"
                        onClick={onLaunchMethodology}
                    >
                        <BorderBeam size={400} duration={12} delay={0} colorFrom="#2C8A5B" colorTo="#44D685" />
                        
                        {/* Inner Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/50 to-transparent pointer-events-none" />
                        
                        {/* The Diagram - Mini Version */}
                        <div className="relative z-10 p-4 md:p-8">
                             <JasperArchitecture condensed />
                        </div>

                        {/* Interactive Overlay */}
                        <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                 <Button variant="primary" className="!px-8 !py-4 text-lg !rounded-full shadow-2xl">
                                    Enter Methodology Lab
                                 </Button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Reflection underneath */}
                    <div className="absolute -bottom-12 left-4 right-4 h-12 bg-gradient-to-b from-brand-emerald/10 to-transparent blur-xl opacity-30 rounded-full pointer-events-none" />
                </div>

                {/* Feature Grid - Sophisticated Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto text-left mb-16">
                    
                    {/* Card 1 */}
                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-colors group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-colors" />
                        
                        <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform border border-blue-500/20">
                            <Layers className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-xl mb-3 text-white">7 Integrated Layers</h3>
                        <p className="text-sm text-gray-400 leading-relaxed border-l border-white/10 pl-4">
                            Navigation → Input → Funding → Revenue → Operations → Financials → Presentation. 
                            <br/><span className="text-white mt-2 block">No orphaned calculations.</span>
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-colors group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-emerald/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-brand-emerald/20 transition-colors" />
                        
                        <div className="w-12 h-12 bg-brand-emerald/10 rounded-lg flex items-center justify-center text-brand-emerald mb-6 group-hover:scale-110 transition-transform border border-brand-emerald/20">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-xl mb-3 text-white">DFI-Specific Formatting</h3>
                        <p className="text-sm text-gray-400 leading-relaxed border-l border-white/10 pl-4">
                            Pre-formatted logic for IDC, IFC, AfDB, and Land Bank criteria. 
                            <br/><span className="text-white mt-2 block">One core model. Multiple outputs.</span>
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-colors group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-colors" />
                        
                        <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform border border-purple-500/20">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-xl mb-3 text-white">Complete Deliverables</h3>
                        <p className="text-sm text-gray-400 leading-relaxed border-l border-white/10 pl-4">
                            Beyond spreadsheets: Professional business plan, Executive investment memo, and Assumption book.
                            <br/><span className="text-white mt-2 block">The full funding package.</span>
                        </p>
                    </div>

                </div>

                <div className="text-center">
                     <Button 
                        onClick={onLaunchMethodology}
                        variant="secondary" 
                        className="!text-white !border-white/10 hover:!bg-white/5 hover:!border-white/30 !px-10 !py-4 hover:!shadow-[0_0_30px_rgba(255,255,255,0.1)] !rounded-full"
                    >
                        Enter Methodology Lab <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        </section>
    );
};

// --- EDGE / ALTERNATIVES SECTION ---
export const EdgeSection: React.FC<SectionProps> = ({ id }) => {
    return (
        <section id={id} className="py-32 bg-white relative text-brand-navy border-t border-gray-100 overflow-hidden">
             {/* Background Pattern */}
             <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

            <div className="container mx-auto px-6 lg:px-12 relative z-10">
                <div className="text-center mb-20">
                    <div className="inline-block px-3 py-1 mb-4 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                        THE DIFFERENCE
                    </div>
                    <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-brand-navy tracking-tight">
                        Why our models pass when others fail.
                    </h2>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                        Most financial modellers understand Excel. We understand how the systems actually work.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 items-stretch">
                    
                    {/* TYPICAL MODELLER */}
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 lg:p-12 relative overflow-hidden group">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Typical Modeller</div>
                        <ul className="space-y-8 relative z-10">
                            <li className="flex gap-4 opacity-60">
                                <X className="w-6 h-6 text-gray-400 shrink-0" />
                                <span className="text-lg text-gray-600">Learns your project from your documents</span>
                            </li>
                            <li className="flex gap-4 opacity-60">
                                <X className="w-6 h-6 text-gray-400 shrink-0" />
                                <span className="text-lg text-gray-600">Models what you tell them</span>
                            </li>
                            <li className="flex gap-4 opacity-60">
                                <X className="w-6 h-6 text-gray-400 shrink-0" />
                                <span className="text-lg text-gray-600">Copies structure from previous models</span>
                            </li>
                             <li className="flex gap-4 opacity-60">
                                <X className="w-6 h-6 text-gray-400 shrink-0" />
                                <span className="text-lg text-gray-600">Passes financial review (maybe)</span>
                            </li>
                             <li className="flex gap-4 opacity-60">
                                <X className="w-6 h-6 text-gray-400 shrink-0" />
                                <span className="text-lg text-gray-600">Asks "what are your assumptions?"</span>
                            </li>
                        </ul>
                    </div>

                    {/* JASPER */}
                    <div className="bg-[#0F172A] border border-brand-emerald/30 rounded-2xl p-8 lg:p-12 relative overflow-hidden shadow-2xl scale-[1.02] z-10">
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-emerald/10 blur-[80px] rounded-full pointer-events-none" />
                        
                        <div className="text-xs font-bold text-brand-emerald uppercase tracking-widest mb-6 flex items-center gap-2">
                             <Zap className="w-4 h-4" />
                             JASPER Architecture
                        </div>
                        <ul className="space-y-8 relative z-10">
                            <li className="flex gap-4">
                                <CircleCheck className="w-6 h-6 text-brand-emerald shrink-0" />
                                <span className="text-lg text-white font-medium">Has designed integrated energy systems from scratch</span>
                            </li>
                            <li className="flex gap-4">
                                <CircleCheck className="w-6 h-6 text-brand-emerald shrink-0" />
                                <span className="text-lg text-white font-medium">Knows what you forgot to mention</span>
                            </li>
                            <li className="flex gap-4">
                                <CircleCheck className="w-6 h-6 text-brand-emerald shrink-0" />
                                <span className="text-lg text-white font-medium">Builds from first principles based on system operation</span>
                            </li>
                             <li className="flex gap-4">
                                <CircleCheck className="w-6 h-6 text-brand-emerald shrink-0" />
                                <span className="text-lg text-white font-medium">Passes technical AND financial due diligence</span>
                            </li>
                             <li className="flex gap-4">
                                <CircleCheck className="w-6 h-6 text-brand-emerald shrink-0" />
                                <span className="text-lg text-white font-medium">Asks "have you considered the heat reuse revenue stream?"</span>
                            </li>
                        </ul>
                    </div>

                </div>

                <div className="mt-16 text-center">
                    <p className="text-gray-500 italic max-w-2xl mx-auto">
                        This isn't theoretical knowledge. We've designed these systems. That's why our models reflect how they actually operate—and why they survive scrutiny from engineers AND bankers.
                    </p>
                </div>
            </div>
        </section>
    );
}

// --- FIT & PROCESS SECTION ---
export const FitProcessSection: React.FC<SectionProps> = ({ id }) => {
    const [activeProcess, setActiveProcess] = useState(0);

    return (
        <div id={id} className="bg-[#050A14] text-white relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0F172A] via-[#050A14] to-black" />
            <div className="absolute top-1/3 left-[-10%] w-[600px] h-[600px] bg-brand-emerald/5 blur-[120px] rounded-full pointer-events-none" />
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
            
            {/* --- SELECTION CRITERIA --- */}
            <section className="py-24 relative z-10 border-b border-white/5">
                <div className="container mx-auto px-6 lg:px-12">
                     <div className="flex flex-col lg:flex-row items-start gap-16 lg:gap-24">
                         
                         {/* Header Copy */}
                         <div className="lg:w-1/3 sticky top-32">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                    <User className="w-6 h-6 text-brand-emerald" />
                                </div>
                                <span className="text-xs font-bold tracking-[0.2em] text-brand-emerald uppercase">RIGHT FIT</span>
                            </div>
                            
                            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 leading-[1.1] text-white">
                                We're selective about who we work with.
                            </h2>
                            <p className="text-brand-muted mb-8 leading-relaxed text-lg font-light">
                                JASPER is built for specific types of projects. This ensures we deliver exceptional results for every client.
                            </p>
                            
                            <p className="text-sm text-brand-muted border-t border-white/10 pt-6">
                                If you're not sure whether your project qualifies, email us. We'll tell you honestly.
                            </p>
                         </div>

                         {/* Cards */}
                         <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                             
                             {/* Good Fit Card */}
                             <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="group relative p-8 rounded-3xl bg-gradient-to-b from-[#1E293B] to-[#0F172A] border border-brand-emerald/20 hover:border-brand-emerald/50 transition-colors duration-500 overflow-hidden"
                             >
                                 <div className="relative z-10">
                                     <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                         <span className="w-2 h-2 rounded-full bg-brand-emerald shadow-[0_0_8px_#2C8A5B]"></span>
                                         We work with
                                     </h3>
                                     <ul className="space-y-4 mt-6">
                                         {FIT_CRITERIA.good.map((item, i) => (
                                             <li key={i} className="flex items-start gap-3 group/item">
                                                 <div className="mt-1 w-5 h-5 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center flex-shrink-0 group-hover/item:bg-brand-emerald group-hover/item:border-brand-emerald transition-all">
                                                     <Check className="w-3 h-3 text-brand-emerald group-hover/item:text-white" />
                                                 </div>
                                                 <span className="text-sm text-gray-300 group-hover/item:text-white transition-colors">{item}</span>
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                             </motion.div>

                             {/* Bad Fit Card */}
                             <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, delay: 0.2 }}
                                className="relative p-8 rounded-3xl bg-[#0F172A] border border-white/5 hover:border-red-500/30 transition-colors duration-500"
                             >
                                 <div className="relative z-10">
                                     <h3 className="text-xl font-bold text-brand-muted mb-2 flex items-center gap-2">
                                         <span className="w-2 h-2 rounded-full bg-red-500/50"></span>
                                         Not right fit
                                     </h3>
                                     <ul className="space-y-4 mt-6 opacity-70">
                                         {FIT_CRITERIA.bad.map((item, i) => (
                                             <li key={i} className="flex items-start gap-3">
                                                 <CircleX className="w-5 h-5 text-red-500/50 mt-0.5 flex-shrink-0" />
                                                 <span className="text-sm text-brand-muted">{item}</span>
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                             </motion.div>
                         </div>
                     </div>
                </div>
            </section>

            {/* --- PROCESS SECTION --- */}
            <section className="py-32 relative z-10 bg-transparent">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
                        <div>
                            <div className="inline-block px-3 py-1 mb-4 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest text-brand-muted uppercase">
                                HOW WE WORK
                            </div>
                            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">Async-first. Documentation-driven.</h2>
                        </div>
                        <p className="text-brand-muted text-sm md:text-right max-w-xs leading-relaxed">
                            No discovery calls. No scope creep.<br/>
                            Clear communication through every step.
                        </p>
                    </div>

                    {/* Interactive Process Flow */}
                    <div className="relative">
                        {/* Connecting Line - Base */}
                        <div className="absolute top-[2.5rem] left-0 w-full h-0.5 bg-white/5 hidden md:block" />
                        
                        {/* Connecting Line - Active Progress */}
                        <div className="absolute top-[2.5rem] left-0 h-0.5 bg-brand-emerald hidden md:block transition-all duration-500 ease-in-out" 
                             style={{ width: `${(activeProcess / (PROCESS_STEPS.length - 1)) * 100}%` }} 
                        />

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                            {PROCESS_STEPS.map((step, i) => {
                                const isActive = i === activeProcess;
                                const isPast = i < activeProcess;
                                
                                return (
                                    <div 
                                        key={i} 
                                        className="relative group cursor-pointer"
                                        onMouseEnter={() => setActiveProcess(i)}
                                    >
                                        {/* Step Marker */}
                                        <div className={`
                                            w-20 h-20 mx-auto md:mx-0 rounded-2xl border-2 flex items-center justify-center text-xl font-bold mb-6 transition-all duration-300 relative z-10
                                            ${isActive 
                                                ? 'bg-brand-emerald border-brand-emerald text-white shadow-[0_0_30px_rgba(44,138,91,0.4)] scale-110' 
                                                : isPast
                                                    ? 'bg-[#0F172A] border-brand-emerald text-brand-emerald'
                                                    : 'bg-[#0F172A] border-white/10 text-brand-muted hover:border-white/30'
                                            }
                                        `}>
                                            {isPast ? <Check className="w-6 h-6" /> : step.number}
                                        </div>

                                        {/* Content */}
                                        <div className={`transition-all duration-300 ${isActive ? 'opacity-100 transform translate-y-0' : 'opacity-50 transform translate-y-2'}`}>
                                            <h3 className={`text-lg font-bold mb-2 ${isActive ? 'text-white' : 'text-brand-muted'}`}>
                                                {step.title}
                                            </h3>
                                            <p className="text-sm text-brand-muted leading-relaxed max-w-[150px]">
                                                {step.description}
                                            </p>
                                        </div>

                                        {/* Mobile Connector */}
                                        {i !== PROCESS_STEPS.length - 1 && (
                                            <div className="md:hidden absolute left-10 top-20 bottom-[-2rem] w-0.5 bg-white/10 -z-10" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="mt-16 p-6 rounded-xl bg-white/5 border border-white/10 md:text-center text-sm text-brand-muted">
                            <h4 className="font-bold text-white mb-2">What to expect:</h4>
                            <p>Written communication only—no calls required • Fixed pricing—no hourly billing • Progress updates at each milestone • Draft files watermarked until final payment</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
