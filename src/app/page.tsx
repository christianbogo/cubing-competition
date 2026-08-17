'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, Users, MonitorSmartphone, ArrowRight } from 'lucide-react';
import { HeaderBar } from '@/components/display/HeaderBar';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950 transition-colors duration-200">
      
      {/* Header */}
      <HeaderBar />

      {/* Hero Section */}
      <main className="flex-1 w-full flex flex-col items-center justify-center p-6 z-20">
        <div className="text-center max-w-3xl mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 font-mono leading-none mb-6">
            The Ultimate <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Speedcubing</span> Arena
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Host professional drag-race style cubing competitions, challenge your friends, or practice against AI bots with dynamic maturity scaling.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <Link href="/host" className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-6 text-amber-500 group-hover:scale-110 transition-transform duration-300">
              <Trophy className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black uppercase font-mono mb-2">Host Match</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 flex-1">
              Create a new tournament, configure scoring, add players, and manage the competition from the host controller.
            </p>
            <div className="flex items-center text-amber-500 font-bold text-sm uppercase tracking-wider font-mono">
              Start Hosting <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link href="/join" className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:border-cyan-500/50 transition-all duration-300 overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="w-14 h-14 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center mb-6 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black uppercase font-mono mb-2">Join Match</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 flex-1">
              Connect to an active arena as a spectator or participant using a Match ID. Follow the action in real-time.
            </p>
            <div className="flex items-center text-cyan-600 dark:text-cyan-400 font-bold text-sm uppercase tracking-wider font-mono">
              Connect <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link href="/host?mode=local" className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <MonitorSmartphone className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black uppercase font-mono mb-2">Local Match</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 flex-1">
              Play offline or on a single device. Perfect for practice sessions or couch-multiplayer with friends.
            </p>
            <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-wider font-mono">
              Play Local <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
          
        </div>
      </main>

      <footer className="w-full py-6 text-center text-slate-500 dark:text-slate-500 text-xs font-mono">
        &copy; {new Date().getFullYear()} Cube Online Arena. All rights reserved.
      </footer>
    </div>
  );
}
