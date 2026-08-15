import React from 'react';
import { X, Keyboard, Hand, CheckCircle2, AlertOctagon } from 'lucide-react';
import { useTournamentStore } from '@/store/tournamentStore';

interface KeyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyGuideModal: React.FC<KeyGuideModalProps> = ({ isOpen, onClose }) => {
  const { players } = useTournamentStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black uppercase text-white font-mono tracking-wider">
              Keyboard Controller Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Home Row Mapping */}
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
            Active Home-Row Key Mappings
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {players
              .filter((p) => p.active)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800"
                >
                  <span className="w-8 h-8 rounded-lg bg-neutral-900 border border-amber-500/50 flex items-center justify-center font-black font-mono text-amber-400 text-sm shadow-inner">
                    {p.key.toUpperCase()}
                  </span>
                  <div>
                    <div className={`font-black text-xs ${p.color}`}>{p.name}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">Player Key</div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Step-by-step How to Race */}
        <div className="space-y-2.5 text-xs text-neutral-300 font-sans">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/80">
            <Hand className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">1. Hold Key to Ready: </span>
              Each player places a finger on their key and holds it down.
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">2. 1.0s Lock-In: </span>
              Once all players hold for 1.0s, the drag race stage sequence activates.
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/80">
            <AlertOctagon className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">3. Countdown & False Start: </span>
              Yellow stage lights count down. Do NOT release your key early or you will receive a false start penalty!
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/80">
            <div className="w-4 h-4 rounded-full bg-emerald-400 shrink-0 mt-0.5 flex items-center justify-center font-black text-black text-[9px]">
              GO
            </div>
            <div>
              <span className="font-bold text-white">4. Green Light & Finish: </span>
              On the green flash and 1000Hz tone, release to solve! Tap your key again when finished to lock your time.
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono font-bold text-white transition-all"
        >
          Got It, Let&apos;s Race!
        </button>
      </div>
    </div>
  );
};
