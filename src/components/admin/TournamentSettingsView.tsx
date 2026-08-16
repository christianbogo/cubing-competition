import React from 'react';
import { Settings, ShieldCheck, Zap, ChevronDown, Flag, Target } from 'lucide-react';
import { useTournamentStore } from '@/store/tournamentStore';

export const TournamentSettingsView: React.FC = () => {
  const { settings, updateSettings, resetTournament } = useTournamentStore();

  return (
    <div className="w-full flex flex-col gap-6">
      <div>
        <h3 className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-500" />
          Tournament Rules & Scoring Engine
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure multi-round game victory thresholds, tournament structure, and penalty multipliers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scoring Mode Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Primary Scoring Method
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateSettings({ scoringMode: 'RANK_BASED' })}
              className={`p-3 rounded-xl border text-left transition-all ${
                settings.scoringMode === 'RANK_BASED'
                  ? 'bg-amber-100/70 dark:bg-amber-500/20 border-amber-400 dark:border-amber-500/60 text-slate-900 dark:text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">Rank-Based</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Point Floor to win Game. High score wins.
              </div>
            </button>

            <button
              onClick={() => updateSettings({ scoringMode: 'DIFFERENTIAL' })}
              className={`p-3 rounded-xl border text-left transition-all ${
                settings.scoringMode === 'DIFFERENTIAL'
                  ? 'bg-cyan-100/70 dark:bg-cyan-500/20 border-cyan-400 dark:border-cyan-500/60 text-slate-900 dark:text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold font-mono text-cyan-600 dark:text-cyan-400">Differential</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Winner Gap to win Game. Low score wins.
              </div>
            </button>
          </div>
        </div>

        {/* Game Win Condition (Point Floor or Differential Gap) */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-amber-500" />
            Game Win Requirement (Multi-Round)
          </label>

          {settings.scoringMode === 'RANK_BASED' ? (
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
                Point Floor to Win Game (5 – 100):
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={5}
                  max={100}
                  step={1}
                  value={settings.rankPointsFloor}
                  onChange={(e) => {
                    const val = Math.max(5, Math.min(100, Number(e.target.value) || 5));
                    updateSettings({ rankPointsFloor: val });
                  }}
                  className="w-32 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  First to reach {settings.rankPointsFloor} pts (ties trigger next round)
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
                Winner Point Gap Threshold (100 – 10,000):
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={100}
                  max={10000}
                  step={50}
                  value={settings.differentialGapThreshold}
                  onChange={(e) => {
                    const val = Math.max(100, Math.min(10000, Number(e.target.value) || 100));
                    updateSettings({ differentialGapThreshold: val });
                  }}
                  className="w-36 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  1st must lead 2nd by &ge; {settings.differentialGapThreshold} pts
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tournament Target Goals */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-amber-500" />
            Tournament Hierarchy Targets
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block mb-1">Sets to Win Match:</span>
              <div className="relative">
                <select
                  value={settings.targetSets}
                  onChange={(e) => updateSettings({ targetSets: Number(e.target.value) })}
                  className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                >
                  <option value={1}>Best of 1 Set</option>
                  <option value={2}>First to 2 Sets (Best of 3)</option>
                  <option value={3}>First to 3 Sets (Best of 5)</option>
                  <option value={4}>First to 4 Sets (Best of 7)</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block mb-1">Games to Win Set:</span>
              <div className="relative">
                <select
                  value={settings.targetGames}
                  onChange={(e) => updateSettings({ targetGames: Number(e.target.value) })}
                  className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                >
                  <option value={1}>1 Game per Set</option>
                  <option value={2}>First to 2 Games</option>
                  <option value={3}>First to 3 Games</option>
                  <option value={5}>First to 5 Games</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Penalties & Bonus Adjustments */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            False Start & Bonus Modifiers
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block mb-1">
                False Start Multiplier:
              </span>
              <div className="relative">
                <select
                  value={settings.falseStartMultiplier}
                  onChange={(e) => updateSettings({ falseStartMultiplier: Number(e.target.value) })}
                  className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                >
                  <option value={1}>1x Delta Time</option>
                  <option value={2}>2x Delta Time</option>
                  <option value={5}>5x Delta Time (Standard)</option>
                  <option value={10}>10x Delta Time (Strict)</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block mb-1">
                1st Place Bonus (Rank Mode):
              </span>
              <div className="relative">
                <select
                  value={settings.firstPlaceBonus}
                  onChange={(e) => updateSettings({ firstPlaceBonus: Number(e.target.value) })}
                  className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                >
                  <option value={0}>+0 Points</option>
                  <option value={1}>+1 Point</option>
                  <option value={2}>+2 Points (Default)</option>
                  <option value={5}>+5 Points</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* State Machine Timing */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Timing & Sound Settings
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block mb-1">
                Lock-In Hold Duration:
              </span>
              <div className="relative">
                <select
                  value={settings.lockInDurationMs}
                  onChange={(e) => updateSettings({ lockInDurationMs: Number(e.target.value) })}
                  className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                >
                  <option value={500}>0.5s Fast Lock</option>
                  <option value={1000}>1.0s Standard Lock</option>
                  <option value={1500}>1.5s Strict Lock</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block mb-1">
                Synthesizer Volume:
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.soundVolume}
                onChange={(e) => updateSettings({ soundVolume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 mt-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Entire Tournament */}
      <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase text-red-600 dark:text-red-400 font-mono">Reset Tournament</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Clears all sets, games, and solve history immediately.</p>
        </div>
        <button
          onClick={() => resetTournament()}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold transition-all active:scale-95 shadow-sm"
        >
          Reset Tournament
        </button>
      </div>
    </div>
  );
};
