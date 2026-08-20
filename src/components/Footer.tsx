import React from 'react';
import { Database, ShieldCheck, Cpu, Flame, RotateCcw, Zap, ExternalLink, Github, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 mt-16 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black font-mono text-white">
                CRIC<span className="text-red-500">MYSTIC</span> 🏏
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              "Cricket, decoded ball by ball. Built by an RCBian." — An independent sports analytics platform exploring real-time win probability, historical ball-by-ball turning points, and match simulations.
            </p>
            <p className="text-slate-400 text-[11px] italic">
              "Trust the numbers. Feel the game. One ball can change everything."
            </p>
            <div className="pt-2 text-slate-300 font-semibold flex items-center gap-1.5">
              <span>Made with cricket obsession & code by an RCBian</span>
              <span className="text-red-500 animate-pulse">❤️</span>
            </div>
          </div>

          {/* Data & ML Engine */}
          <div className="space-y-2.5">
            <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Dataset & Modeling</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-red-400 shrink-0" />
                <span>Historical IPL Ball-by-Ball Data (2008–2026)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Supervised Delivery State Vectors</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Calibrated Logistic Classifier</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-blue-400 shrink-0" />
                <span>Strict Temporal Chronological Validation</span>
              </li>
            </ul>
          </div>

          {/* Intelligence Modules */}
          <div className="space-y-2.5">
            <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Intelligence Modules</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Live Win Probability Predictor</span>
              </li>
              <li className="flex items-center gap-1.5">
                <RotateCcw className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Historical Ball-by-Ball Replays</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-red-400 shrink-0" />
                <span>Turning Points & Swings Engine</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-blue-400 shrink-0" />
                <span>19-Season Franchise Archives (2008–2026)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Notice */}
        <div className="pt-6 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>
            Statistical Notice: Win probability is a statistical estimate based on historical patterns and current match state. It is not a guarantee of match outcomes and is not intended for betting advice.
          </p>
          <p className="shrink-0">
            © {new Date().getFullYear()} CricMystic.
          </p>
        </div>

        {/* Developer Section */}
        <div className="mt-4 pt-4 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Developer Links:</span>
          </div>
          <div className="flex items-center gap-2.5">
            <a
              id="dev-linkedin-btn"
              href="https://www.linkedin.com/in/ashwitha-ramesh-0123ab315"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-white transition-all text-xs font-medium shadow-sm hover:shadow-blue-500/10 active:scale-95"
            >
              <Linkedin className="w-3.5 h-3.5 text-blue-400" />
              <span>LinkedIn</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
            </a>
            <a
              id="dev-github-btn"
              href="https://github.com/Ashwitha-Ramesh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white transition-all text-xs font-medium shadow-sm hover:shadow-slate-500/10 active:scale-95"
            >
              <Github className="w-3.5 h-3.5 text-slate-300" />
              <span>GitHub</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
