'use client';

import React from 'react';

// DFI Institutions
const LOGOS = [
  { label: 'IFC' },
  { label: 'AfDB' },
  { label: 'DBSA' },
  { label: 'IDC' },
  { label: 'LAND BANK' },
  { label: 'ADB' },
  { label: 'BII' },
  { label: 'FMO' },
];

export const LogoTicker: React.FC = () => {
  return (
    <section className="w-full py-10 border-y border-white/5 bg-brand-navy/50 backdrop-blur-sm overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 mb-6 text-center">
         <p className="text-xs font-semibold tracking-widest text-brand-muted uppercase opacity-60">
            Formatted for submission to
         </p>
      </div>
      
      <div className="relative flex overflow-x-hidden group hover:[&_.animate-marquee]:paused">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-16 md:gap-24 px-12">
          {[...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS].map((logo, idx) => (
            <div 
                key={`${logo.label}-${idx}`} 
                className="flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
            >
               <span className="text-xl md:text-2xl font-bold font-sans tracking-tighter text-white hover:text-brand-emerald transition-colors">
                  {logo.label}
               </span>
            </div>
          ))}
        </div>
        
        {/* Gradient Fade Edges */}
        <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-brand-navy to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-brand-navy to-transparent z-10 pointer-events-none" />
      </div>
    </section>
  );
};