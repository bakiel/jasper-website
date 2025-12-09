
import React from 'react';
import { Twitter, Linkedin, Wallet, CreditCard, Gem } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#050A14] pt-24 pb-8 border-t border-white/5 relative z-20">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-6 group cursor-pointer">
              <img 
                src="https://i.postimg.cc/C1VxnRJL/JASPER-FINANCIAL-ARCHITECTURE.png" 
                alt="JASPER Financial Architecture" 
                className="h-10 w-auto opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <p className="text-brand-muted text-sm leading-relaxed mb-4">
              DFI investment packages.<br/>
              $5M to $500M+<br/>
              Worldwide.
            </p>
            <div className="flex gap-4 mt-8">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-brand-emerald hover:text-white transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-brand-emerald hover:text-white transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-xs">Services</h4>
            <ul className="space-y-4 text-sm text-brand-muted">
              <li><a href="/#services" className="hover:text-brand-emerald transition-colors">Growth Package</a></li>
              <li><a href="/#services" className="hover:text-brand-emerald transition-colors">Institutional Package</a></li>
              <li><a href="/#services" className="hover:text-brand-emerald transition-colors">Infrastructure Package</a></li>
              <li><a href="/#process" className="hover:text-brand-emerald transition-colors">Process</a></li>
            </ul>
          </div>

          {/* Sectors */}
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-xs">Sectors</h4>
            <ul className="space-y-4 text-sm text-brand-muted">
              <li><a href="/sectors/renewable-energy" className="hover:text-brand-emerald transition-colors">Renewable Energy</a></li>
              <li><a href="/sectors/data-centres" className="hover:text-brand-emerald transition-colors">Data Centres</a></li>
              <li><a href="/sectors/agri-industrial" className="hover:text-brand-emerald transition-colors">Agri-Industrial</a></li>
              <li><a href="/sectors/climate-finance" className="hover:text-brand-emerald transition-colors">Climate Finance</a></li>
              <li><a href="/sectors/technology" className="hover:text-brand-emerald transition-colors">Technology</a></li>
              <li><a href="/sectors/manufacturing" className="hover:text-brand-emerald transition-colors">Manufacturing</a></li>
            </ul>
          </div>

          {/* Payment (Detailed) */}
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-xs">Payment</h4>
            <div className="space-y-6 text-sm text-brand-muted">
               <div>
                  <div className="flex items-center gap-2 text-brand-emerald font-medium mb-2">
                      <Gem className="w-4 h-4" />
                      <span>CRYPTO (PREFERRED)</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-70 pl-6 border-l border-brand-emerald/20">
                      USDC • USDT • BTC • ETH<br/>
                      <span className="text-[10px] uppercase tracking-wider text-white/50">via Binance</span>
                  </p>
               </div>
               <div>
                  <div className="flex items-center gap-2 text-white font-medium mb-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Traditional</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-70 pl-6 border-l border-white/10">
                      Wise • Payoneer<br/>
                      Bank Transfer (SA)
                  </p>
               </div>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-xs">Resources</h4>
            <ul className="space-y-4 text-sm text-brand-muted">
              <li><a href="/#methodology" className="hover:text-brand-emerald transition-colors">Methodology</a></li>
              <li><a href="/contact" className="hover:text-brand-emerald transition-colors">Contact</a></li>
              <li><a href="/faq" className="hover:text-brand-emerald transition-colors">FAQ</a></li>
              <li><a href="/terms" className="hover:text-brand-emerald transition-colors">Terms</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-brand-muted text-xs">
            © 2025 JASPER Financial Architecture.
          </div>
          <div className="flex items-center gap-6 text-xs text-brand-muted">
            <a href="mailto:models@jasperfinance.org" className="hover:text-white transition-colors">models@jasperfinance.org</a>
            <span className="hidden md:inline text-white/10">|</span>
            <span className="text-brand-emerald font-medium">Crypto-native. Borderless payments.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};