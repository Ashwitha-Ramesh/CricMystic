import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  RotateCcw, 
  TrendingUp, 
  HelpCircle, 
  Flame, 
  ShieldAlert, 
  CheckCircle2, 
  Sliders, 
  ChevronRight, 
  Share2,
  RefreshCw
} from 'lucide-react';
import { MysticMeter } from './MysticMeter';
import { PredictionResult, TeamData, VenueData } from '../types';
import { apiUrl } from '../lib/api';

interface PredictionViewProps {
  initialState?: Partial<{
    battingTeam: string;
    bowlingTeam: string;
    venue: string;
    currentScore: number;
    wicketsLost: number;
    overs: number;
    target: number;
  }>;
}

export const PredictionView: React.FC<PredictionViewProps> = ({ initialState }) => {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [venues, setVenues] = useState<VenueData[]>([]);
  
  // Match inputs
  const [battingTeam, setBattingTeam] = useState<string>(initialState?.battingTeam || 'Royal Challengers Bengaluru');
  const [bowlingTeam, setBowlingTeam] = useState<string>(initialState?.bowlingTeam || 'Chennai Super Kings');
  const [venue, setVenue] = useState<string>(initialState?.venue || 'M. Chinnaswamy Stadium, Bengaluru');
  const [innings, setInnings] = useState<number>(2);
  const [currentScore, setCurrentScore] = useState<number>(initialState?.currentScore ?? 142);
  const [wicketsLost, setWicketsLost] = useState<number>(initialState?.wicketsLost ?? 4);
  const [oversFloat, setOversFloat] = useState<number>(initialState?.overs ?? 16.2);
  const [target, setTarget] = useState<number>(initialState?.target ?? 186);
  const [tossWinner, setTossWinner] = useState<string>('Royal Challengers Bengaluru');
  const [tossDecision, setTossDecision] = useState<string>('field');

  // Advanced momentum adjustments
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [recentRuns6, setRecentRuns6] = useState<number>(10);
  const [recentRuns12, setRecentRuns12] = useState<number>(21);
  const [recentWickets12, setRecentWickets12] = useState<number>(0);
  const [dotRatio, setDotRatio] = useState<number>(0.32);

  // Result state
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(apiUrl('/api/teams'))
      .then(r => r.json())
      .then(data => setTeams(data))
      .catch(() => {});

    fetch(apiUrl('/api/venues'))
      .then(r => r.json())
      .then(data => setVenues(data))
      .catch(() => {});
  }, []);

  const runPrediction = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/predict'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battingTeam,
          bowlingTeam,
          venue,
          innings,
          currentScore,
          wicketsLost,
          overs: oversFloat,
          target,
          tossWinner,
          tossDecision,
          last6Runs: recentRuns6,
          last12Runs: recentRuns12,
          last12Wickets: recentWickets12,
          dotRatio
        })
      });
      const data = await res.json();
      setPrediction(data);
    } catch (e) {
      console.error('Prediction failed', e);
    } finally {
      setLoading(false);
    }
  };

  // Re-run whenever core match state variables change
  useEffect(() => {
    runPrediction();
  }, [
    battingTeam,
    bowlingTeam,
    venue,
    innings,
    currentScore,
    wicketsLost,
    oversFloat,
    target,
    tossWinner,
    tossDecision,
    recentRuns6,
    recentRuns12,
    recentWickets12,
    dotRatio
  ]);

  // Quick preset scenario loaders
  const loadPreset = (presetName: string) => {
    if (presetName === 'rcb_chase_chinnaswamy') {
      setBattingTeam('Royal Challengers Bengaluru');
      setBowlingTeam('Chennai Super Kings');
      setVenue('M. Chinnaswamy Stadium, Bengaluru');
      setCurrentScore(168);
      setWicketsLost(4);
      setOversFloat(17.2);
      setTarget(205);
      setTossWinner('Royal Challengers Bengaluru');
    } else if (presetName === 'death_over_squeeze') {
      setBattingTeam('Mumbai Indians');
      setBowlingTeam('Kolkata Knight Riders');
      setVenue('Wankhede Stadium, Mumbai');
      setCurrentScore(172);
      setWicketsLost(7);
      setOversFloat(18.4);
      setTarget(198);
      setTossWinner('Kolkata Knight Riders');
    } else if (presetName === 'powerplay_dominance') {
      setBattingTeam('Sunrisers Hyderabad');
      setBowlingTeam('Rajasthan Royals');
      setVenue('Rajiv Gandhi International Stadium, Hyderabad');
      setCurrentScore(78);
      setWicketsLost(1);
      setOversFloat(6.0);
      setTarget(180);
      setTossWinner('Sunrisers Hyderabad');
    }
  };

  const handleSwapTeams = () => {
    const temp = battingTeam;
    setBattingTeam(bowlingTeam);
    setBowlingTeam(temp);
  };

  const overNum = Math.floor(oversFloat);
  const ballInOver = Math.round((oversFloat - overNum) * 10);
  const totalBallsBowled = Math.min(120, overNum * 6 + ballInOver);
  const ballsRemaining = Math.max(0, 120 - totalBallsBowled);
  const runsRequired = Math.max(0, target - currentScore);
  const currentRR = totalBallsBowled > 0 ? (currentScore / (totalBallsBowled / 6)).toFixed(2) : '0.00';
  const requiredRR = ballsRemaining > 0 ? (runsRequired / (ballsRemaining / 6)).toFixed(2) : (runsRequired > 0 ? '99.00' : '0.00');

  return (
    <div className="w-full space-y-8 animate-fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-950/80 border border-red-800/60 text-red-400">
              <Zap className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Win Probability Predictor
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time calibrated match reading based on historical ball-by-ball IPL dynamics.
          </p>
        </div>

        {/* Presets Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold">Try Scenarios:</span>
          <button
            onClick={() => loadPreset('rcb_chase_chinnaswamy')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-red-400 transition-colors"
          >
            RCB Chinnaswamy Thriller
          </button>
          <button
            onClick={() => loadPreset('death_over_squeeze')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-blue-400 transition-colors"
          >
            Death Overs Squeeze
          </button>
          <button
            onClick={() => loadPreset('powerplay_dominance')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-amber-400 transition-colors"
          >
            Powerplay Blitz
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Mystic Meter & Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Match Setup Inputs */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Match Configuration
              </h3>
              <button
                onClick={handleSwapTeams}
                className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Swap Teams</span>
              </button>
            </div>

            {/* Team Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Batting / Chasing Team
                </label>
                <select
                  id="predict-batting-team-select"
                  value={battingTeam}
                  onChange={(e) => setBattingTeam(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-3 py-2.5 text-sm text-white font-semibold outline-none transition-all"
                >
                  {teams.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Defending / Bowling Team
                </label>
                <select
                  id="predict-bowling-team-select"
                  value={bowlingTeam}
                  onChange={(e) => setBowlingTeam(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-3 py-2.5 text-sm text-white font-semibold outline-none transition-all"
                >
                  {teams.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Venue Selector */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Match Stadium Venue
              </label>
              <select
                id="predict-venue-select"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-3 py-2.5 text-xs text-white font-medium outline-none transition-all"
              >
                {venues.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.matches} matches, {v.chasingWinRate.toFixed(1)}% chase win rate)
                  </option>
                ))}
              </select>
            </div>

            {/* Innings Target & Current Score */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Target Score
                </label>
                <input
                  id="predict-target-input"
                  type="number"
                  min={50}
                  max={320}
                  value={target}
                  onChange={(e) => setTarget(Math.max(1, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Current Runs
                </label>
                <input
                  id="predict-current-score-input"
                  type="number"
                  min={0}
                  max={320}
                  value={currentScore}
                  onChange={(e) => setCurrentScore(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-400 outline-none"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Wickets Lost ({wicketsLost}/10)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="predict-wickets-range"
                    type="range"
                    min={0}
                    max={10}
                    value={wicketsLost}
                    onChange={(e) => setWicketsLost(parseInt(e.target.value, 10))}
                    className="w-full accent-red-500 cursor-pointer"
                  />
                  <span className="text-sm font-mono font-bold text-rose-400 w-6 text-right">
                    {wicketsLost}
                  </span>
                </div>
              </div>
            </div>

            {/* Overs Stepper & Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Overs Bowled: <span className="text-white font-mono">{oversFloat.toFixed(1)} / 20.0</span>
                </label>
                <span className="text-xs font-mono text-slate-400">
                  {ballsRemaining} balls left
                </span>
              </div>
              <input
                id="predict-overs-range"
                type="range"
                min={0.1}
                max={20.0}
                step={0.1}
                value={oversFloat}
                onChange={(e) => setOversFloat(parseFloat(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>0.1 (Start)</span>
                <span>6.0 (PP End)</span>
                <span>15.0 (Middle)</span>
                <span>20.0 (Death Finish)</span>
              </div>
            </div>

            {/* Toss Settings */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Toss Winner
                </label>
                <select
                  value={tossWinner}
                  onChange={(e) => setTossWinner(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none"
                >
                  <option value={battingTeam}>{battingTeam}</option>
                  <option value={bowlingTeam}>{bowlingTeam}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Toss Choice
                </label>
                <select
                  value={tossDecision}
                  onChange={(e) => setTossDecision(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none"
                >
                  <option value="field">Elected to Field</option>
                  <option value="bat">Elected to Bat</option>
                </select>
              </div>
            </div>

            {/* Advanced Momentum Toggle */}
            <div className="pt-2">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-red-400" />
                <span>{showAdvanced ? 'Hide Momentum Micro-Factors' : 'Fine-Tune Recent Momentum (Last Overs)'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3 animate-fade-in text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block mb-1">Runs last 6 balls: {recentRuns6}</span>
                      <input
                        type="range"
                        min={0}
                        max={36}
                        value={recentRuns6}
                        onChange={(e) => setRecentRuns6(parseInt(e.target.value, 10))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Runs last 12 balls: {recentRuns12}</span>
                      <input
                        type="range"
                        min={0}
                        max={60}
                        value={recentRuns12}
                        onChange={(e) => setRecentRuns12(parseInt(e.target.value, 10))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block mb-1">Wickets in last 2 overs: {recentWickets12}</span>
                      <input
                        type="range"
                        min={0}
                        max={4}
                        value={recentWickets12}
                        onChange={(e) => setRecentWickets12(parseInt(e.target.value, 10))}
                        className="w-full accent-rose-500"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Dot ball ratio: {(dotRatio * 100).toFixed(0)}%</span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={dotRatio}
                        onChange={(e) => setDotRatio(parseFloat(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Prediction Reading & The Signature Mystic Meter */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Main Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Current Match Reading
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Target: {target}
              </span>
            </div>

            {/* Signature Mystic Meter */}
            <div className="my-2">
              <MysticMeter
                probability={prediction ? prediction.battingProbability : 50}
                battingTeam={battingTeam}
                bowlingTeam={bowlingTeam}
                size="lg"
              />
            </div>

            {/* Calculated Match Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-800 text-center">
              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Balls Left</span>
                <span className="text-base font-black font-mono text-white">{ballsRemaining}</span>
              </div>
              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Runs Needed</span>
                <span className="text-base font-black font-mono text-amber-400">{runsRequired}</span>
              </div>
              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Current RR</span>
                <span className="text-base font-black font-mono text-emerald-400">{currentRR}</span>
              </div>
              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Required RR</span>
                <span className="text-base font-black font-mono text-red-400">{requiredRR}</span>
              </div>
            </div>

            {/* Natural Narrative Summary */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/80">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {prediction?.meterDescription || 'Evaluating historical match vector...'}
              </p>
            </div>
          </div>

          {/* Model Attribution Factor Breakdown */}
          {prediction && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Why Batting Favoured */}
              <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Why balance favours {battingTeam}</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {(prediction.whyBattingFavoured || []).map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Why Bowling Can Turn It Around */}
              <div className="bg-slate-900/80 border border-rose-900/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase tracking-wide">
                  <ShieldAlert className="w-4 h-4" />
                  <span>How {bowlingTeam} can turn it around</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {(prediction.whyBowlingCanTurn || []).map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
