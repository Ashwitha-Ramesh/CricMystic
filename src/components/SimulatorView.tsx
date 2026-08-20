import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Plus, 
  Minus, 
  Flame, 
  ShieldCheck, 
  ChevronRight,
  GitCompare
} from 'lucide-react';
import { MysticMeter } from './MysticMeter';
import { SimulationResult, TeamData, VenueData } from '../types';
import { apiUrl } from '../lib/api';

export const SimulatorView: React.FC = () => {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [venues, setVenues] = useState<VenueData[]>([]);

  // Baseline scenario state
  const [battingTeam, setBattingTeam] = useState<string>('Royal Challengers Bengaluru');
  const [bowlingTeam, setBowlingTeam] = useState<string>('Chennai Super Kings');
  const [venue, setVenue] = useState<string>('M. Chinnaswamy Stadium, Bengaluru');
  const [target, setTarget] = useState<number>(188);
  const [overs, setOvers] = useState<number>(15.0);
  const [baseScore, setBaseScore] = useState<number>(130);
  const [baseWickets, setBaseWickets] = useState<number>(3);

  // Modified scenario state
  const [modScore, setModScore] = useState<number>(130);
  const [modWickets, setModWickets] = useState<number>(5);
  const [modOvers, setModOvers] = useState<number>(15.0);
  const [modTarget, setModTarget] = useState<number>(188);

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetch(apiUrl('/api/teams'))
      .then(r => r.json())
      .then(d => setTeams(d))
      .catch(() => {});

    fetch(apiUrl('/api/venues'))
      .then(r => r.json())
      .then(d => setVenues(d))
      .catch(() => {});
  }, []);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/simulate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battingTeam,
          bowlingTeam,
          venue,
          baseline: {
            currentScore: baseScore,
            wicketsLost: baseWickets,
            overs: overs,
            target: target
          },
          modified: {
            currentScore: modScore,
            wicketsLost: modWickets,
            overs: modOvers,
            target: modTarget
          }
        })
      });
      const data = await res.json();
      setSimResult(data);
    } catch (e) {
      console.error('Simulation failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [
    battingTeam,
    bowlingTeam,
    venue,
    target,
    overs,
    baseScore,
    baseWickets,
    modScore,
    modWickets,
    modOvers,
    modTarget
  ]);

  // Shortcut modifiers on Modified Scenario
  const applyDeltaWickets = (delta: number) => {
    setModWickets(prev => Math.min(10, Math.max(0, prev + delta)));
  };

  const applyDeltaRuns = (delta: number) => {
    setModScore(prev => Math.max(0, prev + delta));
  };

  const applyDeltaTarget = (delta: number) => {
    setModTarget(prev => Math.max(50, prev + delta));
  };

  const syncModifiedToBaseline = () => {
    setModScore(baseScore);
    setModWickets(baseWickets);
    setModOvers(overs);
    setModTarget(target);
  };

  const delta = simResult ? simResult.deltaProbability : 0;

  return (
    <div className="w-full space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-800/60 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              "What If?" Match Simulator
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manipulate game situations to see how wickets, burst overs, or target variations shift win probability.
          </p>
        </div>

        <button
          onClick={syncModifiedToBaseline}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Modified to Baseline</span>
        </button>
      </div>

      {/* Global Context (Teams & Venue) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Chasing Team
          </label>
          <select
            value={battingTeam}
            onChange={(e) => setBattingTeam(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
          >
            {teams.map(t => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Defending Team
          </label>
          <select
            value={bowlingTeam}
            onChange={(e) => setBowlingTeam(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
          >
            {teams.map(t => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Venue
          </label>
          <select
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
          >
            {venues.map(v => (
              <option key={v.name} value={v.name}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Comparison Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* BASELINE SCENARIO PANEL */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Baseline Scenario A
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Target: {target}
            </span>
          </div>

          {/* Baseline Inputs */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Target Score</label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-white text-sm"
              />
            </div>
            <div>
              <label className="text-slate-400 font-bold block mb-1">Score</label>
              <input
                type="number"
                value={baseScore}
                onChange={(e) => setBaseScore(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-emerald-400 text-sm"
              />
            </div>
            <div>
              <label className="text-slate-400 font-bold block mb-1">Wickets ({baseWickets}/10)</label>
              <input
                type="number"
                min={0}
                max={10}
                value={baseWickets}
                onChange={(e) => setBaseWickets(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-rose-400 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <label className="text-slate-400 font-bold">Overs Bowled: <span className="text-white font-mono">{overs.toFixed(1)}</span></label>
              <span className="text-slate-400 font-mono">Need {Math.max(0, target - baseScore)} off {Math.max(0, 120 - Math.floor(overs) * 6 - Math.round((overs % 1) * 10))} balls</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={20.0}
              step={0.1}
              value={overs}
              onChange={(e) => setOvers(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Baseline Mystic Meter */}
          <div className="pt-3 border-t border-slate-800">
            <MysticMeter
              probability={simResult ? simResult.baseline.battingProbability : 50}
              battingTeam={battingTeam}
              bowlingTeam={bowlingTeam}
              size="md"
            />
          </div>
        </div>

        {/* MODIFIED SCENARIO PANEL */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-amber-900/50 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                Modified Scenario B ("What If?")
              </h3>
            </div>
            
            {/* Live Delta Badge */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 uppercase font-mono">Net Swing:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black border ${
                  delta > 0
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : delta < 0
                    ? 'bg-rose-950 text-rose-300 border-rose-800'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {delta > 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`}
              </span>
            </div>
          </div>

          {/* Quick Modifier Shortcuts */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Impact Modifiers:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => applyDeltaWickets(2)}
                className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-[11px] font-bold transition-all"
              >
                +2 Wickets Lost
              </button>
              <button
                onClick={() => applyDeltaWickets(-1)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-bold transition-all"
              >
                -1 Wicket (Better Depth)
              </button>
              <button
                onClick={() => applyDeltaRuns(18)}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800 text-[11px] font-bold transition-all"
              >
                +18 Run Explosive Over
              </button>
              <button
                onClick={() => applyDeltaTarget(12)}
                className="px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 border border-amber-800 text-[11px] font-bold transition-all"
              >
                Target +12 Runs
              </button>
            </div>
          </div>

          {/* Modified Inputs */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Target Score</label>
              <input
                type="number"
                value={modTarget}
                onChange={(e) => setModTarget(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-amber-900/60 rounded-xl px-3 py-2 font-mono font-bold text-white text-sm"
              />
            </div>
            <div>
              <label className="text-slate-400 font-bold block mb-1">Score</label>
              <input
                type="number"
                value={modScore}
                onChange={(e) => setModScore(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-amber-900/60 rounded-xl px-3 py-2 font-mono font-bold text-emerald-400 text-sm"
              />
            </div>
            <div>
              <label className="text-slate-400 font-bold block mb-1">Wickets ({modWickets}/10)</label>
              <input
                type="number"
                min={0}
                max={10}
                value={modWickets}
                onChange={(e) => setModWickets(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-amber-900/60 rounded-xl px-3 py-2 font-mono font-bold text-rose-400 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <label className="text-slate-400 font-bold">Overs Bowled: <span className="text-amber-300 font-mono">{modOvers.toFixed(1)}</span></label>
              <span className="text-slate-400 font-mono">Need {Math.max(0, modTarget - modScore)} off {Math.max(0, 120 - Math.floor(modOvers) * 6 - Math.round((modOvers % 1) * 10))} balls</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={20.0}
              step={0.1}
              value={modOvers}
              onChange={(e) => setModOvers(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Modified Mystic Meter */}
          <div className="pt-3 border-t border-slate-800">
            <MysticMeter
              probability={simResult ? simResult.modified.battingProbability : 50}
              battingTeam={battingTeam}
              bowlingTeam={bowlingTeam}
              size="md"
            />
          </div>
        </div>
      </div>

      {/* TACTICAL IMPACT NARRATIVE REPORT */}
      {simResult && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3">
            <GitCompare className="w-4 h-4 text-amber-400" />
            <span>Simulation Tactical Breakdown</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {simResult.narrative}
          </p>

          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Baseline Win %</span>
              <span className="text-lg font-black font-mono text-white">{simResult.baseline.battingProbability}%</span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Modified Win %</span>
              <span className="text-lg font-black font-mono text-amber-400">{simResult.modified.battingProbability}%</span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Required RR Delta</span>
              <span className="text-lg font-black font-mono text-slate-200">
                {(simResult.modified.calculatedMetrics.requiredRunRate - simResult.baseline.calculatedMetrics.requiredRunRate).toFixed(2)} RPO
              </span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Wickets Buffer</span>
              <span className="text-lg font-black font-mono text-emerald-400">
                {simResult.modified.calculatedMetrics.wicketsRemaining} in hand
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
