import React, { useState } from 'react';
import { X, Table, Users, Settings, Keyboard } from 'lucide-react';
import { SolveGrid } from './SolveGrid';
import { PlayerManager } from './PlayerManager';
import { TournamentSettingsView } from './TournamentSettingsView';
import { HardwareTester } from './HardwareTester';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'grid' | 'players' | 'settings' | 'hardware';
}

type TabType = 'grid' | 'players' | 'settings' | 'hardware';

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, initialTab = 'grid' }) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-base md:text-lg font-black uppercase text-white tracking-wider font-mono">
              Admin & Tournament Director Control Panel
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-neutral-800/80 bg-neutral-900/30 overflow-x-auto">
          <button
            onClick={() => setActiveTab('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
              activeTab === 'grid'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>The Solve Grid (+2 & DNF)</span>
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
              activeTab === 'players'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Players & Keybinds</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Scoring & Match Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
              activeTab === 'hardware'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>NKRO Key Tester</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'grid' && <SolveGrid />}
          {activeTab === 'players' && <PlayerManager />}
          {activeTab === 'settings' && <TournamentSettingsView />}
          {activeTab === 'hardware' && <HardwareTester />}
        </div>
      </div>
    </div>
  );
};
