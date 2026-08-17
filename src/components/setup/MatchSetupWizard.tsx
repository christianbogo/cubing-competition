'use client';

import React, { useState } from 'react';
import {
  Users,
  User,
  Play,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  Trash2,
  Trophy,
  Target,
  Flag,
  Zap,
  Award,
  ChevronDown,
  Bot,
  Sliders,
  Lock,
  Link,
  Copy,
} from 'lucide-react';
import { useTournamentStore } from '@/store/tournamentStore';
import { WCA_EVENTS } from '@/utils/scramble';
import { DEFAULT_PLAYER_COLORS, TeamId, PlayerRole, BotMaturity } from '@/types/tournament';
import { CubeOnlineLogo } from '@/components/display/CubeOnlineLogo';

export const ARENA_TIERS = [
  { rank: 'Iron', division: 'III', average: 180000, std: 25000, maturity: 0.20 },
  { rank: 'Iron', division: 'II', average: 150000, std: 20000, maturity: 0.18 },
  { rank: 'Iron', division: 'I', average: 120000, std: 15000, maturity: 0.15 },
  { rank: 'Bronze', division: 'III', average: 100000, std: 12000, maturity: 0.12 },
  { rank: 'Bronze', division: 'II', average: 85000, std: 10000, maturity: 0.11 },
  { rank: 'Bronze', division: 'I', average: 70000, std: 8000, maturity: 0.10 },
  { rank: 'Silver', division: 'III', average: 60000, std: 7000, maturity: 0.09 },
  { rank: 'Silver', division: 'II', average: 50000, std: 6000, maturity: 0.08 },
  { rank: 'Silver', division: 'I', average: 40000, std: 5000, maturity: 0.07 },
  { rank: 'Gold', division: 'III', average: 35000, std: 4500, maturity: 0.065 },
  { rank: 'Gold', division: 'II', average: 30000, std: 4000, maturity: 0.06 },
  { rank: 'Gold', division: 'I', average: 25000, std: 3000, maturity: 0.055 },
  { rank: 'Platinum', division: 'III', average: 22000, std: 2500, maturity: 0.05 },
  { rank: 'Platinum', division: 'II', average: 19000, std: 2200, maturity: 0.045 },
  { rank: 'Platinum', division: 'I', average: 16000, std: 1800, maturity: 0.04 },
  { rank: 'Diamond', division: 'III', average: 14000, std: 1500, maturity: 0.035 },
  { rank: 'Diamond', division: 'II', average: 12000, std: 1200, maturity: 0.03 },
  { rank: 'Diamond', division: 'I', average: 10000, std: 1000, maturity: 0.025 },
  { rank: 'Master', division: 'III', average: 9000, std: 900, maturity: 0.02 },
  { rank: 'Master', division: 'II', average: 8000, std: 800, maturity: 0.015 },
  { rank: 'Master', division: 'I', average: 7000, std: 700, maturity: 0.01 },
  { rank: 'Grandmaster', division: 'III', average: 6000, std: 600, maturity: 0.008 },
  { rank: 'Grandmaster', division: 'II', average: 5500, std: 500, maturity: 0.006 },
  { rank: 'Grandmaster', division: 'I', average: 5000, std: 400, maturity: 0.005 },
];

const TextInputNumber = ({ 
  value, 
  onChange, 
  min, 
  max, 
  className 
}: { 
  value: string | number; 
  onChange: (val: number) => void; 
  min?: number; 
  max?: number; 
  className?: string;
}) => {
  const [internalVal, setInternalVal] = React.useState(value.toString());

  React.useEffect(() => {
    // only sync if it's not actively being edited and differs by value
    if (Number(internalVal) !== Number(value)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInternalVal(value.toString());
    }
  }, [value]);

  const parsed = Number(internalVal);
  const isInvalid = isNaN(parsed) || internalVal.trim() === '' || (min !== undefined && parsed < min) || (max !== undefined && parsed > max);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalVal(e.target.value);
    const p = Number(e.target.value);
    if (!isNaN(p) && e.target.value.trim() !== '') {
      onChange(p);
    }
  };

  const handleBlur = () => {
    let p = Number(internalVal);
    if (isNaN(p) || internalVal.trim() === '') {
      p = Number(value);
      setInternalVal(value.toString());
    } else {
      if (min !== undefined && p < min) p = min;
      if (max !== undefined && p > max) p = max;
      setInternalVal(p.toString());
      onChange(p);
    }
  };

  return (
    <input
      type="text"
      value={internalVal}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`${className} ${isInvalid ? '!border-red-500 focus:!border-red-500 !text-red-500 dark:!text-red-400' : ''}`}
    />
  );
};

export const MatchSetupWizard: React.FC = () => {
  const {
    matchId,
    players,
    settings,
    isRoomActive,
    setIsRoomActive,
    connectedGuests,
    setTournamentMode,
    setPlayerTeam,
    setPlayerRole,
    updatePlayerBotConfig,
    addPlayer,
    removePlayer,
    updatePlayerName,
    updateSettings,
    startMatch,
  } = useTournamentStore();

  const [step, setStep] = useState<number>(1);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState<PlayerRole>('BOT');
  const [newPlayerTeam, setNewPlayerTeam] = useState<TeamId>('RED');

  const [copiedPlayerId, setCopiedPlayerId] = useState<string | null>(null);

  const isTeamMode = settings.tournamentMode === 'TEAMS';

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    let finalName = newPlayerName.trim();
    if (!finalName) {
      if (newPlayerRole === 'BOT') {
        const botNames = ['BOT ALPHA', 'BOT BETA', 'AUTO', 'CPU', 'CYBORG', 'MECH', 'CUBER-X', 'AI-SOLVER'];
        finalName = botNames[Math.floor(Math.random() * botNames.length)];
      } else {
        return;
      }
    }
    addPlayer(finalName, isTeamMode ? newPlayerTeam : undefined, newPlayerRole);
    setNewPlayerName('');
  };

  const activePlayers = players.filter((p) => p.active);
  const humanGuests = activePlayers.filter((p) => p.role === 'PLAYER');
  const allGuestsConnected = humanGuests.every((p) => connectedGuests.includes(p.id));

  const handleStartMatch = async () => {
    if (activePlayers.length < 2 || !allGuestsConnected) return;
    await startMatch();
  };

  const hasArenaBots = players.some((p) => p.role === 'BOT' && (!p.botConfig?.difficultyType || p.botConfig.difficultyType === 'ARENA'));
  const steps = [1, ...(hasArenaBots ? [1.5] : []), 3, 4];
  const currentStepIndex = steps.indexOf(step);

  React.useEffect(() => {
    if (step === 4 && !isRoomActive) {
      setIsRoomActive(true);
    } else if (step !== 4 && isRoomActive) {
      setIsRoomActive(false);
    }
  }, [step, isRoomActive, setIsRoomActive]);

  const handleBack = () => setStep(steps[currentStepIndex - 1]);
  const handleNext = () => setStep(steps[currentStepIndex + 1]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col items-center select-none">
      {/* Wizard Header & Progress Bar */}
      <div className="w-full text-center space-y-3 mb-8">

        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 font-mono">
          Configure Your <span className="text-amber-500">Match</span>
        </h1>

        {/* Step Indicator Pills */}
        <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
          {[
            { num: 1, label: '1. Players & Bots' },
            ...(hasArenaBots ? [{ num: 1.5, label: '1.5. Arena Difficulty' }] : []),
            { num: 3, label: '2. Scoring Engine' },
            { num: 4, label: '3. Match Structure' },
          ].map(({ num, label }) => {
            const isActive = step === num;
            const isDone = step > num;
            return (
              <button
                key={num}
                onClick={() => setStep(num)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${isActive
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : isDone
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600'
                  }`}
              >
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Container */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl transition-all duration-200">
        {/* STEP 1: Format & Roster (Full-Width Rows) */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div>
                <h2 className="text-lg font-black uppercase text-slate-900 dark:text-white font-mono flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  Step 1: Players & Bot AI Roster
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure the Host and customize bot average times, variance, and maturity.
                </p>
              </div>

              {/* FFA vs Teams Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl shrink-0">
                <button
                  type="button"
                  onClick={() => setTournamentMode('FREE_FOR_ALL')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${!isTeamMode
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Free For All</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTournamentMode('TEAMS')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${isTeamMode
                    ? 'bg-gradient-to-r from-red-600 to-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Red vs Blue</span>
                </button>
              </div>
            </div>

            {/* Full-Width Participant Rows */}
            <div className="space-y-3">
              {players.map((player, index) => {
                const ffaTheme = DEFAULT_PLAYER_COLORS[index % DEFAULT_PLAYER_COLORS.length];
                const displayNameColor = isTeamMode
                  ? player.team === 'RED'
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-cyan-600 dark:text-cyan-400'
                  : ffaTheme.color;

                const isHost = player.role === 'HOST';
                const isBot = player.role === 'BOT';
                const isPlayer = player.role === 'PLAYER';
                const botConfig = player.botConfig || {
                  difficultyType: 'ARENA',
                  arenaTier: 'Iron III',
                  averageTimeMs: 180000,
                  stdDevMs: 25000,
                  maturityNumber: 0.20,
                  maturity: 'INTERMEDIATE',
                };
                const isArena = !botConfig.difficultyType || botConfig.difficultyType === 'ARENA';

                return (
                  <div
                    key={player.id}
                    className={`w-full rounded-2xl border p-4 transition-all ${isHost
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/40 shadow-sm ring-1 ring-amber-400/20'
                      : isTeamMode
                        ? player.team === 'RED'
                          ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                          : 'bg-cyan-50/40 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900/40'
                        : 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                      }`}
                  >
                    {/* Primary Row: Role, Name, Role-Toggle, Team, Delete */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Left: Role Pill & Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Controller Pill */}
                        {isHost && (
                          <span
                            className="px-2.5 py-1.5 rounded-xl border flex items-center justify-center font-mono font-black text-xs shrink-0 bg-amber-400 text-black border-amber-300 shadow-sm"
                          >
                            HOST
                          </span>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              maxLength={10}
                              value={player.name}
                              onChange={(e) => updatePlayerName(player.id, e.target.value)}
                              className={`bg-transparent font-black text-sm sm:text-base uppercase tracking-wide focus:outline-none focus:border-b border-amber-500 ${displayNameColor}`}
                            />
                            {isBot && (
                              <button
                                type="button"
                                onClick={() => updatePlayerBotConfig(player.id, { difficultyType: isArena ? 'CUSTOM' : 'ARENA' })}
                                className={`shrink-0 text-[10px] font-bold font-mono px-2 py-0.5 rounded transition-colors ${
                                  !isArena 
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                              >
                                Custom Weights
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                            <span>Slot #{index + 1}</span>
                            {isHost && (
                              <span className="text-amber-600 dark:text-amber-400 font-bold">
                                • Host Controller
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Role Selection & Team Dropdown */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5">
                          {index === 0 ? (
                            <div className="px-2.5 py-1 text-xs font-mono font-bold text-amber-500">Host Controller</div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setPlayerRole(player.id, 'BOT')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${isBot
                                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                  }`}
                              >
                                Bot
                              </button>
                              {matchId !== 'local' && (
                                <button
                                  type="button"
                                  onClick={() => setPlayerRole(player.id, 'PLAYER')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${isPlayer
                                    ? 'bg-blue-500 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                  Player
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        {/* Team Dropdown */}
                        {isTeamMode && (
                          <div className="relative">
                            <select
                              value={player.team || 'RED'}
                              onChange={(e) => setPlayerTeam(player.id, e.target.value as TeamId)}
                              className="appearance-none pr-6 pl-2 py-1.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none"
                            >
                              <option value="RED">RED</option>
                              <option value="BLUE">BLUE</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" />
                          </div>
                        )}

                        {index !== 0 && players.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removePlayer(player.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bot AI Configuration Details (Expanded for Bot participants) */}
                    {isBot && !isArena && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-col gap-3 text-xs font-mono">
                        {/* Custom Bot Stats Form */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* 1. Target Average Time */}
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Sliders className="w-3 h-3 text-amber-500" />
                            Average Time (sec):
                          </label>
                          <TextInputNumber
                            min={1}
                            max={60}
                            value={(botConfig.averageTimeMs / 1000).toFixed(1)}
                            onChange={(val) =>
                              updatePlayerBotConfig(player.id, {
                                averageTimeMs: Math.max(1000, val * 1000),
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>

                        {/* 2. Standard Deviation */}
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-500 dark:text-slate-400">
                            Std Dev Variance (±sec):
                          </label>
                          <TextInputNumber
                            min={0.1}
                            max={10}
                            value={(botConfig.stdDevMs / 1000).toFixed(2)}
                            onChange={(val) =>
                              updatePlayerBotConfig(player.id, {
                                stdDevMs: Math.max(100, val * 1000),
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>

                        {/* 3. Maturity (Discipline / Penalty Probability) */}
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-500 dark:text-slate-400">
                            Maturity & Error Rate:
                          </label>
                          <div className="relative">
                            <select
                              value={botConfig.maturity}
                              onChange={(e) =>
                                updatePlayerBotConfig(player.id, {
                                  maturity: e.target.value as BotMaturity,
                                })
                              }
                              className="w-full appearance-none pr-8 pl-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-amber-500"
                            >
                              <option value="NOVICE">Novice (12% +2, 8% False Start)</option>
                              <option value="INTERMEDIATE">Intermediate (6% +2, 4% Early)</option>
                              <option value="PRO">Pro (2% +2, 1% Early)</option>
                              <option value="WORLD_CLASS">World Class (&lt;1% errors)</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
            );
          })}
            </div>

            {/* Add Participant Bar Moved to Bottom */}
            {players.length < 8 && (
              <form
                onSubmit={handleAddPlayer}
                className="flex flex-wrap items-center gap-2.5 p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl mt-4"
              >
                <input
                  type="text"
                  placeholder="Participant Name (e.g. LEO)"
                  maxLength={10}
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="flex-1 min-w-[150px] px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-slate-400">Type:</span>
                  <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-0.5">
                    <button
                      type="button"
                      onClick={() => setNewPlayerRole('BOT')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${newPlayerRole === 'BOT'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                        }`}
                    >
                      Bot AI
                    </button>
                    {matchId !== 'local' && (
                      <button
                        type="button"
                        onClick={() => setNewPlayerRole('PLAYER')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${newPlayerRole === 'PLAYER'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                          }`}
                      >
                        Player
                      </button>
                    )}
                  </div>
                </div>

                {isTeamMode && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setNewPlayerTeam('RED')}
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${newPlayerTeam === 'RED'
                        ? 'bg-red-100 dark:bg-red-600/30 border-red-300 dark:border-red-500 text-red-700 dark:text-red-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                    >
                      Red Team
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPlayerTeam('BLUE')}
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${newPlayerTeam === 'BLUE'
                        ? 'bg-cyan-100 dark:bg-cyan-600/30 border-cyan-300 dark:border-cyan-500 text-cyan-700 dark:text-cyan-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                    >
                      Blue Team
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs font-mono rounded-xl transition-all shadow-sm active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{newPlayerRole === 'BOT' ? 'Add Bot' : 'Add Player'}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {step === 1.5 && (() => {
          const arenaBots = players.filter((p) => p.role === 'BOT' && (!p.botConfig?.difficultyType || p.botConfig.difficultyType === 'ARENA'));
          const firstArenaTierName = arenaBots[0]?.botConfig?.arenaTier || 'Iron III';
          const globalArenaIndex = Math.max(0, ARENA_TIERS.findIndex(t => `${t.rank} ${t.division}` === firstArenaTierName));
          const currentTier = ARENA_TIERS[globalArenaIndex] || ARENA_TIERS[0];
          const currentTierName = `${currentTier.rank} ${currentTier.division}`;

          const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newIndex = Number(e.target.value);
            const tierData = ARENA_TIERS[newIndex];
            const tierName = `${tierData.rank} ${tierData.division}`;
            
            // Apply to all arena bots
            players.forEach((p) => {
              if (p.role === 'BOT' && (!p.botConfig?.difficultyType || p.botConfig.difficultyType === 'ARENA')) {
                updatePlayerBotConfig(p.id, {
                  arenaTier: tierName,
                  averageTimeMs: tierData.average,
                  stdDevMs: tierData.std,
                  maturityNumber: tierData.maturity,
                });
              }
            });
          };

          return (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <h2 className="text-lg font-black uppercase text-slate-900 dark:text-white font-mono flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-500" />
                  Step 1.5: Arena Difficulty
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Adjust the slider to set the difficulty for all Arena bots simultaneously.
                </p>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="flex flex-col gap-6">
                  {/* Slider Control */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-mono font-bold text-slate-900 dark:text-white uppercase">
                        Difficulty Slider
                      </label>
                      <span className="px-3 py-1 bg-amber-500 text-slate-950 rounded-xl text-xs font-mono font-black shadow-sm">
                        {currentTierName}
                      </span>
                    </div>
                    
                    <input
                      type="range"
                      min={0}
                      max={ARENA_TIERS.length - 1}
                      value={globalArenaIndex}
                      onChange={handleSliderChange}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold uppercase px-1">
                      <span>Beginner (Iron)</span>
                      <span>Elite (Grandmaster)</span>
                    </div>
                  </div>

                  {/* Stats Display */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Target Average</span>
                      <strong className="text-lg font-mono text-slate-900 dark:text-white">
                        {(currentTier.average / 1000).toFixed(2)}s
                      </strong>
                    </div>
                    <div className="border-x border-slate-100 dark:border-slate-800">
                      <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Inconsistency</span>
                      <strong className="text-lg font-mono text-slate-900 dark:text-white">
                        ±{(currentTier.std / 1000).toFixed(2)}s
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Mistake Rate</span>
                      <strong className="text-lg font-mono text-amber-600 dark:text-amber-400">
                        {(currentTier.maturity * 100).toFixed(1)}%
                      </strong>
                    </div>
                  </div>
                  
                  <div className="text-center text-xs text-slate-500 dark:text-slate-400 font-mono mt-2">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Applies to {arenaBots.length} Arena bot{arenaBots.length !== 1 ? 's' : ''} in the match.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}



        {/* STEP 3: Scoring Engine */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <h2 className="text-lg font-black uppercase text-slate-900 dark:text-white font-mono flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                Step 3: Scoring Engine
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the primary point calculation method to decide multi-round game winners.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scoring Mode Selection */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3 md:col-span-2">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Scoring Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateSettings({ scoringMode: 'RANK_BASED' })}
                    className={`p-3.5 rounded-xl border text-left transition-all ${settings.scoringMode === 'RANK_BASED'
                      ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-400 dark:border-amber-500/60 text-slate-900 dark:text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    <div className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                      Rank-Based (Placements)
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Solvers earn points based on finish placement. First to reach point floor wins the game.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSettings({ scoringMode: 'DIFFERENTIAL' })}
                    className={`p-3.5 rounded-xl border text-left transition-all ${settings.scoringMode === 'DIFFERENTIAL'
                      ? 'bg-cyan-100 dark:bg-cyan-500/20 border-cyan-400 dark:border-cyan-500/60 text-slate-900 dark:text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    <div className="text-sm font-bold font-mono text-cyan-600 dark:text-cyan-400">
                      Differential (Time Delta)
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Points accumulate based on time behind 1st place. Winner needs gap over 2nd place.
                    </div>
                  </button>
                </div>
              </div>

              {/* Target Floor/Gap */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-500" />
                  Game Win Target
                </label>

                {settings.scoringMode === 'RANK_BASED' ? (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
                      Point Floor to Win Game:
                    </span>
                    <TextInputNumber
                      min={5}
                      max={100}
                      value={settings.rankPointsFloor}
                      onChange={(val) =>
                        updateSettings({
                          rankPointsFloor: Math.max(5, Math.min(100, val)),
                        })
                      }
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
                      Winner Point Gap Threshold:
                    </span>
                    <TextInputNumber
                      min={100}
                      max={10000}
                      value={settings.differentialGapThreshold}
                      onChange={(val) =>
                        updateSettings({
                          differentialGapThreshold: Math.max(100, Math.min(10000, val)),
                        })
                      }
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Round Win Bonus Amount (For Rank-Based) */}
              {settings.scoringMode === 'RANK_BASED' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    Round Win Bonus (1st Place)
                  </label>
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
                      Bonus Points for 1st in Each Round:
                    </span>
                    <div className="relative">
                      <select
                        value={settings.firstPlaceBonus}
                        onChange={(e) => updateSettings({ firstPlaceBonus: Number(e.target.value) })}
                        className="w-full appearance-none pr-9 pl-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-amber-500"
                      >
                        <option value={0}>0 Points (No bonus)</option>
                        <option value={1}>+1 Bonus Point</option>
                        <option value={2}>+2 Bonus Points (Standard)</option>
                        <option value={3}>+3 Bonus Points</option>
                        <option value={5}>+5 Bonus Points</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Tournament Targets & Penalties */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <h2 className="text-lg font-black uppercase text-slate-900 dark:text-white font-mono flex items-center gap-2">
                <Flag className="w-5 h-5 text-amber-500" />
                Step 4: Tournament Hierarchy & Penalties
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure sets, games, false start multipliers, and launch your match.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tournament Match Hierarchy */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-amber-500" />
                  Sets & Games Threshold
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500 font-mono block mb-1">
                      Sets to Win Match:
                    </span>
                    <div className="relative">
                      <select
                        value={settings.targetSets}
                        onChange={(e) => updateSettings({ targetSets: Number(e.target.value) })}
                        className="w-full appearance-none pr-9 pl-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-amber-500"
                      >
                        <option value={1}>1 Set (Single)</option>
                        <option value={2}>First to 2 Sets</option>
                        <option value={3}>First to 3 Sets</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 font-mono block mb-1">
                      Games to Win Set:
                    </span>
                    <div className="relative">
                      <select
                        value={settings.targetGames}
                        onChange={(e) => updateSettings({ targetGames: Number(e.target.value) })}
                        className="w-full appearance-none pr-9 pl-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-amber-500"
                      >
                        <option value={1}>1 Game per Set</option>
                        <option value={2}>First to 2 Games</option>
                        <option value={3}>First to 3 Games</option>
                        <option value={5}>First to 5 Games</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* False Start Multiplier */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  False Start Penalty Multiplier
                </label>
                <div className="relative">
                  <select
                    value={settings.falseStartMultiplier}
                    onChange={(e) => updateSettings({ falseStartMultiplier: Number(e.target.value) })}
                    className="w-full appearance-none pr-9 pl-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-amber-500"
                  >
                    <option value={1}>1x Delta Time</option>
                    <option value={2}>2x Delta Time</option>
                    <option value={5}>5x Delta Time (Standard)</option>
                    <option value={10}>10x Delta Time (Strict)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Guest Connections */}
            {humanGuests.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  Player Connections
                </label>
                <div className="space-y-3">
                  {humanGuests.map((guest) => {
                    const isConnected = connectedGuests.includes(guest.id);
                    return (
                      <div key={guest.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full shadow-sm ${isConnected ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-slate-300 dark:bg-slate-700'}`} />
                          <span className="font-mono text-sm font-bold truncate text-slate-900 dark:text-white">
                            {guest.name}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border ${isConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                            {isConnected ? 'Connected' : 'Waiting...'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 w-full sm:max-w-[220px]">
                          <div className="flex items-center justify-between w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-4">
                              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Room Code: <span className="text-amber-500 text-sm ml-1">{matchId}</span></span>
                              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Position: <span className="text-blue-500 text-sm ml-1">{players.findIndex(p => p.id === guest.id) + 1}</span></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          {currentStepIndex > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold transition-all shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStepIndex < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-black transition-all shadow-md active:scale-95"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartMatch}
              disabled={!allGuestsConnected}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-mono font-black uppercase tracking-wider transition-all ${allGuestsConnected ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'}`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{allGuestsConnected ? 'Launch Match Arena' : 'Waiting for Players...'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
