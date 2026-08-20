import React from 'react';

interface PlayerAvatarProps {
  name: string;
  team?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm font-semibold',
  lg: 'w-14 h-14 text-base font-bold',
  xl: 'w-20 h-20 text-xl font-bold'
};

const TEAM_BG_GRADIENTS: Record<string, string> = {
  'royal challengers bengaluru': 'from-red-600 to-amber-500 text-white border-red-500/40',
  'royal challengers bangalore': 'from-red-600 to-amber-500 text-white border-red-500/40',
  'rcb': 'from-red-600 to-amber-500 text-white border-red-500/40',
  'chennai super kings': 'from-amber-400 to-blue-600 text-slate-950 border-amber-400/40',
  'csk': 'from-amber-400 to-blue-600 text-slate-950 border-amber-400/40',
  'mumbai indians': 'from-blue-600 to-amber-400 text-white border-blue-500/40',
  'mi': 'from-blue-600 to-amber-400 text-white border-blue-500/40',
  'kolkata knight riders': 'from-purple-800 to-amber-400 text-white border-purple-500/40',
  'kkr': 'from-purple-800 to-amber-400 text-white border-purple-500/40',
  'rajasthan royals': 'from-pink-600 to-blue-600 text-white border-pink-500/40',
  'rr': 'from-pink-600 to-blue-600 text-white border-pink-500/40',
  'sunrisers hyderabad': 'from-orange-500 to-amber-500 text-slate-950 border-orange-500/40',
  'srh': 'from-orange-500 to-amber-500 text-slate-950 border-orange-500/40',
  'delhi capitals': 'from-blue-600 to-red-600 text-white border-blue-500/40',
  'dc': 'from-blue-600 to-red-600 text-white border-blue-500/40',
  'punjab kings': 'from-red-600 to-slate-400 text-white border-red-500/40',
  'pbks': 'from-red-600 to-slate-400 text-white border-red-500/40',
  'gujarat titans': 'from-slate-900 to-amber-500 text-white border-amber-500/40',
  'gt': 'from-slate-900 to-amber-500 text-white border-amber-500/40',
  'lucknow super giants': 'from-cyan-700 to-rose-600 text-white border-cyan-500/40',
  'lsg': 'from-cyan-700 to-rose-600 text-white border-cyan-500/40'
};

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  name = 'Player',
  team = '',
  size = 'md',
  className = ''
}) => {
  const getInitials = (n: string) => {
    if (!n) return 'CR';
    const clean = n.trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);
  const cleanTeam = (team || '').trim().toLowerCase();
  const gradientClass = TEAM_BG_GRADIENTS[cleanTeam] || 'from-indigo-600 to-violet-500 text-white border-indigo-500/40';
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <div
      id={`avatar-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      className={`relative inline-flex items-center justify-center flex-shrink-0 rounded-full bg-gradient-to-tr ${gradientClass} border shadow-sm select-none transition-transform duration-200 hover:scale-105 ${sizeClass} ${className}`}
      title={`${name}${team ? ` (${team})` : ''}`}
    >
      <span className="tracking-tight drop-shadow-sm">{initials}</span>
    </div>
  );
};
