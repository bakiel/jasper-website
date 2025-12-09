
'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { SECTORS } from '../constants';
import { LucideIcon, ArrowUpRight } from 'lucide-react';
import { BorderBeam } from './BorderBeam';

interface SpotlightCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  delay: number;
  className?: string;
  image?: string;
  onClick?: () => void;
}

const ROTATION_RANGE = 15;

const SpotlightCard: React.FC<SpotlightCardProps> = ({ title, description, icon: Icon, delay, className, image, onClick }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const ySpring = useSpring(y, { stiffness: 150, damping: 20 });
  const transform = useMotionTemplate`rotateX(${xSpring}deg) rotateY(${ySpring}deg)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    
    const rect = divRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Safety check: Prevent division by zero or NaN generation if element is hidden/collapsing
    if (width === 0 || height === 0) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setPosition({ x: mouseX, y: mouseY });
    
    const rX = (mouseY / height - 0.5) * ROTATION_RANGE * -1;
    const rY = (mouseX / width - 0.5) * ROTATION_RANGE;
    
    // Safety check: Ensure values are finite numbers
    if (Number.isFinite(rX)) x.set(rX);
    if (Number.isFinite(rY)) y.set(rY);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={divRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: delay }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ transformStyle: 'preserve-3d', transform }}
      className={`relative overflow-hidden rounded-2xl border border-white/5 bg-brand-surface/30 p-8 shadow-xl backdrop-blur-md group cursor-pointer perspective-1000 flex flex-col justify-end min-h-[340px] ${className}`}
    >
      {/* On Hover Border Beam */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
         <BorderBeam size={300} duration={8} borderWidth={1.5} />
      </div>
      
      {/* Background Image */}
      {image && (
        <>
            <div className="absolute inset-0 z-0">
                <img 
                    src={image} 
                    alt={title} 
                    className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110 opacity-50 group-hover:opacity-60" 
                />
            </div>
            {/* Enhanced Gradient Overlay for Readability */}
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/80 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-500" />
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-brand-emerald/20 to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-500 mix-blend-overlay" />
        </>
      )}

      {/* Spotlight Gradient */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-20"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(44, 138, 91, 0.15), transparent 40%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between pointer-events-none" style={{ transform: 'translateZ(20px)' }}>
        <div className="flex justify-between items-start">
            <div className="w-14 h-14 mb-6 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-brand-emerald transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-brand-emerald group-hover:text-white group-hover:border-brand-emerald backdrop-blur-md shadow-lg shadow-brand-emerald/5">
                <Icon strokeWidth={1.5} className="w-7 h-7" />
            </div>
            <div className="p-2 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 duration-300">
                <ArrowUpRight className="w-5 h-5 text-white" />
            </div>
        </div>
        
        <div>
            <h3 className="text-2xl font-semibold text-white tracking-tight mb-3 drop-shadow-lg flex items-center gap-2">
                {title}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed drop-shadow-md font-medium border-l-2 border-brand-emerald/50 pl-4 bg-black/20 p-2 rounded-r-lg backdrop-blur-sm">
                {description}
            </p>
        </div>
      </div>
    </motion.div>
  );
};

interface SectorsGridProps {
    id?: string;
    onSectorClick?: (id: string) => void;
}

export const SectorsGrid: React.FC<SectorsGridProps> = ({ id, onSectorClick }) => {
  return (
    <section id={id} className="py-32 relative bg-[#0B1E2B] border-t border-white/5">
        
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
            <div className="mb-16 text-center">
                <div className="inline-block px-3 py-1 mb-4 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest text-brand-muted uppercase">
                    SECTORS
                </div>
                <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
                    Where DFI Capital Flows
                </h2>
                <p className="text-brand-muted text-lg">
                    We specialise in sectors where development finance is actively deployed.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {SECTORS.map((sector, i) => (
                    <SpotlightCard
                        key={sector.id}
                        title={sector.title}
                        description={sector.description}
                        icon={sector.icon}
                        image={sector.image}
                        delay={i * 0.1}
                        onClick={() => onSectorClick && onSectorClick(sector.id)}
                    />
                ))}
            </div>
        </div>
    </section>
  );
};
