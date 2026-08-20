import React, { useState, useEffect } from 'react';
import { GitCompare, RotateCcw, Award, ChevronRight, MapPin, Calendar, RefreshCw } from 'lucide-react';
import { TeamData } from '../types';
import { apiUrl } from '../lib/api';
import { TeamLogo } from './TeamLogo';

interface HeadToHeadViewProps {
  onReplayMatch?: (matchId: string) => void;
}

export const HeadToHeadView: React.FC<HeadToHeadViewProps> = ({ onReplayMatch }) => {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [team1, setTeam1] = useState<string>('Royal Challengers Bengaluru');
  const [team2, setTeam2] = useState<string>('Chennai Super Kings');
  const [h2hData, setH2hData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetch(apiUrl('/api/teams'))
      .then(r => r.json())
      .then(d => setTeams(d || []))
      .catch(() => {});
  }, []);

  const loadH2H = () => {
    if (!team1 || !team2 || team1 === team2) return;
    setLoading(true);
    fetch(apiUrl(`/api/head-to-head?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}`))
      .then(r => r.json())
      .then(d => setH2hData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadH2H();
  }, [team1, team2]);

  const handleSwap = () => {
    const temp = team1;
    setTeam1(team2);
    setTeam2(temp);
  };

  const totalMatches = h2hData?.totalMatches || 0;
  const team1Wins = h2hData?.team1Wins || 0;
  const team2Wins = h2hData?.team2Wins || 0;
  const team1WinPct = totalMatches > 0 ? ((team1Wins / totalMatches) * 100).toFixed(1) : '50.0';
  const team2WinPct = totalMatches > 0 ? ((team2Wins / totalMatches) * 100).toFixed(1) : '50.0';

  return (
    <div className="w-full space-y-8 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-400">
              <GitCompare className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Head-to-Head Franchise Clash
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Compare historical records, match outcomes, and rivalry trends across IPL history.
          </p>
        </div>

        <button
          onClick={handleSwap}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Swap Rivalry</span>
        </button>
      </div>

      {/* Team Selectors Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900/90 border border-red-950/60 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-red-400 block font-mono">
              Franchise A
            </label>
            <TeamLogo team={team1} size="sm" />
          </div>
          <select
            value={team1}
            onChange={(e) => setTeam1(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none"
          >
            {teams.map(t => (
              <option key={t.name} value={t.name} disabled={t.name === team2}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-slate-900/90 border border-blue-950/60 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-blue-400 block font-mono">
              Franchise B
            </label>
            <TeamLogo team={team2} size="sm" />
          </div>
          <select
            value={team2}
            onChange={(e) => setTeam2(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none"
          >
            {teams.map(t => (
              <option key={t.name} value={t.name} disabled={t.name === team1}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Computing head-to-head match records...</span>
        </div>
      ) : h2hData ? (
        <div className="space-y-6">
          
          {/* Main Rivalry Summary Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div className="flex items-center gap-4">
                <TeamLogo team={team1} size="xl" />
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-red-400 block uppercase tracking-wider">
                    {team1}
                  </span>
                  <span className="text-4xl sm:text-5xl font-black font-mono text-white">
                    {team1Wins} <span className="text-sm font-sans font-medium text-slate-400">Wins</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400 block">({team1WinPct}%)</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="px-3.5 py-1 rounded-full bg-slate-800 text-xs font-mono font-bold text-slate-300">
                  {totalMatches} Total Encounters
                </div>
                {h2hData.noResults > 0 && (
                  <span className="text-[10px] text-slate-500 mt-1 font-mono">{h2hData.noResults} No Result / Tied</span>
                )}
              </div>

              <div className="flex items-center sm:flex-row-reverse gap-4 text-center sm:text-right">
                <TeamLogo team={team2} size="xl" />
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-blue-400 block uppercase tracking-wider">
                    {team2}
                  </span>
                  <span className="text-4xl sm:text-5xl font-black font-mono text-white">
                    {team2Wins} <span className="text-sm font-sans font-medium text-slate-400">Wins</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400 block">({team2WinPct}%)</span>
                </div>
              </div>
            </div>

            {/* Split Visual Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-red-500 h-full transition-all duration-700"
                  style={{ width: `${team1WinPct}%` }}
                />
                <div
                  className="bg-blue-500 h-full transition-all duration-700"
                  style={{ width: `${team2WinPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Recent Clashes History */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Recent Matches Between Both Sides
            </h3>

            <div className="space-y-2.5">
              {(h2hData?.recentMatches || []).slice(0, 8).map((m: any) => (
                <div
                  key={m.match_id}
                  className="bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-1.5 mr-1">
                        <TeamLogo team={m.team1} size="xs" />
                        <TeamLogo team={m.team2} size="xs" />
                      </div>
                      <span className="font-bold text-white text-xs">
                        {m.team1} vs {m.team2}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {m.season}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3">
                      <span>{m.date}</span>
                      <span>•</span>
                      <span>{m.venue}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span
                      className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${
                        m.winner === team1
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : m.winner === team2
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {m.winner ? `${m.winner} won` : 'No Result'}
                    </span>

                    {onReplayMatch && (
                      <button
                        onClick={() => onReplayMatch(m.match_id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                        title="Replay this clash"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
