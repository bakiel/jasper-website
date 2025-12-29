'use client';

import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Globe, DollarSign, ArrowRight, AlertTriangle, Building, MessageCircle } from 'lucide-react';
import { Button } from './Button';
import { MARKET_CONTENT } from '../constants';

interface MarketPageProps {
    slug: string;
    onBack: () => void;
    onNavigate?: (path: string) => void;
}

export const MarketPage: React.FC<MarketPageProps> = ({ slug, onBack, onNavigate }) => {
    // Safe data access with useMemo
    const data = useMemo(() => {
        if (!slug) return null;
        return MARKET_CONTENT[slug.toLowerCase()] || MARKET_CONTENT[slug];
    }, [slug]);

    // Ensure scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Robust 404 / Error State
    if (!data) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen bg-[#050A14] flex flex-col items-center justify-center text-white p-6 text-center relative z-50"
            >
                <div className="p-4 rounded-full bg-red-500/10 mb-6">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-3xl font-display font-bold mb-4">Market Not Found</h2>
                <p className="text-gray-400 mb-8 max-w-md">
                    The requested market details could not be retrieved. The identifier "{slug}" may be incorrect.
                </p>
                <Button onClick={onBack} variant="secondary" className="!bg-white/5 !border-white/10">
                    Return Home
                </Button>
            </motion.div>
        );
    }

    const whatsappUrl = `https://wa.me/27659387000?text=${encodeURIComponent(data.whatsappMessage)}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-screen w-full bg-[#050A14] overflow-hidden"
        >
            {/* --- TOP NAVIGATION BAR --- */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4 bg-[#050A14]/90 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center gap-4">
                     <button
                        onClick={onBack}
                        className="p-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors group"
                     >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                     </button>
                     <div className="h-6 w-px bg-white/10 hidden md:block" />
                     <span className="text-sm font-bold text-white uppercase tracking-widest hidden md:block opacity-80">Regional Markets</span>
                </div>

                <div className="flex items-center gap-4">
                    <span className="hidden md:block text-xs text-brand-muted font-mono uppercase">{data.currency}</span>
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-xs rounded-full bg-brand-emerald hover:bg-brand-emerald/90 text-white font-semibold shadow-lg shadow-brand-emerald/20 transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" />
                        Start Conversation
                    </a>
                </div>
            </div>

            {/* --- HERO HEADER --- */}
            <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden border-b border-white/5">
                {/* Background Image Layer */}
                <div className="absolute inset-0 z-0 select-none">
                    {data.heroImage && (
                        <img
                            src={data.heroImage}
                            alt={data.title}
                            className="w-full h-full object-cover opacity-30 scale-105"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/80 to-[#050A14]/30" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#050A14] via-transparent to-[#050A14]" />
                </div>

                <div className="container mx-auto px-6 lg:px-12 relative z-10 text-center max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold tracking-widest text-blue-400 uppercase backdrop-blur-md">
                            <Globe className="w-3 h-3" /> Regional Focus
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 tracking-tight leading-tight drop-shadow-2xl">
                            {data.title}
                        </h1>
                        <p className="text-xl md:text-2xl text-brand-muted max-w-2xl mx-auto font-light leading-relaxed">
                            {data.subtitle}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* --- MARKET STATS --- */}
            <section className="py-16 px-6 lg:px-12 bg-[#0B1221] border-b border-white/5">
                <div className="container mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {data.stats?.map((stat: any, idx: number) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="p-6 rounded-xl bg-[#050A14]/80 border border-white/10 text-center backdrop-blur-sm group hover:border-blue-400/50 transition-colors"
                            >
                                <div className="text-2xl md:text-3xl font-bold text-white mb-2 font-mono group-hover:text-blue-400 transition-colors">{stat.val}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-widest">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- KEY DFIs --- */}
            <section className="py-24 px-6 lg:px-12 bg-[#050A14]">
                <div className="container mx-auto text-center">
                    <p className="text-sm font-bold text-brand-muted uppercase tracking-widest mb-10">
                        Key Development Finance Institutions
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {data.keyDFIs?.map((dfi: string, i: number) => (
                            <span
                                key={i}
                                className="px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.02] text-gray-400 text-sm font-medium hover:bg-white/10 hover:text-white transition-colors cursor-default select-none"
                            >
                                {dfi}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- LOCAL CONTEXT --- */}
            <section className="py-32 px-6 lg:px-12 bg-[#0B1221] border-t border-white/5">
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">

                        {/* Sticky Header */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-32">
                                <h2 className="text-4xl font-display font-bold text-white mb-6 leading-tight">
                                    Regional <br/> <span className="text-blue-400">Expertise</span>
                                </h2>
                                <p className="text-brand-muted text-lg mb-8 leading-relaxed">
                                    We understand the specific requirements, regulatory frameworks, and institutional preferences in each market.
                                </p>
                                <div className="p-6 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5">
                                    <p className="text-sm text-gray-400 italic">
                                        "Different DFIs, different formats, different metrics. We speak every institution's language."
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Detail Points */}
                        <div className="lg:col-span-8 space-y-8">
                            {data.localContext?.map((block: any, idx: number) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    className="p-8 md:p-10 rounded-3xl bg-[#0F172A] border border-white/10 hover:border-blue-400/30 transition-colors relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 blur-[60px] rounded-full group-hover:bg-blue-400/10 transition-colors" />

                                    <h3 className="text-xl md:text-2xl font-bold text-white mb-6 relative z-10">{block.title}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                                        {block.points?.map((pt: string, i: number) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-white/5 group-hover:border-white/10 transition-colors">
                                                <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                                <span className="text-sm text-gray-300">{pt}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- PRICING --- */}
            <section className="py-32 px-6 lg:px-12 bg-[#050A14] border-t border-white/5">
                <div className="container mx-auto max-w-5xl">
                    <div className="text-center mb-16">
                        <div className="inline-block px-3 py-1 mb-4 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-[10px] font-bold tracking-widest text-brand-emerald uppercase">
                            Investment Packages
                        </div>
                        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                            Pricing in {data.currency}
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            All packages include multi-DFI formatting. 5% discount for USDT payment.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Core Package */}
                        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-brand-emerald/30 transition-colors">
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-white mb-2">Core</h3>
                                <p className="text-xs text-gray-500 mb-4">{data.pricing?.core?.description}</p>
                                <div className="text-3xl font-bold text-brand-emerald">{data.pricing?.core?.price}</div>
                            </div>
                        </div>

                        {/* Professional Package - Highlighted */}
                        <div className="p-8 rounded-2xl bg-white/[0.04] border-2 border-brand-emerald/50 relative">
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <span className="bg-brand-emerald text-white text-xs font-semibold px-4 py-1 rounded-full">Most Popular</span>
                            </div>
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-white mb-2">Professional</h3>
                                <p className="text-xs text-gray-500 mb-4">{data.pricing?.professional?.description}</p>
                                <div className="text-3xl font-bold text-brand-emerald">{data.pricing?.professional?.price}</div>
                            </div>
                        </div>

                        {/* Enterprise Package */}
                        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-brand-emerald/30 transition-colors">
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-white mb-2">Enterprise</h3>
                                <p className="text-xs text-gray-500 mb-4">{data.pricing?.enterprise?.description}</p>
                                <div className="text-3xl font-bold text-brand-emerald">{data.pricing?.enterprise?.price}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA --- */}
            <section className="py-24 px-6 lg:px-12 bg-[#0F172A] text-center border-t border-white/5">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-6">Ready to discuss your project?</h2>
                    <p className="text-brand-muted mb-8 text-lg">
                        Start a conversation on WhatsApp for immediate response.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-10 py-4 text-lg rounded-full bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold shadow-xl transition-colors"
                        >
                            <MessageCircle className="w-5 h-5" />
                            WhatsApp Us
                        </a>
                        <Button
                            className="!px-10 !py-4 !text-lg !rounded-full shadow-xl shadow-brand-emerald/20"
                            onClick={() => onNavigate?.('/contact')}
                        >
                            Project Intake Form <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>
            </section>

        </motion.div>
    );
};
