/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, PaletteMode, HighScoreRecord, StageData } from './types/game';
import { STAGES } from './game/stages';
import { GameEngine } from './game/engine';
import { sound } from './audio/soundEngine';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { LandscapeEditor } from './components/LandscapeEditor';
import { TouchControls } from './components/TouchControls';

const HIGH_SCORES_STORAGE_KEY = 'penetrator_classic_highscores';

const DEFAULT_HIGH_SCORES: HighScoreRecord[] = [
  { name: 'PHILIP', score: 28500, stage: 5, date: '1982-10-29' },
  { name: 'MELBOURN', score: 21400, stage: 4, date: '1982-11-15' },
  { name: 'SPECTRUM', score: 16800, stage: 3, date: '1983-01-20' },
  { name: 'COMMODOR', score: 12200, stage: 2, date: '1983-03-05' },
  { name: 'PILOT', score: 8500, stage: 1, date: '1983-05-12' },
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // High-level App State
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [palette, setPalette] = useState<PaletteMode>('zx_spectrum');
  const [crtFilter, setCrtFilter] = useState<boolean>(true);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  // HUD values updated via game callbacks
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(HIGH_SCORES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed[0]?.score || 28500;
      }
    } catch {
      // fallback
    }
    return 28500;
  });
  const [lives, setLives] = useState<number>(3);
  const [fuel, setFuel] = useState<number>(100);
  const [shield, setShield] = useState<number>(100);
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [isMeltdown, setIsMeltdown] = useState<boolean>(false);
  const [meltdownTimer, setMeltdownTimer] = useState<number>(0);

  // High scores list
  const [highScores, setHighScores] = useState<HighScoreRecord[]>(() => {
    try {
      const stored = localStorage.getItem(HIGH_SCORES_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return DEFAULT_HIGH_SCORES;
  });

  // Custom stage loaded from editor
  const [activeStages, setActiveStages] = useState<StageData[]>(STAGES);

  // Detect touch screens
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, []);

  // Update sound engine mute
  const handleToggleSound = useCallback(() => {
    setSoundMuted((prev) => {
      const next = !prev;
      sound.setMuted(next);
      return next;
    });
  }, []);

  // Initialize or update GameEngine
  const initEngine = useCallback(
    (stagesToUse = activeStages, startStage = 0) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (engineRef.current) {
        engineRef.current.destroy();
      }

      const engine = new GameEngine(
        canvas,
        stagesToUse,
        {
          onScoreChange: (newScore) => {
            setScore(newScore);
            setHighScore((prev) => Math.max(prev, newScore));
          },
          onLivesChange: setLives,
          onFuelChange: setFuel,
          onShieldChange: setShield,
          onStageChange: setStageIndex,
          onGameOver: (finalScore, lastStage) => {
            setGameState('GAME_OVER');
          },
          onVictory: (finalScore) => {
            setGameState('VICTORY');
          },
        },
        startStage
      );

      engine.paletteMode = palette;
      engine.crtFilter = crtFilter;
      engineRef.current = engine;
    },
    [activeStages, palette, crtFilter]
  );

  // Canvas size and DPR sync
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      // Fix logical resolution to 960 x 540 (16:9 classic arcade ratio)
      canvas.width = 960;
      canvas.height = 540;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Sync palette to engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.paletteMode = palette;
    }
  }, [palette]);

  // Sync meltdown state in game loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const interval = setInterval(() => {
      if (engineRef.current) {
        setIsMeltdown(engineRef.current.isMeltdown);
        setMeltdownTimer(engineRef.current.meltdownTimer);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameState]);

  // Global Pause hotkey (P or Escape)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'KeyP' || e.code === 'Escape') && gameState === 'PLAYING') {
        e.preventDefault();
        if (engineRef.current) {
          engineRef.current.pause();
        }
        setGameState('PAUSED');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [gameState]);

  // Start game from title
  const handleStartGame = (stageIdx: number) => {
    initEngine(activeStages, stageIdx);
    if (engineRef.current) {
      engineRef.current.startNewGame();
    }
    setGameState('PLAYING');
    sound.stopRetroMusic();
  };

  // Resume game from pause
  const handleResumeGame = () => {
    if (engineRef.current) {
      engineRef.current.resume();
    }
    setGameState('PLAYING');
  };

  // Restart game
  const handleRestartGame = () => {
    initEngine(activeStages, stageIndex);
    if (engineRef.current) {
      engineRef.current.startNewGame();
    }
    setGameState('PLAYING');
  };

  // Quit to title
  const handleQuitToTitle = () => {
    if (engineRef.current) {
      engineRef.current.pause();
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setGameState('TITLE');
    sound.startRetroMusic();
  };

  // Open Landscape Editor
  const handleOpenEditor = () => {
    if (engineRef.current) {
      engineRef.current.pause();
      engineRef.current.destroy();
      engineRef.current = null;
    }
    sound.stopRetroMusic();
    setGameState('EDITOR');
  };

  // Test fly from editor
  const handleTestFlyCustomStage = (customStage: StageData) => {
    const newStageList = [customStage];
    setActiveStages(newStageList);
    initEngine(newStageList, 0);
    if (engineRef.current) {
      engineRef.current.startNewGame();
    }
    setGameState('PLAYING');
  };

  // Save High Score
  const handleSaveHighScore = (name: string, newScore: number, finalStage: number) => {
    const newRecord: HighScoreRecord = {
      name,
      score: newScore,
      stage: finalStage,
      date: new Date().toISOString().split('T')[0],
    };
    const updated = [...highScores, newRecord]
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    setHighScores(updated);
    try {
      localStorage.setItem(HIGH_SCORES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Play title theme on title screen
  useEffect(() => {
    if (gameState === 'TITLE' && !soundMuted) {
      sound.startRetroMusic();
    } else {
      sound.stopRetroMusic();
    }
    return () => sound.stopRetroMusic();
  }, [gameState, soundMuted]);

  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden select-none flex items-center justify-center">
      {/* Game Viewport Container: 16:9 arcade cabinet presentation */}
      <div className="relative w-full h-full max-w-[1440px] max-h-[810px] aspect-[16/9] flex items-center justify-center overflow-hidden bg-black shadow-2xl">
        {/* The 60fps Isolated HTML5 Canvas */}
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="w-full h-full object-contain block bg-black"
        />

        {/* CRT Scanline & Curved Vignette Overlays */}
        {crtFilter && (
          <div className="absolute inset-0 pointer-events-none crt-overlay crt-vignette z-15" />
        )}

        {/* In-Game HUD: Low-Occlusion perimeter overlay */}
        {gameState === 'PLAYING' && (
          <GameHUD
            score={score}
            highScore={highScore}
            lives={lives}
            fuel={fuel}
            shield={shield}
            stageIndex={stageIndex}
            isMeltdown={isMeltdown}
            meltdownTimer={meltdownTimer}
            soundMuted={soundMuted}
            onToggleSound={handleToggleSound}
            onPause={() => {
              if (engineRef.current) engineRef.current.pause();
              setGameState('PAUSED');
            }}
          />
        )}

        {/* Touch Controls Overlay for Mobile/Tablets */}
        {gameState === 'PLAYING' && isTouchDevice && (
          <TouchControls
            onTouchChange={(input) => {
              if (engineRef.current) {
                engineRef.current.touchInput = input;
              }
            }}
          />
        )}

        {/* Title Screen Overlay */}
        {gameState === 'TITLE' && (
          <TitleScreen
            onStartGame={handleStartGame}
            onOpenEditor={handleOpenEditor}
            palette={palette}
            onPaletteChange={setPalette}
            soundMuted={soundMuted}
            onToggleSound={handleToggleSound}
            highScores={highScores}
          />
        )}

        {/* Pause Modal */}
        {gameState === 'PAUSED' && (
          <PauseModal
            onResume={handleResumeGame}
            onRestart={handleRestartGame}
            onQuitToTitle={handleQuitToTitle}
            soundMuted={soundMuted}
            onToggleSound={handleToggleSound}
            palette={palette}
            onPaletteChange={setPalette}
          />
        )}

        {/* Game Over Modal */}
        {gameState === 'GAME_OVER' && (
          <GameOverModal
            score={score}
            stage={stageIndex + 1}
            highScores={highScores}
            onRestart={handleRestartGame}
            onQuitToTitle={handleQuitToTitle}
            onSaveHighScore={handleSaveHighScore}
          />
        )}

        {/* Victory Modal */}
        {gameState === 'VICTORY' && (
          <VictoryModal
            score={score}
            highScores={highScores}
            onRestart={handleRestartGame}
            onQuitToTitle={handleQuitToTitle}
            onSaveHighScore={handleSaveHighScore}
          />
        )}

        {/* Landscape Editor Mode */}
        {gameState === 'EDITOR' && (
          <LandscapeEditor
            onBack={() => setGameState('TITLE')}
            onTestFly={handleTestFlyCustomStage}
          />
        )}
      </div>
    </main>
  );
}
