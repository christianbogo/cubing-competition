import React, { useState, useEffect } from 'react';
import { Keyboard, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { DEFAULT_HOME_ROW_KEYS } from '@/types/tournament';
import { useTournamentStore } from '@/store/tournamentStore';

export const HardwareTester: React.FC = () => {
  const { players } = useTournamentStore();
  const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({});
  const [maxSimultaneous, setMaxSimultaneous] = useState(0);

  const activePlayers = players.filter((p) => p.active);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setPressedKeys((prev) => {
        const next = { ...prev, [key]: true };
        const count = Object.values(next).filter(Boolean).length;
        setMaxSimultaneous((m) => Math.max(m, count));
        return next;
      });
    };

    const handleUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setPressedKeys((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);

    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  const currentlyPressedCount = Object.keys(pressedKeys).length;

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-amber-400" />
            Hardware & N-Key Rollover (NKRO) Diagnostic
          </h3>
          <p className="text-xs text-neutral-400">
            Press and hold multiple home-row keys at once to test for keyboard ghosting and simultaneous rollover support.
          </p>
        </div>
        <button
          onClick={() => {
            setPressedKeys({});
            setMaxSimultaneous(0);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-mono text-neutral-300 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Peak</span>
        </button>
      </div>

      {/* Meter Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
          <span className="text-[11px] font-mono text-neutral-400 uppercase">Live Keys Held</span>
          <div className="text-3xl font-black text-amber-400 font-mono mt-1">{currentlyPressedCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
          <span className="text-[11px] font-mono text-neutral-400 uppercase">Peak Registered</span>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-1">{maxSimultaneous} Keys</div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-mono text-neutral-400 uppercase">Status</span>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold mt-1 text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span>{maxSimultaneous >= activePlayers.length ? 'NKRO Verified' : 'Ready to Test'}</span>
          </div>
        </div>
      </div>

      {/* Keyboard Visualizer */}
      <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-inner flex flex-col items-center">
        <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">
          Home Row Matrix (10-Player Key Controller)
        </span>

        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
          {DEFAULT_HOME_ROW_KEYS.map((key, idx) => {
            const isDown = !!pressedKeys[key];
            const player = players.find((p) => p.key.toLowerCase() === key && p.active);

            return (
              <div key={key} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-12 h-14 md:w-14 md:h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-mono font-black text-lg md:text-xl transition-all duration-100 shadow-lg ${
                    isDown
                      ? 'bg-amber-400 text-black border-amber-200 shadow-amber-400/50 scale-110 -translate-y-1'
                      : player
                      ? 'bg-neutral-900 text-white border-neutral-700'
                      : 'bg-neutral-950 text-neutral-600 border-neutral-800 opacity-50'
                  }`}
                >
                  <span>{key.toUpperCase()}</span>
                  <span className="text-[9px] font-bold opacity-70">P{idx + 1}</span>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold truncate max-w-[55px] ${
                    player ? player.color : 'text-neutral-600'
                  }`}
                >
                  {player ? player.name : 'Empty'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hardware Tips */}
      <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-xs text-neutral-400 space-y-1">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Hardware Recommendation:</span>
        </div>
        <p>
          Standard membrane keyboards may limit simultaneous inputs to 3–6 keys (&quot;key jamming / ghosting&quot;). For 4+ simultaneous players, connect a mechanical keyboard with Full N-Key Rollover (NKRO) via USB.
        </p>
      </div>
    </div>
  );
};
