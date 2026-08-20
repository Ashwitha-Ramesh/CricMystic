import React from 'react';
import { Flame, ShieldAlert, Sparkles, Scale } from 'lucide-react';

interface MysticMeterProps {
  probability: number; // 0 to 100 representing batting win probability
  battingTeam?: string;
  bowlingTeam?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const MysticMeter: React.FC<MysticMeterProps> = ({
  probability = 50,
  battingTeam = 'Batting Team',
  bowlingTeam = 'Bowling Team',
  size = 'md',
  showLabels = true
}) => {
  const batProb = Math.min(99.9, Math.max(0.1, Math.round(probability * 10) / 10));
  const bowlProb = Math.round((100 - batProb) * 10) / 10;

  // Meter category determination
  let meterState = 'Too close to call';
  let meterBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  let meterIcon = <Scale className="w-3.5 h-3.5" />;

  if (batProb >= 75) {
    meterState = 'Strongly favoured';
    meterBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    meterIcon = <Sparkles className="w-3.5 h-3.5" />;
  } else if (batProb >= 55) {
    meterState = 'Favourites';
    meterBadgeColor = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    meterIcon = <Flame className="w-3.5 h-3.5" />;
  } else if (batProb <= 25) {
    meterState = 'Very unlikely';
    meterBadgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
    meterIcon = <ShieldAlert className="w-3.5 h-3.5" />;
  } else if (batProb <= 45) {
    meterState = 'Against the odds';
    meterBadgeColor = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    meterIcon = <Flame className="w-3.5 h-3.5" />;
  }

  const heightClass = size === 'lg' ? 'h-4 sm:h-5' : size === 'sm' ? 'h-2.5' : 'h-3.5';

  return (
    <div className="w-full space-y-3">
      {/* Probability Header */}
      {showLabels && (
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-bold text-white max-w-[140px] sm:max-w-[200px] truncate">
              {battingTeam}
            </span>
            <span className="text-emerald-400 font-extrabold text-sm sm:text-base">
              {batProb.toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-red-400 font-extrabold text-sm sm:text-base">
              {bowlProb.toFixed(1)}%
            </span>
            <span className="font-bold text-white max-w-[140px] sm:max-w-[200px] truncate text-right">
              {bowlingTeam}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
        </div>
      )}

      {/* Duel Probability Progress Bar */}
      <div className={`relative w-full ${heightClass} bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5 shadow-inner flex items-center`}>
        {/* Batting Portion */}
        <div
          className="h-full rounded-l-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 transition-all duration-700 ease-out"
          style={{ width: `${batProb}%` }}
        />
        {/* Bowling Portion */}
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-700 ease-out"
          style={{ width: `${bowlProb}%` }}
        />

        {/* Dynamic Center Needle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg shadow-white/50 -translate-x-1/2 transition-all duration-700 pointer-events-none z-10"
          style={{ left: `${batProb}%` }}
        />
      </div>

      {/* Meter Reading Subtext */}
      {showLabels && size !== 'sm' && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-md border flex items-center gap-1 font-semibold ${meterBadgeColor}`}>
              {meterIcon}
              <span>{meterState}</span>
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            CricMystic Calibrated Engine
          </span>
        </div>
      )}
    </div>
  );
};
