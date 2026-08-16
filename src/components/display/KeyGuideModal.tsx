import React from 'react';
import { X, Keyboard, Sparkles, Bot, Zap, Trophy } from 'lucide-react';

interface KeyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyGuideModal: React.FC<KeyGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-900 dark:text-slate-100 font-mono select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">
                Controls & How to Play
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Single-player Spacebar controls vs Bot AI opponents
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Guide */}
        <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
            <div className="p-2 rounded-xl bg-amber-400 text-black font-black shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-900 dark:text-white uppercase block">
                1. Press & Hold Spacebar to Ready Up
              </span>
              <p className="leading-relaxed">
                Hold the <strong className="text-amber-500 font-bold">Spacebar</strong> to enter the starting gate. Active Bot opponents will automatically ready up within 1–2 seconds.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-900 dark:text-white uppercase block">
                2. Wait for Green Light & Release
              </span>
              <p className="leading-relaxed">
                Watch the Christmas tree lights countdown (Yellow 1, 2, 3). Release <strong className="text-amber-500 font-bold">Spacebar</strong> when the light flashes green to launch your solve timer!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-black shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-900 dark:text-white uppercase block">
                3. Tap Spacebar to Stop Timer
              </span>
              <p className="leading-relaxed">
                When you finish your solve, tap <strong className="text-amber-500 font-bold">Spacebar</strong> immediately to lock in your time and placement.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-blue-500 text-white font-black shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-900 dark:text-white uppercase block">
                4. Intelligent Bot Opponents
              </span>
              <p className="leading-relaxed">
                Bots simulate realistic cube solves using Gaussian distributions based on their configured speed and discipline maturity.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
          >
            Got It, Let&apos;s Race
          </button>
        </div>
      </div>
    </div>
  );
};
