
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SECTOR_DETAILS } from '../constants';
import { Globe } from 'lucide-react';

const COLORS: Record<string, string> = {
    emerald: 'text-brand-emerald border-brand-emerald/30 bg-brand-emerald/10',
    blue: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
    yellow: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    teal: 'text-teal-400 border-teal-400/30 bg-teal-400/10',
};

// Video paths for each sector
const SECTOR_VIDEOS: Record<string, string> = {
    'renewable-energy': '/images/sectors/renewable-energy-animation.mp4',
    'data-centres': '/images/sectors/data-centres-animation.mp4',
    'agri-industrial': '/images/sectors/agri-industrial-animation.mp4',
    'climate-finance': '/images/sectors/climate-finance-animation.mp4',
    'technology': '/images/sectors/technology-animation.mp4',
    'manufacturing': '/images/sectors/manufacturing-animation.mp4',
};

const SectorVisual: React.FC<{ id: string }> = ({ id }) => {
    const videoSrc = SECTOR_VIDEOS[id];

    if (videoSrc) {
        return (
            <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-emerald/5 via-transparent to-blue-500/5" />

                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover mix-blend-screen"
                    style={{
                        maskImage: 'radial-gradient(ellipse 85% 85% at center, black 40%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 85% 85% at center, black 40%, transparent 100%)',
                        opacity: 0.9
                    }}
                >
                    <source src={videoSrc} type="video/mp4" />
                </video>
            </div>
        );
    }

    // Fallback for sectors without video
    return (
        <div className="w-full h-full relative flex items-center justify-center">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent" />
             <Globe className="w-24 h-24 text-white/10" />
        </div>
    );
};

export const SectorDeepDive: React.FC = () => {
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});

  const handleTabChange = (sectorId: string, tabId: string) => {
    setActiveTabs(prev => ({ ...prev, [sectorId]: tabId }));
  };

  return (
    <div className="w-full space-y-32">
        {SECTOR_DETAILS.map((sector) => {
            const activeTab = activeTabs[sector.id] || 'model';
            const themeClass = COLORS[sector.color] || COLORS['emerald'];
            const activeTabContent = sector.tabs.find(t => t.id === activeTab)?.content;

            return (
                <section key={sector.id} id={sector.id} className="scroll-mt-32">
                    <div className="container mx-auto px-6 lg:px-12">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-10">
                             <div className={`p-4 rounded-2xl border bg-white/[0.02] ${themeClass}`}>
                                 <sector.icon className="w-8 h-8" />
                             </div>
                             <div>
                                 <h2 className="text-3xl lg:text-5xl font-display font-bold text-white mb-2">{sector.title}</h2>
                                 <p className="text-brand-muted text-lg">{sector.subtitle}</p>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                            
                            {/* Left Column: Interactive Tabs & Content */}
                            <div className="lg:col-span-7 flex flex-col">
                                {/* Tab Navigation */}
                                <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10">
                                    {sector.tabs.map((tab) => {
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => handleTabChange(sector.id, tab.id)}
                                                className={`
                                                    relative px-5 py-3 text-sm font-semibold transition-colors
                                                    ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
                                                `}
                                            >
                                                {tab.label}
                                                {isActive && (
                                                    <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${themeClass.split(' ')[0].replace('text-', 'bg-')}`} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Tab Content Area */}
                                <div className="min-h-[400px]">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={`${sector.id}-${activeTab}`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.2 }}
                                            className="grid grid-cols-1 gap-6"
                                        >
                                            {activeTabContent?.map((group, idx) => (
                                                <div key={`${sector.id}-${activeTab}-${idx}`} className="group/card relative p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                                    <div className="absolute left-0 top-6 bottom-6 w-1 bg-white/10 group-hover/card:bg-brand-emerald transition-colors rounded-r-full" />
                                                    
                                                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 pl-4 ${themeClass.split(' ')[0]}`}>
                                                        {group.title}
                                                    </h4>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 pl-4">
                                                        {group.items.map((item, i) => (
                                                            <div key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                                                <div className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${themeClass.split(' ')[0].replace('text-', 'bg-')}`} />
                                                                <span className="leading-relaxed">{item}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Right Column: Visual & KPI Stats */}
                            <div className="lg:col-span-5">
                                <div className="sticky top-32 space-y-6">
                                    <div className="aspect-square w-full rounded-3xl bg-[#0F172A] border border-white/10 relative overflow-hidden shadow-2xl">
                                         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_60%)] pointer-events-none" />
                                         <SectorVisual id={sector.id} />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        {sector.stats.map((stat, i) => (
                                            <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center">
                                                <span className="text-[10px] text-brand-muted uppercase tracking-wider mb-1">{stat.label}</span>
                                                <span className="text-sm font-bold text-white">{stat.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            );
        })}
    </div>
  );
};
