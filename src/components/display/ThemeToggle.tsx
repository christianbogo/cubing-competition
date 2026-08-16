'use client';

import React, { useSyncExternalStore } from 'react';
import { Monitor, Sun, Moon } from 'lucide-react';
import { useTheme, ThemeMode } from '@/context/ThemeContext';

const emptySubscribe = () => () => {};

export const ThemeToggle: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const options: { mode: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { mode: 'system', label: 'Device', icon: Monitor },
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
  ];

  if (!isClient) {
    return (
      <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-200/80 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 text-xs font-mono select-none w-[170px] h-[34px]" />
    );
  }

  return (
    <div
      className="inline-flex items-center p-0.5 rounded-xl bg-slate-200/80 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 text-xs font-mono select-none shadow-inner"
      role="group"
      aria-label="Theme mode selector"
    >
      {options.map(({ mode, label, icon: Icon }) => {
        const isActive = themeMode === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setThemeMode(mode)}
            title={`Switch to ${label} mode`}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium text-xs transition-all duration-150 active:scale-95 ${
              isActive
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-300/50 dark:border-slate-700/60 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">{label}</span>
          </button>
        );
      })}
    </div>
  );
};
