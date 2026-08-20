import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ChevronRight, 
  Sparkles, 
  Award,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MysticChallenge } from '../types';
import { apiUrl } from '../lib/api';

export const MysticChallengeView: React.FC = () => {
  const [challenges, setChallenges] = useState<MysticChallenge[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    fetch(apiUrl('/api/mystic-challenges'))
      .then(r => r.json())
      .then(d => setChallenges(d || []))
      .catch(() => {});
  }, []);

  const current = challenges[currentIndex];

  const handleSelect = (option: string) => {
    if (isRevealed || !current) return;
    setSelectedOption(option);
    setIsRevealed(true);

    if (option === current.correctAnswer) {
      setScore(prev => prev + 1);
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  };

  const handleNext = () => {
    setIsRevealed(false);
    setSelectedOption(null);
    setCurrentIndex(prev => (prev + 1) % Math.max(1, challenges.length));
  };

  return (
    <div className="w-full space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-400">
              <Flame className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">Mystic Delivery Challenge</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Can you guess the ball outcome that occurred in iconic moments?
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300">
          Streak: <span className="text-emerald-400 font-mono font-bold">{score}</span> / {challenges.length}
        </div>
      </div>

      {current ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold text-red-400 font-mono">
              Moment {currentIndex + 1} of {challenges.length}
            </span>
            <span className="font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              {current.matchTitle}
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">
              {current.situation}
            </h3>
            <p className="text-xs font-mono text-amber-400">
              Delivery: Over {current.over}
            </p>
          </div>

          {!isRevealed ? (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                What happened on this delivery?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(current.options || []).map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(opt)}
                    className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left text-xs font-bold text-slate-200 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-fade-in">
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  selectedOption === current.correctAnswer
                    ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-200'
                    : 'bg-rose-950/80 border-rose-600/60 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {selectedOption === current.correctAnswer ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm">
                      {selectedOption === current.correctAnswer ? 'Correct!' : 'Incorrect'}
                    </h4>
                    <p className="text-xs opacity-90">
                      Outcome: <strong>{current.correctAnswer}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="px-4 py-2 rounded-xl bg-white text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  <span>Next Moment</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Probability Swing:</span>
                  <span className="text-emerald-400 font-bold">{current.swing}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {current.actualOutcome}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
