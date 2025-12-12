import React from 'react';
import { Search, Bell, ShieldCheck, Menu } from 'lucide-react';
import { usePathname } from '../lib/navigation';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const pathname = usePathname();
  
  // Infer title from pathname (Next.js pattern)
  const getTitle = (path: string) => {
    if (path === '/') return 'Dashboard';
    const segment = path.split('/')[1];
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between z-40 sticky top-0 border-b border-white/5 bg-jasper-navy/60 backdrop-blur-md transition-all">
      {/* Title Area */}
      <div className="flex items-center gap-3 md:gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-xl md:text-2xl font-medium tracking-tight text-white">
          {getTitle(pathname)}
        </h1>
        <div className="h-4 w-px bg-white/10 mx-2 hidden md:block"></div>
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-jasper-glow/80">
          <ShieldCheck className="w-3 h-3" />
          <span>SECURE_CONN</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 md:gap-6">
        <div className="relative group hidden md:block">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-jasper-emerald/30 to-blue-600/30 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative flex items-center bg-jasper-dark border border-white/10 rounded-lg px-3 py-2 w-48 lg:w-64 focus-within:border-jasper-emerald/50 transition-colors">
            <Search className="w-4 h-4 text-slate-500 mr-2" />
            <input 
              type="text" 
              placeholder="Search data..." 
              className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-600 w-full"
            />
          </div>
        </div>

        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-jasper-emerald rounded-full border-2 border-jasper-navy"></span>
        </button>

        <div className="flex items-center gap-3 pl-3 md:pl-6 border-l border-white/10">
          <div className="text-right hidden md:block">
            <div className="text-sm font-medium text-white">Admin User</div>
            <div className="text-xs text-slate-500">Engineering Lead</div>
          </div>
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-r from-jasper-emerald to-teal-600 p-[1px] shadow-[0_0_10px_rgba(44,138,91,0.3)]">
            <div className="w-full h-full rounded-full bg-jasper-carbon flex items-center justify-center">
              <span className="font-bold text-xs text-white">AU</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
