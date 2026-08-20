import React, { useState, useEffect } from 'react';
import { 
  Award, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ChevronRight, 
  RotateCcw, 
  Zap,
  MapPin,
  Calendar,
  Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AnalystChallenge } from '../types';
import { apiUrl } from '../lib/api';
import { TeamLogo } from './TeamLogo';

interface AnalystChallengeViewProps {
  onSelectMatch?: (matchId: string) => void;
}

export const AnalystChallengeView: React.FC<AnalystChallengeViewProps> = ({ onSelectMatch }) => {
  const [challenges, setChallenges] = useState<AnalystChallenge[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });

  useEffect(() => {
    fetch(apiUrl('/api/challenges'))
      .then(r => r.json())
      .then(d => {
        setChallenges(d || []);
      })
      .catch(() => {});
  }, []);

  const currentChallenge: AnalystChallenge | undefined = challenges[currentIndex];

  const handlePick = (teamPicked: string) => {
    if (isRevealed || !currentChallenge) return;

    setUserChoice(teamPicked);
    setIsRevealed(true);

    const isCorrect = teamPicked === currentChallenge.actualWinner;
    if (isCorrect) {
      setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    } else {
      setScore(prev => ({ correct: prev.correct, total: prev.total + 1 }));
    }
  };

  const handleNext = () => {
    setIsRevealed(false);
    setUserChoice(null);
    setCurrentIndex(prev => (prev + 1) % Math.max(1, challenges.length));
  };

  const handleReset = () => {
    setIsRevealed(false);
    setUserChoice(null);
    setCurrentIndex(0);
    setScore({ correct: 0, total: 0 });
  };

  return (
    <div className="w-full space-y-8 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-800/60 text-amber-400">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              You Be The Analyst
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Test your cricket instincts against historical IPL crunch situations. Can you outpredict the match?
          </p>
        </div>

        {/* Score Counter */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold">
            <span className="text-slate-400">Analyst Score: </span>
            <span className="text-emerald-400 font-mono font-bold">{score.correct}</span>
            <span className="text-slate-400 font-mono"> / {score.total}</span>
            {score.total > 0 && (
              <span className="ml-2 text-slate-400 font-mono text-[11px]">
                ({Math.round((score.correct / score.total) * 100)}%)
              </span>
            )}
          </div>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white"
            title="Reset Score"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {currentChallenge ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Top Challenge Meta */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800 text-xs font-bold font-mono uppercase">
                Challenge {currentIndex + 1} of {challenges.length}
              </span>
              <h2 className="text-base font-bold text-white">
                {currentChallenge.title}
              </h2>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                {currentChallenge.season}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {currentChallenge.venue}
              </span>
            </div>
          </div>

          {/* Situation Brief */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <TeamLogo team={currentChallenge.battingTeam} size="lg" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Chasing Side</span>
                  <span className="text-xl font-black text-white">{currentChallenge.battingTeam}</span>
                </div>
              </div>
              <div className="flex items-center sm:flex-row-reverse gap-3 text-left sm:text-right">
                <TeamLogo team={currentChallenge.bowlingTeam} size="lg" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Defending Side</span>
                  <span className="text-xl font-black text-white">{currentChallenge.bowlingTeam}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-amber-200/90 font-medium leading-relaxed bg-amber-950/30 p-3.5 rounded-xl border border-amber-800/30">
              "{currentChallenge.situation}"
            </p>

            {/* Situation Numeric Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Current Score</span>
                <span className="text-base font-bold font-mono text-white">{currentChallenge.score}</span>
                <span className="text-[10px] text-slate-400">({currentChallenge.overs} ov)</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Runs Needed</span>
                <span className="text-base font-bold font-mono text-amber-400">{currentChallenge.runsNeeded}</span>
                <span className="text-[10px] text-slate-400">off {currentChallenge.ballsRemaining} balls</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Current Run Rate</span>
                <span className="text-base font-bold font-mono text-emerald-400">{currentChallenge.crr}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Required Run Rate</span>
                <span className="text-base font-bold font-mono text-red-400">{currentChallenge.rrr}</span>
              </div>
            </div>
          </div>

          {/* Interactive User Prediction Choices */}
          {!isRevealed ? (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block text-center">
                Who do you back to win from here?
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  id="pick-batting-team-btn"
                  onClick={() => handlePick(currentChallenge.battingTeam)}
                  className="py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-900/60 to-emerald-800/40 hover:from-emerald-800/80 hover:to-emerald-700/60 border border-emerald-600/50 text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-3"
                >
                  <TeamLogo team={currentChallenge.battingTeam} size="md" />
                  <div className="text-left">
                    <span className="text-[10px] text-emerald-300 uppercase font-mono block">Back The Chasers</span>
                    <span className="text-base">{currentChallenge.battingTeam}</span>
                  </div>
                </button>

                <button
                  id="pick-bowling-team-btn"
                  onClick={() => handlePick(currentChallenge.bowlingTeam)}
                  className="py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-900/60 to-rose-800/40 hover:from-rose-800/80 hover:to-rose-700/60 border border-rose-600/50 text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-3"
                >
                  <TeamLogo team={currentChallenge.bowlingTeam} size="md" />
                  <div className="text-left">
                    <span className="text-[10px] text-rose-300 uppercase font-mono block">Back The Defenders</span>
                    <span className="text-base">{currentChallenge.bowlingTeam}</span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Revealed Analysis & Verdict */
            <div className="space-y-5 animate-fade-in">
              {/* Outcome Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  userChoice === currentChallenge.actualWinner
                    ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-200'
                    : 'bg-rose-950/80 border-rose-600/60 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {userChoice === currentChallenge.actualWinner ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-7 h-7 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <h3 className="font-bold text-sm sm:text-base">
                      {userChoice === currentChallenge.actualWinner
                        ? 'Spot On! Excellent Cricket Reading!'
                        : 'Against the Odds! Cricket always surprises.'}
                    </h3>
                    <p className="text-xs opacity-90">
                      Actual Winner: <strong>{currentChallenge.actualWinner}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="px-4 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-200 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-md"
                >
                  <span>Next Challenge</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* CricMystic's Calibrated ML Probability Split */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  CricMystic Model Probability at this exact juncture
                </span>

                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${currentChallenge.cricMysticProbBatting}%` }}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-500"
                    style={{ width: `${currentChallenge.cricMysticProbBowling}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold">
                    {currentChallenge.battingTeam}: {currentChallenge.cricMysticProbBatting}%
                  </span>
                  <span className="text-rose-400 font-bold">
                    {currentChallenge.bowlingTeam}: {currentChallenge.cricMysticProbBowling}%
                  </span>
                </div>
              </div>

              {/* Historical Explanation */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono block">
                  What Happened Next in Reality:
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentChallenge.explanation}
                </p>
                {onSelectMatch && currentChallenge.matchId && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onSelectMatch(currentChallenge.matchId!)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Replay Entire Match Ball-by-Ball</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          Loading challenges...
        </div>
      )}
    </div>
  );
};
