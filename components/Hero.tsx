
'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { DependencyVisual } from './DependencyVisual';

interface HeroProps {
  onLaunchMethodology?: () => void;
  onNavigate?: (path: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onLaunchMethodology, onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parallax Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 100, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 100, damping: 30 });

  // Element rotation
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);
  
  // Background parallax movement
  const backgroundX = useTransform(mouseXSpring, [-0.5, 0.5], ["-20px", "20px"]);
  const backgroundY = useTransform(mouseYSpring, [-0.5, 0.5], ["-20px", "20px"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-screen flex flex-col justify-center items-center overflow-hidden pt-32 pb-20 bg-[#050A14]"
    >
      {/* Background Layer with Parallax */}
      <motion.div
        style={{ x: backgroundX, y: backgroundY }}
        className="absolute inset-0 z-0"
      >
         {/* Hero Background Image */}
         <div className="absolute inset-0">
           <img
             src="/images/backgrounds/hero-abstract.jpg"
             alt=""
             className="w-full h-full object-cover opacity-40"
           />
           <div className="absolute inset-0 bg-gradient-to-b from-[#050A14]/60 via-[#050A14]/80 to-[#050A14]" />
         </div>
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none" />
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl bg-brand-emerald/5 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      </motion.div>
      
      {/* Spotlight Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none animate-spotlight">
        <div className="absolute inset-0 bg-gradient-radial from-brand-emerald/30 to-transparent blur-[80px]" />
      </div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10 flex flex-col items-center text-center">
        
        {/* Badge */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-surface/50 border border-white/10 mb-8 backdrop-blur-md shadow-lg shadow-brand-emerald/5"
        >
            <Sparkles className="w-3 h-3 text-brand-emerald" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-white">DFI Investment Packages</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-[10px] tracking-widest text-brand-muted uppercase">$5M to $500M+</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight text-white mb-8 max-w-6xl leading-[1.1] drop-shadow-2xl"
        >
          Financial models built by <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald via-green-200 to-white">
             people who've designed the systems.
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-brand-muted max-w-3xl leading-relaxed mb-10 font-light"
        >
          We don't just model energy projects — we've designed 1,300 MW complexes.
          That's why our models survive both technical and financial due diligence.<br className="hidden md:block" />
          <span className="block mt-4 text-white/80">Renewable energy. Infrastructure. Data centres. Agri-industrial.</span>
        </motion.p>

        {/* Stats Bar */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.5 }}
           className="flex flex-wrap justify-center gap-4 md:gap-8 text-xs md:text-sm text-brand-emerald font-mono mb-12 opacity-80 border-b border-brand-emerald/20 pb-2"
        >
            <span>1,300 MW DESIGNED & MODELLED</span>
            <span className="text-white/20">|</span>
            <span>35-SHEET ARCHITECTURE</span>
            <span className="text-white/20">|</span>
            <span>4+ DFI FORMATS</span>
            <span className="text-white/20">|</span>
            <span>GLOBAL</span>
        </motion.div>

        {/* CTA Group */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-5 items-center mb-24"
        >
          <Button
            onClick={() => onNavigate?.('/contact')}
            className="!rounded-full !px-10 !py-4 text-base shadow-[0_0_40px_rgba(44,138,91,0.3)] hover:shadow-[0_0_60px_rgba(44,138,91,0.5)]"
          >
            Start Your Project <ArrowRight className="ml-2 w-4 h-4 inline-block" />
          </Button>
          <Button 
            onClick={onLaunchMethodology}
            variant="secondary" 
            className="!rounded-full !px-8 !py-4 text-base group !border-white/10 hover:!bg-white/5"
          >
            See How We Work
            <ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>

        {/* Visual Pipeline */}
        <div className="w-full max-w-5xl relative perspective-1000">
           <motion.div 
              style={{
                  rotateX,
                  rotateY,
                  transformStyle: "preserve-3d"
              }}
              initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="relative"
           >
              {/* Main Visual Component */}
              <DependencyVisual />
              
              {/* Floor Reflection/Shadow */}
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-[120px] bg-brand-emerald/10 blur-[100px] rounded-[100%]" />
           </motion.div>
        </div>

      </div>
    </section>
  );
};
