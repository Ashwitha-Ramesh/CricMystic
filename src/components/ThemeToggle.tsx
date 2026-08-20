import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export type Theme = 'dark' | 'light';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cricmystic-theme') as Theme;
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    }
    localStorage.setItem('cricmystic-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-200 group active:scale-95 ${
        theme === 'dark'
          ? 'bg-slate-900/90 border-slate-700/80 text-amber-400 hover:text-amber-300 hover:bg-slate-800 hover:border-amber-400/40 shadow-sm shadow-slate-950'
          : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-400 shadow-sm'
      } ${className}`}
    >
      {theme === 'dark' ? (
        <div className="flex items-center gap-1.5">
          <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45 duration-300" />
          <span className="text-[11px] font-mono font-bold text-slate-300 hidden sm:inline">Light</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <Moon className="w-4 h-4 text-indigo-600 transition-transform group-hover:-rotate-12 duration-300" />
          <span className="text-[11px] font-mono font-bold text-slate-700 hidden sm:inline">Dark</span>
        </div>
      )}
    </button>
  );
};
