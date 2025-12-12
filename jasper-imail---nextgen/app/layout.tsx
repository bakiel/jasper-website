import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-jasper-navy text-jasper-text font-sans relative overflow-hidden selection:bg-jasper-emerald/30 selection:text-jasper-glow">
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[140%] h-[1000px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-jasper-emerald/10 via-jasper-navy/80 to-transparent blur-[100px]"></div>
        
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] mask-radar opacity-40">
           <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-0 w-full h-full rounded-full animate-radar-scan">
                <div className="radar-sweep w-full h-full rounded-full"></div>
                <div className="absolute top-0 left-1/2 w-[1px] h-1/2 bg-gradient-to-b from-jasper-glow via-jasper-emerald to-transparent origin-bottom -translate-x-1/2 shadow-[0_0_20px_#44D685]"></div>
              </div>
              
              <div className="absolute w-[80%] h-[80%] rounded-full border border-jasper-emerald/10"></div>
              <div className="absolute w-[60%] h-[60%] rounded-full border border-dashed border-jasper-emerald/10 opacity-50"></div>
              <div className="absolute w-[40%] h-[40%] rounded-full border border-jasper-emerald/5"></div>
              
              <div className="absolute w-full h-px bg-jasper-emerald/10 top-1/2 left-0"></div>
              <div className="absolute h-full w-px bg-jasper-emerald/10 left-1/2 top-0"></div>
           </div>
        </div>
      </div>

      {/* --- APP SHELL --- */}
      <div className="relative z-10 flex h-screen overflow-hidden">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed} 
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
        />
        
        <main className="flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300">
          <Header onMenuClick={() => setMobileMenuOpen(true)} />
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}
