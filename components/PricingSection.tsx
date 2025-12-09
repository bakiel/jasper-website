
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Zap, Plus, Minus, CreditCard, Clock, TriangleAlert, ShieldCheck, Wallet, Gem } from 'lucide-react';
import { Button } from './Button';
import { PACKAGES, ADDONS, SERVICE_FAQS } from '../constants';
import { BorderBeam } from './BorderBeam';

interface PricingSectionProps {
  id?: string;
  onNavigate?: (path: string) => void;
}

const FeatureItem: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => (
    <div className={`flex items-start gap-3 group ${className}`}>
        <div className="mt-1 w-5 h-5 rounded-full bg-brand-emerald/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-emerald/20 transition-colors">
            <Check className="w-3 h-3 text-brand-emerald" />
        </div>
        <span className="text-sm text-brand-muted group-hover:text-gray-300 transition-colors leading-snug">{text}</span>
    </div>
);

const ComparisonTable = () => {
    return (
        <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="p-3 md:p-4 text-xs md:text-sm font-semibold text-brand-muted uppercase tracking-wider w-[28%]">Feature</th>
                        <th className="p-3 md:p-4 text-center w-[24%]"><span className="text-yellow-400 font-bold text-sm md:text-base">Growth</span></th>
                        <th className="p-3 md:p-4 text-center w-[24%] relative">
                            <span className="text-brand-emerald font-bold text-sm md:text-base">Institutional</span>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 bg-brand-emerald text-white text-[8px] md:text-[9px] font-bold rounded-full uppercase tracking-wider whitespace-nowrap">Popular</div>
                        </th>
                        <th className="p-3 md:p-4 text-center w-[24%]"><span className="text-blue-400 font-bold text-sm md:text-base">Infrastructure</span></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs md:text-sm text-gray-300">
                     {/* Summary Row */}
                     <tr className="bg-white/[0.02]">
                        <td className="p-3 md:p-4 font-semibold text-white">Price</td>
                        <td className="p-3 md:p-4 text-center font-mono text-white">$12,000</td>
                        <td className="p-3 md:p-4 text-center font-mono text-white">$25,000</td>
                        <td className="p-3 md:p-4 text-center font-mono text-white">$45,000</td>
                    </tr>
                    <tr>
                        <td className="p-3 md:p-4 font-semibold text-white">Target Funding</td>
                        <td className="p-3 md:p-4 text-center">$5M - $15M</td>
                        <td className="p-3 md:p-4 text-center">$15M - $75M</td>
                        <td className="p-3 md:p-4 text-center">$75M+</td>
                    </tr>
                    <tr>
                        <td className="p-3 md:p-4 font-semibold text-white">Timeline</td>
                        <td className="p-3 md:p-4 text-center">3-4 Weeks</td>
                        <td className="p-3 md:p-4 text-center">4-6 Weeks</td>
                        <td className="p-3 md:p-4 text-center">6-8 Weeks</td>
                    </tr>

                    {/* Model Details */}
                    <tr className="bg-white/[0.02]">
                        <td className="p-3 md:p-4 col-span-4 font-bold text-brand-emerald uppercase text-[10px] md:text-xs tracking-widest pt-6 md:pt-8 pb-2">Financial Model</td>
                        <td className="p-3 md:p-4"></td>
                        <td className="p-3 md:p-4"></td>
                        <td className="p-3 md:p-4"></td>
                    </tr>
                    <tr>
                        <td className="p-3 md:p-4">Sheet Count</td>
                        <td className="p-3 md:p-4 text-center">20 Sheets</td>
                        <td className="p-3 md:p-4 text-center">28 Sheets</td>
                        <td className="p-3 md:p-4 text-center">35+ Sheets</td>
                    </tr>
                    <tr>
                        <td className="p-3 md:p-4">Scenarios</td>
                        <td className="p-3 md:p-4 text-center text-[11px] md:text-sm">3 (Base/Up/Down)</td>
                        <td className="p-3 md:p-4 text-center text-[11px] md:text-sm">5 + Sensitivity</td>
                        <td className="p-3 md:p-4 text-center text-[11px] md:text-sm">7 + Monte Carlo</td>
                    </tr>
                     <tr>
                        <td className="p-3 md:p-4">Debt Sculpting</td>
                        <td className="p-3 md:p-4 text-center opacity-50">—</td>
                        <td className="p-3 md:p-4 text-center text-brand-emerald"><Check className="w-4 h-4 mx-auto" /></td>
                        <td className="p-3 md:p-4 text-center text-brand-emerald"><Check className="w-4 h-4 mx-auto" /></td>
                    </tr>
                    <tr>
                        <td className="p-3 md:p-4">Construction Model</td>
                        <td className="p-3 md:p-4 text-center opacity-50">—</td>
                        <td className="p-3 md:p-4 text-center opacity-50">—</td>
                        <td className="p-3 md:p-4 text-center text-brand-emerald"><Check className="w-4 h-4 mx-auto" /></td>
                    </tr>

                     {/* Docs Details */}
                    <tr className="bg-white/[0.02]">
                        <td className="p-3 md:p-4 col-span-4 font-bold text-brand-emerald uppercase text-[10px] md:text-xs tracking-widest pt-6 md:pt-8 pb-2">Documentation</td>
                        <td className="p-3 md:p-4"></td>
                        <td className="p-3 md:p-4"></td>
                        <td className="p-3 md:p-4"></td>
                    </tr>
                    <tr>
                        <td className="p-3 md:p-4">Business Plan</td>
                        <td className="p-3 md:p-4 text-center opacity-50">—</td>
                        <td className="p-3 md:p-4 text-center text-[11px] md:text-sm">40-60 pages</td>
                        <td className="p-3 md:p-4 text-center text-[11px] md:text-sm">80-120 pages</td>
                    </tr>
                    <tr>
                        <td className="p-3 md:p-4">DFI Formatting</td>
                        <td className="p-3 md:p-4 text-center opacity-50">—</td>
                        <td className="p-3 md:p-4 text-center">1 Institution</td>
                        <td className="p-3 md:p-4 text-center">Up to 4</td>
                    </tr>
                    <tr>
                        <td className="p-3 md:p-4">Infographics</td>
                        <td className="p-3 md:p-4 text-center opacity-50">—</td>
                        <td className="p-3 md:p-4 text-center opacity-50">—</td>
                        <td className="p-3 md:p-4 text-center text-brand-emerald"><Check className="w-4 h-4 mx-auto" /></td>
                    </tr>

                    {/* Support Details */}
                    <tr className="bg-white/[0.02]">
                        <td className="p-3 md:p-4 col-span-4 font-bold text-brand-emerald uppercase text-[10px] md:text-xs tracking-widest pt-6 md:pt-8 pb-2">Support</td>
                        <td className="p-3 md:p-4"></td>
                        <td className="p-3 md:p-4"></td>
                        <td className="p-3 md:p-4"></td>
                    </tr>
                    <tr>
                        <td className="p-3 md:p-4">Revisions</td>
                        <td className="p-3 md:p-4 text-center">2 Rounds</td>
                        <td className="p-3 md:p-4 text-center">2 Rounds</td>
                        <td className="p-3 md:p-4 text-center">3 Rounds</td>
                    </tr>
                    <tr>
                        <td className="p-3 md:p-4">Email Support</td>
                        <td className="p-3 md:p-4 text-center">30 Days</td>
                        <td className="p-3 md:p-4 text-center">60 Days</td>
                        <td className="p-3 md:p-4 text-center">90 Days</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const FAQItem: React.FC<{ q: string, a: string }> = ({ q, a }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-white/10 last:border-0">
             <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-5 flex items-center justify-between text-left group"
            >
                <span className={`text-sm md:text-base font-medium transition-colors ${isOpen ? 'text-brand-emerald' : 'text-gray-200 group-hover:text-white'}`}>{q}</span>
                <span className={`ml-4 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-emerald' : 'text-gray-500'}`}>
                    <Plus className="w-4 h-4" />
                </span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="pb-5 text-sm text-gray-400 leading-relaxed pr-8">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const PricingSection: React.FC<PricingSectionProps> = ({ id, onNavigate }) => {
  const [showTable, setShowTable] = useState(false);

  return (
    <section id={id} className="py-32 relative bg-brand-dark overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-brand-emerald/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-navy/50 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
             <Zap className="w-3 h-3 text-brand-emerald" fill="currentColor" />
             <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald">PACKAGES</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-display font-bold text-white mb-6">
            Complete Investment Packages
          </h2>
          <p className="text-brand-muted text-lg max-w-2xl mx-auto">
            Fixed pricing. Clear deliverables. No hourly surprises. <br className="hidden md:block"/> All packages include working formulas, professional formatting, and complete documentation.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className={`
                relative flex flex-col p-8 rounded-2xl backdrop-blur-md transition-all duration-300
                ${pkg.highlight 
                    ? 'bg-brand-surface/40 border border-white/10 shadow-2xl z-10' 
                    : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]'
                }
              `}
            >
              {pkg.highlight && (
                <>
                    <BorderBeam size={300} duration={8} delay={0} colorFrom="#2C8A5B" colorTo="#44D685" />
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-emerald text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-[0_4px_20px_rgba(44,138,91,0.4)]">
                    Most Popular
                    </div>
                </>
              )}

              <div className="mb-6 pt-2">
                <h3 className="text-xl font-display font-bold text-white mb-2 uppercase tracking-wide">{pkg.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white tracking-tight">{pkg.price}</span>
                </div>
                <div className="text-xs text-brand-emerald uppercase tracking-wider mt-1 mb-4 opacity-90">{pkg.target}</div>
                <div className="text-xs text-brand-muted mt-2 pl-1 border-l-2 border-brand-emerald/30">Est. {pkg.duration}</div>
              </div>

              <div className="flex-grow space-y-4 mb-8">
                 <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Includes</div>
                {pkg.features.map((feature, idx) => (
                  <FeatureItem key={idx} text={feature} />
                ))}
              </div>

              <Button
                variant={pkg.highlight ? 'primary' : 'secondary'}
                className="w-full justify-center text-sm !py-3.5"
                onClick={() => onNavigate?.('/contact')}
              >
                Start Project
              </Button>

            </motion.div>
          ))}
        </div>

        {/* Detailed Comparison Toggle */}
        <div className="max-w-6xl mx-auto mb-32">
             <button 
                onClick={() => setShowTable(!showTable)}
                className="w-full py-4 border-t border-b border-white/10 flex items-center justify-center gap-2 text-brand-muted hover:text-white transition-colors group"
             >
                 <span className="text-sm font-bold uppercase tracking-widest">Compare Detailed Deliverables</span>
                 <Plus className={`w-4 h-4 transition-transform duration-300 ${showTable ? 'rotate-45' : ''}`} />
             </button>
             <AnimatePresence>
                {showTable && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-[#0F172A]/50 backdrop-blur-sm"
                    >
                        <ComparisonTable />
                    </motion.div>
                )}
             </AnimatePresence>
        </div>

        {/* Add-ons Grid */}
        <div className="max-w-6xl mx-auto mb-32">
            <h3 className="text-2xl font-display font-bold text-white mb-8 text-center">Additional Services</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ADDONS.map((addon, i) => (
                    <div key={i} className="p-6 rounded-xl bg-white/[0.03] border border-white/5 hover:border-brand-emerald/30 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-white text-lg group-hover:text-brand-emerald transition-colors">{addon.title}</h4>
                             <span className="text-brand-emerald font-mono text-sm">{addon.price}</span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">{addon.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Expedited & Responsibilities Split */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 mb-32">
            
            {/* Expedited */}
            <div className="p-8 rounded-2xl bg-[#0F172A] border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500"><Clock className="w-5 h-5" /></div>
                    <h3 className="text-xl font-bold text-white">Need It Faster?</h3>
                </div>
                <p className="text-brand-muted text-sm mb-6">Genuine deadline? We may be able to accelerate (+50% fee). Subject to workload availability.</p>
                
                <div className="space-y-4">
                     <div className="flex justify-between items-center text-sm p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Growth</span>
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 line-through text-xs">3-4 weeks</span>
                            <span className="text-orange-400 font-bold">2 weeks</span>
                        </div>
                     </div>
                     <div className="flex justify-between items-center text-sm p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Institutional</span>
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 line-through text-xs">4-6 weeks</span>
                            <span className="text-orange-400 font-bold">3 weeks</span>
                        </div>
                     </div>
                     <div className="flex justify-between items-center text-sm p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Infrastructure</span>
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 line-through text-xs">6-8 weeks</span>
                            <span className="text-orange-400 font-bold">4 weeks</span>
                        </div>
                     </div>
                </div>
            </div>

            {/* Responsibilities */}
            <div className="p-8 rounded-2xl bg-[#0F172A] border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><ShieldCheck className="w-5 h-5" /></div>
                    <h3 className="text-xl font-bold text-white">What We Need From You</h3>
                </div>
                <div className="space-y-3">
                    <FeatureItem text="Project overview / concept note" />
                    <FeatureItem text="Historical financials (if operational)" />
                    <FeatureItem text="CAPEX estimates or quotes" />
                    <FeatureItem text="Revenue assumptions / market data" />
                    <FeatureItem text="Team / management information" />
                </div>
                <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-3">
                    <TriangleAlert className="w-5 h-5 text-red-400 shrink-0" />
                    <p className="text-xs text-red-200 leading-relaxed">Timeline starts only when intake is complete. Incomplete information = delayed delivery.</p>
                </div>
            </div>
        </div>

        {/* Payment Terms & FAQ Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">
            
            {/* Payment (2 cols) */}
            <div className="lg:col-span-2">
                <h3 className="text-xl font-bold text-white mb-6">Payment Terms</h3>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-brand-emerald/20 mb-6">
                    <div className="flex items-center gap-3 mb-4 text-brand-emerald">
                        <Gem className="w-5 h-5" />
                        <span className="font-bold tracking-wide text-sm">CRYPTO-NATIVE (PREFERRED)</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">Same-day settlement. No banking delays. Borderless.</p>
                    <div className="flex gap-2 mb-4">
                         <span className="px-2 py-1 bg-black/40 rounded text-xs text-gray-300 font-mono">USDC</span>
                         <span className="px-2 py-1 bg-black/40 rounded text-xs text-gray-300 font-mono">USDT</span>
                         <span className="px-2 py-1 bg-black/40 rounded text-xs text-gray-300 font-mono">BTC</span>
                         <span className="px-2 py-1 bg-black/40 rounded text-xs text-gray-300 font-mono">ETH</span>
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Via Binance</p>
                </div>

                <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 opacity-70 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-3 mb-2 text-white">
                        <Wallet className="w-4 h-4" />
                        <span className="font-bold text-sm">Traditional</span>
                    </div>
                    <p className="text-sm text-gray-400">Wise • Payoneer • FNB (SA Clients)</p>
                </div>
                
                <div className="mt-8 flex justify-between text-xs text-brand-muted uppercase tracking-wider font-mono border-t border-white/10 pt-4">
                    <span>50% Deposit</span>
                    <span>50% Delivery</span>
                </div>
            </div>

            {/* FAQ (3 cols) */}
            <div className="lg:col-span-3">
                 <h3 className="text-xl font-bold text-white mb-6">Service FAQ</h3>
                 <div className="space-y-1">
                    {SERVICE_FAQS.map((faq, i) => (
                        <FAQItem key={i} q={faq.q} a={faq.a} />
                    ))}
                 </div>
            </div>

        </div>

      </div>
    </section>
  );
};
