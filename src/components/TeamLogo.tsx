import React, { useState } from 'react';

interface TeamLogoProps {
  team?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
}

const TEAM_MAP: Record<string, { slug: string; short: string; bg: string; text: string; border: string }> = {
  'royal challengers bengaluru': { slug: 'rcb', short: 'RCB', bg: 'bg-red-600', text: 'text-amber-300', border: 'border-red-500' },
  'royal challengers bangalore': { slug: 'rcb', short: 'RCB', bg: 'bg-red-600', text: 'text-amber-300', border: 'border-red-500' },
  'rcb': { slug: 'rcb', short: 'RCB', bg: 'bg-red-600', text: 'text-amber-300', border: 'border-red-500' },
  
  'chennai super kings': { slug: 'csk', short: 'CSK', bg: 'bg-amber-400', text: 'text-blue-900', border: 'border-amber-400' },
  'csk': { slug: 'csk', short: 'CSK', bg: 'bg-amber-400', text: 'text-blue-900', border: 'border-amber-400' },
  
  'mumbai indians': { slug: 'mi', short: 'MI', bg: 'bg-blue-600', text: 'text-amber-300', border: 'border-blue-500' },
  'mi': { slug: 'mi', short: 'MI', bg: 'bg-blue-600', text: 'text-amber-300', border: 'border-blue-500' },
  
  'kolkata knight riders': { slug: 'kkr', short: 'KKR', bg: 'bg-purple-900', text: 'text-amber-400', border: 'border-purple-600' },
  'kkr': { slug: 'kkr', short: 'KKR', bg: 'bg-purple-900', text: 'text-amber-400', border: 'border-purple-600' },
  
  'rajasthan royals': { slug: 'rr', short: 'RR', bg: 'bg-pink-600', text: 'text-white', border: 'border-pink-500' },
  'rr': { slug: 'rr', short: 'RR', bg: 'bg-pink-600', text: 'text-white', border: 'border-pink-500' },
  
  'sunrisers hyderabad': { slug: 'srh', short: 'SRH', bg: 'bg-orange-500', text: 'text-black', border: 'border-orange-500' },
  'srh': { slug: 'srh', short: 'SRH', bg: 'bg-orange-500', text: 'text-black', border: 'border-orange-500' },
  
  'delhi capitals': { slug: 'dc', short: 'DC', bg: 'bg-blue-700', text: 'text-red-400', border: 'border-blue-600' },
  'delhi daredevils': { slug: 'dc', short: 'DC', bg: 'bg-blue-700', text: 'text-red-400', border: 'border-blue-600' },
  'dc': { slug: 'dc', short: 'DC', bg: 'bg-blue-700', text: 'text-red-400', border: 'border-blue-600' },
  
  'punjab kings': { slug: 'pbks', short: 'PBKS', bg: 'bg-red-700', text: 'text-slate-200', border: 'border-red-600' },
  'kings xi punjab': { slug: 'pbks', short: 'PBKS', bg: 'bg-red-700', text: 'text-slate-200', border: 'border-red-600' },
  'pbks': { slug: 'pbks', short: 'PBKS', bg: 'bg-red-700', text: 'text-slate-200', border: 'border-red-600' },
  
  'gujarat titans': { slug: 'gt', short: 'GT', bg: 'bg-slate-900', text: 'text-amber-300', border: 'border-amber-500/50' },
  'gt': { slug: 'gt', short: 'GT', bg: 'bg-slate-900', text: 'text-amber-300', border: 'border-amber-500/50' },
  
  'lucknow super giants': { slug: 'lsg', short: 'LSG', bg: 'bg-cyan-800', text: 'text-amber-400', border: 'border-cyan-600' },
  'lsg': { slug: 'lsg', short: 'LSG', bg: 'bg-cyan-800', text: 'text-amber-400', border: 'border-cyan-600' },
  
  'deccan chargers': { slug: 'dc_old', short: 'DC', bg: 'bg-slate-800', text: 'text-slate-200', border: 'border-slate-600' },
  'rising pune supergiant': { slug: 'rps', short: 'RPS', bg: 'bg-fuchsia-800', text: 'text-amber-300', border: 'border-fuchsia-600' },
  'rising pune supergiants': { slug: 'rps', short: 'RPS', bg: 'bg-fuchsia-800', text: 'text-amber-300', border: 'border-fuchsia-600' },
  'gujarat lions': { slug: 'gl', short: 'GL', bg: 'bg-orange-600', text: 'text-slate-900', border: 'border-orange-500' },
  'pune warriors': { slug: 'pwi', short: 'PWI', bg: 'bg-sky-600', text: 'text-white', border: 'border-sky-500' },
  'kochi tuskers kerala': { slug: 'ktk', short: 'KTK', bg: 'bg-purple-800', text: 'text-orange-400', border: 'border-purple-600' }
};

const SIZE_CLASSES = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-base'
};

export const TeamLogo: React.FC<TeamLogoProps> = ({
  team = '',
  size = 'md',
  className = '',
  showBadge = false
}) => {
  const [imgError, setImgError] = useState(false);

  const clean = (team || '').trim().toLowerCase();
  const info = TEAM_MAP[clean] || {
    slug: 'rcb',
    short: (team || 'IPL').slice(0, 3).toUpperCase(),
    bg: 'bg-slate-800',
    text: 'text-white',
    border: 'border-slate-700'
  };

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const logoSrc = `/assets/teams/${info.slug}.svg`;

  return (
    <div
      id={`team-logo-${info.slug}`}
      className={`relative inline-flex items-center justify-center flex-shrink-0 rounded-full overflow-hidden transition-transform duration-200 hover:scale-105 select-none ${sizeClass} ${className}`}
      title={team || 'IPL Team'}
    >
      {!imgError ? (
        <img
          src={logoSrc}
          alt={team || info.short}
          className="w-full h-full object-contain p-0.5"
          onError={() => setImgError(true)}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`w-full h-full rounded-full flex items-center justify-center font-black border shadow-inner ${info.bg} ${info.text} ${info.border}`}
        >
          {info.short}
        </div>
      )}
    </div>
  );
};
