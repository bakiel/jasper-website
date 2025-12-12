import React from 'react';
import { 
  BarChart3, Zap, Users, Mail, TrendingUp, Settings, 
  Menu, X
} from 'lucide-react';
import { Link, usePathname } from '../lib/navigation';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const pathname = usePathname();

  const menuItems = [
    { href: '/', icon: BarChart3, label: 'Dashboard' },
    { href: '/sequences', icon: Zap, label: 'Sequences' },
    { href: '/leads', icon: Users, label: 'Leads' },
    { href: '/templates', icon: Mail, label: 'Templates' },
    { href: '/analytics', icon: TrendingUp, label: 'Analytics' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 h-full 
          transition-all duration-300 ease-in-out
          border-r border-white/5 bg-jasper-carbon/95 md:bg-jasper-carbon/40 backdrop-blur-xl
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${collapsed ? 'md:w-20' : 'md:w-72'}
          w-72 md:relative
        `}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-jasper-emerald to-green-800 flex items-center justify-center shadow-[0_0_15px_rgba(44,138,91,0.4)]">
                <span className="font-bold text-white text-sm">J</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white tracking-wide text-sm">JASPER</span>
                <span className="text-[10px] text-jasper-glow uppercase tracking-widest font-semibold">Next</span>
              </div>
            </div>
          )}
          
          {/* Desktop Collapse Button */}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden md:block p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors ${collapsed ? 'mx-auto' : ''}`}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Close Button */}
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden
                  ${isActive 
                    ? 'bg-jasper-emerald/10 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'}
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-jasper-emerald shadow-[0_0_10px_#2C8A5B]" />
                )}

                <item.icon 
                  className={`
                    w-5 h-5 transition-colors duration-300 flex-shrink-0
                    ${isActive ? 'text-jasper-glow' : 'text-slate-500 group-hover:text-slate-300'}
                  `} 
                />
                
                {(!collapsed || mobileOpen) && (
                  <span className="text-sm font-medium tracking-wide">
                    {item.label}
                  </span>
                )}

                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-jasper-emerald/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                )}
              </Link>
            );
          })}
        </nav>

        {(!collapsed || mobileOpen) && (
          <div className="absolute bottom-6 left-6 right-6">
            <div className="p-4 rounded-xl glass-card border border-white/5 bg-gradient-to-br from-jasper-carbon to-black/40">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-jasper-glow animate-pulse"></div>
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-jasper-glow animate-ping opacity-75"></div>
                </div>
                <span className="text-xs font-mono text-jasper-glow">SYSTEM ONLINE</span>
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[85%] bg-jasper-emerald shadow-[0_0_10px_#2C8A5B]"></div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-mono">
                <span>USAGE</span>
                <span>85%</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
