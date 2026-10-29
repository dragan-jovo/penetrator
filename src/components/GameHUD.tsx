import React from 'react';
import { Volume2, VolumeX, Pause, AlertTriangle } from 'lucide-react';
import { STAGES } from '../game/stages';

interface GameHUDProps {
  score: number;
  highScore: number;
  lives: number;
  fuel: number;
  shield: number;
  stageIndex: number;
  isMeltdown: boolean;
  meltdownTimer: number;
  soundMuted: boolean;
  onToggleSound: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  highScore,
  lives,
  fuel,
  stageIndex,
  isMeltdown,
  meltdownTimer,
  soundMuted,
  onToggleSound,
  onPause,
}) => {
  const currentStage = STAGES[stageIndex] || STAGES[0];

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 md:p-4 select-none">
      {/* Top Status Cluster: Score, High Score, Stage Title, Sound & Pause */}
      <div className="w-full flex items-start justify-between">
        {/* Left: Score & High Score */}
        <div className="flex flex-col gap-0.5 font-mono">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Score</span>
            <span className="text-sm md:text-base font-bold text-yellow-400 tabular-nums">
              {score.toString().padStart(6, '0')}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">Best</span>
            <span className="text-xs text-slate-300 tabular-nums">
              {highScore.toString().padStart(6, '0')}
            </span>
          </div>
        </div>

        {/* Center: Stage Name or Emergency Reactor Meltdown Warning */}
        <div className="text-center font-mono">
          {isMeltdown ? (
            <div className="animate-pulse bg-rose-950/80 border border-rose-500 px-3 py-1 rounded flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">
                  CORE MELTDOWN! ESCAPE!
                </span>
                <span className="text-xs font-black text-white tabular-nums">
                  T-{Math.max(0, meltdownTimer).toFixed(1)}s
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
                {currentStage.name}
              </span>
              <span className="text-[9px] text-slate-400 hidden sm:inline-block">
                {currentStage.subtitle}
              </span>
            </div>
          )}
        </div>

        {/* Right: Controls & Meters */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Sound Mute */}
          <button
            onClick={onToggleSound}
            aria-label="Toggle Audio"
            className="p-1.5 rounded bg-black/60 border border-white/20 text-slate-300 hover:text-white hover:bg-black/90 transition-colors"
          >
            {soundMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Pause */}
          <button
            onClick={onPause}
            aria-label="Pause Game"
            className="p-1.5 rounded bg-black/60 border border-white/20 text-slate-300 hover:text-white hover:bg-black/90 transition-colors"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Status Cluster: Lives (Ship icons), Fuel Gauge */}
      {/* Positioned just above the radar strip */}
      <div className="w-full flex items-end justify-between pb-12 font-mono">
        {/* Lives: Vector Jet Icons */}
        <div className="flex items-center gap-2 bg-black/50 border border-white/10 px-2.5 py-1.5 rounded">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider mr-1">Ships</span>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.max(0, lives) }).map((_, idx) => (
              <svg key={idx} viewBox="0 0 24 16" className="w-5 h-3.5 fill-cyan-400 stroke-cyan-200">
                <path d="M 22 8 L 4 2 L 0 8 L 4 14 Z" strokeWidth="1" />
              </svg>
            ))}
          </div>
        </div>

        {/* Fuel Gauge */}
        <div className="flex items-center gap-2 bg-black/50 border border-white/10 px-3 py-1.5 rounded min-w-[140px] md:min-w-[190px]">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Fuel</span>
          <div className="flex-1 h-3 bg-slate-900 border border-slate-700 rounded-sm overflow-hidden p-0.5">
            <div
              className={`h-full transition-all duration-150 rounded-sm ${
                fuel > 50
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  : fuel > 20
                  ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                  : 'bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.9)]'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, fuel))}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-300 tabular-nums w-8 text-right font-bold">
            {Math.round(fuel)}%
          </span>
        </div>
      </div>
    </div>
  );
};
