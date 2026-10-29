import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { PaletteMode } from '../types/game';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onQuitToTitle: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  palette: PaletteMode;
  onPaletteChange: (p: PaletteMode) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onQuitToTitle,
  soundMuted,
  onToggleSound,
  palette,
  onPaletteChange,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        onResume();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onResume]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 select-none p-4 font-mono">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-lg p-6 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-xl font-bold tracking-widest text-cyan-400 mb-6 uppercase">
          MISSION PAUSED
        </h2>

        {/* Action Buttons */}
        <div className="w-full space-y-3 mb-6">
          <button
            onClick={onResume}
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            Resume Flight [P]
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            Restart Mission
          </button>

          <button
            onClick={onQuitToTitle}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 border border-slate-700"
          >
            <Home className="w-4 h-4" />
            Quit to Title
          </button>
        </div>

        {/* In-pause Settings */}
        <div className="w-full border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-400">
          <span>Audio:</span>
          <button
            onClick={onToggleSound}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded border border-slate-700 hover:text-white"
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{soundMuted ? 'Muted' : 'Sound ON'}</span>
          </button>
        </div>

        {/* Display Palette in pause */}
        <div className="w-full pt-3 flex items-center justify-between text-xs text-slate-400">
          <span>Palette:</span>
          <select
            value={palette}
            onChange={(e) => onPaletteChange(e.target.value as PaletteMode)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none"
          >
            <option value="zx_spectrum">ZX Spectrum</option>
            <option value="c64">Commodore 64</option>
            <option value="green_phosphor">Green Phosphor</option>
            <option value="amber_phosphor">Amber CRT</option>
          </select>
        </div>
      </div>
    </div>
  );
};
