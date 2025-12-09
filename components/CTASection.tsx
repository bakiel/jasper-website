'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { Mail } from 'lucide-react';

interface CTASectionProps {
  id?: string;
  onNavigate?: (path: string) => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ id, onNavigate }) => {
  return (
    <section id={id} className="py-24 px-6 lg:px-12 bg-[#1E3A5F]">
      <div className="container mx-auto">
        <div className="relative rounded-3xl bg-brand-navy border border-white/10 p-12 lg:p-24 overflow-hidden text-center group shadow-2xl">
          
          {/* Background Image Texture */}
          <div className="absolute inset-0 z-0">
             <img
                src="/images/backgrounds/cta-rays.jpg"
                alt=""
                className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-[2s]"
             />
             <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/80 via-[#0F172A]/60 to-brand-emerald/10" />
          </div>

          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-emerald/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-emerald/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Ready to fund your project?
            </h2>
            
            <p className="text-lg text-brand-muted mb-10 max-w-xl">
              Start with an email. No sales calls. No pressure. <br/>
              If we're the right fit, we'll send a proposal. If not, we'll tell you honestly.
            </p>
            
            <div className="flex flex-col items-center gap-6">
                <Button
                    className="!px-10 !py-5 text-lg !rounded-full shadow-lg shadow-brand-emerald/20"
                    onClick={() => onNavigate?.('/contact')}
                >
                  Start Your Project
                </Button>
                <span className="text-brand-muted text-sm">or email: <a href="mailto:models@jasperfinance.org" className="text-white hover:text-brand-emerald transition-colors">models@jasperfinance.org</a></span>
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-6 md:gap-12 text-xs font-mono text-brand-muted uppercase tracking-wider opacity-70">
                <span>50% upfront, 50% on delivery</span>
                <span className="text-brand-emerald/80 font-bold">Crypto-native (USDC/USDT/BTC/ETH)</span>
                <span>Response within 48 hours</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};