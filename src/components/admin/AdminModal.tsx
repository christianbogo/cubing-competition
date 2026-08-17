import React from 'react';
import { useRouter } from 'next/navigation';
import { X, LogOut } from 'lucide-react';
import { useTournamentStore } from '@/store/tournamentStore';
import { useTimerStore } from '@/store/timerStore';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const { resetTournament } = useTournamentStore();
  const { resetForNewRace } = useTimerStore();

  if (!isOpen) return null;

  const handleEndMatch = () => {
    const currentMatchId = useTournamentStore.getState().matchId;
    if (currentMatchId && currentMatchId !== 'local') {
      import('firebase/database').then(({ ref, remove }) => {
        import('@/lib/firebase').then(({ database }) => {
          remove(ref(database, `matches/${currentMatchId}`)).catch(e => console.error(e));
        });
      });
    }

    resetForNewRace();
    resetTournament();
    onClose();
    router.push('/');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider font-mono">
              Match Controls
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 font-mono text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            Select an action for the ongoing match. Match settings and player configurations cannot be altered mid-match to preserve competition integrity.
          </p>

          <div className="space-y-3 pt-2">
            {/* End Match */}
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h4 className="font-bold text-rose-900 dark:text-rose-300 uppercase">
                  End Match
                </h4>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Ends the current match and returns to the home page.
              </p>
              <button
                onClick={handleEndMatch}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase transition-all shadow-sm active:scale-98"
              >
                End Match
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors"
            >
              Resume Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
