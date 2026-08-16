import React, { useState } from 'react';
import { UserPlus, ArrowUp, ArrowDown, Trash2, Check, X, Users, User } from 'lucide-react';
import { DEFAULT_PLAYER_COLORS, TeamId } from '@/types/tournament';
import { useTournamentStore } from '@/store/tournamentStore';

export const PlayerManager: React.FC = () => {
  const {
    players,
    settings,
    setTournamentMode,
    setPlayerTeam,
    addPlayer,
    removePlayer,
    reorderPlayers,
    togglePlayerActive,
    updatePlayerName,
  } = useTournamentStore();

  const [newName, setNewName] = useState('');
  const [newTeam, setNewTeam] = useState<TeamId>('RED');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const isTeamMode = settings.tournamentMode === 'TEAMS';

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addPlayer(newName.trim(), isTeamMode ? newTeam : undefined);
    setNewName('');
  };

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      updatePlayerName(id, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider">
            Player Roster & Keybinds
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure tournament format (Free For All or Teams) and button mappings across the home row.
          </p>
        </div>

        {/* FFA vs Teams Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-1 rounded-2xl shrink-0">
          <button
            onClick={() => setTournamentMode('FREE_FOR_ALL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              !isTeamMode
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Free For All</span>
          </button>

          <button
            onClick={() => setTournamentMode('TEAMS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              isTeamMode
                ? 'bg-gradient-to-r from-red-600 to-cyan-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Teams (Red vs Blue)</span>
          </button>
        </div>
      </div>

      {/* Add Player Bar */}
      {players.length < 10 && (
        <form
          onSubmit={handleAdd}
          className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl"
        >
          <input
            type="text"
            placeholder="Player Name (e.g. FELIKS)"
            maxLength={10}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 min-w-[140px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />

          {isTeamMode && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setNewTeam('RED')}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                  newTeam === 'RED'
                    ? 'bg-red-100 dark:bg-red-600/30 border-red-300 dark:border-red-500 text-red-700 dark:text-red-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                Red Team
              </button>
              <button
                type="button"
                onClick={() => setNewTeam('BLUE')}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                  newTeam === 'BLUE'
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
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs font-mono rounded-xl transition-all shadow-sm active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Player</span>
          </button>
        </form>
      )}

      {/* Player List */}
      <div className="space-y-2">
        {players.map((player, index) => {
          const ffaTheme = DEFAULT_PLAYER_COLORS[index % DEFAULT_PLAYER_COLORS.length];
          const displayNameColor = isTeamMode
            ? player.team === 'RED'
              ? 'text-red-600 dark:text-red-400'
              : 'text-cyan-600 dark:text-cyan-400'
            : ffaTheme.color;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                player.active
                  ? isTeamMode
                    ? player.team === 'RED'
                      ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 hover:border-red-300 dark:hover:border-red-700/60'
                      : 'bg-cyan-50/60 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900/40 hover:border-cyan-300 dark:hover:border-cyan-700/60'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-900 opacity-60'
              }`}
            >
              {/* Keybind & Order Badge */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-slate-400 dark:text-slate-500 font-bold w-4">#{index + 1}</span>
                  <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-black text-amber-600 dark:text-amber-400 shadow-inner">
                    {player.key.toUpperCase()}
                  </span>
                </div>

                {/* Player Info / Edit Input */}
                {editingId === player.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={10}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="px-2 py-1 bg-white dark:bg-slate-950 border border-amber-500 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveRename(player.id)}
                      className="p-1 rounded bg-emerald-600 text-white"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartRename(player.id, player.name)}
                      className={`font-black text-sm tracking-wide ${displayNameColor} uppercase hover:underline text-left`}
                    >
                      {player.name}
                    </button>

                    {/* Team Selector in Team Mode */}
                    {isTeamMode && (
                      <select
                        value={player.team || 'RED'}
                        onChange={(e) => setPlayerTeam(player.id, e.target.value as TeamId)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                          player.team === 'RED'
                            ? 'bg-red-100 dark:bg-red-950/80 border-red-300 dark:border-red-600 text-red-700 dark:text-red-400'
                            : 'bg-cyan-100 dark:bg-cyan-950/80 border-cyan-300 dark:border-cyan-600 text-cyan-700 dark:text-cyan-400'
                        }`}
                      >
                        <option value="RED">RED TEAM</option>
                        <option value="BLUE">BLUE TEAM</option>
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons: Move Up, Move Down, Toggle Active, Delete */}
              <div className="flex items-center gap-1.5">
                {/* Move Up */}
                <button
                  disabled={index === 0}
                  onClick={() => reorderPlayers(index, index - 1)}
                  title="Move up (reassigns keybind)"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>

                {/* Move Down */}
                <button
                  disabled={index === players.length - 1}
                  onClick={() => reorderPlayers(index, index + 1)}
                  title="Move down (reassigns keybind)"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                {/* Toggle Active */}
                <button
                  onClick={() => togglePlayerActive(player.id)}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-all ${
                    player.active
                      ? 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  {player.active ? 'ACTIVE' : 'BENCH'}
                </button>

                {/* Remove Player */}
                {players.length > 2 && (
                  <button
                    onClick={() => removePlayer(player.id)}
                    title="Remove player"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-500/50 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
