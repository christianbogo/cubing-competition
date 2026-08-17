'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getSavedMatches, deleteMatch, renameMatch, SavedMatch } from '@/lib/matchLibrary';
import { HeaderBar } from '@/components/display/HeaderBar';
import { BookOpen, Trash2, Edit2, Check, X, Clock, Trophy, Users } from 'lucide-react';
import { formatPoints } from '@/utils/formatters';

export default function MatchLibraryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<SavedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.isAnonymous)) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && !user.isAnonymous) {
      loadMatches();
    }
  }, [user]);

  const loadMatches = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getSavedMatches(user.uid);
      setMatches(data);
    } catch (err) {
      console.error("Failed to load matches:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (matchId: string) => {
    if (!user) return;
    if (window.confirm("Are you sure you want to delete this match?")) {
      await deleteMatch(user.uid, matchId);
      setMatches(matches.filter(m => m.id !== matchId));
    }
  };

  const handleRenameSubmit = async (matchId: string) => {
    if (!user || !editName.trim()) return;
    await renameMatch(user.uid, matchId, editName.trim());
    setMatches(matches.map(m => m.id === matchId ? { ...m, name: editName.trim() } : m));
    setEditingId(null);
  };

  if (loading || (!user || user.isAnonymous)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950 transition-colors duration-200">
      <HeaderBar />

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight font-mono">Match Library</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Your saved tournament history.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold font-mono text-slate-700 dark:text-slate-300">No Matches Saved</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Finish a match while signed in to see it here.</p>
            <Link href="/host" className="inline-block mt-6 px-6 py-2 bg-amber-500 text-slate-950 font-black text-sm font-mono rounded-xl hover:bg-amber-400 transition-colors">
              Host a Match
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map(match => {
              const isTeamMode = match.settings.tournamentMode === 'TEAMS';
              const winnerName = isTeamMode 
                ? `${match.matchWinnerTeamId} TEAM`
                : match.players?.find(p => p.id === match.matchWinnerPlayerId)?.name || 'Unknown';

              return (
                <div key={match.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:border-amber-500/50 hover:shadow-xl transition-all group flex flex-col">
                  
                  <div className="flex items-start justify-between mb-4">
                    {editingId === match.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-4">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-amber-500 rounded-xl text-sm font-bold font-mono focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit(match.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button onClick={() => handleRenameSubmit(match.id)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h3 className="text-lg font-black font-mono truncate">{match.name}</h3>
                        <button 
                          onClick={() => {
                            setEditingId(match.id);
                            setEditName(match.name);
                          }} 
                          className="p-1.5 text-slate-400 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={() => handleDelete(match.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 mb-6">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(match.savedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {match.players?.length || 0} Players
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      {winnerName}
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Sets</span>
                      <strong className="text-sm font-mono">{match.sets.length}</strong>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Mode</span>
                      <strong className="text-sm font-mono text-cyan-600 dark:text-cyan-400">
                        {match.settings.scoringMode === 'RANK_BASED' ? 'Rank' : 'Diff'}
                      </strong>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
