
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { CTASection } from '../../components/CTASection';
import { 
  Check, X, Clock, Mail, FileText, Download, ShieldCheck, 
  TriangleAlert, MessageSquare, ArrowRight, Video, Phone 
} from 'lucide-react';

interface ProcessPageProps {
  onNavigate?: (path: string) => void;
}

// --- LOCAL COMPONENTS ---

const SectionHeading: React.FC<{ children: React.ReactNode, subtitle?: React.ReactNode, className?: string }> = ({ children, subtitle, className = "" }) => (
    <div className={`mb-12 ${className}`}>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">{children}</h2>
        {subtitle && <div className="text-lg text-brand-muted max-w-2xl leading-relaxed">{subtitle}</div>}
    </div>
);

const StepCard: React.FC<{ number: string, title: string, subtitle: string, children: React.ReactNode }> = ({ number, title, subtitle, children }) => (
  <div className="relative pl-8 md:pl-0">
      {/* Mobile Line */}
      <div className="absolute left-3 top-10 bottom-0 w-px bg-white/10 md:hidden" />
      
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 group">
          {/* Number/Marker */}
          <div className="shrink-0 relative z-10">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-[#0F172A] border border-white/10 flex items-center justify-center text-xl md:text-2xl font-bold text-brand-emerald shadow-[0_0_30px_rgba(44,138,91,0.1)] group-hover:shadow-[0_0_30px_rgba(44,138,91,0.3)] group-hover:border-brand-emerald/50 transition-all duration-500">
                  {number}
              </div>
          </div>

          {/* Content */}
          <div className="flex-1 pb-16 md:pb-24 border-b border-white/5 last:border-0">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{title}</h3>
              <p className="text-brand-emerald font-mono text-sm uppercase tracking-widest mb-6">{subtitle}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed">
                  {children}
              </div>
          </div>
      </div>
  </div>
);

const TimelineBar: React.FC<{ label: string, duration: string, width: string, color: string }> = ({ label, duration, width, color }) => (
    <div className="mb-6 last:mb-0">
        <div className="flex justify-between text-sm mb-2 text-gray-300">
            <span className="font-bold">{label}</span>
            <span className="font-mono text-xs opacity-70">{duration}</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full ${color} rounded-full`}
            />
        </div>
    </div>
);

// --- MAIN PAGE ---

const ProcessPage: React.FC<ProcessPageProps> = ({ onNavigate }) => {
  // Ensure scroll to top on mount
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-brand-navy text-brand-text font-sans selection:bg-brand-emerald selection:text-brand-navy">
      <Navbar onNavigate={onNavigate} />
      
      <main className="pt-32">
        
        {/* --- HERO SECTION --- */}
        <section className="relative px-6 lg:px-12 mb-24 md:mb-32">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-emerald/5 blur-[150px] rounded-full pointer-events-none" />
            
            <div className="container mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald">Workflow</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight leading-[1.1]">
                        How We Work
                    </h1>
                    <p className="text-xl text-brand-muted max-w-2xl leading-relaxed mb-10 font-light">
                        Async-first. Documentation-driven. Quality-focused.<br/>
                        <span className="text-white font-medium">No discovery calls. No scope creep.</span> Clear communication at every step.
                    </p>
                </motion.div>
            </div>
        </section>

        {/* --- WHY ASYNC (COMPARISON) --- */}
        <section className="px-6 lg:px-12 mb-32">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
                    
                    {/* Traditional */}
                    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                        <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Traditional Consulting
                        </h3>
                        <ul className="space-y-4 mb-8">
                            {['Discovery call (1 hour)', 'Follow-up call (30 min)', 'Weekly progress calls', 'Multiple review meetings', 'Final presentation (1 hour)'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-500 line-through decoration-gray-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <div className="pt-6 border-t border-white/5 text-red-400/80 text-sm">
                            = 10+ hours of meetings that don't produce deliverables
                        </div>
                    </div>

                    {/* JASPER */}
                    <div className="p-8 rounded-3xl bg-[#0F172A] border border-brand-emerald/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-emerald/10 blur-[80px] rounded-full pointer-events-none" />
                        
                        <h3 className="text-brand-emerald font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-brand-emerald" /> JASPER Approach
                        </h3>
                        <ul className="space-y-4 mb-8 relative z-10">
                            {[
                                'Structured intake form (captures everything)',
                                'Written proposals (clear, referenceable)',
                                'Milestone updates (documented progress)',
                                'Async feedback (thoughtful, not reactive)'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-white">
                                    <Check className="w-4 h-4 text-brand-emerald shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <div className="pt-6 border-t border-white/10 text-white font-medium text-sm relative z-10">
                            = All time spent on actual work. Faster turnaround.
                        </div>
                    </div>

                </div>
            </div>
        </section>

        {/* --- 5-STEP PROCESS --- */}
        <section className="py-32 px-6 lg:px-12 bg-[#0B1221] border-y border-white/5 relative overflow-hidden">
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />
             
             <div className="container mx-auto max-w-5xl relative z-10">
                <SectionHeading subtitle="From first contact to final file delivery.">
                    The 5-Step Process
                </SectionHeading>

                <div className="space-y-4">
                    
                    {/* STEP 1 */}
                    <StepCard number="01" title="Inquiry" subtitle="No Commitment">
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                            <h4 className="font-bold text-white mb-2">What Happens</h4>
                            <p className="text-gray-400 mb-2">You email <span className="text-white">models@jasperfinance.org</span> with:</p>
                            <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                                <li>Brief project description</li>
                                <li>Funding amount sought</li>
                                <li>Target DFI (if known)</li>
                            </ul>
                        </div>
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                            <h4 className="font-bold text-white mb-2">We Respond</h4>
                            <p className="text-gray-400 mb-4">Within 48 hours with confirmation of fit or honest decline.</p>
                            <div className="flex items-center gap-2 text-xs text-brand-emerald font-mono uppercase border-t border-white/10 pt-3">
                                <Mail className="w-3 h-3" /> No fees yet
                            </div>
                        </div>
                    </StepCard>

                    {/* STEP 2 */}
                    <StepCard number="02" title="Intake" subtitle="Critical Step">
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                            <h4 className="font-bold text-white mb-2">You Provide</h4>
                            <p className="text-gray-400 mb-2">Complete our structured intake form:</p>
                            <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                                <li>Detailed project info</li>
                                <li>Historical financials (if any)</li>
                                <li>CAPEX/Revenue assumptions</li>
                                <li>Team background</li>
                            </ul>
                        </div>
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                            <h4 className="font-bold text-white mb-2">Why It Matters</h4>
                            <p className="text-gray-400 mb-4">
                                Good intake = good output. We won't begin until we have what we need.
                            </p>
                            <div className="flex items-center gap-2 text-xs text-orange-400 font-mono uppercase border-t border-white/10 pt-3">
                                <Clock className="w-3 h-3" /> 2-4 Hours to complete
                            </div>
                        </div>
                    </StepCard>

                    {/* STEP 3 */}
                    <StepCard number="03" title="Proposal" subtitle="Fixed Price">
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                            <h4 className="font-bold text-white mb-2">We Send</h4>
                            <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                                <li>Fixed-price proposal</li>
                                <li>Recommended package</li>
                                <li>Specific deliverables list</li>
                                <li>Timeline with milestones</li>
                            </ul>
                        </div>
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                            <h4 className="font-bold text-white mb-2">No Negotiation</h4>
                            <p className="text-gray-400 mb-4">
                                Price is fixed for defined scope. Want more? Pay more. Want less? We adjust scope.
                            </p>
                            <div className="flex items-center gap-2 text-xs text-brand-emerald font-mono uppercase border-t border-white/10 pt-3">
                                <FileText className="w-3 h-3" /> Sent in 24-48h
                            </div>
                        </div>
                    </StepCard>

                     {/* STEP 4 */}
                     <StepCard number="04" title="Production" subtitle="Deep Work">
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                            <h4 className="font-bold text-white mb-2">The Work</h4>
                            <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                                <li>Assumptions locked (Week 1-2)</li>
                                <li>Model structure built (Week 2-3)</li>
                                <li>Draft ready for review (Week 3-4+)</li>
                            </ul>
                        </div>
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                            <h4 className="font-bold text-white mb-2">Communication</h4>
                            <p className="text-gray-400 mb-4">
                                Structured updates via email. No status calls. 
                            </p>
                            <div className="flex items-center gap-2 text-xs text-brand-emerald font-mono uppercase border-t border-white/10 pt-3">
                                <MessageSquare className="w-3 h-3" /> 50% Deposit Starts Work
                            </div>
                        </div>
                    </StepCard>

                    {/* STEP 5 */}
                    <StepCard number="05" title="Delivery" subtitle="Final Handoff">
                         <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                            <h4 className="font-bold text-white mb-2">Draft & Revision</h4>
                            <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2">
                                <li>Watermarked files for review</li>
                                <li>3-5 day review period</li>
                                <li>2-3 revision rounds included</li>
                            </ul>
                        </div>
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                            <h4 className="font-bold text-white mb-2">Final Files</h4>
                            <p className="text-gray-400 mb-4">
                                Clean, unlocked, unwatermarked files released upon final payment.
                            </p>
                            <div className="flex items-center gap-2 text-xs text-brand-emerald font-mono uppercase border-t border-white/10 pt-3">
                                <Download className="w-3 h-3" /> Ownership Transfer
                            </div>
                        </div>
                    </StepCard>

                </div>
             </div>
        </section>

        {/* --- TIMELINE & COMMS --- */}
        <section className="px-6 lg:px-12 py-32 bg-[#050A14]">
             <div className="container mx-auto">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                     
                     {/* Timeline */}
                     <div>
                        <h3 className="text-2xl font-display font-bold text-white mb-8">Typical Timelines</h3>
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                            <TimelineBar label="Inquiry to Intake" duration="1-3 Days" width="10%" color="bg-gray-500" />
                            <TimelineBar label="Intake Completion" duration="Client Dependent" width="20%" color="bg-gray-500" />
                            <TimelineBar label="Proposal" duration="24-48 Hours" width="5%" color="bg-gray-500" />
                            <div className="my-6 border-t border-white/10" />
                            <TimelineBar label="Growth Package" duration="3-4 Weeks" width="40%" color="bg-yellow-500" />
                            <TimelineBar label="Institutional Package" duration="4-6 Weeks" width="70%" color="bg-brand-emerald" />
                            <TimelineBar label="Infrastructure Package" duration="6-8 Weeks" width="100%" color="bg-blue-500" />
                        </div>
                        <p className="mt-6 text-sm text-brand-muted">
                            Total: 5-12 weeks from first contact to final delivery, depending on package and client responsiveness.
                        </p>
                     </div>

                     {/* Communication */}
                     <div>
                        <h3 className="text-2xl font-display font-bold text-white mb-8">Communication Standards</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                            <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/5">
                                <div className="text-xs font-bold text-brand-emerald uppercase tracking-widest mb-4">Channels</div>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-white text-sm">
                                        <Mail className="w-4 h-4 text-brand-emerald" /> Email (Primary)
                                    </li>
                                    <li className="flex items-center gap-3 text-white text-sm">
                                        <ShieldCheck className="w-4 h-4 text-brand-emerald" /> Secure File Share
                                    </li>
                                </ul>
                            </div>
                            <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/5">
                                <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4">Not Offered</div>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-gray-500 text-sm">
                                        <Phone className="w-4 h-4" /> Phone Calls
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-500 text-sm">
                                        <Video className="w-4 h-4" /> Zoom Meetings
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                            <h4 className="font-bold text-white mb-2">Our Commitments</h4>
                            <ul className="space-y-2 text-sm text-gray-400 mb-6">
                                <li>• Respond to emails within 48 hours</li>
                                <li>• Provide proactive milestone updates</li>
                                <li>• Document all decisions in writing</li>
                            </ul>
                             <h4 className="font-bold text-white mb-2">Your Commitments</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>• Respond to questions within 72 hours</li>
                                <li>• Provide requested info promptly</li>
                                <li>• Review drafts within 5 days</li>
                            </ul>
                        </div>
                     </div>

                 </div>
             </div>
        </section>

        {/* --- RISKS & MITIGATION --- */}
        <section className="px-6 lg:px-12 mb-32">
            <div className="container mx-auto">
                 <div className="p-8 lg:p-12 rounded-3xl bg-red-500/5 border border-red-500/10">
                     <div className="flex items-center gap-3 mb-8">
                         <TriangleAlert className="w-6 h-6 text-red-400" />
                         <h3 className="text-2xl font-bold text-white">What Can Go Wrong?</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                         {[
                             { title: "Incomplete Intake", desc: "Timeline delayed until information received." },
                             { title: "Scope Creep", desc: "Proposal revised, additional fees apply." },
                             { title: "Slow Response", desc: "Timeline extends proportionally." },
                             { title: "Surprise Data", desc: "Significant changes may require rework fees." }
                         ].map((risk, i) => (
                             <div key={i}>
                                 <h4 className="text-red-200 font-bold mb-2">{risk.title}</h4>
                                 <p className="text-sm text-red-200/60 leading-relaxed">{risk.desc}</p>
                             </div>
                         ))}
                     </div>
                 </div>
            </div>
        </section>

        {/* --- DELIVERABLES & CTA --- */}
        <section className="px-6 lg:px-12 mb-32">
            <div className="container mx-auto">
                <div className="flex flex-col lg:flex-row gap-12 bg-[#1E293B] rounded-3xl p-8 lg:p-16 border border-white/5">
                    <div className="lg:w-1/2">
                        <h2 className="text-3xl font-display font-bold text-white mb-6">What You Receive</h2>
                        <ul className="space-y-4">
                             {[
                                 'Financial Model (.xlsx) - Fully Functional',
                                 'Business Plan (.pdf) - Print Ready',
                                 'Investment Memo (.pdf) - Executive Summary',
                                 'Assumption Book (.pdf) - Documentation',
                             ].map((item, i) => (
                                 <li key={i} className="flex items-center gap-3 text-lg text-gray-300">
                                     <Download className="w-5 h-5 text-brand-emerald" />
                                     {item}
                                 </li>
                             ))}
                        </ul>
                        <div className="mt-8 pt-8 border-t border-white/10">
                            <h4 className="font-bold text-white mb-2">Usage Rights</h4>
                            <p className="text-sm text-gray-400">
                                You own the deliverables. No usage restrictions. No attribution required.
                            </p>
                        </div>
                    </div>
                    
                    <div className="lg:w-1/2 flex flex-col justify-center items-start lg:items-end lg:text-right">
                        <h2 className="text-3xl font-display font-bold text-white mb-4">Ready to Begin?</h2>
                        <p className="text-brand-muted mb-8 text-lg max-w-sm">
                            Start with an email. No commitment required. We'll let you know if your project is a fit.
                        </p>
                        <button
                             onClick={() => onNavigate?.('/contact')}
                             className="inline-flex items-center justify-center px-10 py-5 rounded-full bg-brand-emerald hover:bg-[#257A4F] text-white font-bold text-lg shadow-lg shadow-brand-emerald/20 transition-all"
                        >
                            Start Your Project <ArrowRight className="ml-2 w-5 h-5" />
                        </button>
                        <p className="mt-4 text-sm font-mono text-brand-emerald">models@jasperfinance.org</p>
                    </div>
                </div>
            </div>
        </section>

        <CTASection id="contact" onNavigate={onNavigate} />
      </main>

      <Footer />
    </div>
  );
};

export default ProcessPage;
