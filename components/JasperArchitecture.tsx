'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Database, Banknote, TrendingUp, Layers, PieChart, FileText, Search } from 'lucide-react';

const LAYERS = [
  { id: 'nav', title: '1. Navigation', icon: Search, x: 50, y: 10, color: '#60A5FA' },
  { id: 'input', title: '2. Inputs', icon: Database, x: 50, y: 30, color: '#818CF8' },
  { id: 'funding', title: '3. Funding', icon: Banknote, x: 15, y: 50, color: '#A78BFA' },
  { id: 'revenue', title: '4. Revenue', icon: TrendingUp, x: 50, y: 50, color: '#34D399' },
  { id: 'ops', title: '5. Operations', icon: Layers, x: 85, y: 50, color: '#FB923C' },
  { id: 'financials', title: '6. Financials', icon: PieChart, x: 50, y: 70, color: '#2DD4BF' },
  { id: 'analysis', title: '7. Analysis', icon: FileText, x: 50, y: 90, color: '#94A3B8' },
];

const CONNECTIONS = [
    ['nav', 'input'],
    ['input', 'funding'],
    ['input', 'revenue'],
    ['input', 'ops'],
    ['funding', 'financials'],
    ['revenue', 'financials'],
    ['ops', 'financials'],
    ['financials', 'analysis']
];

export const JasperArchitecture: React.FC<{ condensed?: boolean; idPrefix?: string }> = ({ condensed = false, idPrefix = 'jasper' }) => {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
        setActiveLayer(prev => {
            const idx = prev ? LAYERS.findIndex(l => l.id === prev) : -1;
            const nextIndex = (idx + 1) % LAYERS.length;
            return LAYERS[nextIndex]?.id || LAYERS[0].id;
        });
    }, 1500); 
    
    return () => clearInterval(interval);
  }, []);

  const safeConnections = useMemo(() => {
      return CONNECTIONS.map(([startId, endId]) => {
          const start = LAYERS.find(l => l.id === startId) || { x: 50, y: 50 };
          const end = LAYERS.find(l => l.id === endId) || { x: 50, y: 50 };
          return {
              start: { x: start.x || 50, y: start.y || 50 },
              end: { x: end.x || 50, y: end.y || 50 },
              id: `${startId}-${endId}`
          };
      });
  }, []);

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <div className={`relative w-full ${condensed ? 'h-[400px] md:h-[500px]' : 'h-[600px] md:h-[750px]'} flex items-center justify-center select-none overflow-visible`}>
      
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-brand-emerald/5 blur-[80px] rounded-full pointer-events-none" />

      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
          {safeConnections.map((conn, i) => (
              <motion.line
                key={conn.id}
                x1={conn.start.x} 
                y1={conn.start.y} 
                x2={conn.end.x} 
                y2={conn.end.y}
                stroke="white"
                strokeWidth={condensed ? "1" : "1.5"}
                strokeOpacity="0.1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: i * 0.1 }}
              />
          ))}
      </svg>
      
      <div className="relative w-full max-w-5xl h-full">
           <div className="absolute left-1/2 top-[10%] bottom-[10%] w-px bg-transparent -translate-x-1/2 z-0 overflow-hidden">
                <motion.div 
                    className="w-full h-[30%] bg-gradient-to-b from-transparent via-brand-emerald to-transparent opacity-50"
                    animate={{ top: ['-30%', '130%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    style={{ position: 'absolute', left: 0, right: 0 }}
                />
           </div>

          {LAYERS.map((layer) => {
              const isActive = activeLayer === layer.id;
              
              return (
                <motion.div
                    key={layer.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{ 
                        left: `${layer.x}%`, 
                        top: `${layer.y}%`,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", delay: 0.1 * LAYERS.findIndex(l => l.id === layer.id) }}
                >
                    <div 
                        className={`
                            relative rounded-xl border backdrop-blur-md transition-all duration-500 flex flex-col items-center justify-center gap-2
                            ${condensed 
                                ? 'p-2 w-[100px] md:w-[120px]' 
                                : 'p-3 w-[120px] md:w-[160px]'
                            }
                            ${isActive 
                                ? `bg-[#0F172A] border-[${layer.color}] shadow-[0_0_30px_${layer.color}40] scale-105 z-20` 
                                : 'bg-[#0F172A]/80 border-white/10 hover:border-white/30 z-10'
                            }
                        `}
                        style={{ borderColor: isActive ? layer.color : undefined }}
                    >
                        {layer.y > 10 && (
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#050A14] border border-white/20 z-20 flex items-center justify-center">
                                <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-brand-emerald' : 'bg-white/20'}`} />
                            </div>
                        )}

                        <div className={`
                            rounded-lg bg-white/5 ${isActive ? 'text-white' : 'text-gray-400'} transition-colors
                            ${condensed ? 'p-1.5' : 'p-2'}
                        `} style={{ color: isActive ? layer.color : undefined }}>
                            <layer.icon size={condensed ? 16 : 24} />
                        </div>
                        
                        <div className="text-center">
                            <div className={`font-bold text-white leading-tight ${condensed ? 'text-[10px]' : 'text-xs md:text-sm'}`}>
                                {layer.title}
                            </div>
                            {!condensed && (
                                <div className="text-[9px] md:text-[10px] text-gray-500 font-mono mt-1 hidden md:block">
                                    Data Validated
                                </div>
                            )}
                        </div>

                        {layer.y < 90 && (
                             <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#050A14] border border-white/20 z-20 flex items-center justify-center">
                                <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-brand-emerald' : 'bg-white/20'}`} />
                            </div>
                        )}
                        
                        {isActive && (
                            <motion.div 
                                // Unique layoutId based on props and context to prevent conflicts
                                layoutId={`${idPrefix}-${condensed ? "scanner-mini" : "scanner-full"}`}
                                className="absolute inset-0 rounded-xl bg-white/5 z-0 pointer-events-none"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </div>
                </motion.div>
              );
          })}
          
          <DataFlowParticles />
      </div>
    </div>
  );
};

const DataFlowParticles = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
            <motion.div 
                className="absolute left-1/2 w-1 h-1 bg-brand-emerald rounded-full shadow-[0_0_10px_#44D685]"
                animate={{ top: ['10%', '90%'], opacity: [0, 1, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                style={{ translateX: '-50%' }}
            />
        </div>
    )
}