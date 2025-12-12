'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { Shield, Eye, Database, Lock, Globe, UserCheck, Mail, Trash2 } from 'lucide-react';

interface PrivacyPageProps {
  onNavigate?: (path: string) => void;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {

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
                <Shield className="w-3 h-3 text-brand-emerald" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald">Privacy</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-8 tracking-tight leading-[1.1]">
                Privacy Policy
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
                  JASPER Financial Architecture ("we", "us", "our") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you use our services or visit our website.
                </p>
              </div>

              {/* SECTION 1 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
                    <Database className="w-5 h-5 text-brand-emerald" />
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">1. Information We Collect</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p><strong className="text-white">1.1 Information You Provide:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Contact information (name, email, phone, company)</li>
                    <li>Project details submitted through our intake forms</li>
                    <li>Financial data provided for modelling purposes</li>
                    <li>Communication records (emails, messages)</li>
                  </ul>
                  <p><strong className="text-white">1.2 Automatically Collected Information:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>IP address and browser type</li>
                    <li>Pages visited and time spent on our website</li>
                    <li>Referring website or source</li>
                    <li>Device information</li>
                  </ul>
                </div>
              </div>

              {/* SECTION 2 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-brand-emerald" />
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">2. How We Use Your Information</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p><strong className="text-white">2.1</strong> To provide our financial modelling services</p>
                  <p><strong className="text-white">2.2</strong> To communicate with you about your projects</p>
                  <p><strong className="text-white">2.3</strong> To send you relevant updates about our services (with your consent)</p>
                  <p><strong className="text-white">2.4</strong> To improve our website and services</p>
                  <p><strong className="text-white">2.5</strong> To comply with legal obligations</p>
                  <p><strong className="text-white">2.6</strong> To protect against fraud and security threats</p>
                </div>
              </div>

              {/* SECTION 3 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-brand-emerald" />
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">3. Data Security</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p><strong className="text-white">3.1</strong> We implement industry-standard security measures including:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>SSL/TLS encryption for data in transit</li>
                    <li>Encrypted storage for sensitive data</li>
                    <li>Access controls and authentication</li>
                    <li>Regular security audits</li>
                  </ul>
                  <p><strong className="text-white">3.2</strong> While we take reasonable precautions, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.</p>
                </div>
              </div>

              {/* SECTION 4 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-brand-emerald" />
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">4. Information Sharing</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p><strong className="text-white">4.1 We do NOT sell your personal information.</strong></p>
                  <p><strong className="text-white">4.2</strong> We may share information with:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Service providers who assist our operations (hosting, email, analytics)</li>
                    <li>Professional advisors (legal, accounting) under confidentiality agreements</li>
                    <li>Law enforcement when required by law</li>
                  </ul>
                  <p><strong className="text-white">4.3</strong> Any third-party service providers are contractually bound to protect your data.</p>
                </div>
              </div>

              {/* SECTION 5 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-brand-emerald" />
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">5. Your Rights</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p>Depending on your location, you may have the right to:</p>
                  <p><strong className="text-white">5.1 Access:</strong> Request a copy of your personal data</p>
                  <p><strong className="text-white">5.2 Correction:</strong> Request correction of inaccurate data</p>
                  <p><strong className="text-white">5.3 Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</p>
                  <p><strong className="text-white">5.4 Portability:</strong> Request your data in a machine-readable format</p>
                  <p><strong className="text-white">5.5 Objection:</strong> Object to certain processing of your data</p>
                  <p><strong className="text-white">5.6 Withdraw Consent:</strong> Withdraw consent for marketing communications at any time</p>
                </div>
              </div>

              {/* SECTION 6 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-brand-emerald" />
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">6. Data Retention</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p><strong className="text-white">6.1</strong> We retain project data for the duration of our engagement plus 7 years for legal and tax compliance.</p>
                  <p><strong className="text-white">6.2</strong> Marketing contact information is retained until you unsubscribe or request deletion.</p>
                  <p><strong className="text-white">6.3</strong> Website analytics data is retained for 26 months.</p>
                </div>
              </div>

              {/* SECTION 7 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-brand-emerald" />
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">7. International Transfers</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p><strong className="text-white">7.1</strong> JASPER is based in South Africa. Your data may be processed in South Africa and other countries where our service providers operate.</p>
                  <p><strong className="text-white">7.2</strong> We ensure appropriate safeguards are in place for international data transfers in compliance with POPIA and applicable data protection laws.</p>
                </div>
              </div>

              {/* SECTION 8 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-brand-emerald" />
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">8. Cookies & Tracking</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p><strong className="text-white">8.1</strong> We use essential cookies to ensure our website functions properly.</p>
                  <p><strong className="text-white">8.2</strong> We use analytics cookies (Google Analytics) to understand how visitors use our site.</p>
                  <p><strong className="text-white">8.3</strong> You can control cookies through your browser settings. Disabling cookies may affect site functionality.</p>
                </div>
              </div>

              {/* SECTION 9 */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-brand-emerald" />
                  </div>
                  <h2 className="text-2xl font-bold text-white m-0">9. Changes to This Policy</h2>
                </div>

                <div className="space-y-4 text-gray-400">
                  <p><strong className="text-white">9.1</strong> We may update this policy from time to time. The "Last updated" date at the top indicates when changes were made.</p>
                  <p><strong className="text-white">9.2</strong> Continued use of our services after changes constitutes acceptance of the updated policy.</p>
                </div>
              </div>

              {/* CONTACT */}
              <div className="p-8 rounded-2xl bg-[#0F172A] border border-brand-emerald/20">
                <h3 className="text-xl font-bold text-white mb-4">Questions About Privacy?</h3>
                <p className="text-gray-400 mb-4">
                  If you have questions about this privacy policy or want to exercise your data rights, please contact us.
                </p>
                <div className="space-y-2">
                  <a
                    href="mailto:privacy@jasperfinance.org"
                    className="inline-flex items-center gap-2 text-brand-emerald hover:text-white transition-colors font-mono"
                  >
                    <Mail className="w-4 h-4" />
                    privacy@jasperfinance.org
                  </a>
                  <p className="text-gray-500 text-sm">
                    JASPER Financial Architecture<br />
                    Kutlwano Holdings (Pty) Ltd<br />
                    Registration: 2017/103109/07<br />
                    South Africa
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

export default PrivacyPage;
