import React from 'react';

interface GlassCardProps {
  children?: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`glass-card rounded-2xl p-4 md:p-6 relative overflow-hidden group ${className}`}>
      {/* Top light border effect */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-jasper-emerald/40 to-transparent opacity-50"></div>
      {children}
    </div>
  );
};
