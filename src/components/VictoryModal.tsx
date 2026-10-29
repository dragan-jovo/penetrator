import React from 'react';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import { HighScoreRecord } from '../types/game';

interface VictoryModalProps {
  score: number;
  highScores: HighScoreRecord[];
  onRestart: () => void;
  onQuitToTitle: () => void;
  onSaveHighScore: (name: string, score: number, stage: number) => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  score,
  highScores,
  onRestart,
  onQuitToTitle,
  onSaveHighScore,
}) => {
  const [pilotName, setPilotName] = React.useState('');
  const [saved, setSaved] = React.useState(false);

  const isQualified =
    score > 0 &&
    (highScores.length < 5 || score > (highScores[highScores.length - 1]?.score || 0));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pilotName.trim() || saved) return;
    onSaveHighScore(pilotName.trim().slice(0, 8).toUpperCase(), score, 5);
    setSaved(true);
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 select-none p-4 font-mono">
      <div className="w-full max-w-lg bg-slate-900 border border-emerald-500/60 rounded-lg p-6 md:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Victory Trophy Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-400 flex items-center justify-center mb-4 text-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.4)]">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black tracking-widest text-emerald-400 mb-2 uppercase">
          MISSION ACCOMPLISHED!
        </h2>
        <p className="text-xs text-slate-300 mb-6 max-w-sm leading-relaxed">
          Nevronski reaktor je bil uničen v eksplozivni verižni reakciji! Uspešno si pobegnil skozi
          zasilni predor v slogu legendarnega Melbourne House Penetratorja!
        </p>

        {/* Score Card */}
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded p-4 mb-6 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Status:</span>
            <span className="text-emerald-400 font-bold">REAKTOR RAZNESEN · POBEG USPEŠEN</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Končni zmagovalni točkovni izkupiček:</span>
            <span className="text-yellow-400 font-bold text-lg tabular-nums">
              {score.toLocaleString()} PTS
            </span>
          </div>
        </div>

        {/* High score submission */}
        {isQualified && !saved && (
          <form onSubmit={handleSave} className="w-full mb-6 bg-slate-950 border border-yellow-500/40 rounded p-3 text-left">
            <div className="text-yellow-400 text-xs font-bold mb-2">
              VNESI SVOJE IME V ZGODOVINO:
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={8}
                value={pilotName}
                onChange={(e) => setPilotName(e.target.value.toUpperCase())}
                placeholder="HERO"
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
            ✓ Zmagovalni rezultat vpisan med nesmrtne pilote!
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={onRestart}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
          >
            <RotateCcw className="w-4 h-4 fill-current" />
            Igraj Ponovno
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
