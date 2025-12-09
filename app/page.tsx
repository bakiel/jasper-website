'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { LogoTicker } from '../components/LogoTicker';
import { ProblemSection, SolutionSection, FitProcessSection, EdgeSection } from '../components/ContentSections';
import { StatsSection } from '../components/StatsSection';
import { PricingSection } from '../components/PricingSection';
import { SectorsGrid } from '../components/FeaturesGrid';
import { CTASection } from '../components/CTASection';
import { Footer } from '../components/Footer';
import { MethodologyViewer } from '../components/MethodologyViewer';
import { ServicesPage } from '../components/ServicesPage';

interface PageProps {
    onNavigate?: (path: string) => void;
}

const Page: React.FC<PageProps> = ({ onNavigate }) => {
  const [view, setView] = useState<'home' | 'methodology' | 'services'>('home');
  const [initialServicePackage, setInitialServicePackage] = useState<string | undefined>(undefined);

  // Handle ESC key to close overlays
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setView('home');
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const openServices = (pkgName?: string) => {
    if (pkgName) setInitialServicePackage(pkgName);
    setView('services');
  };

  // Helper to handle sector navigation
  const handleSectorClick = (sectorId: string) => {
      if (onNavigate) {
          onNavigate(`/sectors/${sectorId}`);
      } else {
          // Fallback if no router (preview mode)
          console.log("Navigation not available in this context");
      }
  };

  return (
    <div className="min-h-screen flex flex-col antialiased selection:bg-brand-emerald selection:text-brand-navy bg-brand-navy text-brand-text">
      <AnimatePresence>
        {view === 'methodology' && (
          <MethodologyViewer onBack={() => setView('home')} onNavigate={onNavigate} />
        )}
        {view === 'services' && (
          <ServicesPage onBack={() => setView('home')} initialPackage={initialServicePackage} />
        )}
      </AnimatePresence>

      <div className={`${view !== 'home' ? 'hidden' : 'block'}`}>
          <Navbar 
            onLaunchMethodology={() => setView('methodology')} 
            onOpenServices={openServices}
            onNavigate={onNavigate}
          />
          
          <main className="flex-grow z-10 relative flex flex-col w-full">
            <Hero onLaunchMethodology={() => setView('methodology')} onNavigate={onNavigate} />
            <StatsSection />
            <ProblemSection />
            <EdgeSection />
            <SolutionSection id="methodology" onLaunchMethodology={() => setView('methodology')} />
            <PricingSection id="services" onNavigate={onNavigate} />
            
            {/* Pass navigation handler to SectorsGrid */}
            <SectorsGrid id="sectors" onSectorClick={handleSectorClick} />
            
            <LogoTicker />
            <FitProcessSection id="process" />
            <CTASection id="contact" onNavigate={onNavigate} />
          </main>
          
          <Footer />
      </div>
    </div>
  );
};

export default Page;