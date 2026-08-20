import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  RotateCcw, 
  ChevronRight,
  ShieldAlert,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { MatchSummary } from '../types';
import { formatNumber } from '../lib/formatters';
import { apiUrl } from '../lib/api';

interface TurningPointsViewProps {
  onOpenReplay: (matchId: string) => void;
}

export const TurningPointsView: React.FC<TurningPointsViewProps> = ({ onOpenReplay }) => {
  const [selectedSeason, setSelectedSeason] = useState<string>('2026');
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('1535465');
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(apiUrl(`/api/matches?season=${selectedSeason}&limit=80`))
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (!isMounted) return;
        const list = d.matches || [];
        setMatches(list);
        if (list.length > 0) {
          const matchExists = list.some((m: any) => (m.match_id === selectedMatchId || m.matchId === selectedMatchId));
          if (!matchExists) {
            const matchWithTP = list.find((m: any) => m.has_turning_points) || list[0];
            setSelectedMatchId(matchWithTP.match_id || matchWithTP.matchId);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not fetch matches list in TurningPointsView:', err);
      });

    return () => { isMounted = false; };
  }, [selectedSeason, selectedMatchId]);

  useEffect(() => {
    if (!selectedMatchId) return;
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetch(apiUrl(`/api/replay/${selectedMatchId}`))
      .then(async (r) => {
        if (!r.ok) {
          const errBody = await r.json().catch(() => ({}));
          throw new Error(errBody.error || `Server error ${r.status}`);
        }
        return r.json();
      })
      .then(d => {
        if (!isMounted) return;
        setMatchData(d);
        setError(null);
      })
      .catch(err => {
        if (!isMounted) return;
        console.warn('Error loading turning points:', err);
        setError(err.message || 'Failed to load turning points');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [selectedMatchId]);

  const tp = matchData?.turningPoints;
  const match = matchData?.match;

  return (
    <div className="w-full space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-400">
              <Flame className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              The Turning Points Engine
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Isolating the highest-leverage deliveries where match destiny flipped based on ML probability delta.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Season:</span>
            <select
              id="turning-points-season-select"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="bg-transparent text-xs font-bold text-red-400 outline-none cursor-pointer font-mono"
            >
              {Array.from({ length: 19 }, (_, i) => String(2026 - i)).map(yr => (
                <option key={yr} value={yr} className="bg-slate-900 text-white">{yr}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Match:</span>
            <select
              id="turning-points-match-select"
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer max-w-[200px] sm:max-w-[260px] truncate"
            >
              {matches.map(m => (
                <option key={m.match_id} value={m.match_id} className="bg-slate-900 text-white">
                  {m.date} - {m.team1} vs {m.team2}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Analyzing leverage factors & probability deltas...</span>
        </div>
      ) : match && tp ? (
        <div className="space-y-6">
          
          {/* Match Summary Banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white">{match.team1}</span>
                <span className="text-xs font-mono text-red-400">vs</span>
                <span className="text-xl font-black text-white">{match.team2}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-slate-300">
                  {match.season}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-3">
                <span>{match.venue}</span>
                <span>•</span>
                <span>{match.date}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-mono">Result</span>
                <span className="text-sm font-bold text-emerald-400">
                  {match.winner} won by {formatNumber(match.win_margin)} {match.win_type}
                </span>
              </div>

              <button
                id="tp-replay-match-btn"
                onClick={() => onOpenReplay(match.match_id || match.matchId || selectedMatchId)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Replay Full Match</span>
              </button>
            </div>
          </div>

          {/* Key Leverage Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Max Swing Card */}
            <div className="bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-900 border border-red-800/60 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4" /> Largest Single Swing
                </span>
                <span className="text-sm font-black font-mono text-red-400">
                  {tp.maxSwing?.swing > 0 ? `+${tp.maxSwing.swing}%` : `${tp.maxSwing?.swing}%`}
                </span>
              </div>

              {tp.maxSwing && (
                <div className="space-y-2">
                  <div className="text-sm font-bold text-white">
                    Over {tp.maxSwing.delivery}: {tp.maxSwing.desc}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono bg-slate-950/60 p-2 rounded-lg">
                    <span>Before: {tp.maxSwing.probBefore}%</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-white font-bold">After: {tp.maxSwing.probAfter}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Most Impactful Wicket */}
            <div className="bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-900 border border-rose-800/40 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Crucial Wicket
                </span>
                <span className="text-xs font-mono font-bold text-rose-400">
                  {tp.biggestWicket ? `${tp.biggestWicket.swing}% delta` : 'N/A'}
                </span>
              </div>

              {tp.biggestWicket ? (
                <div className="space-y-2">
                  <div className="text-sm font-bold text-white">
                    {tp.biggestWicket.player} dismissed
                  </div>
                  <p className="text-xs text-slate-400">
                    Bowled by <strong className="text-amber-400">{tp.biggestWicket.bowler}</strong> in Over {tp.biggestWicket.over}.{tp.biggestWicket.ball}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No major collapse detected in this innings.</p>
              )}
            </div>

            {/* Most Impactful Boundary */}
            <div className="bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Decisive Boundary
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {tp.biggestBoundary ? `+${tp.biggestBoundary.swing}% delta` : 'N/A'}
                </span>
              </div>

              {tp.biggestBoundary ? (
                <div className="space-y-2">
                  <div className="text-sm font-bold text-white">
                    {tp.biggestBoundary.runs === 6 ? 'MASSIVE SIX' : 'CRUCIAL FOUR'}
                  </div>
                  <p className="text-xs text-slate-400">
                    Struck by <strong className="text-white">{tp.biggestBoundary.striker}</strong> in Over {tp.biggestBoundary.over}.{tp.biggestBoundary.ball}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No single boundary swung probability heavily.</p>
              )}
            </div>
          </div>

          {/* Full List of Turning Deliveries */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Chronological Turning Deliveries
            </h3>

            <div className="space-y-2.5">
              {(() => {
                const topSwingsList: any[] = tp?.topSwings || tp?.turningPoints || [];
                if (topSwingsList.length === 0) {
                  return (
                    <p className="text-xs text-slate-500 py-3 italic">
                      No significant turning points found for this match.
                    </p>
                  );
                }

                return topSwingsList.map((swing: any, idx: number) => {
                  const deliveryLabel = swing.delivery || swing.over || '0.0';
                  const narrative = swing.desc || swing.narrative || 'Probability shift';
                  const probB = swing.probBefore ?? 50;
                  const probA = swing.probAfter ?? 50;
                  const sw = swing.swing ?? 0;

                  return (
                    <div
                      key={idx}
                      className="bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-xs font-mono font-bold text-amber-400">
                            Over {deliveryLabel}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {narrative}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3">
                          <span>Win Prob Shift: {probB}% → {probA}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <span
                          className={`text-sm font-mono font-black ${
                            sw > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {sw > 0 ? `+${sw}%` : `${sw}%`}
                        </span>

                        <button
                          onClick={() => onOpenReplay(match?.match_id || match?.matchId || selectedMatchId)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          Select a match to view its turning points.
        </div>
      )}
    </div>
  );
};
