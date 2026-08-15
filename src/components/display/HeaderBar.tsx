import React from 'react';
import {
  Volume2,
  VolumeX,
  Sliders,
  RotateCcw,
  Keyboard,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useTournamentStore } from '@/store/tournamentStore';
import { useTimerStore } from '@/store/timerStore';

interface HeaderBarProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenAdmin: () => void;
  onOpenKeyGuide: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  isFullscreen,
  onToggleFullscreen,
  onOpenAdmin,
  onOpenKeyGuide,
}) => {
  const { settings, updateSettings, resetCurrentGame } = useTournamentStore();
  const { resetForNewRace } = useTimerStore();

  const handleResetGame = () => {
    resetForNewRace();
    resetCurrentGame();
  };

  return (
    <header className={`w-full px-6 transition-all duration-200 flex items-center justify-end gap-3 select-none z-30 ${isFullscreen ? 'py-2' : 'py-4'}`}>
      {/* Hide Reset, Keybinds, and Volume buttons in Fullscreen mode */}
      {!isFullscreen && (
        <>
          {/* Reset Race Button */}
          <button
            onClick={handleResetGame}
            title="Reset current race"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-950/80 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800/80 text-xs font-mono transition-all active:scale-95 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Key Guide Button */}
          <button
            onClick={onOpenKeyGuide}
            title="Show keyboard controller mapping"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-950/80 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800/80 text-xs font-mono transition-all active:scale-95 shadow-sm"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Keybinds</span>
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            title={settings.soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className={`p-2.5 rounded-xl border text-xs font-mono transition-all active:scale-95 shadow-sm ${
              settings.soundEnabled
                ? 'bg-neutral-950/80 border-neutral-700/80 text-amber-400'
                : 'bg-neutral-950/50 border-neutral-800/80 text-neutral-600'
            }`}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </>
      )}

      {/* Fullscreen Toggle Button */}
      <button
        onClick={onToggleFullscreen}
        title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
        className="p-2.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800/80 text-neutral-400 hover:text-neutral-200 text-xs font-mono transition-all active:scale-95 shadow-sm"
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {/* Admin Dashboard Trigger */}
      <button
        onClick={onOpenAdmin}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white font-medium text-xs border border-neutral-700/80 transition-all shadow-md active:scale-95"
      >
        <Sliders className="w-3.5 h-3.5 text-amber-400" />
        <span>Admin</span>
      </button>
    </header>
  );
};
