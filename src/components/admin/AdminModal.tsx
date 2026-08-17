import React from 'react';
import { useRouter } from 'next/navigation';
import { X, LogOut, UserMinus, Bot, UserX } from 'lucide-react';
import { useTournamentStore } from '@/store/tournamentStore';
import { useTimerStore } from '@/store/timerStore';
import { Player } from '@/types/tournament';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const { resetTournament, players, connectedGuests, matchId, setPlayerRole, updatePlayerBotConfig, updatePlayerName, togglePlayerActive, sets } = useTournamentStore();
  const { resetForNewRace } = useTimerStore();

  const isOnlineMatch = matchId && matchId !== 'local';
  
  // A guest is disconnected if they are a PLAYER but not in connectedGuests.
  // Note: Local matches won't hit this because we only check for online matches.
  const disconnectedGuests = isOnlineMatch 
    ? players.filter(p => p.role === 'PLAYER' && !connectedGuests.includes(p.id) && p.active)
    : [];

  const handleReplaceWithBot = (guest: Player) => {
    // Calculate current average and std dev for the guest
    const timesMs: number[] = [];
    sets?.forEach((s) => {
      s.games?.forEach((g) => {
        g.rounds?.forEach((r) => {
          const solve = r.solves?.[guest.id];
          if (solve && r.completed && !solve.isDNF && solve.penalty !== 'DNF' && solve.finalTimeMs > 0) {
            timesMs.push(solve.finalTimeMs);
          }
        });
      });
    });
    
    let avg = 5000;
    let std = 600;
    if (timesMs.length > 0) {
      const sum = timesMs.reduce((a, b) => a + b, 0);
      avg = sum / timesMs.length;
      if (timesMs.length > 1) {
        const variance = timesMs.reduce((acc, t) => acc + Math.pow(t - avg, 2), 0) / timesMs.length;
        std = Math.sqrt(variance);
      } else {
        std = avg * 0.1;
      }
    }

    setPlayerRole(guest.id, 'BOT');
    updatePlayerBotConfig(guest.id, { averageTimeMs: avg, stdDevMs: std, maturity: 'INTERMEDIATE' });
    updatePlayerName(guest.id, guest.name + ' (BOT)');
  };

  const handleLeaveEmpty = (guest: Player) => {
    // Mark as inactive so the game stops waiting for them.
    // If they reconnect, they will be marked active again.
    togglePlayerActive(guest.id);
  };

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
            {/* Manage Disconnected Guests */}
            {disconnectedGuests.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <UserMinus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="font-bold text-amber-900 dark:text-amber-300 uppercase">
                    Disconnected Guests
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  The following players have disconnected. You can replace them with a bot matching their current performance or leave their slot empty to skip them.
                </p>
                <div className="space-y-2">
                  {disconnectedGuests.map(guest => (
                    <div key={guest.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className={`font-black ${guest.color} uppercase text-sm`}>{guest.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReplaceWithBot(guest)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] uppercase transition-colors"
                        >
                          <Bot className="w-3 h-3" /> Bot
                        </button>
                        <button
                          onClick={() => handleLeaveEmpty(guest)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase transition-colors"
                        >
                          <UserX className="w-3 h-3" /> Empty
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
