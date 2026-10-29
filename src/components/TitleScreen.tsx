import React from 'react';
import { PaletteMode, HighScoreRecord } from '../types/game';
import { Volume2, VolumeX, Monitor, Edit3, Trophy, Play } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: (stageIndex: number) => void;
  onOpenEditor: () => void;
  palette: PaletteMode;
  onPaletteChange: (palette: PaletteMode) => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  highScores: HighScoreRecord[];
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenEditor,
  palette,
  onPaletteChange,
  soundMuted,
  onToggleSound,
  highScores,
}) => {
  const [selectedStage, setSelectedStage] = React.useState(0);
  const [showHighScores, setShowHighScores] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStartGame(selectedStage);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame, selectedStage]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between items-center p-6 md:p-8 bg-black/85 text-white select-none overflow-y-auto">
      {/* Top bar: Hardware mode selector & sound toggle */}
      <div className="w-full max-w-4xl flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Monitor className="w-4 h-4 text-emerald-400" />
          <span className="text-xs uppercase tracking-widest text-slate-400">Display:</span>
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded p-0.5 text-xs">
            <button
              onClick={() => onPaletteChange('zx_spectrum')}
              className={`px-2.5 py-1 rounded transition-colors ${
                palette === 'zx_spectrum'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ZX Spectrum
            </button>
            <button
              onClick={() => onPaletteChange('c64')}
              className={`px-2.5 py-1 rounded transition-colors ${
                palette === 'c64'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Commodore 64
            </button>
            <button
              onClick={() => onPaletteChange('green_phosphor')}
              className={`px-2.5 py-1 rounded transition-colors ${
                palette === 'green_phosphor'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Green CRT
            </button>
            <button
              onClick={() => onPaletteChange('amber_phosphor')}
              className={`px-2.5 py-1 rounded transition-colors ${
                palette === 'amber_phosphor'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Amber CRT
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowHighScores(!showHighScores)}
            className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 font-mono transition-colors"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>High Scores</span>
          </button>

          <button
            onClick={onToggleSound}
            aria-label="Toggle Sound"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Title Centerpiece */}
      <div className="flex flex-col items-center justify-center my-auto text-center max-w-3xl px-4 py-6">
        {/* Retro Sinclair / Melbourne House Attribution */}
        <div className="text-[10px] md:text-xs tracking-widest text-cyan-400 mb-2 font-mono uppercase">
          ★ MELBOURNE HOUSE 1982 · PHILIP MITCHELL HOMAGE ★
        </div>

        {/* Bespoke Inline SVG Logo */}
        <div className="relative mb-6 drop-shadow-[0_0_20px_rgba(0,255,180,0.35)]">
          <svg viewBox="0 0 680 110" className="w-full max-w-[580px] h-auto">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="35%" stopColor="#00FFCC" />
                <stop offset="70%" stopColor="#0088FF" />
                <stop offset="100%" stopColor="#FF00AA" />
              </linearGradient>
              <linearGradient id="bevelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00FF88" />
                <stop offset="50%" stopColor="#00EEFF" />
                <stop offset="100%" stopColor="#FFCC00" />
              </linearGradient>
            </defs>

            {/* Glowing Backdrop Jet Silhouette */}
            <path
              d="M 280 40 L 400 55 L 280 70 L 300 55 Z"
              fill="rgba(0, 255, 200, 0.15)"
              transform="scale(1.8) translate(-100, -25)"
            />

            {/* Main Typographic Vector Text */}
            <text
              x="340"
              y="75"
              textAnchor="middle"
              fontFamily="'Press Start 2P', monospace"
              fontSize="48"
              fontWeight="900"
              letterSpacing="6"
              fill="url(#titleGrad)"
              stroke="#000000"
              strokeWidth="4"
            >
              PENETRATOR
            </text>

            {/* Underline vector laser */}
            <line x1="80" y1="92" x2="600" y2="92" stroke="url(#bevelGrad)" strokeWidth="3" />
            <circle cx="600" cy="92" r="4" fill="#FFFF00" />
          </svg>
        </div>

        <p className="text-slate-300 text-xs md:text-sm max-w-xl font-mono leading-relaxed mb-6">
          Prebij se skozi nevarne podzemne votline, uniči raketne silose in radarske baze,
          ter bombandiraj nevronski reaktor v samem jedru pred uničevalnim pobegom!
        </p>

        {/* Modal / High Score Popup if opened */}
        {showHighScores ? (
          <div className="w-full max-w-md bg-slate-900/90 border border-yellow-500/40 rounded-lg p-5 mb-6 text-left font-mono">
            <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
              <span className="text-yellow-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Top Pilots Hall of Fame
              </span>
              <button
                onClick={() => setShowHighScores(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Zapri
              </button>
            </div>
            <div className="space-y-1.5 text-xs">
              {highScores.map((hs, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-800 text-slate-300">
                  <span className="text-slate-400">
                    #{idx + 1} <strong className="text-white ml-2">{hs.name}</strong>
                  </span>
                  <div className="flex gap-4">
                    <span className="text-cyan-400">STG {hs.stage}</span>
                    <span className="text-yellow-400 font-bold tabular-nums">
                      {hs.score.toLocaleString()} PTS
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Stage Select and Launch buttons */
          <div className="flex flex-col items-center gap-4 w-full max-w-md mb-4">
            <div className="w-full flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded px-4 py-2 text-xs">
              <span className="text-slate-400 font-mono">Start Stage:</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedStage(idx)}
                    className={`w-8 h-7 rounded font-mono text-xs font-bold transition-all ${
                      selectedStage === idx
                        ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/50 scale-105'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => onStartGame(selectedStage)}
                className="flex-1 py-3.5 px-6 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer font-mono"
              >
                <Play className="w-4 h-4 fill-current" />
                Launch Mission
              </button>

              <button
                onClick={onOpenEditor}
                className="py-3.5 px-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer"
                title="Melbourne House Landscape Editor"
              >
                <Edit3 className="w-4 h-4 text-purple-400" />
                Landscape Editor
              </button>
            </div>
          </div>
        )}

        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
          <span>Pritisni</span>
          <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-600 rounded text-cyan-300 font-bold">
            SPACE
          </kbd>
          <span>ali</span>
          <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-600 rounded text-cyan-300 font-bold">
            ENTER
          </kbd>
          <span>za takojšen začetek</span>
        </div>
      </div>

      {/* Flat control-hint line required by Game Craft guidelines */}
      <div className="w-full max-w-3xl text-center border-t border-white/10 pt-4">
        <p className="text-[11px] md:text-xs text-slate-400 font-mono tracking-wide">
          <span className="text-white font-semibold">WASD / Smerne tipke:</span> Krmiljenje ·{' '}
          <span className="text-white font-semibold">Space:</span> Laser ·{' '}
          <span className="text-white font-semibold">B / M:</span> Bomba ·{' '}
          <span className="text-white font-semibold">P / Esc:</span> Premor
        </p>
      </div>
    </div>
  );
};
