
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, ChevronDown, Zap, Sprout, Landmark, Cpu, Factory, Leaf, BookOpen, Mail, User, Search } from 'lucide-react';
import { Button } from './Button';
import { SiteSearch } from './SiteSearch';

interface NavbarProps {
  onLaunchMethodology?: () => void;
  onOpenServices?: (pkg?: string) => void;
  onNavigate?: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onLaunchMethodology, onOpenServices, onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<number | null>(null);

  // --- MENU DATA STRUCTURE ---
  const MENU_ITEMS = [
    {
      label: 'Services',
      href: '/#services',
      type: 'megamenu',
      onClick: 'openServices',
      children: [
        {
          label: 'Growth',
          desc: '$12K · 3-4 weeks · $5M-$15M deals',
          href: '/#services',
          onClick: 'openServices-Growth',
          icon: Zap,
          color: 'text-yellow-400'
        },
        {
          label: 'Institutional',
          desc: '$25K · 4-6 weeks · $15M-$75M deals',
          href: '/#services',
          onClick: 'openServices-Institutional',
          icon: Landmark,
          color: 'text-brand-emerald'
        },
        {
          label: 'Infrastructure',
          desc: '$45K · 6-8 weeks · $75M-$150M deals',
          href: '/#services',
          onClick: 'openServices-Infrastructure',
          icon: Factory,
          color: 'text-blue-400'
        },
        {
          label: 'Strategic',
          desc: '$85K+ · 8-12 weeks · $150M+ portfolios',
          href: '/#services',
          onClick: 'openServices-Strategic',
          icon: Landmark,
          color: 'text-purple-400'
        },
      ]
    },
    { 
      label: 'Methodology', 
      href: '#', 
      onClick: 'launchMethodology',
      type: 'link'
    },
    { 
      label: 'Sectors', 
      href: '/sectors',
      type: 'dropdown',
      children: [
        { label: 'Renewable Energy', href: '/sectors/renewable-energy', icon: Zap },
        { label: 'Data Centres', href: '/sectors/data-centres', icon: Cpu },
        { label: 'Agri-Industrial', href: '/sectors/agri-industrial', icon: Sprout },
        { label: 'Climate Finance', href: '/sectors/climate-finance', icon: Leaf },
      ]
    },
    {
      label: 'Process',
      href: '/process',
      type: 'link'
    },
    {
      label: 'Resources',
      href: '#',
      type: 'dropdown',
      children: [
        { label: 'Insights', desc: 'DFI funding articles & guides', href: '/insights', icon: BookOpen },
        { label: 'Contact', desc: 'Get in touch with our team', href: '/contact', icon: Mail },
      ]
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const handleLinkClick = (item: any) => {
    if (item.onClick) {
        if (item.onClick === 'launchMethodology' && onLaunchMethodology) {
            onLaunchMethodology();
        } else if (item.onClick === 'openServices' && onOpenServices) {
            onOpenServices();
        } else if (item.onClick.startsWith('openServices-')) {
            const pkgName = item.onClick.split('-')[1];
            if (onOpenServices) {
                // On home page - open services directly
                onOpenServices(pkgName);
            } else if (onNavigate) {
                // On other pages - navigate home with query param to open services
                sessionStorage.setItem('openServicesPackage', pkgName);
                onNavigate('/');
            }
        }
    } else if (item.href) {
       // Handle /#section links (navigate to home then scroll)
       if (item.href.startsWith('/#')) {
           const targetId = item.href.split('#')[1];
           if (onNavigate) {
               onNavigate('/');
               setTimeout(() => {
                   const el = document.getElementById(targetId);
                   if (el) el.scrollIntoView({ behavior: 'smooth' });
               }, 100);
           }
       }
       // Check for internal router navigation
       else if (onNavigate && item.href.startsWith('/')) {
           onNavigate(item.href);
       } else {
           // Standard hash navigation
           if (item.href.includes('#')) {
              const targetId = item.href.split('#')[1];
              if (targetId) {
                 const el = document.getElementById(targetId);
                 if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
           }
       }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 md:pt-6 pointer-events-none">
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className={`
            pointer-events-auto
            flex items-center justify-between
            transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isScrolled
              ? 'px-5 py-3 md:px-8 md:py-3 rounded-full bg-[#050A14]/70 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] w-fit'
              : 'px-6 py-4 md:px-12 md:py-5 rounded-full bg-transparent border border-transparent w-full max-w-7xl'
            }
          `}
          onMouseLeave={() => setActiveDropdown(null)}
        >
            {/* Scrolled State: Decorative Top Highlight & Inner Shadow */}
            {isScrolled && (
                <>
                    <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 pointer-events-none" />
                    <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/5 pointer-events-none" />
                </>
            )}

            {/* Logo Area */}
            <div className="flex items-center gap-3 cursor-pointer group relative z-10 shrink-0 mr-4 md:mr-8" onClick={() => { if(onNavigate) onNavigate('/'); else window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <div className="relative">
                  {/* Logo Glow */}
                  <div className={`absolute inset-0 bg-brand-emerald blur-2xl transition-opacity duration-700 ${isScrolled ? 'opacity-0' : 'opacity-20 group-hover:opacity-40'}`} />
                  <img 
                    src="https://i.postimg.cc/C1VxnRJL/JASPER-FINANCIAL-ARCHITECTURE.png" 
                    alt="JASPER Financial Architecture" 
                    className={`relative h-10 md:h-12 w-auto transition-transform duration-500 ease-out object-contain ${isScrolled ? 'scale-90 opacity-90' : 'scale-100'}`}
                  />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              {MENU_ITEMS.map((item, index) => (
                <div 
                    key={index} 
                    className="relative"
                    onMouseEnter={() => setActiveDropdown(index)}
                >
                    <a 
                      href={item.href}
                      onClick={(e) => { e.preventDefault(); handleLinkClick(item); }}
                      className={`
                        relative px-3 py-2 xl:px-4 text-[11px] xl:text-xs font-semibold tracking-wide transition-all duration-300 rounded-full flex items-center gap-1 overflow-hidden group/item cursor-pointer
                        ${activeDropdown === index ? 'text-white' : 'text-gray-400 hover:text-white'}
                      `}
                    >
                      <span className={`absolute inset-0 rounded-full transition-opacity duration-500 ${activeDropdown === index ? 'bg-white/10 opacity-100' : 'bg-white/5 opacity-0 group-hover/item:opacity-100'}`} />
                      
                      <span className={`relative z-10 flex items-center gap-1 transition-all duration-300 ${activeDropdown === index ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : ''}`}>
                          {item.label}
                          {(item.children) && (
                              <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${activeDropdown === index ? 'rotate-180 text-brand-emerald' : 'opacity-50'}`} />
                          )}
                      </span>
                    </a>

                    <AnimatePresence>
                        {activeDropdown === index && item.children && (
                            <motion.div
                                initial={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(8px)' }}
                                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(8px)' }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute top-[calc(100%+12px)] left-0 min-w-[260px] bg-[#0A0F1C]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] z-[100] p-2"
                            >
                                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-brand-emerald/40 to-transparent" />
                                
                                <div className="flex flex-col gap-1 relative z-10">
                                    {item.children.map((child: any, childIdx) => (
                                        <a 
                                            key={childIdx} 
                                            href={child.href}
                                            onClick={(e) => { e.preventDefault(); handleLinkClick(child); }}
                                            className="group/child relative flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
                                        >
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-0 bg-brand-emerald transition-all duration-300 group-hover/child:h-1/2 rounded-r-full shadow-[0_0_8px_rgba(44,138,91,0.8)]" />

                                            {child.icon && (
                                                <div className={`mt-0.5 p-1.5 rounded-lg bg-black/40 border border-white/5 group-hover/child:border-brand-emerald/30 group-hover/child:shadow-[0_0_15px_rgba(44,138,91,0.15)] transition-all duration-300 ${child.color || 'text-brand-muted'}`}>
                                                    <child.icon className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-xs font-bold text-gray-200 group-hover/child:text-white transition-colors">{child.label}</div>
                                                {child.desc && (
                                                    <div className="text-[9px] text-gray-500 mt-0.5 font-mono tracking-wide">{child.desc}</div>
                                                )}
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3 lg:gap-4 relative z-10 ml-auto lg:ml-6 shrink-0">
              {/* Search Button */}
              <SiteSearch onNavigate={onNavigate} className="hidden lg:flex" />

              <a
                href="/login"
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all group relative"
                title="Client Login"
              >
                <User className="w-4 h-4" />
                {/* Tooltip */}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-[9px] text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Client Login
                </span>
              </a>
              <Button
                className={`!py-2 !px-5 !text-[11px] !font-bold !tracking-widest !rounded-full transition-all duration-300 whitespace-nowrap
                  ${isScrolled
                    ? '!bg-brand-emerald text-white shadow-[0_0_20px_rgba(44,138,91,0.5)] hover:shadow-[0_0_30px_rgba(68,214,133,0.6)] border border-brand-emerald/50'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                  }
                `}
                variant={isScrolled ? 'primary' : 'secondary'}
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                START PROJECT
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="lg:hidden pointer-events-auto relative z-10 ml-4">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`
                    p-2.5 rounded-full transition-all duration-300 border
                    ${isMobileMenuOpen 
                        ? 'bg-white/10 border-white/20 text-white rotate-90' 
                        : 'bg-transparent border-white/5 text-white/80 hover:bg-white/5 hover:border-white/20'
                    }
                `}
              >
                {isMobileMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
              </button>
            </div>
        </motion.nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-40 bg-[#050A14] flex flex-col lg:hidden overflow-hidden"
          >
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1A2C38] via-[#050A14] to-[#050A14] pointer-events-none" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-emerald/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Content Container - Scrollable */}
            <div className="flex-1 overflow-y-auto pt-28 px-6 pb-32 relative z-10 scrollbar-none">
                <div className="flex flex-col gap-1">
                    {MENU_ITEMS.map((item, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + (i * 0.05) }}
                        className="border-b border-white/[0.08] last:border-0"
                      >
                         {item.children ? (
                            // Accordion Item
                            <div>
                                 <button 
                                    onClick={() => setMobileExpanded(mobileExpanded === i ? null : i)}
                                    className="w-full flex items-center justify-between py-5 group"
                                 >
                                     <span className={`text-2xl font-display font-bold transition-all duration-300 ${mobileExpanded === i ? 'text-brand-emerald drop-shadow-[0_0_15px_rgba(44,138,91,0.3)]' : 'text-white/80 group-hover:text-white'}`}>
                                        {item.label}
                                     </span>
                                     <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${mobileExpanded === i ? 'rotate-180 text-brand-emerald' : 'text-white/30'}`} />
                                 </button>
                                 <AnimatePresence>
                                    {mobileExpanded === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="flex flex-col gap-2 pb-6 pl-2">
                                                <div className="bg-white/[0.03] rounded-2xl border border-white/5 p-2 flex flex-col gap-1">
                                                {item.children.map((child: any, cIdx) => (
                                                    <a 
                                                        key={cIdx} 
                                                        href={child.href}
                                                        className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-white/[0.05] transition-all group/link relative overflow-hidden"
                                                        onClick={(e) => { e.preventDefault(); handleLinkClick(child); }}
                                                    >
                                                        {child.icon && (
                                                            <div className="p-2 rounded-lg bg-[#0F172A] border border-white/10 text-brand-emerald group-hover/link:text-white group-hover/link:border-brand-emerald/50 transition-colors shadow-lg">
                                                                <child.icon className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col">
                                                            <span className="text-base font-semibold text-gray-200 group-hover/link:text-white">{child.label}</span>
                                                            {child.desc && <span className="text-[11px] text-gray-500 group-hover/link:text-gray-400">{child.desc}</span>}
                                                        </div>
                                                    </a>
                                                ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                 </AnimatePresence>
                            </div>
                         ) : (
                            // Standard Link
                            <a 
                                href={item.href}
                                onClick={(e) => { e.preventDefault(); handleLinkClick(item); }}
                                className="block py-5 text-2xl font-display font-bold text-white/80 hover:text-white transition-colors"
                            >
                                {item.label}
                            </a>
                         )}
                      </motion.div>
                    ))}
                </div>
            </div>

            {/* Bottom Sticky Action Area */}
            <div className="p-6 border-t border-white/10 bg-[#050A14]/80 backdrop-blur-xl relative z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
                 <Button 
                   className="w-full justify-center !text-lg !py-4 mb-6 !rounded-xl shadow-[0_0_30px_rgba(44,138,91,0.2)] hover:shadow-[0_0_50px_rgba(44,138,91,0.4)] border border-brand-emerald/30 !bg-brand-emerald text-white font-display font-bold tracking-wide"
                   onClick={() => {
                     document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                     setIsMobileMenuOpen(false);
                   }}
                 >
                  START PROJECT <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <div className="flex justify-center gap-8 text-sm font-medium text-brand-muted uppercase tracking-widest">
                    <a href="/login" className="hover:text-white transition-colors">Login</a>
                    <span className="text-white/10">|</span>
                    <a href="/contact" className="hover:text-white transition-colors">Support</a>
                </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
