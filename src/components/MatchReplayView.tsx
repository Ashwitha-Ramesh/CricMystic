import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCcw, 
  Play, 
  Pause, 
  FastForward, 
  SkipBack, 
  SkipForward, 
  Flame, 
  Activity, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  CartesianGrid 
} from 'recharts';
import { MatchSummary, Delivery, MatchTurningPoints } from '../types';
import { MysticMeter } from './MysticMeter';
import { apiUrl } from '../lib/api';
import { formatNumber, formatDecimal, formatPercentage } from '../lib/formatters';

interface MatchReplayViewProps {
  initialMatchId?: string;
  onNavigateToSimulator?: (matchState: any) => void;
}

export const MatchReplayView: React.FC<MatchReplayViewProps> = ({ 
  initialMatchId, 
  onNavigateToSimulator 
}) => {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('2026');
  const [selectedMatchId, setSelectedMatchId] = useState<string>(initialMatchId || '1535465');
  const [selectedInnings, setSelectedInnings] = useState<number>(2);

  // Loaded Match Replay Data
  const [matchData, setMatchData] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [turningPoints, setTurningPoints] = useState<MatchTurningPoints | null>(null);
  const [currentBallIdx, setCurrentBallIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per ball
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize when initialMatchId prop changes
  useEffect(() => {
    if (initialMatchId) {
      setSelectedMatchId(initialMatchId);
    }
  }, [initialMatchId]);

  // Fetch match list for the season
  useEffect(() => {
    let isMounted = true;
    fetch(apiUrl(`/api/matches?season=${selectedSeason}&limit=80`))
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (!isMounted) return;
        const matchList = data.matches || [];
        setMatches(matchList);
        if (matchList.length > 0) {
          const matchExists = matchList.some((m: any) => (m.match_id === selectedMatchId || m.matchId === selectedMatchId));
          if (!matchExists && !initialMatchId) {
            const best = matchList.find((m: any) => m.has_turning_points) || matchList[0];
            setSelectedMatchId(best.match_id || best.matchId);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not fetch matches list:', err);
      });

    return () => { isMounted = false; };
  }, [selectedSeason, selectedMatchId, initialMatchId]);

  // Fetch full ball-by-ball replay for selected match
  useEffect(() => {
    if (!selectedMatchId) return;
    let isMounted = true;
    setLoading(true);
    setError(null);
    setIsPlaying(false);
    if (playTimerRef.current) clearInterval(playTimerRef.current);

    fetch(apiUrl(`/api/replay/${selectedMatchId}`))
      .then(async (r) => {
        if (!r.ok) {
          const errBody = await r.json().catch(() => ({}));
          throw new Error(errBody.error || `Server responded with ${r.status}`);
        }
        return r.json();
      })
      .then(data => {
        if (!isMounted) return;
        setMatchData(data.match);
        setTurningPoints(data.turningPoints);
        const delivs = selectedInnings === 1 ? data.innings1Deliveries : data.innings2Deliveries;
        setDeliveries(delivs || []);
        setCurrentBallIdx(0);
        setError(null);
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('Failed to load replay', err);
        setError(err.message || 'Failed to fetch replay data');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [selectedMatchId, selectedInnings, retryCount]);

  // Handle Play/Pause timer
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentBallIdx((prev) => {
          if (prev >= deliveries.length - 1) {
            setIsPlaying(false);
            if (playTimerRef.current) clearInterval(playTimerRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, deliveries.length, playbackSpeed]);

  const currentDelivery = deliveries[currentBallIdx] || null;

  // Chart data formatting: include all deliveries up to the current ball
  const chartData = deliveries.map((d) => ({
    over: d.deliveryLabel,
    battingProb: d.battingWinProb,
    bowlingProb: d.bowlingWinProb,
    score: `${d.cumRuns}/${d.cumWickets}`,
    event: d.isWicket ? `Wicket: ${d.playerDismissed}` : d.runsOffBat === 6 ? 'SIX' : d.runsOffBat === 4 ? 'FOUR' : '',
    striker: d.striker,
  }));

  // Step controls
  const stepForward = () => {
    setIsPlaying(false);
    if (currentBallIdx < deliveries.length - 1) {
      setCurrentBallIdx(currentBallIdx + 1);
    }
  };

  const stepBackward = () => {
    setIsPlaying(false);
    if (currentBallIdx > 0) {
      setCurrentBallIdx(currentBallIdx - 1);
    }
  };

  const jumpToStart = () => {
    setIsPlaying(false);
    setCurrentBallIdx(0);
  };

  const jumpToEnd = () => {
    setIsPlaying(false);
    setCurrentBallIdx(Math.max(0, deliveries.length - 1));
  };

  const jumpToDelivery = (deliveryLabel: string) => {
    setIsPlaying(false);
    const idx = deliveries.findIndex(d => d.deliveryLabel === deliveryLabel);
    if (idx !== -1) {
      setCurrentBallIdx(idx);
    }
  };

  // Calculate momentum
  const getMomentum = () => {
    if (!currentDelivery || currentBallIdx === 0) return 'Stable';
    const prev = deliveries[Math.max(0, currentBallIdx - 3)];
    if (!prev) return 'Stable';
    const delta = currentDelivery.battingWinProb - prev.battingWinProb;
    if (delta >= 4) return 'Rising';
    if (delta <= -4) return 'Falling';
    return 'Stable';
  };

  const momentum = getMomentum();

  return (
    <div className="w-full space-y-8 animate-fade-in">
      
      {/* Replay Header & Selector Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
                <RotateCcw className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Historical Match Replay Engine
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Rewind any IPL match ball-by-ball. Watch the live win-probability graph react to turning points.
            </p>
          </div>

          {/* Season & Match Pickers */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Season:</span>
              <select
                id="replay-season-select"
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="bg-transparent text-xs font-bold text-red-400 outline-none cursor-pointer font-mono"
              >
                {Array.from({ length: 19 }, (_, i) => String(2026 - i)).map(yr => (
                  <option key={yr} value={yr} className="bg-slate-900 text-white">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 max-w-xs sm:max-w-md">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Match:</span>
              <select
                id="replay-match-select"
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer truncate max-w-[220px] sm:max-w-[280px]"
              >
                {matches.map((m) => (
                  <option key={m.match_id} value={m.match_id} className="bg-slate-900 text-white">
                    {m.date} - {m.team1} vs {m.team2} ({m.winner ? `${m.winner} won` : 'Match'})
                  </option>
                ))}
              </select>
            </div>

            {/* Innings Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                id="replay-innings-1-btn"
                onClick={() => setSelectedInnings(1)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedInnings === 1
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Innings 1
              </button>
              <button
                id="replay-innings-2-btn"
                onClick={() => setSelectedInnings(2)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedInnings === 2
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Innings 2 (Chase)
              </button>
            </div>
          </div>
        </div>

        {/* Selected Match Metadata Card */}
        {matchData && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-bold text-white text-sm">
                {matchData.team1} <span className="text-red-400 font-mono">vs</span> {matchData.team2}
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{matchData.venue}</span>
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{matchData.date}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold">
                Winner: {matchData.winner} ({formatNumber(matchData.win_margin)} {matchData.win_type === 'runs' ? 'runs' : matchData.win_type === 'wickets' ? 'wkts' : 'win'})
              </span>
              {matchData.player_of_match && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">
                  POTM: {matchData.player_of_match}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading ball-by-ball trajectory...</span>
        </div>
      ) : error ? (
        <div className="bg-slate-900/90 border border-rose-800/60 rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-700/60 flex items-center justify-center mx-auto text-rose-400">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Replay Connection Issue</h3>
            <p className="text-xs text-slate-400 mt-1">{error}</p>
          </div>
          <button
            id="retry-replay-load-btn"
            onClick={() => setRetryCount(c => c + 1)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg hover:shadow-red-600/20 active:scale-95 inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Loading Replay</span>
          </button>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          No deliveries found for this innings.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Column: Live Replay Scoreboard, Graph & Controls */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Live Scoreboard Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              
              {/* Top Score Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-white">
                      {currentDelivery?.cumRuns}
                      <span className="text-red-400">/{currentDelivery?.cumWickets}</span>
                    </span>
                    <span className="text-base font-bold font-mono text-slate-300">
                      {currentDelivery?.deliveryLabel} overs
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ({currentDelivery?.actualBallNum} legal balls)
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-emerald-400 mt-1">
                    {currentDelivery?.battingTeam} (Batting)
                  </div>
                </div>

                <div className="flex sm:flex-col sm:items-end justify-between text-xs">
                  {selectedInnings === 2 && (
                    <div className="space-y-0.5 text-right">
                      <span className="text-slate-400 text-[11px] block">Target: {currentDelivery?.target}</span>
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        Need {Math.max(0, (currentDelivery?.target || 0) - (currentDelivery?.cumRuns || 0))} runs from {Math.max(0, 120 - (currentDelivery?.actualBallNum || 0))} balls
                      </span>
                    </div>
                  )}

                  {/* Momentum Tag */}
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Momentum:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${
                        momentum === 'Rising'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : momentum === 'Falling'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {momentum === 'Rising' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                      {momentum === 'Falling' && <TrendingDown className="w-3 h-3 text-rose-400" />}
                      {momentum === 'Stable' && <Minus className="w-3 h-3 text-slate-400" />}
                      <span>{momentum}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Narrative / Ball Info */}
              <div className="my-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Striker</span>
                  <span className="text-sm font-bold text-white truncate block">
                    {currentDelivery?.striker}
                  </span>
                  <span className="text-[10px] text-slate-400">Non-striker: {currentDelivery?.nonStriker}</span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Bowler</span>
                  <span className="text-sm font-bold text-amber-400 truncate block">
                    {currentDelivery?.bowler}
                  </span>
                  <span className="text-[10px] text-slate-400">{currentDelivery?.bowlingTeam}</span>
                </div>

                <div className="text-left sm:text-right space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Outcome</span>
                  <div className="flex items-center sm:justify-end gap-2">
                    <span
                      className={`text-base font-black font-mono px-2.5 py-0.5 rounded-lg ${
                        currentDelivery?.isWicket
                          ? 'bg-red-600 text-white animate-pulse'
                          : currentDelivery?.runsOffBat === 6
                          ? 'bg-emerald-600 text-white'
                          : currentDelivery?.runsOffBat === 4
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {currentDelivery?.isWicket ? 'W' : `${currentDelivery?.totalRuns}R`}
                    </span>
                    {currentDelivery?.eventLabel && (
                      <span className="text-xs font-bold text-slate-200">
                        {currentDelivery.eventLabel}
                      </span>
                    )}
                  </div>
                  {currentDelivery?.isWicket && (
                    <span className="text-[10px] text-rose-400 block font-medium">
                      {currentDelivery.playerDismissed} ({currentDelivery.wicketType})
                    </span>
                  )}
                </div>
              </div>

              {/* Rates Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Current RR</span>
                  <span className="font-mono font-bold text-emerald-400">{formatDecimal(currentDelivery?.currentRR || 0, 2)}</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Required RR</span>
                  <span className="font-mono font-bold text-red-400">{formatDecimal(currentDelivery?.requiredRR || 0, 2)}</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Win Prob</span>
                  <span className="font-mono font-bold text-white">{formatPercentage(currentDelivery?.battingWinProb || 50, 1)}</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Ball Swing</span>
                  <span className={`font-mono font-bold ${(currentDelivery?.probSwing || 0) > 0 ? 'text-emerald-400' : (currentDelivery?.probSwing || 0) < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {(currentDelivery?.probSwing || 0) > 0 ? `+${formatDecimal(currentDelivery?.probSwing, 1)}%` : `${formatDecimal(currentDelivery?.probSwing, 1)}%`}
                  </span>
                </div>
              </div>

              {/* TIMELINE SCRUBBER & CONTROLS */}
              <div className="mt-6 pt-5 border-t border-slate-800 space-y-4">
                
                {/* Timeline Range Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Over 0.1</span>
                    <span className="font-bold text-white">Ball {currentBallIdx + 1} of {deliveries.length}</span>
                    <span>Over 20.0</span>
                  </div>
                  <input
                    id="replay-timeline-scrubber"
                    type="range"
                    min={0}
                    max={Math.max(0, deliveries.length - 1)}
                    value={currentBallIdx}
                    onChange={(e) => {
                      setIsPlaying(false);
                      setCurrentBallIdx(parseInt(e.target.value, 10));
                    }}
                    className="w-full accent-red-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>

                {/* Media Control Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      id="replay-start-btn"
                      onClick={jumpToStart}
                      className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                      title="Jump to Start"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      id="replay-step-back-btn"
                      onClick={stepBackward}
                      className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                      title="Previous Ball"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      id="replay-play-toggle-btn"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-950/60"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{isPlaying ? 'Pause' : 'Play Ball-by-Ball'}</span>
                    </button>
                    <button
                      id="replay-step-forward-btn"
                      onClick={stepForward}
                      className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                      title="Next Ball"
                    >
                      <FastForward className="w-4 h-4" />
                    </button>
                    <button
                      id="replay-end-btn"
                      onClick={jumpToEnd}
                      className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                      title="Jump to Match End"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Speed Selector */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase px-1.5">Speed:</span>
                    {[
                      { label: '1x', delay: 1000 },
                      { label: '2x', delay: 500 },
                      { label: '5x', delay: 200 }
                    ].map(s => (
                      <button
                        key={s.label}
                        onClick={() => setPlaybackSpeed(s.delay)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                          playbackSpeed === s.delay
                            ? 'bg-slate-800 text-white border border-slate-700'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE PROBABILITY TIMELINE GRAPH */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Live Win Probability Trajectory
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>{currentDelivery?.battingTeam || 'Batting Team'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>{currentDelivery?.bowlingTeam || 'Defending Team'}</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis
                      dataKey="over"
                      stroke="#64748B"
                      fontSize={10}
                      tickFormatter={(val) => val.endsWith('.1') || val.endsWith('.6') ? val : ''}
                    />
                    <YAxis
                      stroke="#64748B"
                      fontSize={10}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                              <span className="font-bold text-white font-mono block">
                                Over {data.over} (Score: {data.score})
                              </span>
                              <div className="text-emerald-400 font-mono">
                                Batting: {data.battingProb}%
                              </div>
                              <div className="text-rose-400 font-mono">
                                Defending: {data.bowlingProb}%
                              </div>
                              {data.event && (
                                <span className="inline-block text-[10px] font-bold text-amber-400">
                                  {data.event} ({data.striker})
                                </span>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={50} stroke="#475569" strokeDasharray="3 3" />
                    
                    {/* Active vertical marker */}
                    <ReferenceLine x={currentDelivery?.deliveryLabel} stroke="#EF4444" strokeWidth={2} />

                    <Line
                      type="monotone"
                      dataKey="battingProb"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: '#10B981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
                <span>50% threshold indicates dead heat balance</span>
                <span className="text-slate-400">Hover over curve or scrub timeline to inspect moments</span>
              </div>
            </div>
          </div>

          {/* Right Column: Mystic Meter & Turning Points Engine */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Live Mystic Meter Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <MysticMeter
                probability={currentDelivery ? currentDelivery.battingWinProb : 50}
                battingTeam={currentDelivery?.battingTeam}
                bowlingTeam={currentDelivery?.bowlingTeam}
                size="md"
              />
            </div>

            {/* THE TURNING POINTS ENGINE */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    The Turning Points
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                  Model Identified
                </span>
              </div>

              {turningPoints?.maxSwing && (
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-red-950/40 via-slate-950 to-slate-950 border border-red-800/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                      Largest Single-Ball Swing
                    </span>
                    <span className="text-xs font-mono font-bold text-red-400">
                      {turningPoints.maxSwing.swing > 0 ? `+${turningPoints.maxSwing.swing}%` : `${turningPoints.maxSwing.swing}%`}
                    </span>
                  </div>
                  <p className="text-xs text-white font-medium">
                    Over {turningPoints.maxSwing.delivery}: {turningPoints.maxSwing.desc}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{turningPoints.maxSwing.probBefore}% → {turningPoints.maxSwing.probAfter}%</span>
                    <button
                      onClick={() => jumpToDelivery(turningPoints.maxSwing.delivery)}
                      className="text-xs font-bold text-red-400 hover:underline flex items-center gap-1"
                    >
                      <span>Jump</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* List of top turning points */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Top Probability Swings
                </span>

                {(() => {
                  const swingsList: any[] = turningPoints?.topSwings || turningPoints?.turningPoints || [];
                  if (swingsList.length === 0) {
                    return (
                      <p className="text-[11px] text-slate-500 italic py-2">
                        No major turning points recorded for this innings.
                      </p>
                    );
                  }

                  return swingsList.slice(0, 4).map((swing: any, idx: number) => {
                    const deliveryLabel = swing.delivery || swing.over || '0.0';
                    const narrative = swing.desc || swing.narrative || 'Probability swing';
                    const probB = swing.probBefore ?? 50;
                    const probA = swing.probAfter ?? 50;
                    const sw = swing.swing ?? 0;

                    return (
                      <div
                        key={idx}
                        onClick={() => jumpToDelivery(deliveryLabel)}
                        className="p-2.5 rounded-lg bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="space-y-0.5 max-w-[190px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono font-bold text-amber-400">
                              {deliveryLabel}
                            </span>
                            <span className="text-xs text-slate-200 truncate block">
                              {narrative}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {probB}% → {probA}%
                          </span>
                        </div>

                        <span
                          className={`text-xs font-mono font-bold ${
                            sw > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {sw > 0 ? `+${sw}%` : `${sw}%`}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
