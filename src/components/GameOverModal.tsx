import React from 'react';
import { RotateCcw, Home, Award } from 'lucide-react';
import { HighScoreRecord } from '../types/game';

interface GameOverModalProps {
  score: number;
  stage: number;
  highScores: HighScoreRecord[];
  onRestart: () => void;
  onQuitToTitle: () => void;
  onSaveHighScore: (name: string, score: number, stage: number) => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  stage,
  highScores,
  onRestart,
  onQuitToTitle,
  onSaveHighScore,
}) => {
  const [pilotName, setPilotName] = React.useState('');
  const [saved, setSaved] = React.useState(false);

  // Check if player qualified for high score
  const isQualified =
    score > 0 &&
    (highScores.length < 5 || score > (highScores[highScores.length - 1]?.score || 0));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pilotName.trim() || saved) return;
    onSaveHighScore(pilotName.trim().slice(0, 8).toUpperCase(), score, stage);
    setSaved(true);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' && !isQualified) {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart, isQualified]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 select-none p-4 font-mono">
      <div className="w-full max-w-md bg-slate-900 border border-rose-500/50 rounded-lg p-6 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-2xl font-black tracking-widest text-rose-500 mb-2 uppercase drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]">
          GAME OVER
        </h2>
        <p className="text-xs text-slate-400 mb-6">Tvoja ladja je bila uničena v podzemnem sektorju.</p>

        {/* Score Card */}
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded p-4 mb-6 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Dosežen sektor:</span>
            <span className="text-cyan-400 font-bold">Stage {stage}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Končni rezultat:</span>
            <span className="text-yellow-400 font-bold text-base tabular-nums">
              {score.toLocaleString()} PTS
            </span>
          </div>
        </div>

        {/* High Score Name Entry */}
        {isQualified && !saved && (
          <form onSubmit={handleSave} className="w-full mb-6 bg-slate-950 border border-yellow-500/40 rounded p-3 text-left">
            <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold mb-2">
              <Award className="w-4 h-4" />
              <span>NOVI REKORD! Vnesi svoje ime:</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={8}
                value={pilotName}
                onChange={(e) => setPilotName(e.target.value.toUpperCase())}
                placeholder="PILOT"
                autoFocus
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white uppercase tracking-widest outline-none focus:border-yellow-400"
              />
              <button
                type="submit"
                disabled={!pilotName.trim()}
                className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase rounded transition-colors"
              >
                Shrani
              </button>
            </div>
          </form>
        )}

        {saved && (
          <div className="w-full mb-4 py-2 bg-emerald-950/60 border border-emerald-500/40 rounded text-emerald-400 text-xs font-semibold">
            ✓ Rezultat shranjen v Dvorano slavnih!
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={onRestart}
            className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
          >
            <RotateCcw className="w-4 h-4" />
            Nova Igra [Enter]
          </button>

          <button
            onClick={onQuitToTitle}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 border border-slate-700"
          >
            <Home className="w-4 h-4" />
            Glavni Meni
          </button>
        </div>
      </div>
    </div>
  );
};
