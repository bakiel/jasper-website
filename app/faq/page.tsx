'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { CTASection } from '../../components/CTASection';
import { ChevronDown, MessageSquare, Clock, DollarSign, Shield, Globe, Zap } from 'lucide-react';

interface FAQPageProps {
  onNavigate?: (path: string) => void;
}

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
  category: string;
}

const FAQPage: React.FC<FAQPageProps> = ({ onNavigate }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const CATEGORIES = [
    { id: 'all', label: 'All Questions', icon: MessageSquare },
    { id: 'process', label: 'Process', icon: Clock },
    { id: 'pricing', label: 'Pricing & Payment', icon: DollarSign },
    { id: 'scope', label: 'Scope & Sectors', icon: Globe },
    { id: 'trust', label: 'Trust & Security', icon: Shield },
  ];

  const FAQ_DATA: FAQItem[] = [
    // PROCESS
    {
      category: 'process',
      question: 'Why no phone calls or video meetings?',
      answer: `Written communication produces better outcomes for complex financial work:

• Documentation: Every decision is recorded and referenceable
• Precision: Written proposals eliminate ambiguity
• Time: All hours go to actual work, not meetings
• Quality: Thoughtful responses instead of reactive answers
• Async: Work happens across time zones without scheduling friction

We've found that clients who engage well in writing are also the ones who provide the detailed information needed for accurate models.`
    },
    {
      category: 'process',
      question: 'How long does a typical project take?',
      answer: `Timeline depends on package and complexity:

• Growth Package: 3-4 weeks
• Institutional Package: 4-6 weeks
• Infrastructure Package: 6-8 weeks

These assume prompt client responses. Delays in providing information extend timelines proportionally. Total from first contact to final delivery: 5-12 weeks.`
    },
    {
      category: 'process',
      question: 'What information do I need to provide?',
      answer: `Our structured intake captures everything we need:

• Project description and location
• Historical financials (if any)
• CAPEX estimates or quotes
• Revenue assumptions
• Team background
• Target DFI and timeline

Good intake = good output. We won't start until we have what we need.`
    },
    {
      category: 'process',
      question: 'How many revision rounds are included?',
      answer: `All packages include 2-3 revision rounds:

• Draft delivery with watermarked files
• 3-5 day review period for your feedback
• Revisions implemented
• Final files released on payment

Major scope changes discovered mid-project may require additional fees.`
    },

    // PRICING
    {
      category: 'pricing',
      question: 'Why is JASPER more expensive than template services?',
      answer: `Because we deliver different value:

Template services ($500-$2,000):
• Generic spreadsheets you customise yourself
• No DFI-specific formatting
• No sector expertise
• You own the errors

JASPER ($12,000-$45,000+):
• Custom-built for your project
• DFI-ready from day one
• Sector-specific modelling
• Professional documentation
• We stand behind the work

Our models pass due diligence. Templates rarely do.`
    },
    {
      category: 'pricing',
      question: 'Do you accept cryptocurrency?',
      answer: `Yes - crypto is our preferred payment method.

We accept:
• USDC (preferred)
• USDT
• BTC
• ETH

All via Binance. This eliminates international wire fees, banking delays, and currency conversion issues.

Traditional options (Wise, Payoneer, SA bank transfer) are also available.`
    },
    {
      category: 'pricing',
      question: 'What are your payment terms?',
      answer: `Standard terms:

• 50% deposit to begin work
• 50% balance on draft delivery
• Final files released after full payment

For Infrastructure packages ($75M+ projects), we may offer milestone-based terms.`
    },
    {
      category: 'pricing',
      question: 'Can you work within my budget?',
      answer: `We don't negotiate on price - we adjust scope.

If you have $15K and need a $25K package, we can:
• Reduce the number of DFI versions
• Simplify the model structure
• Limit revision rounds

What we won't do: deliver a $25K scope for $15K. Quality has a cost.`
    },

    // SCOPE
    {
      category: 'scope',
      question: 'What sectors do you work in?',
      answer: `We specialise in sectors where DFI capital flows:

• Renewable Energy (solar, wind, biogas, storage)
• Data Centres & Digital Infrastructure
• Agri-Industrial (processing, value chains)
• Climate Finance (carbon, green bonds)
• Technology Platforms (fintech, AgTech, SaaS)
• Manufacturing & Processing

We don't work in: real estate, mining, oil & gas, shipping, aviation, hospitality, healthcare, or financial services.`
    },
    {
      category: 'scope',
      question: 'Why don\'t you model mining projects?',
      answer: `Two reasons:

1. Technical: Mining requires specialised expertise in geology, reserve estimation, and commodity hedging that we haven't developed.

2. Philosophy: Our focus is on beneficiation and value-addition - projects that build capacity rather than extract resources. We model what stays in the country, not what leaves.

We can refer you to mining specialists if needed.`
    },
    {
      category: 'scope',
      question: 'Can you help with projects outside Africa?',
      answer: `Absolutely. We work globally.

Our models have been formatted for:
• IFC, AfDB, ADB, EBRD, DFC
• Regional development banks
• Climate funds (GCF, SEFA, GEF)

Geography doesn't limit us. What matters is: Is it a DFI-fundable project in a sector we know?`
    },
    {
      category: 'scope',
      question: 'What if my project is unusual or complex?',
      answer: `That's often when we're most valuable.

Complexity we've handled:
• 1,300 MW integrated renewable complex
• 700 MW hyperscale data centre
• Multi-phase construction projects
• Multiple revenue streams
• Complex capital structures (debt + equity + grant)
• Multi-currency operations
• Concession and PPP structures
• 35+ sheet integrated models

Tell us about your project. We'll confirm if it's in our wheelhouse.`
    },

    // TRUST
    {
      category: 'trust',
      question: 'How do I know you\'re legitimate?',
      answer: `Valid concern. Here's our answer:

We don't hide behind logos or fake testimonials. Our work speaks for itself:
• 1,308+ financial models built
• Projects up to R508.6M
• 1,300 MW renewable infrastructure designed (not just modelled)
• Real engineering background

We'll provide references on request for serious inquiries. But we don't publish case studies - our clients' projects are confidential.`
    },
    {
      category: 'trust',
      question: 'Who owns the deliverables?',
      answer: `You do. Completely.

• No usage restrictions
• No attribution required
• No ongoing fees
• No licensing

Once paid, the files are yours to use however you want. We don't retain rights or require credit.`
    },
    {
      category: 'trust',
      question: 'What if you can\'t deliver what you promised?',
      answer: `Two protections:

1. Fixed scope: We define exactly what's included before you pay. No ambiguity.

2. Draft review: You see watermarked files before final payment. If something's fundamentally wrong, we address it.

We've never failed to deliver on agreed scope. Our reputation depends on it.`
    },
    {
      category: 'trust',
      question: 'Why async-first? Is this a scam?',
      answer: `Fair question. Here's the reality:

Async-first is a deliberate business model choice, not evasion:
• We work with global clients across time zones
• Written communication creates better documentation
• All time goes to deliverables, not meetings
• We've found this produces better outcomes

Scammers want your money quickly with minimal accountability. We want detailed intake, fixed scope, milestone payments, and documented deliverables. That's the opposite of a scam.`
    },
  ];

  const filteredFAQs = activeCategory === 'all'
    ? FAQ_DATA
    : FAQ_DATA.filter(faq => faq.category === activeCategory);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-brand-navy text-brand-text font-sans selection:bg-brand-emerald selection:text-brand-navy">
      <Navbar onNavigate={onNavigate} />

      <main className="pt-32 pb-20">

        {/* HERO */}
        <section className="relative px-6 lg:px-12 mb-16">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-emerald/5 blur-[150px] rounded-full pointer-events-none" />

          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald">FAQ</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight leading-[1.1]">
                Questions?<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald to-white">Answered.</span>
              </h1>
              <p className="text-xl text-brand-muted max-w-2xl leading-relaxed">
                Everything you need to know about how we work, what we charge, and why we do things differently.
              </p>
            </motion.div>
          </div>
        </section>

        {/* CATEGORY FILTER */}
        <section className="px-6 lg:px-12 mb-12">
          <div className="container mx-auto max-w-4xl">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setOpenIndex(null);
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeCategory === cat.id
                      ? 'bg-brand-emerald text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section className="px-6 lg:px-12 mb-20">
          <div className="container mx-auto max-w-4xl">
            <div className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left group"
                  >
                    <span className="text-lg font-semibold text-white group-hover:text-brand-emerald transition-colors pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-brand-emerald shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6">
                          <div className="pt-2 border-t border-white/5">
                            <pre className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap font-sans mt-4">
                              {faq.answer}
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* STILL HAVE QUESTIONS */}
        <section className="px-6 lg:px-12 mb-20">
          <div className="container mx-auto max-w-2xl">
            <div className="p-8 rounded-3xl bg-[#0F172A] border border-brand-emerald/20 text-center">
              <Zap className="w-10 h-10 text-brand-emerald mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Still have questions?</h3>
              <p className="text-brand-muted mb-6">
                We'd rather answer your questions than have you guess. Reach out.
              </p>
              <a
                href="mailto:models@jasperfinance.org"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-emerald hover:bg-[#257A4F] text-white font-bold transition-all"
              >
                <MessageSquare className="w-5 h-5" />
                Email Us
              </a>
            </div>
          </div>
        </section>

        <CTASection id="contact" />

      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
