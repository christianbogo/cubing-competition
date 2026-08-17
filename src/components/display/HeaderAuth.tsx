'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  UserCircle,
  LogOut,
  BookOpen,
  Settings,
  ChevronDown,
  Monitor,
  Sun,
  Moon,
  Check,
  Sparkles,
} from 'lucide-react';
import { DEFAULT_PLAYER_COLORS } from '@/types/tournament';
import { useTournamentStore } from '@/store/tournamentStore';

export const HeaderAuth: React.FC = () => {
  const { user, profile, signOut, loading, updateProfileColor, updateProfileNickname } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const { localPlayerId, updatePlayerColor, updatePlayerName, players } = useTournamentStore();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  
  const [nicknameInput, setNicknameInput] = useState(profile?.nickname || '');
  const [prevProfileNickname, setPrevProfileNickname] = useState(profile?.nickname);
  const [isSavedNickname, setIsSavedNickname] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync nickname input when profile changes
  if (profile?.nickname !== prevProfileNickname) {
    setPrevProfileNickname(profile?.nickname);
    setNicknameInput(profile?.nickname || '');
  }

  // Sync color with local player in tournament store
  useEffect(() => {
    if (profile?.color && profile?.accentColor && localPlayerId) {
      updatePlayerColor(localPlayerId, profile.color, profile.accentColor);
    }
  }, [profile?.color, profile?.accentColor, localPlayerId, updatePlayerColor]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().slice(0, 10);
    setNicknameInput(val);
  };

  const handleNicknameBlurOrSave = () => {
    const trimmed = nicknameInput.trim();
    updateProfileNickname(trimmed);
    
    // Also update current host player name if currently on host/setup
    const hostPlayer = players.find(p => p.role === 'HOST');
    if (hostPlayer && trimmed) {
      updatePlayerName(hostPlayer.id, trimmed);
    }

    setIsSavedNickname(true);
    setTimeout(() => setIsSavedNickname(false), 2000);
  };

  const handleNicknameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />;
  }

  const isSignedIn = !!user && !user.isAnonymous;

  const currentThemeOptions: { mode: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { mode: 'system', label: 'Device', icon: Monitor },
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-1.5">
        {!isSignedIn && (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs font-mono rounded-xl transition-all shadow-sm uppercase tracking-wide active:scale-95"
          >
            <UserCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}

        {/* Account / Settings Toggle Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          title="Account Settings & Appearance"
          className={`flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl transition-all border ${
            isDropdownOpen
              ? 'bg-slate-200 dark:bg-slate-800 border-amber-500/50'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 border-transparent hover:border-slate-200 dark:hover:border-slate-700/60'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg shadow-inner flex items-center justify-center font-mono font-black text-[11px] text-white ${
              profile?.color || DEFAULT_PLAYER_COLORS[0].color
            } bg-current`}
          >
            <span className="drop-shadow-sm">
              {profile?.nickname ? profile.nickname.charAt(0) : isSignedIn ? user.email?.charAt(0).toUpperCase() : <Settings className="w-3.5 h-3.5 text-white" />}
            </span>
          </div>

          {profile?.nickname && (
            <span className="hidden sm:inline font-mono font-bold text-xs max-w-[80px] truncate text-slate-800 dark:text-slate-200">
              {profile.nickname}
            </span>
          )}

          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Account Settings Dropdown */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Info */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                {isSignedIn ? 'Account Settings' : 'Guest Settings'}
              </span>
              {isSignedIn ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold">
                  Online
                </span>
              ) : (
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsAuthOpen(true);
                  }}
                  className="text-[10px] font-mono text-amber-500 hover:underline font-bold"
                >
                  Sign in
                </button>
              )}
            </div>
            {isSignedIn && (
              <p className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300 truncate mt-1">
                {user.email}
              </p>
            )}
          </div>

          <div className="p-3 flex flex-col gap-3.5">
            {/* 1. Account Nickname */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Account Nickname
                </label>
                {isSavedNickname && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-500 animate-in fade-in">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  maxLength={10}
                  value={nicknameInput}
                  onChange={handleNicknameChange}
                  onBlur={handleNicknameBlurOrSave}
                  onKeyDown={handleNicknameKeyDown}
                  placeholder="e.g. CUBEMASTER"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                Defaults your host name when creating matches.
              </p>
            </div>

            {/* 2. Theme Mode Selector (Device, Light, Dark) */}
            <div>
              <label className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase block mb-1.5">
                Theme / Appearance
              </label>
              <div
                className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl select-none"
                role="group"
                aria-label="Theme mode selector"
              >
                {currentThemeOptions.map(({ mode, label, icon: Icon }) => {
                  const isActive = themeMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setThemeMode(mode)}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        isActive
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-300/60 dark:border-slate-700/80'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[11px]">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Player Color Selection */}
            <div>
              <button
                type="button"
                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                className="flex items-center justify-between w-full text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <span>Player Color</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-3.5 h-3.5 rounded-full ${profile?.color || DEFAULT_PLAYER_COLORS[0].color} bg-current`} />
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isColorPickerOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isColorPickerOpen && (
                <div className="px-3 py-2 mt-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl grid grid-cols-4 gap-2">
                  {DEFAULT_PLAYER_COLORS.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        updateProfileColor(c.color, c.accentColor);
                      }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${c.color} bg-current opacity-80 hover:opacity-100 transition-all ${
                        profile?.color === c.color ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-110' : ''
                      }`}
                      title={c.color.split('-')[1]}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 4. Match Library Link (if signed in) */}
            {isSignedIn && (
              <Link
                href="/library"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors border border-slate-200/60 dark:border-slate-800"
              >
                <BookOpen className="w-4 h-4 text-cyan-500" />
                <span>Match Library</span>
              </Link>
            )}

            {/* 5. Sign In or Sign Out Button */}
            {isSignedIn ? (
              <button
                type="button"
                onClick={() => {
                  signOut();
                  setIsDropdownOpen(false);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors w-full border border-red-200/40 dark:border-red-900/30"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsAuthOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-black bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all shadow-sm uppercase tracking-wide"
              >
                <Sparkles className="w-4 h-4" />
                <span>Sign In / Create Account</span>
              </button>
            )}
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};
