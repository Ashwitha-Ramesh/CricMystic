import React, { useState } from 'react';
import { 
  Activity, 
  RotateCcw, 
  Compass, 
  GitCompare, 
  Sparkles, 
  Award, 
  Flame, 
  Menu, 
  X, 
  Zap
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Activity },
    { id: 'predict', label: 'Predict', icon: Zap },
    { id: 'replay', label: 'Match Replay', icon: RotateCcw, badge: 'Interactive' },
    { id: 'simulator', label: 'Simulator', icon: Sparkles },
    { id: 'turning-points', label: 'Turning Points', icon: Flame },
    { id: 'challenges', label: 'Challenges', icon: Award },
    { id: 'explore', label: 'Explore IPL', icon: Compass },
    { id: 'compare', label: 'Compare', icon: GitCompare },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div 
            id="brand-logo-button"
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-700 to-amber-600 p-[1px] shadow-lg shadow-red-950/40 group-hover:shadow-red-900/60 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <span className="text-xl select-none">🏏</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight font-mono text-white flex items-center">
                  CRIC<span className="text-red-500">MYSTIC</span>
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold tracking-wider rounded bg-red-950/60 text-red-400 border border-red-800/40 uppercase">
                  RCBian
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-tight">
                Cricket, decoded ball by ball
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-800/90 text-white shadow-sm border border-slate-700/80 shadow-slate-900'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.2 text-[9px] font-bold tracking-wider uppercase rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-red-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action / 2008–2026 Archive Badge & Theme Toggle */}
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-semibold text-slate-200">2008–2026 Live Archive</span>
            </div>
            <ThemeToggle />
          </div>

          {/* Mobile menu trigger */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle className="sm:hidden" />
            <button
              id="mobile-menu-toggle-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/95 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-950/40 text-white border border-red-900/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Coverage
            </div>
            <span className="px-2.5 py-1 bg-slate-900 text-xs font-semibold text-emerald-400 rounded border border-slate-800">
              2008–2026 Archive
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
