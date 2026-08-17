'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ActivityFeedItem, PenaltyType } from '@/types/tournament';
import { useTournamentStore } from '@/store/tournamentStore';
import { useTimerStore } from '@/store/timerStore';
import { PanelRightClose, X, Send } from 'lucide-react';
import { ref, push } from 'firebase/database';
import { database } from '@/lib/firebase';

export const ActivityFeed: React.FC = () => {
  const {
    activityFeed,
    applyPenalty,
    isActivityFeedOpen,
    toggleActivityFeed,
    sets,
    currentSetIndex,
    currentGameIndex,
    currentRoundIndex,
    matchId,
    players,
  } = useTournamentStore();
  const raceState = useTimerStore((s) => s.raceState);
  const [selectedItem, setSelectedItem] = useState<ActivityFeedItem | null>(null);
  const [chatInput, setChatInput] = useState('');
  const feedContainerRef = useRef<HTMLDivElement>(null);

  const currentGame = sets[currentSetIndex]?.games[currentGameIndex];
  const activeGameId = currentGame?.id;
  const isBotMatch = matchId === 'local' || !players.some(p => p.role === 'PLAYER');

  // Close popup if clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (feedContainerRef.current && !feedContainerRef.current.contains(e.target as Node)) {
        setSelectedItem(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    
    const handleGuestDisconnect = (e: CustomEvent<{ guestId: string }>) => {
      const { players, addActivityItem } = useTournamentStore.getState();
      const guest = players.find(p => p.id === e.detail.guestId);
      if (guest) {
        addActivityItem({
          type: 'CHAT_MESSAGE',
          playerName: 'System',
          playerColor: 'text-slate-500',
          message: `${guest.name} disconnected.`,
        });
      }
    };
    window.addEventListener('guestDisconnected', handleGuestDisconnect as EventListener);
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('guestDisconnected', handleGuestDisconnect as EventListener);
    };
  }, []);

  const handleItemClick = (e: React.MouseEvent, item: ActivityFeedItem) => {
    if (item.type !== 'SOLVE_FINISHED' || !item.playerId) return;
    setSelectedItem(item);
  };

  const handleApplyPenalty = (penalty: PenaltyType) => {
    if (!selectedItem || !selectedItem.playerId) return;
    const gameId = selectedItem.gameId || '';
    const roundId = selectedItem.roundIndex !== undefined ? `round-${gameId}-${selectedItem.roundIndex + 1}` : undefined;
    
    const { localPlayerId, matchId: currentMatchId, players: currentPlayers } = useTournamentStore.getState();
    const isHost = currentPlayers.find(p => p.id === localPlayerId)?.role === 'HOST';

    if (isHost || currentMatchId === 'local' || !currentMatchId) {
      applyPenalty(gameId, selectedItem.playerId, penalty, roundId);
    } else {
      push(ref(database, `matches/${currentMatchId}/penaltyRequests`), {
        gameId,
        playerId: selectedItem.playerId,
        roundId: roundId || null,
        penalty
      });
    }
    setSelectedItem(null);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { matchId, localPlayerId, players, addActivityItem } = useTournamentStore.getState();
    if (!chatInput.trim() || !localPlayerId) return;

    const me = players.find((p) => p.id === localPlayerId);
    if (!me) return;

    const messagePayload: any = {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'CHAT_MESSAGE',
      playerId: me.id,
      playerName: me.name,
      playerColor: me.color,
      message: chatInput.trim(),
      timestamp: Date.now(),
    };
    if (me.team) messagePayload.team = me.team;

    if (matchId && matchId !== 'local') {
      push(ref(database, `matches/${matchId}/chatMessages`), messagePayload);
    } else {
      addActivityItem(messagePayload);
    }
    setChatInput('');
  };

  if (!isActivityFeedOpen) {
    return null;
  }

  // Strip any legacy emojis from messages for clean text presentation
  const sanitizeMessage = (msg: string) => {
    return msg.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
  };

  return (
    <aside
      ref={feedContainerRef}
      className="w-full lg:w-72 xl:w-80 flex flex-col bg-transparent border-0 p-3 h-full max-h-[85vh] overflow-hidden select-none shrink-0 transition-all duration-200"
    >
      {/* Feed Header (Clean typography without emojis) */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/40 dark:border-slate-800/40">
        <h3 className="text-xs font-mono font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Activity Feed
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            Live Events
          </span>
          <button
            onClick={() => toggleActivityFeed(false)}
            title="Hide Activity Feed"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <PanelRightClose className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chat Input */}
      {(!isBotMatch) && (
        <div className="pb-2 mb-2 border-b border-slate-200/40 dark:border-slate-800/40 shrink-0">
          <form onSubmit={handleChatSubmit} className="relative flex items-center">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type message..."
              className="w-full bg-transparent border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="absolute right-1 p-1.5 text-slate-400 hover:text-amber-500 disabled:opacity-50 disabled:hover:text-slate-400 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {activityFeed.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-slate-400 dark:text-slate-600">
            Awaiting race events...
          </div>
        ) : (
          activityFeed.map((item) => {
            const isLatestRoundSolve =
              raceState === 'FINISHED' &&
              item.type === 'SOLVE_FINISHED' &&
              !!item.gameId &&
              !!activeGameId &&
              item.gameId === activeGameId &&
              item.roundIndex === currentRoundIndex;
              
            const isHost = players.find(p => p.id === useTournamentStore.getState().localPlayerId)?.role === 'HOST';
            const isMe = item.playerId === useTournamentStore.getState().localPlayerId;
            const isClickable = item.type === 'SOLVE_FINISHED' && !!item.playerId && (isHost || (isMe && isLatestRoundSolve));

            return (
              <div
                key={item.id}
                onClick={(e) => isClickable && handleItemClick(e, item)}
                className={`py-1 px-2 rounded-lg text-xs font-mono transition-all animate-in fade-in slide-in-from-top-1 duration-150 ${
                  isClickable ? 'cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-900/60' : ''
                } ${
                  isLatestRoundSolve
                    ? 'bg-amber-500/15 dark:bg-amber-500/20 text-slate-950 dark:text-white font-bold border-l-2 border-amber-500'
                    : item.type === 'MATCH_WON' || item.type === 'SET_WON'
                    ? 'text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10'
                    : item.type === 'RECORD_BROKEN'
                    ? 'text-rose-600 dark:text-rose-400 font-semibold bg-rose-500/10'
                    : item.type === 'FALSE_START'
                    ? 'text-red-600 dark:text-red-400'
                    : item.type === 'GAME_WON'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : item.type === 'PENALTY_APPLIED'
                    ? 'text-amber-700 dark:text-amber-300'
                    : item.type === 'CHAT_MESSAGE'
                    ? 'text-slate-900 dark:text-slate-100 bg-slate-200/40 dark:bg-slate-800/60'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* Bullet dot matching text color instead of bright green */}
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />

                    <span className="truncate text-[11px] leading-tight font-medium">
                      {item.type === 'CHAT_MESSAGE' && (
                        <span className={`${item.playerColor || ''} font-bold mr-1`}>{item.playerName}:</span>
                      )}
                      {sanitizeMessage(item.message)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.penalty && item.penalty !== 'NONE' && (
                      <span
                        className={`text-[9px] font-black px-1 rounded ${
                          item.penalty === 'DNF'
                            ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'
                            : 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400'
                        }`}
                      >
                        {item.penalty === 'DNF' ? 'DNF' : '+2'}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Admin Quick Penalty Popover */}
      {selectedItem && selectedItem.playerId && (
        <div className="mt-2 p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-xl space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-white uppercase truncate max-w-[170px]">
              Adjust: {selectedItem.playerName}
            </span>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleApplyPenalty('NONE')}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                selectedItem.penalty === 'NONE' || !selectedItem.penalty
                  ? 'bg-emerald-500 text-white border-emerald-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => handleApplyPenalty('PLUS_2')}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                selectedItem.penalty === 'PLUS_2'
                  ? 'bg-orange-500 text-white border-orange-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              +2.00s
            </button>
            <button
              type="button"
              onClick={() => handleApplyPenalty('DNF')}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                selectedItem.penalty === 'DNF'
                  ? 'bg-red-500 text-white border-red-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              DNF
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
