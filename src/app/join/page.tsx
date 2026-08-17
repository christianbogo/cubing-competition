'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeaderBar } from '@/components/display/HeaderBar';

export default function JoinPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [position, setPosition] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && position.trim()) {
      router.push(`/arena/${roomId.trim()}?position=${position.trim()}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950 transition-colors duration-200">
      <HeaderBar />
      
      <main className="flex-1 w-full flex flex-col items-center justify-center py-6 z-20 px-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 font-mono mb-2 text-center">
            Join <span className="text-amber-500">Match</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 text-center">
            Enter the 6-digit Room Code and your assigned Position to join.
          </p>
          
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1.5">
                  Room Code
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="e.g. 123456"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors text-center font-bold tracking-widest"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1.5">
                  Your Position
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors text-center font-bold"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={!roomId.trim() || !position.trim()}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm font-mono uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 mt-2"
            >
              Confirm & Join
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
