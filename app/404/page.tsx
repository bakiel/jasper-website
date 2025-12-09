'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { AlertTriangle, Home, ArrowRight, Mail, RefreshCw } from 'lucide-react';
import { Button } from '../../components/Button';

interface NotFoundPageProps {
  onNavigate?: (path: string) => void;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-brand-navy text-brand-text font-sans selection:bg-brand-emerald selection:text-brand-navy">
      <Navbar onNavigate={onNavigate} />

      <main className="pt-32 pb-20 min-h-screen flex items-center justify-center relative overflow-hidden">

        {/* Background Effects */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-500/5 blur-[150px] rounded-full pointer-events-none" />

        {/* Floating Grid Cells */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-16 h-10 border border-white/5 rounded bg-white/[0.01]"
              initial={{
                x: Math.random() * 100 + '%',
                y: Math.random() * 100 + '%',
                opacity: 0
              }}
              animate={{
                y: [null, '-20%'],
                opacity: [0, 0.3, 0]
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: 'linear'
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="max-w-2xl mx-auto text-center">

            {/* Error Cell Visualization - Looping Video Above Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="relative mb-4 flex items-center justify-center"
            >
              {/* Deep background glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-emerald/10 blur-[120px] rounded-full pointer-events-none" />

              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full max-w-xl h-auto mix-blend-screen"
                style={{
                  maskImage: 'radial-gradient(ellipse 80% 80% at center, black 30%, transparent 75%)',
                  WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at center, black 30%, transparent 75%)',
                  opacity: 0.9
                }}
              >
                <source src="/images/misc/404-animation.mp4" type="video/mp4" />
              </video>
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 tracking-tight">
                Page Not Found
              </h1>
              <p className="text-xl text-brand-muted mb-4 leading-relaxed">
                The reference you're looking for doesn't exist.
              </p>
              <p className="text-gray-500 mb-12 font-mono text-sm">
                Error: Cell reference points to non-existent location.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                onClick={() => onNavigate?.('/')}
                className="!px-8 !py-4 !rounded-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Button>

              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
                className="!px-8 !py-4 !rounded-full !border-white/10 hover:!bg-white/5"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </motion.div>

            {/* Help Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-16 pt-8 border-t border-white/5"
            >
              <p className="text-gray-500 text-sm mb-4">
                Think this is an error on our end?
              </p>
              <a
                href="mailto:models@jasperfinance.org"
                className="inline-flex items-center gap-2 text-brand-emerald hover:text-white transition-colors text-sm"
              >
                <Mail className="w-4 h-4" />
                models@jasperfinance.org
                <ArrowRight className="w-3 h-3" />
              </a>
            </motion.div>

            {/* Easter Egg - Spreadsheet Humor */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-12"
            >
              <p className="text-gray-600 text-xs font-mono italic">
                Tip: Unlike this page, our financial models always resolve their references.
              </p>
            </motion.div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;
