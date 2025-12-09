'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { FileText, Shield, Scale, AlertTriangle, Clock, Mail } from 'lucide-react';

interface TermsPageProps {
  onNavigate?: (path: string) => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const LAST_UPDATED = 'December 2025';

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
                <FileText className="w-3 h-3 text-brand-emerald" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald">Legal</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-8 tracking-tight leading-[1.1]">
                Terms of Service
              </h1>
              <p className="text-lg text-brand-muted">
                Last updated: {LAST_UPDATED}
              </p>
            </motion.div>
          </div>
        </section>

        {/* CONTENT */}
        <section className="px-6 lg:px-12">
          <div className="container mx-auto max-w-4xl">
            <div className="prose prose-invert prose-lg max-w-none">

              {/* INTRO */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 mb-12">
                <p className="text-gray-300 leading-relaxed m-0">
                  These terms govern your engagement with JASPER Financial Architecture for financial modelling and related services. By engaging our services, you agree to these terms. Please read them carefully.
                </p>
              </div>

              {/* SECTION 1 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-brand-emerald" />
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">1. Scope of Services</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p><strong className="text-white">1.1</strong> JASPER provides financial modelling, business plan preparation, and investment documentation services for projects seeking development finance.</p>
                  <p><strong className="text-white">1.2</strong> Specific deliverables are defined in the written proposal provided before engagement. Only items explicitly listed in the proposal are included.</p>
                  <p><strong className="text-white">1.3</strong> We do not provide legal, tax, or investment advice. Our models and documents are tools for your use; you remain responsible for their accuracy in your specific context.</p>
                </div>
              </div>

              {/* SECTION 2 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-brand-emerald" />
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">2. Engagement Process</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p><strong className="text-white">2.1 Inquiry:</strong> Initial contact establishes whether your project is a potential fit. No fees apply at this stage.</p>
                  <p><strong className="text-white">2.2 Intake:</strong> You complete our structured intake form with project details. Incomplete intake delays project start.</p>
                  <p><strong className="text-white">2.3 Proposal:</strong> We provide a fixed-price proposal with defined scope, deliverables, and timeline. Prices are fixed for the defined scope.</p>
                  <p><strong className="text-white">2.4 Acceptance:</strong> Engagement begins upon your acceptance of the proposal and payment of the deposit.</p>
                </div>
              </div>

              {/* SECTION 3 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
                    <span className="text-brand-emerald font-bold">$</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">3. Fees & Payment</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p><strong className="text-white">3.1 Fixed Pricing:</strong> All engagements are fixed-price for defined scope. We don't bill hourly.</p>
                  <p><strong className="text-white">3.2 Payment Terms:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>50% deposit required to begin work</li>
                    <li>50% balance due upon draft delivery</li>
                    <li>Final files released after full payment</li>
                  </ul>
                  <p><strong className="text-white">3.3 Payment Methods:</strong> We accept cryptocurrency (USDC, USDT, BTC, ETH via Binance) and traditional transfers (Wise, Payoneer, SA bank transfer).</p>
                  <p><strong className="text-white">3.4 Currency:</strong> Prices are quoted in USD unless otherwise specified. Exchange rate risk is borne by the client for non-USD payments.</p>
                  <p><strong className="text-white">3.5 No Refunds:</strong> Deposits are non-refundable once work begins. If you cancel after deposit but before work starts, we'll discuss a partial refund at our discretion.</p>
                </div>
              </div>

              {/* SECTION 4 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-brand-emerald" />
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">4. Deliverables & Revisions</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p><strong className="text-white">4.1 Draft Delivery:</strong> Deliverables are first provided as watermarked draft files for your review.</p>
                  <p><strong className="text-white">4.2 Review Period:</strong> You have 3-5 business days to review drafts and provide consolidated feedback.</p>
                  <p><strong className="text-white">4.3 Revisions:</strong> 2-3 revision rounds are included, depending on package. Revisions address issues within the original scope only.</p>
                  <p><strong className="text-white">4.4 Scope Changes:</strong> Requests outside original scope require a change order with additional fees.</p>
                  <p><strong className="text-white">4.5 Final Delivery:</strong> Clean, unwatermarked files are released upon receipt of final payment.</p>
                </div>
              </div>

              {/* SECTION 5 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-brand-emerald" />
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">5. Intellectual Property</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p><strong className="text-white">5.1 Your Ownership:</strong> Upon full payment, you own all deliverables. No usage restrictions, no attribution required, no ongoing fees.</p>
                  <p><strong className="text-white">5.2 Our Methodology:</strong> We retain ownership of our proprietary methodologies, templates, and systems. You receive the output, not our underlying IP.</p>
                  <p><strong className="text-white">5.3 Confidentiality:</strong> We treat all client information as confidential. We will not share your project details with third parties without consent.</p>
                  <p><strong className="text-white">5.4 Portfolio Rights:</strong> We may reference the general nature of work completed (sector, scale) without identifying you, unless you object in writing.</p>
                </div>
              </div>

              {/* SECTION 6 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-brand-emerald" />
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">6. Communication</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p><strong className="text-white">6.1 Primary Channel:</strong> Email is our primary communication channel. We do not offer phone calls or video meetings.</p>
                  <p><strong className="text-white">6.2 Response Time:</strong> We aim to respond to emails within 48 hours during business days.</p>
                  <p><strong className="text-white">6.3 Your Responsibility:</strong> Timely responses to our questions are essential. Delays on your end extend project timelines proportionally.</p>
                </div>
              </div>

              {/* SECTION 7 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">7. Limitations & Disclaimers</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p><strong className="text-white">7.1 No Guarantee of Funding:</strong> We provide models and documents to support your funding applications. We do not guarantee that you will secure funding.</p>
                  <p><strong className="text-white">7.2 Accuracy Depends on Inputs:</strong> Model outputs depend on the accuracy of information you provide. "Garbage in, garbage out" applies.</p>
                  <p><strong className="text-white">7.3 Limitation of Liability:</strong> Our liability is limited to the fees paid for the specific engagement. We are not liable for consequential, indirect, or incidental damages.</p>
                  <p><strong className="text-white">7.4 Independent Review:</strong> You should have deliverables reviewed by your own advisors before relying on them for investment decisions.</p>
                </div>
              </div>

              {/* SECTION 8 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-brand-emerald" />
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">8. Termination</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p><strong className="text-white">8.1 By You:</strong> You may terminate at any time. Fees paid for work completed are non-refundable.</p>
                  <p><strong className="text-white">8.2 By Us:</strong> We may terminate if you fail to provide required information, become unresponsive, or breach these terms. Partial refunds at our discretion.</p>
                  <p><strong className="text-white">8.3 Effect:</strong> Upon termination, you receive work completed to date (in draft form if balance unpaid). Our confidentiality obligations continue.</p>
                </div>
              </div>

              {/* SECTION 9 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-brand-emerald" />
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">9. Governing Law</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p><strong className="text-white">9.1</strong> These terms are governed by the laws of South Africa.</p>
                  <p><strong className="text-white">9.2</strong> Any disputes shall be resolved through arbitration in Johannesburg, South Africa.</p>
                </div>
              </div>

              {/* CONTACT */}
              <div className="p-8 rounded-2xl bg-[#0F172A] border border-brand-emerald/20">
                <h3 className="text-xl font-bold text-white mb-4">Questions About These Terms?</h3>
                <p className="text-gray-400 mb-4">
                  If you have questions about these terms before engaging our services, please email us.
                </p>
                <a
                  href="mailto:models@jasperfinance.org"
                  className="inline-flex items-center gap-2 text-brand-emerald hover:text-white transition-colors font-mono"
                >
                  <Mail className="w-4 h-4" />
                  models@jasperfinance.org
                </a>
              </div>

            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default TermsPage;
