
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, Code, Database, FileJson } from 'lucide-react';

export const DependencyVisual: React.FC = () => {
  const [step, setStep] = useState(0);

  // Cycle through the pipeline steps
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // Map pipeline steps to grid positions (isometric grid logic)
  // UPDATED: Using "JASPER Train System" colors
  const steps = [
    { 
      id: 0, 
      label: 'Inputs (Foundation)', 
      value: 'RAW_DATA_INGEST', 
      icon: Database, 
      // Train Navy #002060
      color: 'text-blue-300', 
      bg: 'bg-[#002060]/40',
      border: 'border-[#002060]',
      pos: { r: 0, c: 0 } 
    },
    { 
      id: 1, 
      label: 'Logic (Python)', 
      value: 'def solve_iterative():', 
      icon: Code, 
      // Train Gold #C4961A
      color: 'text-amber-400', 
      bg: 'bg-[#C4961A]/20',
      border: 'border-[#C4961A]',
      pos: { r: 1, c: 2 } 
    },
    { 
      id: 2, 
      label: 'Structure (JSON)', 
      value: '{ "debt": 4500.00 }', 
      icon: FileJson, 
      // Train Grey #5A5A5A
      color: 'text-gray-300', 
      bg: 'bg-[#5A5A5A]/30',
      border: 'border-[#5A5A5A]',
      pos: { r: 2, c: 4 } 
    },
    { 
      id: 3, 
      label: 'Financial Statements', 
      value: 'Generating .xlsx...', 
      icon: FileSpreadsheet, 
      // Train Green #2C8A5B
      color: 'text-brand-emerald', 
      bg: 'bg-brand-emerald/20',
      border: 'border-brand-emerald/50',
      pos: { r: 4, c: 4 } 
    },
  ];

  const activeStep = steps[step];

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center perspective-1000 select-none">
      
      {/* 3D Isometric Plane Container */}
      <motion.div 
        className="relative w-[320px] h-[320px] md:w-[400px] md:h-[400px] bg-brand-surface/40 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl"
        style={{ 
          transform: 'rotateX(55deg) rotateZ(-45deg)', 
          transformStyle: 'preserve-3d' 
        }}
      >
        {/* Grid Overlay - The Spreadsheet */}
        <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
            {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className="border border-white/5 relative">
                   {/* Random static "data" in some cells for realism */}
                   {i % 7 === 0 && i !== 0 && i !== 24 && (
                      <div className="absolute inset-2 bg-white/5 rounded-sm" />
                   )}
                </div>
            ))}
        </div>

        {/* Column/Row Headers for Excel feel */}
        <div className="absolute -top-6 left-0 w-full flex justify-between px-2 font-mono text-xs text-brand-muted opacity-50" style={{ transform: 'rotateZ(0deg)' }}>
           <span>A</span><span>B</span><span>C</span><span>D</span><span>E</span>
        </div>
        <div className="absolute -left-6 top-0 h-full flex flex-col justify-between py-2 font-mono text-xs text-brand-muted opacity-50">
           <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
        </div>

        {/* The Active "Cursor" Box */}
        <motion.div
            className={`absolute z-20 shadow-[0_0_30px_rgba(255,255,255,0.1)]`}
            style={{
               width: '20%', 
               height: '20%',
            }}
            animate={{ 
                top: `${activeStep.pos.r * 20}%`, 
                left: `${activeStep.pos.c * 20}%`,
                borderColor: 'var(--cursor-color)',
                backgroundColor: 'var(--cursor-bg)'
            }}
            transition={{ type: "spring", stiffness: 180, damping: 24 }}
        >
             {/* Dynamic colored border/bg based on step */}
             <div className={`w-full h-full border-2 ${activeStep.border} ${activeStep.bg} relative transition-colors duration-500`}>
                 {/* Excel selection handle */}
                 <div className={`absolute -bottom-1 -right-1 w-2 h-2 ${activeStep.color.replace('text-', 'bg-')} transition-colors duration-500`} />
             </div>
        </motion.div>

        {/* Connecting Data Flow Lines */}
         <svg 
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" 
            style={{ transform: 'translateZ(2px)' }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
         >
             <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(44, 138, 91, 0)" />
                    <stop offset="50%" stopColor="rgba(44, 138, 91, 0.5)" />
                    <stop offset="100%" stopColor="rgba(44, 138, 91, 0)" />
                </linearGradient>
             </defs>
            <motion.path
                d={`M ${steps[0].pos.c * 20 + 10} ${steps[0].pos.r * 20 + 10} L ${steps[1].pos.c * 20 + 10} ${steps[1].pos.r * 20 + 10} L ${steps[2].pos.c * 20 + 10} ${steps[2].pos.r * 20 + 10} L ${steps[3].pos.c * 20 + 10} ${steps[3].pos.r * 20 + 10}`}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                strokeDasharray="5 5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.4 }}
                transition={{ duration: 2, repeat: Infinity }}
            />
         </svg>
      </motion.div>

      {/* Floating Info Card (Always faces user) */}
      <div className="absolute top-0 right-0 md:-right-4 w-72 pointer-events-none">
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-brand-surface/90 border border-white/10 p-5 rounded-xl shadow-2xl backdrop-blur-md"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white/5 ${activeStep.color}`}>
                            <activeStep.icon size={18} />
                        </div>
                        <span className="text-sm font-semibold text-white tracking-wide">{activeStep.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-brand-muted opacity-50">Step {step + 1}/4</span>
                </div>
                
                {/* Code Snippet / Value */}
                <div className="font-mono text-xs text-brand-muted bg-black/40 p-3 rounded border border-white/5 mb-3 overflow-hidden whitespace-nowrap">
                   <span className={activeStep.color}>{'> '}</span>
                   <span className="text-gray-300">{activeStep.value}</span>
                   <span className="animate-pulse inline-block w-1.5 h-3 bg-brand-emerald ml-1 align-middle"/>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-1.5 h-1">
                    {steps.map((s, i) => (
                        <motion.div 
                            key={s.id} 
                            className={`flex-1 h-full rounded-full`}
                            initial={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                            animate={{ backgroundColor: i <= step ? '#2C8A5B' : 'rgba(255,255,255,0.1)' }}
                        />
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
};
