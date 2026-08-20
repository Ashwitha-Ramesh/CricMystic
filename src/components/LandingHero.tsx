import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Zap, 
  Flame, 
  Sparkles, 
  ChevronRight, 
  Database, 
  ShieldCheck, 
  Users, 
  MapPin, 
  Calendar,
  Award,
  ArrowUpRight
} from 'lucide-react';
import { formatNumber } from '../lib/formatters';
import { apiUrl } from '../lib/api';
import { TeamLogo } from './TeamLogo';

interface LandingHeroProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<any>(null);
  const [didYouKnowList, setDidYouKnowList] = useState<any[]>([]);
  const [mysticMoments, setMysticMoments] = useState<any>(null);
  const [activeFactIdx, setActiveFactIdx] = useState(0);

  useEffect(() => {
    fetch(apiUrl('/api/summary'))
      .then(r => r.json())
      .then(d => setSummary(d))
      .catch(() => {});

    fetch(apiUrl('/api/did-you-know'))
      .then(r => r.json())
      .then(d => setDidYouKnowList(d))
      .catch(() => {});

    fetch(apiUrl('/api/mystic-moments'))
      .then(r => r.json())
      .then(d => setMysticMoments(d))
      .catch(() => {});
  }, []);

  const seasonStart = summary?.seasonRange?.min || 2008;
  const seasonEnd = summary?.seasonRange?.max || 2026;

  return (
    <div className="w-full space-y-12 animate-fade-in">
      
      {/* Hero Section */}
      <section className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-slate-800/90 p-6 sm:p-10 lg:p-12 overflow-hidden shadow-2xl">
        {/* Subtle Pitch Grass & Ball Light effect */}
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/60 text-xs font-semibold text-red-300">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>CricMystic • Built by an RCBian ❤️</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                Cricket, decoded <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-400">
                  ball by ball.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl font-normal leading-relaxed">
                Explore IPL matches through win probabilities, match replays, simulations and statistics — all built from real ball-by-ball data spanning {seasonStart} through the {seasonEnd} Final.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-enter-cricmystic-btn"
                onClick={() => onNavigate('predict')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Zap className="w-4 h-4" />
                <span>Enter CricMystic</span>
              </button>

              <button
                id="hero-replay-match-btn"
                onClick={() => onNavigate('replay')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                <span>Replay a Match</span>
              </button>
            </div>

            {/* Dataset Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>IPL Historical Data ({seasonStart}–{seasonEnd})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Temporal Chronological Validation</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Analytics Interactive Card Preview */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
                    Live Model Intelligence
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  Innings 2 Chase
                </span>
              </div>

              {/* Teams & Probabilities Header */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-red-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Royal Challengers</span>
                    <span className="text-2xl font-black font-mono text-emerald-400">68.4%</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Chasing (Favourites)</span>
                  </div>
                  <TeamLogo team="Royal Challengers Bengaluru" size="md" />
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-blue-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Chennai Super Kings</span>
                    <span className="text-2xl font-black font-mono text-rose-400">31.6%</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Defending</span>
                  </div>
                  <TeamLogo team="Chennai Super Kings" size="md" />
                </div>
              </div>

              {/* Match State Visual Mockup */}
              <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono text-white">142/4</span>
                    <span className="text-xs font-medium text-slate-400">16.2 overs</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Target: 186</span>
                    <span className="text-xs font-mono font-bold text-amber-400">Need 44 off 22</span>
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full w-[68%]" />
                  <div className="bg-rose-500 h-full w-[32%]" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                  <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">Current RR</span>
                    <span className="font-mono font-bold text-slate-200">8.70</span>
                  </div>
                  <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">Required RR</span>
                    <span className="font-mono font-bold text-red-400">12.00</span>
                  </div>
                  <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">Wickets Left</span>
                    <span className="font-mono font-bold text-emerald-400">6 in hand</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Calibrated Logistic Classifier</span>
                <button
                  onClick={() => onNavigate('predict')}
                  className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 text-[11px]"
                >
                  <span>Launch Live Predictor</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Dataset Metrics Counter Bar */}
        <div className="relative z-10 mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60 min-w-0">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white block truncate">
              {summary ? summary.seasonsCount : '18'}
            </span>
            <span className="text-xs text-slate-400 font-medium truncate block">IPL Seasons ({seasonStart}–{seasonEnd})</span>
          </div>

          <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60 min-w-0">
            <span className="text-2xl sm:text-3xl font-black font-mono text-red-400 block truncate">
              {summary ? formatNumber(summary.totalMatches) : '1,007'}
            </span>
            <span className="text-xs text-slate-400 font-medium truncate block">Matches Analyzed</span>
          </div>

          <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60 min-w-0">
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 block truncate">
              {summary ? formatNumber(summary.totalDeliveries) : '239,959'}
            </span>
            <span className="text-xs text-slate-400 font-medium truncate block">Ball-by-Ball Deliveries</span>
          </div>

          <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60 min-w-0">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 block truncate">
              {summary ? summary.teamsCount : '15'}
            </span>
            <span className="text-xs text-slate-400 font-medium truncate block">Franchises Normalized</span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60 min-w-0">
            <span className="text-2xl sm:text-3xl font-black font-mono text-blue-400 block truncate">
              {summary ? summary.venuesCount : '35'}
            </span>
            <span className="text-xs text-slate-400 font-medium truncate block">Stadium Venues</span>
          </div>
        </div>
      </section>

      {/* TODAY'S CRICKET DESK SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Today's Cricket Desk
            </h2>
          </div>
          <span className="text-xs text-slate-400 italic">
            "Trust the numbers. Feel the game."
          </span>
        </div>

        {/* Feature Interactive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Quick Predict Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-red-500/40 transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">What's the game saying?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter any live or hypothetical match state — overs, runs, wickets, target, and venue — to estimate instant win probability with the signature Mystic Meter.
              </p>
            </div>

            <button
              id="desk-predict-btn"
              onClick={() => onNavigate('predict')}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-red-600 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
            >
              <span>Predict a Match</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Rewind a Match Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Relive the turning points.</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Step ball-by-ball through 18 seasons of IPL thrillers. Watch how win probability swung with every boundary, wicket, and dot-ball cluster.
              </p>
            </div>

            <button
              id="desk-replay-btn"
              onClick={() => onNavigate('replay')}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
            >
              <span>Open Match Replay</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* What-If Simulator Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-amber-500/40 transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Change the game.</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                "What if they had 2 more wickets in hand? What if target was 10 runs higher?" Manipulate scenarios and see the model instantly recompute probabilities.
              </p>
            </div>

            <button
              id="desk-simulator-btn"
              onClick={() => onNavigate('simulator')}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-amber-600 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
            >
              <span>Open Match Simulator</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* MYSTIC MOMENTS & DETERMINISTIC DID YOU KNOW SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Mystic Moments Spotlight */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <h3 className="text-base font-bold text-white">Mystic Moments in IPL History</h3>
            </div>
            <button
              onClick={() => onNavigate('explore')}
              className="text-xs text-red-400 hover:underline"
            >
              View All Moments
            </button>
          </div>

          <div className="space-y-3">
            {(() => {
              const momentsList: any[] = Array.isArray(mysticMoments)
                ? mysticMoments
                : (mysticMoments?.biggestChases || mysticMoments?.moments || []);
              
              if (momentsList.length === 0) {
                return (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    Loading historical moments...
                  </p>
                );
              }

              return momentsList.slice(0, 3).map((moment: any, i: number) => {
                const teams = Array.isArray(moment.teams) ? moment.teams : [moment.chasingTeam || 'Team 1', moment.opposingTeam || 'Team 2'];
                const targetMatchId = moment.matchId || moment.match_id;

                return (
                  <div
                    key={moment.id || i}
                    onClick={() => targetMatchId && onNavigate('replay', { matchId: targetMatchId })}
                    className="bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 p-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center -space-x-1.5 shrink-0">
                        <TeamLogo team={teams[0]} size="xs" />
                        <TeamLogo team={teams[1]} size="xs" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white truncate">{teams[0]}</span>
                          <span className="text-[10px] text-slate-400 font-mono">vs</span>
                          <span className="text-xs text-slate-300 truncate">{teams[1]}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">{moment.season}</span>
                          {moment.tag && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800/60 font-mono">
                              {moment.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {moment.summary || moment.title || `${moment.winner} won by ${moment.margin}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold shrink-0 ml-2">
                      <span>Replay</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Deterministic "Did You Know?" Carousel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">💡</span>
                <h3 className="text-base font-bold text-white">Did You Know?</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Dataset Verified
              </span>
            </div>

            {didYouKnowList.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 block">
                  {didYouKnowList[activeFactIdx]?.tag || 'Cricket Fact'}
                </span>
                <h4 className="text-sm font-bold text-slate-200">
                  {didYouKnowList[activeFactIdx]?.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {didYouKnowList[activeFactIdx]?.fact}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
            <div className="flex gap-1.5">
              {didYouKnowList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFactIdx(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeFactIdx === idx ? 'bg-red-500 w-5' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setActiveFactIdx((prev) => (prev + 1) % Math.max(1, didYouKnowList.length))}
              className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
            >
              <span>Next Fact</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* EXPLORE IPL SHORTCUTS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Explore IPL Archives</h3>
          <button onClick={() => onNavigate('explore')} className="text-xs text-red-400 hover:underline">
            View Complete Database
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('explore', { section: 'teams' })}
            className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer transition-all group"
          >
            <Users className="w-6 h-6 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white">Teams Archive</h4>
            <p className="text-[11px] text-slate-400 mt-1">Win rates, title counts & franchise records</p>
          </div>

          <div
            onClick={() => onNavigate('explore', { section: 'seasons' })}
            className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer transition-all group"
          >
            <Calendar className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white">Seasons Journey</h4>
            <p className="text-[11px] text-slate-400 mt-1">{seasonStart} to {seasonEnd} match breakdowns & champions</p>
          </div>

          <div
            onClick={() => onNavigate('explore', { section: 'venues' })}
            className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer transition-all group"
          >
            <MapPin className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white">Venues & Dynamics</h4>
            <p className="text-[11px] text-slate-400 mt-1">Chinnaswamy, Wankhede, Eden chasing bias</p>
          </div>

          <div
            onClick={() => onNavigate('explore', { section: 'players' })}
            className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer transition-all group"
          >
            <Award className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white">Player Legends</h4>
            <p className="text-[11px] text-slate-400 mt-1">Top run scorers, wicket takers & records</p>
          </div>
        </div>
      </section>
    </div>
  );
};
