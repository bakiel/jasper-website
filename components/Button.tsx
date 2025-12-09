'use client';

import React, { useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  onClick,
  className = ''
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  // Magnetic Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    // Calculate distance from center
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    // Move the button a fraction of the distance (magnetic strength)
    x.set(distanceX * 0.35);
    y.set(distanceY * 0.35);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Base button styles
  const baseStyles = "relative inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-base transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 overflow-hidden z-20";
  
  // Updated Colors from Brand Guide
  const variants = {
    primary: "bg-brand-emerald text-white hover:bg-[#257A4F] focus:ring-brand-emerald border border-transparent font-medium shadow-[0_4px_20px_rgba(44,138,91,0.2)] hover:shadow-[0_4px_30px_rgba(44,138,91,0.4)]",
    secondary: "bg-transparent text-white hover:text-brand-emerald hover:border-brand-emerald focus:ring-brand-emerald border border-white/20"
  };

  return (
    <motion.div 
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: mouseXSpring, y: mouseYSpring }}
      className="relative inline-flex group cursor-pointer"
    >
       {/* Ambient Glow for Primary Button */}
       {variant === 'primary' && (
         <div className="absolute -inset-1 bg-gradient-to-r from-brand-emerald via-[#257A4F] to-brand-emerald rounded-lg blur opacity-25 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-gradient-x pointer-events-none"></div>
       )}
       
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        onClick={onClick}
      >
        <span className="relative z-20 flex items-center">{children}</span>
      </motion.button>
    </motion.div>
  );
};