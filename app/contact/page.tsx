'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import {
  Mail, Send, Check, X, Clock, DollarSign, Building2,
  FileText, AlertTriangle, Gem, CreditCard, ArrowRight,
  Zap, Cpu, Sprout, Leaf, Factory, Code
} from 'lucide-react';

// API Configuration
const API_URL = import.meta.env.PROD
  ? 'https://api.jasperfinance.org'
  : 'http://localhost:3000';

interface ContactPageProps {
  onNavigate?: (path: string) => void;
}

interface SubmitResponse {
  success: boolean;
  message: string;
  reference?: string;
  errors?: Record<string, string>;
}

const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    sector: '',
    fundingAmount: '',
    fundingStage: '',
    targetDFI: '',
    message: '',
    phone: '',
    timeline: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    try {
      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: SubmitResponse = await response.json();

      if (data.success) {
        setReference(data.reference || null);
        setIsSubmitted(true);
      } else {
        if (data.errors) {
          setFieldErrors(data.errors);
        }
        setSubmitError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError('Unable to connect. Please email us directly at models@jasperfinance.org');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Qualification criteria
  const QUALIFICATIONS = {
    should: [
      { icon: DollarSign, text: 'Seeking $5M+ in development finance' },
      { icon: Building2, text: 'Targeting a DFI (IFC, AfDB, ADB, EBRD, IDC, etc.)' },
      { icon: Zap, text: 'In a sector we serve (RE, Data Centres, Agri, Climate, Tech, Manufacturing)' },
      { icon: FileText, text: 'Ready for financial modelling (basic feasibility known)' },
      { icon: Clock, text: 'Timeline of 4+ weeks (no rush jobs)' },
    ],
    shouldNot: [
      { text: 'Seeking traditional bank loans under $1M' },
      { text: 'Need visa or immigration documentation' },
      { text: 'Looking for template-based solutions' },
      { text: 'In real estate, mining, oil & gas, or hospitality' },
    ]
  };

  const SECTORS = [
    { value: 'renewable-energy', label: 'Renewable Energy', icon: Zap },
    { value: 'data-centres', label: 'Data Centres', icon: Cpu },
    { value: 'agri-industrial', label: 'Agri-Industrial', icon: Sprout },
    { value: 'climate-finance', label: 'Climate Finance', icon: Leaf },
    { value: 'technology', label: 'Technology', icon: Code },
    { value: 'manufacturing', label: 'Manufacturing', icon: Factory },
    { value: 'other', label: 'Other', icon: FileText },
  ];

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-brand-navy text-brand-text font-sans">
        <Navbar onNavigate={onNavigate} />
        <main className="pt-32 pb-20 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md mx-auto px-6"
          >
            <div className="w-20 h-20 rounded-full bg-brand-emerald/20 flex items-center justify-center mx-auto mb-8">
              <Check className="w-10 h-10 text-brand-emerald" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Inquiry Received</h1>
            {reference && (
              <p className="text-brand-emerald font-mono text-sm mb-4">
                Reference: {reference}
              </p>
            )}
            <p className="text-brand-muted mb-8">
              We'll review your project and respond within 24 hours with confirmation of fit or honest decline.
            </p>
            <button
              onClick={() => onNavigate?.('/')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white font-semibold"
            >
              Back to Home <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-navy text-brand-text font-sans selection:bg-brand-emerald selection:text-brand-navy">
      <Navbar onNavigate={onNavigate} />

      <main className="pt-32 pb-20">

        {/* HERO */}
        <section className="relative px-6 lg:px-12 mb-16">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-emerald/5 blur-[150px] rounded-full pointer-events-none" />

          <div className="container mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald">Start a Project</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight leading-[1.1]">
                Let's Talk About<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald to-white">Your Project.</span>
              </h1>
              <p className="text-xl text-brand-muted max-w-2xl leading-relaxed">
                Before we begin, let's make sure we're a good fit.
                <span className="text-white"> We'd rather refer you elsewhere than waste your time.</span>
              </p>
            </motion.div>
          </div>
        </section>

        {/* QUALIFICATION SECTION */}
        <section className="px-6 lg:px-12 mb-20">
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Should Be */}
              <div className="p-8 rounded-3xl bg-[#0F172A] border border-brand-emerald/20">
                <h3 className="text-brand-emerald font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                  <Check className="w-4 h-4" /> Your Project Should Be
                </h3>
                <ul className="space-y-4">
                  {QUALIFICATIONS.should.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white">
                      <item.icon className="w-5 h-5 text-brand-emerald shrink-0 mt-0.5" />
                      <span className="text-sm">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Should Not Be */}
              <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                <h3 className="text-red-400 font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                  <X className="w-4 h-4" /> We're Not Right If You
                </h3>
                <ul className="space-y-4">
                  {QUALIFICATIONS.shouldNot.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-400">
                      <X className="w-4 h-4 text-red-400/50 shrink-0 mt-0.5" />
                      <span className="text-sm">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* FORM SECTION */}
        <section className="px-6 lg:px-12 mb-20">
          <div className="container mx-auto max-w-3xl">
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 lg:p-12 rounded-3xl bg-[#0B1221] border border-white/5"
            >
              <h2 className="text-2xl font-bold text-white mb-8">Project Inquiry</h2>

              <div className="space-y-6">

                {/* Error Banner */}
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 text-sm font-medium">{submitError}</p>
                      <a
                        href="mailto:models@jasperfinance.org"
                        className="text-red-400/70 text-xs hover:text-red-400 underline"
                      >
                        Email us directly
                      </a>
                    </div>
                  </motion.div>
                )}

                {/* Name & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Your Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${
                        fieldErrors.name
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
                          : 'border-white/10 focus:border-brand-emerald focus:ring-brand-emerald'
                      }`}
                      placeholder="Full name"
                    />
                    {fieldErrors.name && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${
                        fieldErrors.email
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
                          : 'border-white/10 focus:border-brand-emerald focus:ring-brand-emerald'
                      }`}
                      placeholder="you@company.com"
                    />
                    {fieldErrors.email && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Company & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Company / SPV Name *</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${
                        fieldErrors.company
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
                          : 'border-white/10 focus:border-brand-emerald focus:ring-brand-emerald'
                      }`}
                      placeholder="Company name"
                    />
                    {fieldErrors.company && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.company}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Phone (Optional)</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-brand-emerald focus:outline-none focus:ring-1 focus:ring-brand-emerald transition-all"
                      placeholder="+27 XX XXX XXXX"
                    />
                  </div>
                </div>

                {/* Sector & Funding Stage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Sector *</label>
                    <select
                      name="sector"
                      value={formData.sector}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white focus:outline-none focus:ring-1 transition-all appearance-none cursor-pointer ${
                        fieldErrors.sector
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
                          : 'border-white/10 focus:border-brand-emerald focus:ring-brand-emerald'
                      }`}
                    >
                      <option value="" className="bg-[#0F172A]">Select sector</option>
                      {SECTORS.map(s => (
                        <option key={s.value} value={s.value} className="bg-[#0F172A]">{s.label}</option>
                      ))}
                    </select>
                    {fieldErrors.sector && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.sector}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Funding Stage *</label>
                    <select
                      name="fundingStage"
                      value={formData.fundingStage}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white focus:outline-none focus:ring-1 transition-all appearance-none cursor-pointer ${
                        fieldErrors.fundingStage
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
                          : 'border-white/10 focus:border-brand-emerald focus:ring-brand-emerald'
                      }`}
                    >
                      <option value="" className="bg-[#0F172A]">Select stage</option>
                      <option value="seed" className="bg-[#0F172A]">Seed / Pre-Revenue</option>
                      <option value="series-a" className="bg-[#0F172A]">Series A</option>
                      <option value="series-b" className="bg-[#0F172A]">Series B</option>
                      <option value="growth" className="bg-[#0F172A]">Growth Stage</option>
                      <option value="expansion" className="bg-[#0F172A]">Expansion</option>
                      <option value="other" className="bg-[#0F172A]">Other</option>
                    </select>
                    {fieldErrors.fundingStage && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.fundingStage}</p>
                    )}
                  </div>
                </div>

                {/* Funding Amount & Target DFI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Funding Amount Sought</label>
                    <select
                      name="fundingAmount"
                      value={formData.fundingAmount}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-brand-emerald focus:outline-none focus:ring-1 focus:ring-brand-emerald transition-all appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-[#0F172A]">Select range</option>
                      <option value="5-15m" className="bg-[#0F172A]">$5M - $15M</option>
                      <option value="15-75m" className="bg-[#0F172A]">$15M - $75M</option>
                      <option value="75-250m" className="bg-[#0F172A]">$75M - $250M</option>
                      <option value="250m+" className="bg-[#0F172A]">$250M+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Target DFI (if known)</label>
                    <input
                      type="text"
                      name="targetDFI"
                      value={formData.targetDFI}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-brand-emerald focus:outline-none focus:ring-1 focus:ring-brand-emerald transition-all"
                      placeholder="e.g., IFC, AfDB, IDC, GCF..."
                    />
                  </div>
                </div>

                {/* Project Description / Message */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Brief Project Description *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all resize-none ${
                      fieldErrors.message
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-brand-emerald focus:ring-brand-emerald'
                    }`}
                    placeholder="What are you building? Where? What stage is the project at?"
                  />
                  {fieldErrors.message && (
                    <p className="text-red-400 text-xs mt-1">{fieldErrors.message}</p>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">When do you need the model?</label>
                  <select
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-brand-emerald focus:outline-none focus:ring-1 focus:ring-brand-emerald transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#0F172A]">Select timeline</option>
                    <option value="4-6weeks" className="bg-[#0F172A]">4-6 weeks</option>
                    <option value="6-8weeks" className="bg-[#0F172A]">6-8 weeks</option>
                    <option value="8-12weeks" className="bg-[#0F172A]">8-12 weeks</option>
                    <option value="flexible" className="bg-[#0F172A]">Flexible / No rush</option>
                  </select>
                </div>

                {/* Disclaimer */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-400 leading-relaxed">
                    This is an inquiry, not a commitment. We'll review your project and respond within 48 hours.
                    If we're not the right fit, we'll tell you honestly and may suggest alternatives.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-brand-emerald hover:bg-[#257A4F] text-white font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-emerald/20"
                >
                  {isSubmitting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      Send Inquiry <Send className="w-5 h-5" />
                    </>
                  )}
                </button>

              </div>
            </motion.form>
          </div>
        </section>

        {/* ALTERNATIVE CONTACT */}
        <section className="px-6 lg:px-12 mb-20">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center">
              <p className="text-brand-muted mb-4">Prefer email?</p>
              <a
                href="mailto:models@jasperfinance.org"
                className="inline-flex items-center gap-2 text-xl text-brand-emerald hover:text-white transition-colors font-mono"
              >
                <Mail className="w-5 h-5" />
                models@jasperfinance.org
              </a>
            </div>
          </div>
        </section>

        {/* PAYMENT INFO */}
        <section className="px-6 lg:px-12">
          <div className="container mx-auto max-w-3xl">
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
              <h3 className="text-lg font-bold text-white mb-6 text-center">Payment Methods</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-brand-emerald font-bold mb-3">
                    <Gem className="w-5 h-5" />
                    <span>CRYPTO (PREFERRED)</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    USDC • USDT • BTC • ETH<br/>
                    <span className="text-xs text-gray-500">via Binance</span>
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-white font-bold mb-3">
                    <CreditCard className="w-5 h-5" />
                    <span>Traditional</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Wise • Payoneer<br/>
                    <span className="text-xs text-gray-500">Bank Transfer (SA)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
