import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  RotateCcw, 
  Sliders, 
  Compass, 
  Trophy, 
  HelpCircle, 
  Activity,
  Menu,
  X,
  Flame,
} from 'lucide-react';
import { LandingHero } from './components/LandingHero';
import { PredictionView } from './components/PredictionView';
import { MatchReplayView } from './components/MatchReplayView';
import { SimulatorView } from './components/SimulatorView';
import { ExploreIPLView } from './components/ExploreIPLView';
import { AnalystChallengeView } from './components/AnalystChallengeView';
import { MysticChallengeView } from './components/MysticChallengeView';
import { ThemeToggle } from './components/ThemeToggle';
import { Footer } from './components/Footer';

export type TabKey = 
  | 'home'
  | 'predict'
  | 'replay'
  | 'simulator'
  | 'explore'
  | 'challenges'
  | 'mystic-challenges';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [extraParams, setExtraParams] = useState<any>(null);

  // Sync initial tab with URL path or hash
  useEffect(() => {
    const path = window.location.pathname.replace(/^\/+/, '').toLowerCase();
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const route = path || hash;

    if (route === 'predict') setActiveTab('predict');
    else if (route === 'replay' || route === 'replays') setActiveTab('replay');
    else if (route === 'simulator' || route === 'simulate') setActiveTab('simulator');
    else if (route === 'explore' || route === 'teams' || route === 'venues' || route === 'compare') setActiveTab('explore');
    else if (route === 'challenges' || route === 'analyst-challenges') setActiveTab('challenges');
    else if (route === 'mystic-challenges' || route === 'moments') setActiveTab('mystic-challenges');
    else setActiveTab('home');

    const handlePopState = () => {
      const p = window.location.pathname.replace(/^\/+/, '').toLowerCase();
      if (p === 'predict') setActiveTab('predict');
      else if (p === 'replay') setActiveTab('replay');
      else if (p === 'simulator') setActiveTab('simulator');
      else if (p === 'explore' || p === 'compare') setActiveTab('explore');
      else if (p === 'challenges') setActiveTab('challenges');
      else if (p === 'mystic-challenges') setActiveTab('mystic-challenges');
      else setActiveTab('home');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (tab: string, extra?: any) => {
    const validTabs: Record<string, TabKey> = {
      home: 'home',
      predict: 'predict',
      replay: 'replay',
      simulator: 'simulator',
      explore: 'explore',
      compare: 'explore',
      challenges: 'challenges',
      'mystic-challenges': 'mystic-challenges',
    };

    const targetTab = validTabs[tab] || 'home';
    setActiveTab(targetTab);
    setExtraParams(extra || null);
    setMobileMenuOpen(false);

    // Update browser history cleanly
    const urlPath = targetTab === 'home' ? '/' : `/${targetTab}`;
    window.history.pushState({}, '', urlPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks: { key: TabKey; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'home', label: 'Home', icon: <Activity className="w-4 h-4" /> },
    { key: 'predict', label: 'Predictor', icon: <Zap className="w-4 h-4 text-amber-400" /> },
    { key: 'replay', label: 'Match Replay', icon: <RotateCcw className="w-4 h-4 text-emerald-400" /> },
    { key: 'simulator', label: 'Simulator', icon: <Sliders className="w-4 h-4 text-blue-400" /> },
    { key: 'explore', label: 'Explore IPL', icon: <Compass className="w-4 h-4 text-purple-400" /> },
    { key: 'challenges', label: 'Analyst Challenges', icon: <Trophy className="w-4 h-4 text-amber-500" /> },
    { key: 'mystic-challenges', label: 'Mystic Trivia', icon: <HelpCircle className="w-4 h-4 text-red-400" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300">
      
      {/* Top Authoritative Header */}
      <header className="sticky top-0 z-50 bg-[#0b0f17]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo */}
            <button
              onClick={() => navigateTo('home')}
              className="flex items-center gap-3 group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-amber-600 to-slate-900 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform border border-red-500/30">
                <Flame className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-wider text-white font-mono">
                    CRIC<span className="text-red-500">MYSTIC</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    2008–2026
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Authoritative IPL Win Probability & Data Engine
                </div>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-1">
              {navLinks.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => navigateTo(item.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-slate-800/90 text-white shadow-sm border border-slate-700/80'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Meta Badges & Theme Toggle */}
            <div className="hidden sm:flex items-center gap-3">
              <ThemeToggle />
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>1,243 Matches</span>
              </div>
              <button
                onClick={() => navigateTo('predict')}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs font-bold shadow-lg shadow-red-600/20 hover:from-red-500 hover:to-amber-500 transition-all active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Live Predictor</span>
              </button>
            </div>

            {/* Mobile Menu Button & Theme Toggle */}
            <div className="flex xl:hidden items-center gap-2">
              <ThemeToggle className="sm:hidden" />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-slate-950/95 border-b border-slate-800 px-4 pt-2 pb-6 space-y-1.5 animate-fade-in">
            {navLinks.map((item) => (
              <button
                key={item.key}
                onClick={() => navigateTo(item.key)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.key
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && (
          <LandingHero onNavigate={navigateTo} />
        )}
        
        {activeTab === 'predict' && (
          <PredictionView />
        )}

        {activeTab === 'replay' && (
          <MatchReplayView initialMatchId={extraParams?.matchId} />
        )}

        {activeTab === 'simulator' && (
          <SimulatorView />
        )}

        {activeTab === 'explore' && (
          <ExploreIPLView initialTab={extraParams?.exploreTab} />
        )}

        {activeTab === 'challenges' && (
          <AnalystChallengeView onSelectMatch={(mId) => navigateTo('replay', { matchId: mId })} />
        )}

        {activeTab === 'mystic-challenges' && (
          <MysticChallengeView />
        )}
      </main>

      {/* Authoritative Global Footer */}
      <Footer />
    </div>
  );
}
