'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserCircle, LogOut, BookOpen, Settings, ChevronDown } from 'lucide-react';
import { DEFAULT_PLAYER_COLORS } from '@/types/tournament';
import { useTournamentStore } from '@/store/tournamentStore';

export const HeaderAuth: React.FC = () => {
  const { user, profile, signOut, loading, updateProfileColor } = useAuth();
  const { localPlayerId, updatePlayerColor } = useTournamentStore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.color && profile?.accentColor && localPlayerId) {
      updatePlayerColor(localPlayerId, profile.color, profile.accentColor);
    }
  }, [profile?.color, profile?.accentColor, localPlayerId, updatePlayerColor]);

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

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />;
  }

  const isGuest = user?.isAnonymous;
  const isSignedIn = !!user && !isGuest;

  return (
    <div className="relative" ref={dropdownRef}>
      {!isSignedIn ? (
        <button
          onClick={() => setIsAuthOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs font-mono rounded-xl transition-all shadow-sm uppercase tracking-wide"
        >
          <UserCircle className="w-4 h-4" />
          <span>Sign In</span>
        </button>
      ) : (
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className={`w-8 h-8 rounded-full shadow-inner ${profile?.color || DEFAULT_PLAYER_COLORS[0].color} bg-current opacity-90`} />
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      )}

      {isDropdownOpen && isSignedIn && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 text-xs font-mono">
            <p className="text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
          </div>
          <div className="p-2 flex flex-col gap-1">
            <Link 
              href="/library"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <BookOpen className="w-4 h-4 text-cyan-500" />
              <span>Match Library</span>
            </Link>
            
            <button
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              className="flex items-center justify-between px-3 py-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-violet-500" />
                <span>Player Color</span>
              </div>
              <div className={`w-3 h-3 rounded-full ${profile?.color || DEFAULT_PLAYER_COLORS[0].color} bg-current`} />
            </button>

            {isColorPickerOpen && (
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl grid grid-cols-4 gap-2 mb-1">
                {DEFAULT_PLAYER_COLORS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      updateProfileColor(c.color, c.accentColor);
                      setIsColorPickerOpen(false);
                    }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${c.color} bg-current opacity-80 hover:opacity-100 transition-opacity ${profile?.color === c.color ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : ''}`}
                    title={c.color.split('-')[1]}
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => {
                signOut();
                setIsDropdownOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};
